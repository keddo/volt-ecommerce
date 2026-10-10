import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SalesRange, type SalesPoint } from "@personal-ecommerce/shared";
import { formatCurrency, formatDate } from "../../lib/format";

const RANGE_LABELS: Record<SalesRange, string> = {
  [SalesRange.SEVEN_DAYS]: "7D",
  [SalesRange.THIRTY_DAYS]: "30D",
  [SalesRange.THREE_MONTHS]: "3M",
  [SalesRange.ONE_YEAR]: "1Y",
};

const RANGES = Object.values(SalesRange);

interface SalesChartProps {
  data: SalesPoint[];
  range: SalesRange;
  onRangeChange: (range: SalesRange) => void;
  loading: boolean;
  isRefetching: boolean;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: SalesPoint }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-navy-soft px-3 py-2 shadow-lg">
      <div className="text-sm font-semibold text-white">{formatCurrency(point.total)}</div>
      <div className="text-xs text-surface-muted">{formatDate(point.bucket)}</div>
    </div>
  );
}

function compactCurrency(value: number): string {
  if (value >= 1000) return `ETB ${Math.round(value / 1000)}k`;
  return `ETB ${value}`;
}

export function SalesChart({ data, range, onRangeChange, loading, isRefetching }: SalesChartProps) {
  const [showTable, setShowTable] = useState(false);
  const hasData = data.length > 0;

  return (
    <div className="rounded-xl border border-white/10 bg-navy-soft p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Sales Overview</h2>
        <div className="flex gap-1 rounded-xl border border-white/10 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={`rounded-xl px-3 py-1 text-xs font-medium transition-colors ${
                r === range ? "bg-accent text-white" : "text-surface-muted hover:text-white"
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div
        className="mt-4 h-64 transition-opacity"
        style={{ opacity: isRefetching ? 0.5 : 1 }}
      >
        {loading ? (
          <div className="h-full w-full animate-pulse rounded bg-white/5" />
        ) : hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C2410C" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#C2410C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" strokeDasharray="0" />
              <XAxis
                dataKey="bucket"
                tickFormatter={formatDate}
                tick={{ fill: "#9C9686", fontSize: 12 }}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                tickFormatter={compactCurrency}
                tick={{ fill: "#9C9686", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#C2410C"
                strokeWidth={2}
                fill="url(#salesFill)"
                dot={false}
                activeDot={{ r: 5, fill: "#C2410C", stroke: "#211C15", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-surface-muted">
            No sales in this period.
          </div>
        )}
      </div>

      {hasData && (
        <details className="mt-3" open={showTable} onToggle={(e) => setShowTable(e.currentTarget.open)}>
          <summary className="cursor-pointer text-xs text-surface-muted hover:text-white">
            View as table
          </summary>
          <table className="mt-2 w-full text-left text-xs">
            <thead>
              <tr className="text-surface-muted">
                <th className="py-1 pr-4 font-normal">Date</th>
                <th className="py-1 font-normal">Sales</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point) => (
                <tr key={point.bucket} className="border-t border-white/5">
                  <td className="py-1 pr-4 text-white">{formatDate(point.bucket)}</td>
                  <td className="py-1 tabular-nums text-white">{formatCurrency(point.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}
