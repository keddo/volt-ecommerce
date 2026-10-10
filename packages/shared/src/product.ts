import { z } from "zod";

export interface ProductImageDTO {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

export interface ProductSpecificationDTO {
  id: string;
  key: string;
  value: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  image: string | null;
  categoryId: string;
  categoryName: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  minStock: number;
  published: boolean;
  featured: boolean;
  createdAt: string;
}

export interface ProductDetail extends ProductListItem {
  description: string | null;
  brand: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  images: ProductImageDTO[];
  specifications: ProductSpecificationDTO[];
  tags: string[];
}

export interface ProductListResponse {
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export const productInputSchema = z.object({
  name: z.string().min(2).max(200),
  sku: z.string().min(1).max(50),
  categoryId: z.string().min(1),
  brand: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),
  price: z.coerce.number().positive(),
  discountPrice: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0),
  featured: z.coerce.boolean().optional().default(false),
  published: z.coerce.boolean().optional().default(false),
  seoTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(300).optional(),
  specifications: z.string().optional(), // JSON-encoded { key, value }[] in multipart bodies
  tags: z.string().optional(), // JSON-encoded string[] in multipart bodies
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const bulkProductActionSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(["publish", "unpublish", "delete"]),
});
export type BulkProductAction = z.infer<typeof bulkProductActionSchema>;
