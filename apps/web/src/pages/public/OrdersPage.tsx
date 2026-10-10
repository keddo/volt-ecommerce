import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import type { OrderSummaryDTO } from "@personal-ecommerce/shared";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/apiClient";
import { formatCurrency, formatDate } from "../../lib/format";
import { useDocumentHead } from "../../hooks/useDocumentHead";
import { ORDER_STATUS_STYLES, PAYMENT_STATUS_STYLES } from "../../lib/orderStatus";
import { useLocale, type TranslationKey } from "../../context/LocaleContext";

export function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, locale } = useLocale();
  const statusLabel = (status: string) => t(`status.${status}` as TranslationKey);
  useDocumentHead(t("orders.title"), t("orders.metaDescription"));

  useEffect(() => {
    if (!user) return;
    api
      .get<OrderSummaryDTO[]>("/orders")
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [user]);

  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">{t("orders.title")}</h1>

      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-surface-muted">{t("orders.empty")}</p>
          <Link to="/shop" className="mt-4 inline-block text-accent hover:underline">
            {t("orders.startShopping")}
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="flex items-center justify-between border border-white/10 bg-navy-soft p-4 transition-colors duration-200 hover:border-white/25"
            >
              <div>
                <div className="font-medium text-white">{t("orders.orderNumber", { id: order.id.slice(-6) })}</div>
                <div className="text-xs text-surface-muted">
                  {formatDate(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? t("orders.item") : t("orders.items")}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs font-medium ${PAYMENT_STATUS_STYLES[order.paymentStatus]}`}>
                  {statusLabel(order.paymentStatus)}
                </span>
                <span className={`px-2 py-1 text-xs font-medium ${ORDER_STATUS_STYLES[order.orderStatus]}`}>
                  {statusLabel(order.orderStatus)}
                </span>
                <span className="w-16 text-right font-mono font-semibold text-white">
                  {formatCurrency(order.total, locale)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
