import { Router } from "express";
import { z } from "zod";
import { Role, SalesRange } from "@personal-ecommerce/shared";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate, requireRole } from "../../middleware/authenticate";
import * as dashboardService from "./dashboard.service";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate, requireRole(Role.ADMIN));

dashboardRouter.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    res.json(await dashboardService.getSummary());
  })
);

const salesRangeSchema = z.nativeEnum(SalesRange);

dashboardRouter.get(
  "/sales",
  asyncHandler(async (req, res) => {
    const range = salesRangeSchema.parse(req.query.range ?? SalesRange.THIRTY_DAYS);
    res.json(await dashboardService.getSalesSeries(range));
  })
);

dashboardRouter.get(
  "/recent-orders",
  asyncHandler(async (_req, res) => {
    res.json(await dashboardService.getRecentOrders());
  })
);

dashboardRouter.get(
  "/top-products",
  asyncHandler(async (_req, res) => {
    res.json(await dashboardService.getTopProducts());
  })
);
