import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { truncateAll, createTestUser, createTestCategory, createTestProduct } from "../helpers/db";
import { loginAs } from "../helpers/auth";

let adminToken: string;

beforeEach(async () => {
  await truncateAll();
  const { email, password } = await createTestUser({ role: "ADMIN", password: "AdminPass123!" });
  adminToken = await loginAs(app, email, password);
});

describe("admin products", () => {
  it("rejects a non-admin with 403", async () => {
    const { email, password } = await createTestUser({ role: "CUSTOMER", password: "CorrectHorse1!" });
    const customerToken = await loginAs(app, email, password);

    const res = await request(app).get("/api/admin/products").set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it("creates a product via multipart form fields", async () => {
    const category = await createTestCategory();

    const res = await request(app)
      .post("/api/admin/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("name", "Integration Test Gadget")
      .field("sku", "ITG-001")
      .field("categoryId", category.id)
      .field("price", "149.99")
      .field("stock", "20")
      .field("minStock", "5")
      .field("published", "true");

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Integration Test Gadget");
    expect(res.body.slug).toBe("integration-test-gadget");
    expect(res.body.published).toBe(true);
  });

  it("rejects a duplicate SKU with 409", async () => {
    const category = await createTestCategory();
    const existing = await createTestProduct({ categoryId: category.id });

    const res = await request(app)
      .post("/api/admin/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("name", "Another Product")
      .field("sku", existing.sku)
      .field("categoryId", category.id)
      .field("price", "10")
      .field("stock", "1")
      .field("minStock", "0");

    expect(res.status).toBe(409);
  });

  it("lists products and supports the search filter", async () => {
    const category = await createTestCategory();
    await prisma.product.create({
      data: {
        name: "Findable Widget",
        slug: "findable-widget",
        sku: "FIND-1",
        categoryId: category.id,
        price: 10,
        stock: 5,
        minStock: 1,
        published: true,
      },
    });
    await createTestProduct({ categoryId: category.id });

    const res = await request(app)
      .get("/api/admin/products?search=Findable")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].name).toBe("Findable Widget");
  });

  it("toggles published status", async () => {
    const product = await createTestProduct({ published: false });

    const res = await request(app)
      .patch(`/api/admin/products/${product.id}/publish`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ published: true });

    expect(res.status).toBe(200);
    expect(res.body.published).toBe(true);
  });

  it("deletes a product with no order history", async () => {
    const product = await createTestProduct();
    const res = await request(app)
      .delete(`/api/admin/products/${product.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(204);

    const found = await prisma.product.findUnique({ where: { id: product.id } });
    expect(found).toBeNull();
  });

  it("returns 409 (not a raw 500) deleting a product referenced by an order", async () => {
    // Regression test for the Phase 3 bug: Postgres raises this as a RESTRICT violation
    // (PrismaClientUnknownRequestError), not Prisma's own P2003 - the service must special-case it.
    const product = await createTestProduct();
    const { user } = await createTestUser();
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        subtotal: product.price,
        shippingCost: 0,
        total: product.price,
        shippingName: "X",
        shippingPhone: "X",
        shippingAddress: "X",
        shippingCity: "X",
        shippingCountry: "X",
      },
    });
    await prisma.orderItem.create({
      data: { orderId: order.id, productId: product.id, quantity: 1, price: product.price },
    });

    const res = await request(app)
      .delete(`/api/admin/products/${product.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(409);

    const stillExists = await prisma.product.findUnique({ where: { id: product.id } });
    expect(stillExists).not.toBeNull();
  });
});
