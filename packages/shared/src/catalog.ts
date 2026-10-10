import type { ProductDetail, ProductListItem } from "./product";

export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string;
  createdAt: string;
}

export interface PublicProductDetail extends ProductDetail {
  reviews: PublicReview[];
  averageRating: number | null;
  reviewCount: number;
  relatedProducts: ProductListItem[];
}

export interface PublicProductListResponse {
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HomeBundle {
  featured: ProductListItem[];
  newArrivals: ProductListItem[];
}

export type ProductSort = "featured" | "newest" | "price_asc" | "price_desc";
