import { z } from "zod";

export const reviewInputSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});
export type ReviewInput = z.infer<typeof reviewInputSchema>;

export interface AdminReviewDTO {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface AdminReviewListResponse {
  items: AdminReviewDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export const updateReviewStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});
export type UpdateReviewStatusInput = z.infer<typeof updateReviewStatusSchema>;
