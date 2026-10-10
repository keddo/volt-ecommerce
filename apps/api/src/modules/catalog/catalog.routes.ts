import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import * as catalogService from "./catalog.service";

export const catalogRouter = Router();

const listQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  brand: z.string().optional(),
  sort: z.enum(["featured", "newest", "price_asc", "price_desc"]).optional().default("featured"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(60).optional().default(24),
});

catalogRouter.get(
  "/products",
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    res.json(await catalogService.listPublicProducts(query));
  })
);

catalogRouter.get(
  "/products/:slug",
  asyncHandler(async (req, res) => {
    res.json(await catalogService.getPublicProductBySlug(req.params.slug));
  })
);

catalogRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    res.json(await catalogService.listActiveCategories());
  })
);

catalogRouter.get(
  "/home",
  asyncHandler(async (_req, res) => {
    res.json(await catalogService.getHomeBundle());
  })
);
