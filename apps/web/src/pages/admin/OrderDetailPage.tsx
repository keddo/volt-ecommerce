import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { OrderDetailDTO } from "@personal-ecommerce/shared";
import { api, ApiError } from "../../lib/apiClient";
import { resolveImageUrl } from "../../lib/imageUrl";
import { useToast } from "../../context/ToastContext";
import { formatCurrency, formatDate } from "../../lib/format";
import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "../../lib/orderStatus";

const selectClass = "rounded-xl border border-white/10 bg-navy-soft px-3 py-2 text-sm";

export function OrderDetailPage() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [order, setOrder] = useState<OrderDetailDTO | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [updating, setUpdating] = useState(false);

  function fetchOrder() {
    if (!id) return;
    api
      .get<OrderDetailDTO>(`/admin/orders/${id}`)
      .then(setOrder)
      .catch(() => setNotFound(true));
  }

  useEffect(fetchOrder, [id]);

  async function handleStatusChange(field: "orderStatus" | "paymentStatus", value: string) {
    if (!id) return;
    setUpdating(true);
    try {
      const updated = await api.patch<OrderDetailDTO>(`/admin/orders/${id}/status`, { [field]: value });
      setOrder(updated);
      showToast("Order updated");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to update order", "error");
    } finally {
      setUpdating(false);
    }
  }

  if (notFound) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Order not found</h1>
        <Link to="/admin/orders" className="mt-4 inline-block text-accent hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return <div className="text-sm text-surface-muted">Loading…</div>;
  }

  return (
    <div>
      <Link to="/admin/orders" className="text-sm text-accent hover:underline">
        ← Orders
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order #{order.id.slice(-6)}</h1>
      </div>
      <p className="mt-1 text-sm text-surface-muted">
        {order.customerName} · Placed {formatDate(order.createdAt)}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.productId} className="flex items-center gap-4 rounded-xl border border-white/10 bg-navy-soft p-4">
              {item.image ? (
                <img src={resolveImageUrl(item.image)} alt="" loading="lazy" className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-white/10" />
              )}
              <div className="flex-1">
                <div className="font-medium text-white">{item.name}</div>
                <div className="text-sm text-surface-muted">
                  {formatCurrency(item.price)} × {item.quantity}
                </div>
              </div>
              <div className="font-semibold text-white">{formatCurrency(item.lineTotal)}</div>
            </div>
          ))}
        </div>

        <div className="h-fit space-y-6">
          <div className="rounded-xl border border-white/10 bg-navy-soft p-5">
            <h2 className="text-sm font-semibold text-white">Status</h2>
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-surface-muted">Order status</label>
                <select
                  disabled={updating}
                  value={order.orderStatus}
                  onChange={(e) => handleStatusChange("orderStatus", e.target.value)}
                  className={selectClass + " w-full"}
                >
                  {ORDER_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-surface-muted">Payment status</label>
                <select
                  disabled={updating}
                  value={order.paymentStatus}
                  onChange={(e) => handleStatusChange("paymentStatus", e.target.value)}
                  className={selectClass + " w-full"}
                >
                  {PAYMENT_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-navy-soft p-5">
            <h2 className="text-sm font-semibold text-white">Shipping</h2>
            <div className="mt-2 text-sm text-surface-muted">
              <div>{order.shippingName}</div>
              <div>{order.shippingPhone}</div>
              <div>{order.shippingAddress}</div>
              <div>
                {order.shippingCity}, {order.shippingCountry}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-navy-soft p-5">
            <h2 className="text-sm font-semibold text-white">Summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-surface-muted">Subtotal</dt>
                <dd className="text-white">{formatCurrency(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-surface-muted">Shipping</dt>
                <dd className="text-white">{order.shippingCost === 0 ? "Free" : formatCurrency(order.shippingCost)}</dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-base font-semibold">
                <dt className="text-white">Total</dt>
                <dd className="text-white">{formatCurrency(order.total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
