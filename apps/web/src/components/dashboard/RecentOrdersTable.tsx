import type { RecentOrder } from "@personal-ecommerce/shared";
import { formatCurrency, formatDate } from "../../lib/format";
import { ORDER_STATUS_STYLES } from "../../lib/orderStatus";

export function RecentOrdersTable({ orders, loading }: { orders: RecentOrder[]; loading: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-navy-soft p-5">
      <h2 className="text-sm font-semibold text-white">Recent Orders</h2>

      {loading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-white/5" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-6 text-center text-sm text-surface-muted">No orders yet.</div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-surface-muted">
                <th className="pb-2 pr-4 font-normal">Order</th>
                <th className="pb-2 pr-4 font-normal">Customer</th>
                <th className="pb-2 pr-4 font-normal">Date</th>
                <th className="pb-2 pr-4 font-normal">Amount</th>
                <th className="pb-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-white/5">
                  <td className="py-2 pr-4 text-surface-muted">#{order.id.slice(-6)}</td>
                  <td className="py-2 pr-4 text-white">{order.customerName}</td>
                  <td className="py-2 pr-4 text-surface-muted">{formatDate(order.createdAt)}</td>
                  <td className="py-2 pr-4 tabular-nums text-white">{formatCurrency(order.total)}</td>
                  <td className="py-2">
                    <span
                      className={`rounded-xl px-2 py-1 text-xs font-medium ${
                        ORDER_STATUS_STYLES[order.orderStatus] ?? "bg-white/10 text-surface-muted"
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
