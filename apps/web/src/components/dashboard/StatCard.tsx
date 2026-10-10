interface StatCardProps {
  label: string;
  value: string;
  loading?: boolean;
  tone?: "default" | "warning";
}

export function StatCard({ label, value, loading, tone = "default" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-navy-soft p-5">
      <div className="text-sm text-surface-muted">{label}</div>
      {loading ? (
        <div className="mt-2 h-8 w-20 animate-pulse rounded bg-white/10" />
      ) : (
        <div className={`mt-1 text-2xl font-bold ${tone === "warning" ? "text-amber-400" : "text-white"}`}>
          {value}
        </div>
      )}
    </div>
  );
}
