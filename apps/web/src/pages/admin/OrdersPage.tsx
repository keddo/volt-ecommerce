import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { OrderListResponse } from "@personal-ecommerce/shared";
import { api } from "../../lib/apiClient";
import { formatCurrency, formatDate } from "../../lib/format";
import { ORDER_STATUS_OPTIONS, ORDER_STATUS_STYLES, PAYMENT_STATUS_STYLES } from "../../lib/orderStatus";

const PAGE_SIZE = 20;

export function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<OrderListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));

    api
      .get<OrderListResponse>(`/admin/orders?${params.toString()}`)
      .then(setResult)
      .finally(() => setLoading(false));
  }, [search, status, page]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          placeholder="Search by customer name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[260px] flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none focus:border-accent"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-white/10 bg-navy-soft px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {ORDER_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-navy-soft p-5">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-white/5" />
            ))}
          </div>
        ) : !result || result.items.length === 0 ? (
          <div className="py-16 text-center text-sm text-surface-muted">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-surface-muted">
                  <th className="py-2 pr-4 font-normal">Order</th>
                  <th className="py-2 pr-4 font-normal">Customer</th>
                  <th className="py-2 pr-4 font-normal">Date</th>
                  <th className="py-2 pr-4 font-normal">Amount</th>
                  <th className="py-2 pr-4 font-normal">Payment</th>
                  <th className="py-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((order) => (
                  <tr key={order.id} className="border-b border-white/5">
                    <td className="py-3 pr-4">
                      <Link to={`/admin/orders/${order.id}`} className="text-accent hover:underline">
                        #{order.id.slice(-6)}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-white">{order.customerName}</td>
                    <td className="py-3 pr-4 text-surface-muted">{formatDate(order.createdAt)}</td>
                    <td className="py-3 pr-4 tabular-nums text-white">{formatCurrency(order.total)}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-xl px-2 py-1 text-xs font-medium ${PAYMENT_STATUS_STYLES[order.paymentStatus]}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`rounded-xl px-2 py-1 text-xs font-medium ${ORDER_STATUS_STYLES[order.orderStatus]}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result && result.total > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-surface-muted">
            <span>
              {result.total} order{result.total === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-xl px-3 py-1 hover:bg-white/5 disabled:opacity-30"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl px-3 py-1 hover:bg-white/5 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
