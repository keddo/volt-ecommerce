import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { truncateAll, createTestUser, createTestProduct } from "../helpers/db";
import { loginAs } from "../helpers/auth";

const shipping = {
  shippingName: "Test Buyer",
  shippingPhone: "555-0100",
  shippingAddress: "1 Test St",
  shippingCity: "Austin",
  shippingCountry: "USA",
};

beforeEach(async () => {
  await truncateAll();
});

describe("POST /api/orders (checkout)", () => {
  it("rejects checkout with an empty cart", async () => {
    const { email, password } = await createTestUser({ password: "CorrectHorse1!" });
    const token = await loginAs(app, email, password);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send(shipping);

    expect(res.status).toBe(400);
  });

  it("creates an order, decrements stock, and clears the cart", async () => {
    const { email, password, user } = await createTestUser({ password: "CorrectHorse1!" });
    const token = await loginAs(app, email, password);
    const product = await createTestProduct({ stock: 10, price: 50 });

    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product.id, quantity: 3 });

    const checkoutRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send(shipping);

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.items).toHaveLength(1);
    expect(checkoutRes.body.items[0].quantity).toBe(3);
    expect(checkoutRes.body.subtotal).toBe(150);
    expect(checkoutRes.body.orderStatus).toBe("PENDING");
    expect(checkoutRes.body.paymentStatus).toBe("PENDING");

    const updatedProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(updatedProduct.stock).toBe(7);

    const cartRes = await request(app).get("/api/cart").set("Authorization", `Bearer ${token}`);
    expect(cartRes.body.items).toHaveLength(0);

    const dbOrder = await prisma.order.findFirst({ where: { userId: user.id } });
    expect(dbOrder).not.toBeNull();
  });

  it("rejects checkout when cart quantity now exceeds available stock", async () => {
    const { email, password } = await createTestUser({ password: "CorrectHorse1!" });
    const token = await loginAs(app, email, password);
    const product = await createTestProduct({ stock: 5 });

    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product.id, quantity: 5 });

    // Stock drops below what's already in the cart (e.g. another customer bought the rest).
    await prisma.product.update({ where: { id: product.id }, data: { stock: 2 } });

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send(shipping);

    expect(res.status).toBe(400);

    // Stock must be unchanged - the failed checkout shouldn't have partially decremented it.
    const product2 = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(product2.stock).toBe(2);
  });
});

describe("GET /api/orders/:id", () => {
  it("404s when a customer requests another customer's order (not 403 - doesn't confirm it exists)", async () => {
    const owner = await createTestUser({ password: "CorrectHorse1!" });
    const stranger = await createTestUser({ password: "CorrectHorse1!" });
    const product = await createTestProduct({ stock: 10 });
    const ownerToken = await loginAs(app, owner.email, owner.password);

    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ productId: product.id, quantity: 1 });
    const order = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send(shipping);

    const strangerToken = await loginAs(app, stranger.email, stranger.password);
    const res = await request(app)
      .get(`/api/orders/${order.body.id}`)
      .set("Authorization", `Bearer ${strangerToken}`);

    expect(res.status).toBe(404);
  });
});
