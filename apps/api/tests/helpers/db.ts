import bcrypt from "bcryptjs";
import { prisma } from "../../src/lib/prisma";

export async function truncateAll() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "RefreshToken", "CartItem", "Cart", "OrderItem", "Order", "Review",
      "ProductTag", "Tag", "ProductSpecification", "ProductImage", "Product",
      "Category", "Coupon", "SiteSetting", "User"
    RESTART IDENTITY CASCADE
  `);
}

let counter = 0;
function unique(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export async function createTestUser(overrides: { role?: "CUSTOMER" | "ADMIN"; password?: string } = {}) {
  const password = overrides.password ?? "TestPass123!";
  const email = `${unique("user")}@example.com`;
  const passwordHash = await bcrypt.hash(password, 4); // low cost factor - tests don't need production security margins
  const user = await prisma.user.create({
    data: { name: "Test User", email, passwordHash, role: overrides.role ?? "CUSTOMER" },
  });
  return { user, email, password };
}

export async function createTestCategory(overrides: Partial<{ name: string; status: "ACTIVE" | "INACTIVE" }> = {}) {
  const name = overrides.name ?? unique("Category");
  return prisma.category.create({
    data: { name, slug: unique("category"), status: overrides.status ?? "ACTIVE" },
  });
}

export async function createTestProduct(
  overrides: Partial<{
    categoryId: string;
    price: number;
    discountPrice: number;
    stock: number;
    minStock: number;
    published: boolean;
    featured: boolean;
  }> = {}
) {
  const categoryId = overrides.categoryId ?? (await createTestCategory()).id;
  return prisma.product.create({
    data: {
      name: unique("Product"),
      slug: unique("product"),
      sku: unique("SKU"),
      categoryId,
      price: overrides.price ?? 99.99,
      discountPrice: overrides.discountPrice,
      stock: overrides.stock ?? 10,
      minStock: overrides.minStock ?? 2,
      published: overrides.published ?? true,
      featured: overrides.featured ?? false,
    },
  });
}
