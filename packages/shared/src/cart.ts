import { z } from "zod";

export interface CartItemDTO {
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  stock: number;
  lineTotal: number;
}

export interface CartSummary {
  items: CartItemDTO[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  couponCode: string | null;
  total: number;
}

export const addCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).default(1),
});
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(0),
});
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export const applyCouponSchema = z.object({
  code: z.string().min(1).max(50),
});
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
