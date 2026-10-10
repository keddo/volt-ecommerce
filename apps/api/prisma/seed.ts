import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@volt.dev";
  const adminPassword = "ChangeMe123!";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminPasswordHash },
    create: {
      name: "Store Admin",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const customerEmail = "jane@example.com";
  const customerPassword = "CustomerPass123!";
  const customerPasswordHash = await bcrypt.hash(customerPassword, 12);

  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: { passwordHash: customerPasswordHash },
    create: {
      name: "Jane Buyer",
      email: customerEmail,
      passwordHash: customerPasswordHash,
      role: "CUSTOMER",
    },
  });

  const categories = [
    { name: "Smartphones", slug: "smartphones" },
    { name: "Laptops", slug: "laptops" },
    { name: "Headphones", slug: "headphones" },
  ];

  const categoryBySlug = new Map<string, { id: string }>();
  for (const category of categories) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    categoryBySlug.set(category.slug, row);
  }

  const products = [
    {
      name: "VOLT Pulse Smartphone",
      slug: "volt-pulse-smartphone",
      sku: "PHN-001",
      categorySlug: "smartphones",
      price: 799,
      discountPrice: null,
      stock: 40,
      minStock: 10,
    },
    {
      name: "VOLT Edge Smartphone Mini",
      slug: "volt-edge-smartphone-mini",
      sku: "PHN-002",
      categorySlug: "smartphones",
      price: 599,
      discountPrice: null,
      stock: 50,
      minStock: 10,
    },
    {
      name: "VOLT Air Laptop 14",
      slug: "volt-air-laptop-14",
      sku: "LAP-001",
      categorySlug: "laptops",
      price: 1299,
      discountPrice: null,
      stock: 15,
      minStock: 5,
    },
    {
      name: "VOLT Pro Laptop 16",
      slug: "volt-pro-laptop-16",
      sku: "LAP-002",
      categorySlug: "laptops",
      price: 1899,
      discountPrice: null,
      stock: 3, // deliberately below minStock to exercise the low-stock dashboard stat
      minStock: 5,
    },
    {
      name: "VOLT Wave Headphones",
      slug: "volt-wave-headphones",
      sku: "HPH-001",
      categorySlug: "headphones",
      price: 199,
      discountPrice: 149,
      stock: 60,
      minStock: 15,
    },
    {
      name: "VOLT Buds Pro",
      slug: "volt-buds-pro",
      sku: "HPH-002",
      categorySlug: "headphones",
      price: 179,
      discountPrice: null,
      stock: 25,
      minStock: 10,
    },
  ];

  const productBySlug = new Map<string, { id: string; price: unknown; discountPrice: unknown }>();
  for (const product of products) {
    const category = categoryBySlug.get(product.categorySlug)!;
    // Keyed by SKU, not slug: an admin can rename a product (changing its slug) without the seed
    // trying to create a duplicate - SKU is the stable seed identity here.
    const row = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        categoryId: category.id,
        price: product.price,
        discountPrice: product.discountPrice ?? undefined,
        stock: product.stock,
        minStock: product.minStock,
        published: true,
        images: {
          create: [
            {
              url: `https://placehold.co/600x600?text=${encodeURIComponent(product.name)}`,
              altText: product.name,
              sortOrder: 0,
            },
          ],
        },
      },
    });
    productBySlug.set(product.slug, row);
  }

  const existingOrderCount = await prisma.order.count({ where: { userId: customer.id } });
  if (existingOrderCount === 0) {
    const pulse = productBySlug.get("volt-pulse-smartphone")!;
    const wave = productBySlug.get("volt-wave-headphones")!;
    const buds = productBySlug.get("volt-buds-pro")!;
    const airLaptop = productBySlug.get("volt-air-laptop-14")!;

    const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
    const shippingInfo = {
      shippingName: "Jane Buyer",
      shippingPhone: "+1-555-0100",
      shippingAddress: "123 Market Street",
      shippingCity: "Austin",
      shippingCountry: "USA",
    };

    await prisma.order.create({
      data: {
        userId: customer.id,
        createdAt: daysAgo(25),
        updatedAt: daysAgo(25),
        subtotal: 799,
        shippingCost: 0,
        total: 799,
        paymentStatus: "PAID",
        orderStatus: "DELIVERED",
        ...shippingInfo,
        items: { create: [{ productId: pulse.id, quantity: 1, price: 799 }] },
      },
    });

    await prisma.order.create({
      data: {
        userId: customer.id,
        createdAt: daysAgo(10),
        updatedAt: daysAgo(10),
        subtotal: 328,
        shippingCost: 9.99,
        total: 337.99,
        paymentStatus: "PAID",
        orderStatus: "SHIPPED",
        ...shippingInfo,
        items: {
          create: [
            { productId: wave.id, quantity: 1, price: 149 },
            { productId: buds.id, quantity: 1, price: 179 },
          ],
        },
      },
    });

    await prisma.order.create({
      data: {
        userId: customer.id,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
        subtotal: 1299,
        shippingCost: 0,
        total: 1299,
        paymentStatus: "PENDING",
        orderStatus: "PENDING",
        ...shippingInfo,
        items: { create: [{ productId: airLaptop.id, quantity: 1, price: 1299 }] },
      },
    });
  }

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: { code: "WELCOME10", type: "PERCENT", value: 10, active: true },
  });
  await prisma.coupon.upsert({
    where: { code: "SAVE20" },
    update: {},
    create: { code: "SAVE20", type: "FIXED", value: 20, minOrderAmount: 150, active: true },
  });

  console.log("Seed complete.");
  console.log(`Admin login    -> email: ${adminEmail}  password: ${adminPassword}`);
  console.log(`Customer login -> email: ${customerEmail}  password: ${customerPassword}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
