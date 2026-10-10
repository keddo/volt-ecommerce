import crypto from "crypto";
import { Router } from "express";
import type { Request, Response } from "express";
import { addCartItemSchema, applyCouponSchema, updateCartItemSchema } from "@personal-ecommerce/shared";
import { asyncHandler } from "../../lib/asyncHandler";
import { optionalAuthenticate } from "../../middleware/authenticate";
import { actionRateLimiter } from "../../middleware/rateLimiters";
import { env } from "../../config/env";
import * as cartService from "./cart.service";
import type { CartIdentity } from "./cart.service";

export const cartRouter = Router();

const CART_COOKIE = "cartToken";

// See the matching comment in auth.routes.ts - the web app and API live on different domains in
// production, so this cookie needs "none" (cross-site) rather than "lax" there.
const crossSiteCookieOptions =
  env.NODE_ENV === "production" ? ({ secure: true, sameSite: "none" } as const) : ({ secure: false, sameSite: "lax" } as const);

function resolveIdentity(req: Request): CartIdentity | null {
  if (req.user) return { userId: req.user.id };
  const token = req.cookies?.[CART_COOKIE];
  return token ? { sessionToken: token } : null;
}

function resolveOrCreateIdentity(req: Request, res: Response): CartIdentity {
  if (req.user) return { userId: req.user.id };

  let token = req.cookies?.[CART_COOKIE];
  if (!token) {
    token = crypto.randomBytes(24).toString("hex");
    res.cookie(CART_COOKIE, token, {
      httpOnly: true,
      ...crossSiteCookieOptions,
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
  return { sessionToken: token };
}

cartRouter.use(optionalAuthenticate);

cartRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await cartService.getCartSummary(resolveIdentity(req)));
  })
);

cartRouter.post(
  "/items",
  asyncHandler(async (req, res) => {
    const { productId, quantity } = addCartItemSchema.parse(req.body);
    const identity = resolveOrCreateIdentity(req, res);
    res.json(await cartService.addItem(identity, productId, quantity));
  })
);

cartRouter.patch(
  "/items/:productId",
  asyncHandler(async (req, res) => {
    const { quantity } = updateCartItemSchema.parse(req.body);
    res.json(await cartService.updateItemQuantity(resolveIdentity(req), req.params.productId, quantity));
  })
);

cartRouter.delete(
  "/items/:productId",
  asyncHandler(async (req, res) => {
    res.json(await cartService.removeItem(resolveIdentity(req), req.params.productId));
  })
);

cartRouter.delete(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await cartService.clearCart(resolveIdentity(req)));
  })
);

cartRouter.post(
  "/coupon",
  actionRateLimiter,
  asyncHandler(async (req, res) => {
    const { code } = applyCouponSchema.parse(req.body);
    res.json(await cartService.applyCoupon(resolveIdentity(req), code));
  })
);

cartRouter.delete(
  "/coupon",
  asyncHandler(async (req, res) => {
    res.json(await cartService.removeCoupon(resolveIdentity(req)));
  })
);
