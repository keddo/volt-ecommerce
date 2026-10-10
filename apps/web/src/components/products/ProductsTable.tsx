import { Link } from "react-router-dom";
import type { ProductListItem } from "@personal-ecommerce/shared";
import { formatCurrency, formatDate } from "../../lib/format";
import { resolveImageUrl } from "../../lib/imageUrl";

interface ProductsTableProps {
  products: ProductListItem[];
  loading: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  sort: string;
  onSortChange: (sort: string) => void;
  onTogglePublish: (product: ProductListItem) => void;
  onDuplicate: (product: ProductListItem) => void;
  onDelete: (product: ProductListItem) => void;
}

const COLUMNS: { key: string; label: string; sortable?: boolean }[] = [
  { key: "name", label: "Product", sortable: true },
  { key: "sku", label: "SKU" },
  { key: "category", label: "Category" },
  { key: "price", label: "Price", sortable: true },
  { key: "stock", label: "Stock", sortable: true },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Created", sortable: true },
  { key: "actions", label: "" },
];

function stockLabel(product: ProductListItem): { text: string; className: string } {
  if (product.stock === 0) return { text: "Out of stock", className: "text-red-400" };
  if (product.stock <= product.minStock) return { text: `Low (${product.stock})`, className: "text-amber-400" };
  return { text: String(product.stock), className: "text-white" };
}

export function ProductsTable({
  products,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  sort,
  onSortChange,
  onTogglePublish,
  onDuplicate,
  onDelete,
}: ProductsTableProps) {
  const [sortField, sortDir] = sort.split(":");
  const allSelected = products.length > 0 && products.every((p) => selectedIds.has(p.id));

  function handleSortClick(field: string) {
    if (sortField === field) {
      onSortChange(`${field}:${sortDir === "asc" ? "desc" : "asc"}`);
    } else {
      onSortChange(`${field}:asc`);
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded bg-white/5" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return <div className="py-16 text-center text-sm text-surface-muted">No products found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs text-surface-muted">
            <th className="w-10 py-2 pr-2">
              <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} />
            </th>
            <th className="w-14 py-2 pr-2" />
            {COLUMNS.map((col) => (
              <th key={col.key} className="py-2 pr-4 font-normal">
                {col.sortable ? (
                  <button
                    onClick={() => handleSortClick(col.key)}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    {col.label}
                    {sortField === col.key && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const stock = stockLabel(product);
            return (
              <tr key={product.id} className="border-b border-white/5">
                <td className="py-3 pr-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(product.id)}
                    onChange={() => onToggleSelect(product.id)}
                  />
                </td>
                <td className="py-3 pr-2">
                  {product.image ? (
                    <img src={resolveImageUrl(product.image)} alt="" loading="lazy" className="h-10 w-10 rounded-xl object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-white/10" />
                  )}
                </td>
                <td className="max-w-xs truncate py-3 pr-4 text-white">{product.name}</td>
                <td className="py-3 pr-4 text-surface-muted">{product.sku}</td>
                <td className="py-3 pr-4 text-surface-muted">{product.categoryName}</td>
                <td className="py-3 pr-4 tabular-nums text-white">
                  {formatCurrency(product.discountPrice ?? product.price)}
                  {product.discountPrice && (
                    <span className="ml-1 text-xs text-surface-muted line-through">
                      {formatCurrency(product.price)}
                    </span>
                  )}
                </td>
                <td className={`py-3 pr-4 tabular-nums ${stock.className}`}>{stock.text}</td>
                <td className="py-3 pr-4">
                  <button
                    onClick={() => onTogglePublish(product)}
                    className={`rounded-xl px-2 py-1 text-xs font-medium ${
                      product.published ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-surface-muted"
                    }`}
                  >
                    {product.published ? "Published" : "Unpublished"}
                  </button>
                </td>
                <td className="py-3 pr-4 text-surface-muted">{formatDate(product.createdAt)}</td>
                <td className="py-3 pr-4">
                  <div className="flex gap-3 text-xs">
                    <Link to={`/admin/products/${product.id}/edit`} className="text-accent hover:underline">
                      Edit
                    </Link>
                    <button onClick={() => onDuplicate(product)} className="text-surface-muted hover:text-white">
                      Duplicate
                    </button>
                    <button onClick={() => onDelete(product)} className="text-red-400 hover:text-red-300">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
