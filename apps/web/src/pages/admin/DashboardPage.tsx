import { useEffect, useState } from "react";
import {
  SalesRange,
  type DashboardSummary,
  type RecentOrder,
  type SalesPoint,
  type TopProduct,
} from "@personal-ecommerce/shared";
import { api } from "../../lib/apiClient";
import { formatCurrency, formatNumber } from "../../lib/format";
import { StatCard } from "../../components/dashboard/StatCard";
import { SalesChart } from "../../components/dashboard/SalesChart";
import { RecentOrdersTable } from "../../components/dashboard/RecentOrdersTable";
import { TopProductsList } from "../../components/dashboard/TopProductsList";

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [range, setRange] = useState<SalesRange>(SalesRange.THIRTY_DAYS);
  const [salesData, setSalesData] = useState<SalesPoint[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesRefetching, setSalesRefetching] = useState(false);

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardSummary>("/admin/dashboard/summary")
      .then(setSummary)
      .finally(() => setSummaryLoading(false));

    api
      .get<RecentOrder[]>("/admin/dashboard/recent-orders")
      .then(setRecentOrders)
      .finally(() => setOrdersLoading(false));

    api
      .get<TopProduct[]>("/admin/dashboard/top-products")
      .then(setTopProducts)
      .finally(() => setProductsLoading(false));
  }, []);

  useEffect(() => {
    const isFirstLoad = salesData.length === 0 && salesLoading;
    if (!isFirstLoad) setSalesRefetching(true);

    api
      .get<SalesPoint[]>(`/admin/dashboard/sales?range=${range}`)
      .then(setSalesData)
      .finally(() => {
        setSalesLoading(false);
        setSalesRefetching(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total Sales"
          value={summary ? formatCurrency(summary.totalSales) : "—"}
          loading={summaryLoading}
        />
        <StatCard
          label="Total Orders"
          value={summary ? formatNumber(summary.totalOrders) : "—"}
          loading={summaryLoading}
        />
        <StatCard
          label="Total Products"
          value={summary ? formatNumber(summary.totalProducts) : "—"}
          loading={summaryLoading}
        />
        <StatCard
          label="Total Customers"
          value={summary ? formatNumber(summary.totalCustomers) : "—"}
          loading={summaryLoading}
        />
        <StatCard
          label="Low Stock"
          value={summary ? formatNumber(summary.lowStockCount) : "—"}
          loading={summaryLoading}
          tone={summary && summary.lowStockCount > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Pending Orders"
          value={summary ? formatNumber(summary.pendingOrdersCount) : "—"}
          loading={summaryLoading}
        />
      </div>

      <div className="mt-4">
        <SalesChart
          data={salesData}
          range={range}
          onRangeChange={setRange}
          loading={salesLoading}
          isRefetching={salesRefetching}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentOrdersTable orders={recentOrders} loading={ordersLoading} />
        </div>
        <TopProductsList products={topProducts} loading={productsLoading} />
      </div>
    </div>
  );
}
