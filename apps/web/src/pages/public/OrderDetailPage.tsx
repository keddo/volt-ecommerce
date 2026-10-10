import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import type { OrderDetailDTO } from "@personal-ecommerce/shared";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/apiClient";
import { resolveImageUrl } from "../../lib/imageUrl";
import { formatCurrency, formatDate } from "../../lib/format";
import { useDocumentHead } from "../../hooks/useDocumentHead";
import { ORDER_STATUS_STYLES, PAYMENT_STATUS_STYLES } from "../../lib/orderStatus";
import { useLocale, type TranslationKey } from "../../context/LocaleContext";

export function OrderDetailPage() {
  const { id } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderDetailDTO | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { t, locale } = useLocale();
  const statusLabel = (status: string) => t(`status.${status}` as TranslationKey);
  useDocumentHead(t("orders.metaDescriptionDetail"));

  useEffect(() => {
    if (!user || !id) return;
    api
      .get<OrderDetailDTO>(`/orders/${id}`)
      .then(setOrder)
      .catch(() => setNotFound(true));
  }, [user, id]);

  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">{t("orders.notFound")}</h1>
        <Link to="/orders" className="mt-4 inline-block text-accent hover:underline">
          {t("orders.backToOrders")}
        </Link>
      </div>
    );
  }

  if (!order) {
    return <div className="mx-auto max-w-4xl px-6 py-12 text-sm text-surface-muted">{t("checkout.loading")}</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link to="/orders" className="text-sm text-accent hover:underline">
        {t("orders.yourOrdersLink")}
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("orders.orderNumber", { id: order.id.slice(-6) })}</h1>
        <div className="flex gap-2">
          <span className={`px-2 py-1 text-xs font-medium ${PAYMENT_STATUS_STYLES[order.paymentStatus]}`}>
            {statusLabel(order.paymentStatus)}
          </span>
          <span className={`px-2 py-1 text-xs font-medium ${ORDER_STATUS_STYLES[order.orderStatus]}`}>
            {statusLabel(order.orderStatus)}
          </span>
        </div>
      </div>
      <p className="mt-1 text-sm text-surface-muted">{t("orders.placedOn", { date: formatDate(order.createdAt) })}</p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.productId} className="flex items-center gap-4 border border-white/10 bg-navy-soft p-4">
              {item.image ? (
                <img src={resolveImageUrl(item.image)} alt="" loading="lazy" className="h-16 w-16 object-cover" />
              ) : (
                <div className="h-16 w-16 bg-white/10" />
              )}
              <div className="flex-1">
                <Link to={`/products/${item.slug}`} className="font-medium text-white hover:text-accent">
                  {item.name}
                </Link>
                <div className="font-mono text-sm text-surface-muted">
                  {formatCurrency(item.price, locale)} × {item.quantity}
                </div>
              </div>
              <div className="font-mono font-semibold text-white">{formatCurrency(item.lineTotal, locale)}</div>
            </div>
          ))}
        </div>

        <div className="h-fit space-y-6">
          <div className="border border-white/10 bg-navy-soft p-5">
            <h2 className="text-sm font-semibold text-white">{t("orders.shippingHeading")}</h2>
            <div className="mt-2 text-sm text-surface-muted">
              <div>{order.shippingName}</div>
              <div>{order.shippingPhone}</div>
              <div>{order.shippingAddress}</div>
              <div>
                {order.shippingCity}, {order.shippingCountry}
              </div>
            </div>
          </div>

          <div className="border border-white/10 bg-navy-soft p-5">
            <h2 className="text-sm font-semibold text-white">{t("orders.summary")}</h2>
            <dl className="mt-3 space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <dt className="font-sans text-surface-muted">{t("cart.subtotal")}</dt>
                <dd className="text-white">{formatCurrency(order.subtotal, locale)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-sans text-surface-muted">{t("cart.shipping")}</dt>
                <dd className="text-white">
                  {order.shippingCost === 0 ? t("cart.free") : formatCurrency(order.shippingCost, locale)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-base font-semibold">
                <dt className="font-sans text-white">{t("cart.total")}</dt>
                <dd className="text-white">{formatCurrency(order.total, locale)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
