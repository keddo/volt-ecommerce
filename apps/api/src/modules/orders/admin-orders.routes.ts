import { Router } from "express";
import { z } from "zod";
import { Role, updateOrderStatusSchema } from "@personal-ecommerce/shared";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate, requireRole } from "../../middleware/authenticate";
import * as ordersService from "./orders.service";

export const adminOrdersRouter = Router();

adminOrdersRouter.use(authenticate, requireRole(Role.ADMIN));

const listQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

adminOrdersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    res.json(await ordersService.listOrdersForAdmin(query));
  })
);

adminOrdersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await ordersService.getOrderForAdmin(req.params.id));
  })
);

adminOrdersRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const input = updateOrderStatusSchema.parse(req.body);
    res.json(await ordersService.updateOrderStatus(req.params.id, input));
  })
);
