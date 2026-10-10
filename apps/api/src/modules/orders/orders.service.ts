import { Prisma, type OrderStatus } from "@prisma/client";
import type { CheckoutInput, OrderDetailDTO, OrderSummaryDTO, UpdateOrderStatusInput } from "@personal-ecommerce/shared";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errorHandler";
import { calculateShipping, computeDiscount, getCartRowForUser, clearCart } from "../cart/cart.service";

const ORDER_INCLUDE = {
  user: true,
  items: { include: { product: { include: { images: { orderBy: { sortOrder: "asc" as const }, take: 1 } } } } },
};

type OrderRow = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

function toNumber(value: Prisma.Decimal): number {
  return Number(value);
}

function toSummary(order: OrderRow): OrderSummaryDTO {
  return {
    id: order.id,
    customerName: order.user.name,
    createdAt: order.createdAt.toISOString(),
    itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: toNumber(order.subtotal),
    shippingCost: toNumber(order.shippingCost),
    total: toNumber(order.total),
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
  };
}

function toDetail(order: OrderRow): OrderDetailDTO {
  return {
    ...toSummary(order),
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      slug: item.product.slug,
      image: item.product.images[0]?.url ?? null,
      quantity: item.quantity,
      price: toNumber(item.price),
      lineTotal: toNumber(item.price) * item.quantity,
    })),
    shippingName: order.shippingName,
    shippingPhone: order.shippingPhone,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingCountry: order.shippingCountry,
  };
}

export async function createOrderFromCart(userId: string, shipping: CheckoutInput): Promise<OrderDetailDTO> {
  const cartRow = await getCartRowForUser(userId);
  if (!cartRow || cartRow.items.length === 0) {
    throw new HttpError(400, "Your cart is empty");
  }

  for (const item of cartRow.items) {
    if (item.quantity > item.product.stock) {
      throw new HttpError(400, `${item.product.name} only has ${item.product.stock} in stock`);
    }
  }

  const subtotal = cartRow.items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0);
  const shippingCost = calculateShipping(subtotal);
  const discount = await computeDiscount(subtotal, cartRow.couponCode);
  const total = subtotal + shippingCost - discount;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId,
        subtotal,
        shippingCost,
        total,
        paymentStatus: "PENDING",
        orderStatus: "PENDING",
        ...shipping,
        items: {
          create: cartRow.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.unitPrice,
          })),
        },
      },
      include: ORDER_INCLUDE,
    });

    for (const item of cartRow.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return created;
  });

  await clearCart({ userId });

  return toDetail(order);
}

export async function listOrdersForUser(userId: string): Promise<OrderSummaryDTO[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return orders.map(toSummary);
}

export async function getOrderForUser(userId: string, orderId: string): Promise<OrderDetailDTO> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (!order || order.userId !== userId) throw new HttpError(404, "Order not found");
  return toDetail(order);
}

export interface AdminListParams {
  search?: string;
  status?: string;
  page: number;
  pageSize: number;
}

export async function listOrdersForAdmin(params: AdminListParams) {
  const where: Prisma.OrderWhereInput = {};
  if (params.search) {
    where.user = {
      OR: [
        { name: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ],
    };
  }
  if (params.status) where.orderStatus = params.status as OrderStatus;

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return { items: rows.map(toSummary), total, page: params.page, pageSize: params.pageSize };
}

export async function getOrderForAdmin(orderId: string): Promise<OrderDetailDTO> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (!order) throw new HttpError(404, "Order not found");
  return toDetail(order);
}

export async function updateOrderStatus(orderId: string, input: UpdateOrderStatusInput): Promise<OrderDetailDTO> {
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) throw new HttpError(404, "Order not found");

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      orderStatus: input.orderStatus,
      paymentStatus: input.paymentStatus,
    },
    include: ORDER_INCLUDE,
  });

  return toDetail(order);
}
