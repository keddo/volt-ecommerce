export const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-white/10 text-surface-muted",
  CONFIRMED: "bg-accent/20 text-accent",
  PROCESSING: "bg-accent/20 text-accent",
  SHIPPED: "bg-accent/20 text-accent",
  DELIVERED: "bg-emerald-500/20 text-emerald-400",
  CANCELLED: "bg-red-500/20 text-red-400",
};

export const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-white/10 text-surface-muted",
  PAID: "bg-emerald-500/20 text-emerald-400",
  FAILED: "bg-red-500/20 text-red-400",
  REFUNDED: "bg-amber-500/20 text-amber-400",
};

export const ORDER_STATUS_OPTIONS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
export const PAYMENT_STATUS_OPTIONS = ["PENDING", "PAID", "FAILED", "REFUNDED"];
