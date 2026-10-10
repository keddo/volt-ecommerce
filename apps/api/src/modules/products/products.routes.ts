import { Router } from "express";
import { z } from "zod";
import { Role, productInputSchema, bulkProductActionSchema } from "@personal-ecommerce/shared";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate, requireRole } from "../../middleware/authenticate";
import { uploadImages } from "../../middleware/upload";
import * as productsService from "./products.service";

export const productsRouter = Router();

productsRouter.use(authenticate, requireRole(Role.ADMIN));

const listQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["published", "unpublished", "all"]).optional().default("all"),
  stock: z.enum(["in", "low", "out", "all"]).optional().default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z.string().optional().default("createdAt:desc"),
});

const SORT_FIELDS = new Set(["name", "price", "stock", "createdAt"]);

productsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    const [sortFieldRaw, sortDirRaw] = query.sort.split(":");
    const sortField = SORT_FIELDS.has(sortFieldRaw) ? (sortFieldRaw as "name" | "price" | "stock" | "createdAt") : "createdAt";
    const sortDir = sortDirRaw === "asc" ? "asc" : "desc";

    const result = await productsService.listProducts({
      search: query.search,
      category: query.category,
      status: query.status,
      stock: query.stock,
      page: query.page,
      pageSize: query.pageSize,
      sortField,
      sortDir,
    });
    res.json(result);
  })
);

productsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await productsService.getProductById(req.params.id));
  })
);

productsRouter.post(
  "/",
  uploadImages.array("images"),
  asyncHandler(async (req, res) => {
    const input = productInputSchema.parse(req.body);
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const product = await productsService.createProduct(
      input,
      files.map((f) => ({ buffer: f.buffer, originalName: f.originalname, mimeType: f.mimetype }))
    );
    res.status(201).json(product);
  })
);

productsRouter.put(
  "/:id",
  uploadImages.array("images"),
  asyncHandler(async (req, res) => {
    const input = productInputSchema.parse(req.body);
    res.json(await productsService.updateProduct(req.params.id, input));
  })
);

productsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await productsService.deleteProduct(req.params.id);
    res.status(204).send();
  })
);

productsRouter.post(
  "/:id/duplicate",
  asyncHandler(async (req, res) => {
    res.status(201).json(await productsService.duplicateProduct(req.params.id));
  })
);

const publishSchema = z.object({ published: z.boolean() });

productsRouter.patch(
  "/:id/publish",
  asyncHandler(async (req, res) => {
    const { published } = publishSchema.parse(req.body);
    res.json(await productsService.setPublished(req.params.id, published));
  })
);

productsRouter.post(
  "/:id/images",
  uploadImages.array("images"),
  asyncHandler(async (req, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const product = await productsService.addImages(
      req.params.id,
      files.map((f) => ({ buffer: f.buffer, originalName: f.originalname, mimeType: f.mimetype }))
    );
    res.json(product);
  })
);

productsRouter.delete(
  "/:id/images/:imageId",
  asyncHandler(async (req, res) => {
    res.json(await productsService.removeImage(req.params.id, req.params.imageId));
  })
);

productsRouter.post(
  "/bulk",
  asyncHandler(async (req, res) => {
    const { ids, action } = bulkProductActionSchema.parse(req.body);
    await productsService.bulkAction(ids, action);
    res.status(204).send();
  })
);
