import { Prisma } from "@prisma/client";
import type { AdminReviewDTO } from "@personal-ecommerce/shared";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errorHandler";

export async function submitReview(userId: string, productId: string, rating: number, comment?: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.published) throw new HttpError(404, "Product not found");

  const existing = await prisma.review.findFirst({ where: { productId, userId } });

  if (existing) {
    // Editing a review's content means it needs re-approval, same as the first submission.
    await prisma.review.update({
      where: { id: existing.id },
      data: { rating, comment, status: "PENDING" },
    });
  } else {
    await prisma.review.create({
      data: { productId, userId, rating, comment, status: "PENDING" },
    });
  }
}

const ADMIN_INCLUDE = { product: true, user: true };
type ReviewRow = Prisma.ReviewGetPayload<{ include: typeof ADMIN_INCLUDE }>;

function toAdminDTO(review: ReviewRow): AdminReviewDTO {
  return {
    id: review.id,
    productId: review.productId,
    productName: review.product.name,
    customerName: review.user.name,
    rating: review.rating,
    comment: review.comment,
    status: review.status,
    createdAt: review.createdAt.toISOString(),
  };
}

export interface AdminListParams {
  status?: "PENDING" | "APPROVED" | "REJECTED";
  page: number;
  pageSize: number;
}

export async function listReviewsForAdmin(params: AdminListParams) {
  const where: Prisma.ReviewWhereInput = {};
  if (params.status) where.status = params.status;

  const [rows, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: ADMIN_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.review.count({ where }),
  ]);

  return { items: rows.map(toAdminDTO), total, page: params.page, pageSize: params.pageSize };
}

export async function updateReviewStatus(reviewId: string, status: "APPROVED" | "REJECTED"): Promise<void> {
  const existing = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!existing) throw new HttpError(404, "Review not found");
  await prisma.review.update({ where: { id: reviewId }, data: { status } });
}

export async function deleteReview(reviewId: string): Promise<void> {
  const existing = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!existing) throw new HttpError(404, "Review not found");
  await prisma.review.delete({ where: { id: reviewId } });
}
