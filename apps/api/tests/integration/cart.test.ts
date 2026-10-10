import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { truncateAll, createTestUser, createTestProduct } from "../helpers/db";

beforeEach(async () => {
  await truncateAll();
});

function extractCartCookie(res: request.Response): string {
  const raw = res.headers["set-cookie"] as unknown as string[] | undefined;
  const match = raw?.find((c) => c.startsWith("cartToken="));
  if (!match) throw new Error("Expected a cartToken cookie in the response");
  return match.split(";")[0];
}

describe("POST /api/cart/items (guest)", () => {
  it("creates a cart and sets a cartToken cookie on first add", async () => {
    const product = await createTestProduct({ stock: 5 });
    const res = await request(app).post("/api/cart/items").send({ productId: product.id, quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(2);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects adding more than available stock", async () => {
    const product = await createTestProduct({ stock: 3 });
    const res = await request(app).post("/api/cart/items").send({ productId: product.id, quantity: 10 });
    expect(res.status).toBe(400);
  });

  it("increments quantity on repeat add, still clamped to stock", async () => {
    const product = await createTestProduct({ stock: 5 });
    const agent = request.agent(app);

    await agent.post("/api/cart/items").send({ productId: product.id, quantity: 3 });
    const second = await agent.post("/api/cart/items").send({ productId: product.id, quantity: 3 });

    expect(second.status).toBe(400); // 3 + 3 = 6 > stock of 5
  });
});

describe("coupons", () => {
  it("applies a percentage coupon and recalculates the total", async () => {
    await prisma.coupon.create({ data: { code: "TEST10", type: "PERCENT", value: 10, active: true } });
    const product = await createTestProduct({ stock: 5, price: 200 });

    const addRes = await request(app).post("/api/cart/items").send({ productId: product.id, quantity: 1 });
    const cookie = extractCartCookie(addRes);

    const res = await request(app).post("/api/cart/coupon").set("Cookie", cookie).send({ code: "TEST10" });

    expect(res.status).toBe(200);
    expect(res.body.discount).toBe(20);
    expect(res.body.total).toBe(res.body.subtotal + res.body.shippingCost - 20);
  });

  it("rejects an unknown coupon code", async () => {
    const product = await createTestProduct({ stock: 5 });
    const addRes = await request(app).post("/api/cart/items").send({ productId: product.id, quantity: 1 });
    const cookie = extractCartCookie(addRes);

    const res = await request(app).post("/api/cart/coupon").set("Cookie", cookie).send({ code: "NOPE" });
    expect(res.status).toBe(404);
  });

  it("rejects an expired coupon", async () => {
    await prisma.coupon.create({
      data: { code: "EXPIRED", type: "FIXED", value: 5, active: true, expiresAt: new Date("2020-01-01") },
    });
    const product = await createTestProduct({ stock: 5 });
    const addRes = await request(app).post("/api/cart/items").send({ productId: product.id, quantity: 1 });
    const cookie = extractCartCookie(addRes);

    const res = await request(app).post("/api/cart/coupon").set("Cookie", cookie).send({ code: "EXPIRED" });
    expect(res.status).toBe(400);
  });
});

describe("guest cart merge on login", () => {
  it("sums quantities into the user's cart and clears the guest cookie", async () => {
    const { email, password, user } = await createTestUser({ password: "CorrectHorse1!" });
    const product = await createTestProduct({ stock: 10 });

    // Guest adds 2 of the product before logging in.
    const addRes = await request(app).post("/api/cart/items").send({ productId: product.id, quantity: 2 });
    const cartCookie = extractCartCookie(addRes);

    // The user already has 1 of the same product in their account cart from a previous session.
    const existingUserCart = await prisma.cart.create({ data: { userId: user.id } });
    await prisma.cartItem.create({
      data: { cartId: existingUserCart.id, productId: product.id, quantity: 1, unitPrice: 99.99 },
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .set("Cookie", cartCookie)
      .send({ email, password });

    expect(loginRes.status).toBe(200);

    const merged = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

    expect(merged.body.items).toHaveLength(1);
    expect(merged.body.items[0].quantity).toBe(3); // 1 existing + 2 from the guest cart
  });
});
