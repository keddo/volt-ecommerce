import { Router } from "express";
import type { Request, Response } from "express";
import { loginSchema, registerSchema, updateProfileSchema, changePasswordSchema } from "@personal-ecommerce/shared";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/authenticate";
import { authRateLimiter, actionRateLimiter } from "../../middleware/rateLimiters";
import { env } from "../../config/env";
import * as authService from "./auth.service";
import { mergeGuestCartIntoUser } from "../cart/cart.service";

export const authRouter = Router();

const REFRESH_COOKIE = "refreshToken";
const REFRESH_COOKIE_PATH = "/api/auth";
const CART_COOKIE = "cartToken";

async function mergeGuestCartIfPresent(req: Request, res: Response, userId: string) {
  const cartToken = req.cookies?.[CART_COOKIE];
  if (!cartToken) return;
  await mergeGuestCartIntoUser(cartToken, userId);
  res.clearCookie(CART_COOKIE, { path: "/", ...crossSiteCookieOptions });
}

// The web app and API are deployed on different domains in production (e.g. Vercel + Railway),
// so this cookie is cross-site from the browser's perspective - "lax" would be silently dropped
// on the fetch() calls this app makes, so production needs "none" (which itself requires
// `secure: true`, already the case in production). Dev keeps "lax" since cookies without
// `secure` can't use "none" at all.
const crossSiteCookieOptions =
  env.NODE_ENV === "production" ? ({ secure: true, sameSite: "none" } as const) : ({ secure: false, sameSite: "lax" } as const);

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    ...crossSiteCookieOptions,
    path: REFRESH_COOKIE_PATH,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH, ...crossSiteCookieOptions });
}

authRouter.post(
  "/register",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await authService.registerCustomer(input);
    setRefreshCookie(res, refreshToken);
    await mergeGuestCartIfPresent(req, res, user.id);
    res.status(201).json({ user, accessToken });
  })
);

authRouter.post(
  "/login",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await authService.login(input);
    setRefreshCookie(res, refreshToken);
    await mergeGuestCartIfPresent(req, res, user.id);
    res.json({ user, accessToken });
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { accessToken, refreshToken, user } = await authService.refreshSession(
      req.cookies?.[REFRESH_COOKIE]
    );
    setRefreshCookie(res, refreshToken);
    res.json({ user, accessToken });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    await authService.logout(req.cookies?.[REFRESH_COOKIE]);
    clearRefreshCookie(res);
    res.status(204).send();
  })
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user!.id);
    res.json({ user });
  })
);

authRouter.patch(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const { name } = updateProfileSchema.parse(req.body);
    const user = await authService.updateProfile(req.user!.id, name);
    res.json({ user });
  })
);

authRouter.post(
  "/change-password",
  authenticate,
  actionRateLimiter,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await authService.changePassword(
      req.user!.id,
      currentPassword,
      newPassword
    );
    setRefreshCookie(res, refreshToken);
    res.json({ user, accessToken });
  })
);
