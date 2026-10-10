export const SalesRange = {
  SEVEN_DAYS: "7d",
  THIRTY_DAYS: "30d",
  THREE_MONTHS: "3m",
  ONE_YEAR: "1y",
} as const;

export type SalesRange = (typeof SalesRange)[keyof typeof SalesRange];

export interface DashboardSummary {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockCount: number;
  pendingOrdersCount: number;
}

export interface SalesPoint {
  bucket: string;
  total: number;
}

export interface RecentOrder {
  id: string;
  customerName: string;
  createdAt: string;
  total: number;
  orderStatus: string;
}

export interface TopProduct {
  productId: string;
  name: string;
  image: string | null;
  quantitySold: number;
}
