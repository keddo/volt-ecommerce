import { Prisma } from "@prisma/client";
import type { CartSummary } from "@personal-ecommerce/shared";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errorHandler";

export type CartIdentity = { userId: string } | { sessionToken: string };

const EMPTY_SUMMARY: CartSummary = {
  items: [],
  subtotal: 0,
  shippingCost: 0,
  discount: 0,
  couponCode: null,
  total: 0,
};

const CART_INCLUDE = {
  items: {
    include: { product: { include: { images: { orderBy: { sortOrder: "asc" as const }, take: 1 } } } },
  },
};

type CartRow = Prisma.CartGetPayload<{ include: typeof CART_INCLUDE }>;

function identityWhere(identity: CartIdentity): Prisma.CartWhereUniqueInput {
  return "userId" in identity ? { userId: identity.userId } : { sessionToken: identity.sessionToken };
}

async function findCartRow(identity: CartIdentity | null): Promise<CartRow | null> {
  if (!identity) return null;
  return prisma.cart.findUnique({ where: identityWhere(identity), include: CART_INCLUDE });
}

async function getOrCreateCartId(identity: CartIdentity): Promise<string> {
  const existing = await prisma.cart.findUnique({ where: identityWhere(identity) });
  if (existing) return existing.id;
  const created = await prisma.cart.create({
    data: "userId" in identity ? { userId: identity.userId } : { sessionToken: identity.sessionToken },
  });
  return created.id;
}

export function calculateShipping(subtotal: number): number {
  return subtotal === 0 || subtotal >= 100 ? 0 : 9.99;
}

export async function computeDiscount(subtotal: number, couponCode: string | null): Promise<number> {
  if (!couponCode) return 0;
  const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
  if (!coupon || !coupon.active) return 0;
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return 0;
  if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) return 0;
  const raw = coupon.type === "PERCENT" ? subtotal * (Number(coupon.value) / 100) : Number(coupon.value);
  return Math.min(raw, subtotal);
}

async function toSummary(cartRow: CartRow): Promise<CartSummary> {
  const items = cartRow.items.map((item) => ({
    productId: item.productId,
    name: item.product.name,
    slug: item.product.slug,
    image: item.product.images[0]?.url ?? null,
    unitPrice: Number(item.unitPrice),
    quantity: item.quantity,
    stock: item.product.stock,
    lineTotal: Number(item.unitPrice) * item.quantity,
  }));
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const shippingCost = calculateShipping(subtotal);
  const discount = await computeDiscount(subtotal, cartRow.couponCode);

  return {
    items,
    subtotal,
    shippingCost,
    discount,
    couponCode: cartRow.couponCode,
    total: subtotal + shippingCost - discount,
  };
}

export async function getCartSummary(identity: CartIdentity | null): Promise<CartSummary> {
  const cartRow = await findCartRow(identity);
  return cartRow ? toSummary(cartRow) : EMPTY_SUMMARY;
}

// Exposed for the orders module: checkout needs the raw cart row (id + items with product stock)
// to build OrderItems and decrement stock, not just the computed CartSummary DTO.
export async function getCartRowForUser(userId: string) {
  return findCartRow({ userId });
}

export async function addItem(identity: CartIdentity, productId: string, quantity: number): Promise<CartSummary> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.published) throw new HttpError(404, "Product not found");
  if (product.stock <= 0) throw new HttpError(400, "This product is out of stock");

  const cartId = await getOrCreateCartId(identity);
  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
  });
  const desiredQuantity = (existingItem?.quantity ?? 0) + quantity;
  if (desiredQuantity > product.stock) {
    throw new HttpError(400, `Only ${product.stock} in stock`);
  }

  const unitPrice = product.discountPrice ?? product.price;
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    update: { quantity: desiredQuantity, unitPrice },
    create: { cartId, productId, quantity: desiredQuantity, unitPrice },
  });

  return getCartSummary(identity);
}

export async function updateItemQuantity(
  identity: CartIdentity | null,
  productId: string,
  quantity: number
): Promise<CartSummary> {
  const cartRow = await findCartRow(identity);
  if (!cartRow) throw new HttpError(404, "Cart not found");

  if (quantity === 0) {
    await prisma.cartItem.deleteMany({ where: { cartId: cartRow.id, productId } });
    return getCartSummary(identity);
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new HttpError(404, "Product not found");
  if (quantity > product.stock) throw new HttpError(400, `Only ${product.stock} in stock`);

  await prisma.cartItem.updateMany({ where: { cartId: cartRow.id, productId }, data: { quantity } });
  return getCartSummary(identity);
}

export async function removeItem(identity: CartIdentity | null, productId: string): Promise<CartSummary> {
  const cartRow = await findCartRow(identity);
  if (cartRow) await prisma.cartItem.deleteMany({ where: { cartId: cartRow.id, productId } });
  return getCartSummary(identity);
}

export async function clearCart(identity: CartIdentity | null): Promise<CartSummary> {
  const cartRow = await findCartRow(identity);
  if (cartRow) await prisma.cartItem.deleteMany({ where: { cartId: cartRow.id } });
  return getCartSummary(identity);
}

export async function applyCoupon(identity: CartIdentity | null, code: string): Promise<CartSummary> {
  const cartRow = await findCartRow(identity);
  if (!cartRow || cartRow.items.length === 0) throw new HttpError(400, "Your cart is empty");

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.active) throw new HttpError(404, "Invalid coupon code");
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new HttpError(400, "This coupon has expired");

  const subtotal = cartRow.items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0);
  if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
    throw new HttpError(400, `This coupon requires a minimum order of $${Number(coupon.minOrderAmount)}`);
  }

  await prisma.cart.update({ where: { id: cartRow.id }, data: { couponCode: code } });
  return getCartSummary(identity);
}

export async function removeCoupon(identity: CartIdentity | null): Promise<CartSummary> {
  const cartRow = await findCartRow(identity);
  if (cartRow) await prisma.cart.update({ where: { id: cartRow.id }, data: { couponCode: null } });
  return getCartSummary(identity);
}

export async function mergeGuestCartIntoUser(sessionToken: string, userId: string): Promise<void> {
  const guestCart = await prisma.cart.findUnique({ where: { sessionToken }, include: { items: true } });
  if (!guestCart) return;

  const userCartId = await getOrCreateCartId({ userId });

  for (const item of guestCart.items) {
    const [existing, product] = await Promise.all([
      prisma.cartItem.findUnique({ where: { cartId_productId: { cartId: userCartId, productId: item.productId } } }),
      prisma.product.findUnique({ where: { id: item.productId } }),
    ]);
    if (!product || product.stock <= 0) continue; // sold out or removed since it was added as a guest

    const mergedQty = Math.min((existing?.quantity ?? 0) + item.quantity, product.stock);

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: userCartId, productId: item.productId } },
      update: { quantity: mergedQty },
      create: { cartId: userCartId, productId: item.productId, quantity: mergedQty, unitPrice: item.unitPrice },
    });
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });
}
