import { Prisma } from "@prisma/client";
import { SalesRange } from "@personal-ecommerce/shared";
import { prisma } from "../../lib/prisma";

function toNumber(value: Prisma.Decimal | null | undefined): number {
  return value ? Number(value) : 0;
}

export async function getSummary() {
  const [salesAgg, totalOrders, pendingOrdersCount, totalProducts, totalCustomers, lowStockRows] =
    await Promise.all([
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
      prisma.order.count(),
      prisma.order.count({ where: { orderStatus: "PENDING" } }),
      prisma.product.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*)::int AS count FROM "Product" WHERE stock <= "minStock"
      `,
    ]);

  return {
    totalSales: toNumber(salesAgg._sum.total),
    totalOrders,
    totalProducts,
    totalCustomers,
    lowStockCount: lowStockRows[0]?.count ?? 0,
    pendingOrdersCount,
  };
}

const RANGE_CONFIG: Record<SalesRange, { days: number; unit: "day" | "week" | "month" }> = {
  [SalesRange.SEVEN_DAYS]: { days: 7, unit: "day" },
  [SalesRange.THIRTY_DAYS]: { days: 30, unit: "day" },
  [SalesRange.THREE_MONTHS]: { days: 90, unit: "week" },
  [SalesRange.ONE_YEAR]: { days: 365, unit: "month" },
};

export async function getSalesSeries(range: SalesRange) {
  const { days, unit } = RANGE_CONFIG[range];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const rows = await prisma.$queryRaw<{ bucket: Date; total: Prisma.Decimal | null }[]>`
    SELECT date_trunc(${unit}, "createdAt") AS bucket, SUM("total") AS total
    FROM "Order"
    WHERE "paymentStatus" = 'PAID' AND "createdAt" >= ${startDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  return rows.map((row) => ({
    bucket: row.bucket.toISOString(),
    total: toNumber(row.total),
  }));
}

export async function getRecentOrders(limit = 8) {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: true },
  });

  return orders.map((order) => ({
    id: order.id,
    customerName: order.user.name,
    createdAt: order.createdAt.toISOString(),
    total: toNumber(order.total),
    orderStatus: order.orderStatus,
  }));
}

export async function getTopProducts(limit = 5) {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: grouped.map((g) => g.productId) } },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  return grouped
    .map((g) => {
      const product = productMap.get(g.productId);
      if (!product) return null;
      return {
        productId: product.id,
        name: product.name,
        image: product.images[0]?.url ?? null,
        quantitySold: g._sum.quantity ?? 0,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}
