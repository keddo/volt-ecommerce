import { Router } from "express";
import { reviewInputSchema } from "@personal-ecommerce/shared";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/authenticate";
import { actionRateLimiter } from "../../middleware/rateLimiters";
import * as reviewsService from "./reviews.service";

export const reviewsRouter = Router();

reviewsRouter.use(authenticate);

reviewsRouter.post(
  "/",
  actionRateLimiter,
  asyncHandler(async (req, res) => {
    const { productId, rating, comment } = reviewInputSchema.parse(req.body);
    await reviewsService.submitReview(req.user!.id, productId, rating, comment);
    res.status(201).json({ status: "PENDING" });
  })
);
