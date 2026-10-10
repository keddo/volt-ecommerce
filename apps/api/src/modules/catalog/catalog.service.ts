import { Prisma } from "@prisma/client";
import type {
  CategoryDTO,
  HomeBundle,
  ProductListItem,
  ProductSort,
  PublicProductDetail,
  PublicProductListResponse,
} from "@personal-ecommerce/shared";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errorHandler";
import { DETAIL_INCLUDE, toDetail, toListItem } from "../products/products.service";

export interface PublicListParams {
  search?: string;
  category?: string; // slug
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  sort: ProductSort;
  page: number;
  pageSize: number;
}

const SORT_TO_ORDER_BY: Record<ProductSort, Prisma.ProductOrderByWithRelationInput> = {
  featured: { featured: "desc" },
  newest: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
};

export async function listPublicProducts(params: PublicListParams): Promise<PublicProductListResponse> {
  const where: Prisma.ProductWhereInput = {
    published: true,
    category: { status: "ACTIVE" },
  };

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { brand: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params.category) where.category = { slug: params.category, status: "ACTIVE" };
  if (params.brand) where.brand = { equals: params.brand, mode: "insensitive" };
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    where.price = {};
    if (params.minPrice !== undefined) where.price.gte = params.minPrice;
    if (params.maxPrice !== undefined) where.price.lte = params.maxPrice;
  }

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: SORT_TO_ORDER_BY[params.sort],
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { items: rows.map(toListItem), total, page: params.page, pageSize: params.pageSize };
}

export async function getPublicProductBySlug(slug: string): Promise<PublicProductDetail> {
  const product = await prisma.product.findFirst({
    where: { slug, published: true, category: { status: "ACTIVE" } },
    include: DETAIL_INCLUDE,
  });
  if (!product) throw new HttpError(404, "Product not found");

  const [relatedRows, approvedReviews] = await Promise.all([
    prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        published: true,
        id: { not: product.id },
        category: { status: "ACTIVE" },
      },
      include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      take: 4,
    }),
    prisma.review.findMany({
      where: { productId: product.id, status: "APPROVED" },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const reviewCount = approvedReviews.length;
  const averageRating =
    reviewCount > 0 ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : null;

  return {
    ...toDetail(product),
    reviews: approvedReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      authorName: r.user.name,
      createdAt: r.createdAt.toISOString(),
    })),
    averageRating,
    reviewCount,
    relatedProducts: relatedRows.map(toListItem),
  };
}

export async function listActiveCategories(): Promise<CategoryDTO[]> {
  const categories = await prisma.category.findMany({
    where: { status: "ACTIVE" },
    include: { _count: { select: { products: { where: { published: true } } } } },
    orderBy: { name: "asc" },
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    image: c.image,
    status: c.status as "ACTIVE" | "INACTIVE",
    productCount: c._count.products,
  }));
}

export async function getHomeBundle(): Promise<HomeBundle> {
  const baseWhere: Prisma.ProductWhereInput = { published: true, category: { status: "ACTIVE" } };
  const include = { category: true, images: { orderBy: { sortOrder: "asc" as const }, take: 1 } };

  const [featuredRows, newArrivalRows] = await Promise.all([
    prisma.product.findMany({
      where: { ...baseWhere, featured: true },
      include,
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.product.findMany({ where: baseWhere, include, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const featured: ProductListItem[] = featuredRows.map(toListItem);
  const newArrivals: ProductListItem[] = newArrivalRows.map(toListItem);

  return { featured, newArrivals };
}
