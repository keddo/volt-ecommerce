import { z } from "zod";

export const checkoutInputSchema = z.object({
  shippingName: z.string().min(2).max(100),
  shippingPhone: z.string().min(5).max(30),
  shippingAddress: z.string().min(5).max(200),
  shippingCity: z.string().min(1).max(100),
  shippingCountry: z.string().min(1).max(100),
});
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

export interface OrderItemDTO {
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  quantity: number;
  price: number;
  lineTotal: number;
}

export interface OrderSummaryDTO {
  id: string;
  customerName: string;
  createdAt: string;
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentStatus: string;
  orderStatus: string;
}

export interface OrderDetailDTO extends OrderSummaryDTO {
  items: OrderItemDTO[];
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
}

export interface OrderListResponse {
  items: OrderSummaryDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export const updateOrderStatusSchema = z
  .object({
    orderStatus: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
    paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
  })
  .refine((v) => v.orderStatus !== undefined || v.paymentStatus !== undefined, {
    message: "At least one of orderStatus or paymentStatus is required",
  });
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
