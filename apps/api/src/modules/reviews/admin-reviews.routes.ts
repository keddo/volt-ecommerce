import { Router } from "express";
import { z } from "zod";
import { Role, updateReviewStatusSchema } from "@personal-ecommerce/shared";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate, requireRole } from "../../middleware/authenticate";
import * as reviewsService from "./reviews.service";

export const adminReviewsRouter = Router();

adminReviewsRouter.use(authenticate, requireRole(Role.ADMIN));

const listQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

adminReviewsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    res.json(await reviewsService.listReviewsForAdmin(query));
  })
);

adminReviewsRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const { status } = updateReviewStatusSchema.parse(req.body);
    await reviewsService.updateReviewStatus(req.params.id, status);
    res.status(204).send();
  })
);

adminReviewsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await reviewsService.deleteReview(req.params.id);
    res.status(204).send();
  })
);
