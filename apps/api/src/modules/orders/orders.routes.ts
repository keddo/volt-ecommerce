import { Router } from "express";
import { checkoutInputSchema } from "@personal-ecommerce/shared";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/authenticate";
import { actionRateLimiter } from "../../middleware/rateLimiters";
import * as ordersService from "./orders.service";

export const ordersRouter = Router();

ordersRouter.use(authenticate);

ordersRouter.post(
  "/",
  actionRateLimiter,
  asyncHandler(async (req, res) => {
    const input = checkoutInputSchema.parse(req.body);
    const order = await ordersService.createOrderFromCart(req.user!.id, input);
    res.status(201).json(order);
  })
);

ordersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await ordersService.listOrdersForUser(req.user!.id));
  })
);

ordersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await ordersService.getOrderForUser(req.user!.id, req.params.id));
  })
);
