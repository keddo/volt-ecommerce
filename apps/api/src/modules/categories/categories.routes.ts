import { Router } from "express";
import { Role, categoryInputSchema } from "@personal-ecommerce/shared";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate, requireRole } from "../../middleware/authenticate";
import { uploadImages } from "../../middleware/upload";
import * as categoriesService from "./categories.service";

export const categoriesRouter = Router();

categoriesRouter.use(authenticate, requireRole(Role.ADMIN));

categoriesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await categoriesService.listCategories());
  })
);

categoriesRouter.post(
  "/",
  uploadImages.single("image"),
  asyncHandler(async (req, res) => {
    const input = categoryInputSchema.parse(req.body);
    const file = req.file
      ? { buffer: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype }
      : undefined;
    res.status(201).json(await categoriesService.createCategory(input, file));
  })
);

categoriesRouter.put(
  "/:id",
  uploadImages.single("image"),
  asyncHandler(async (req, res) => {
    const input = categoryInputSchema.parse(req.body);
    const file = req.file
      ? { buffer: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype }
      : undefined;
    res.json(await categoriesService.updateCategory(req.params.id, input, file));
  })
);

categoriesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await categoriesService.deleteCategory(req.params.id);
    res.status(204).send();
  })
);
