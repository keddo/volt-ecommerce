import type { TopProduct } from "@personal-ecommerce/shared";
import { resolveImageUrl } from "../../lib/imageUrl";

export function TopProductsList({ products, loading }: { products: TopProduct[]; loading: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-navy-soft p-5">
      <h2 className="text-sm font-semibold text-white">Top Products</h2>

      {loading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-white/5" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-6 text-center text-sm text-surface-muted">No sales yet.</div>
      ) : (
        <ul className="mt-4 space-y-3">
          {products.map((product, i) => (
            <li key={product.productId} className="flex items-center gap-3">
              <span className="w-4 text-xs text-surface-muted">{i + 1}</span>
              {product.image ? (
                <img src={resolveImageUrl(product.image)} alt="" loading="lazy" className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-white/10" />
              )}
              <div className="flex-1 truncate text-sm text-white">{product.name}</div>
              <div className="text-sm tabular-nums text-surface-muted">{product.quantitySold} sold</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
