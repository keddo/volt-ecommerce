import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CategoryDTO, ProductListItem, ProductListResponse } from "@personal-ecommerce/shared";
import { api, ApiError } from "../../lib/apiClient";
import { useToast } from "../../context/ToastContext";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { ProductsTable } from "../../components/products/ProductsTable";

const PAGE_SIZE = 20;

export function ProductsPage() {
  const { showToast } = useToast();

  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("all");
  const [stock, setStock] = useState("all");
  const [sort, setSort] = useState("createdAt:desc");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<ProductListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState<"delete" | null>(null);

  useEffect(() => {
    api.get<CategoryDTO[]>("/admin/categories").then(setCategories);
  }, []);

  function fetchProducts() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (status !== "all") params.set("status", status);
    if (stock !== "all") params.set("stock", stock);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));

    api
      .get<ProductListResponse>(`/admin/products?${params.toString()}`)
      .then(setResult)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, status, stock, sort, page]);

  useEffect(() => {
    setPage(1);
  }, [search, category, status, stock]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!result) return;
    setSelectedIds((prev) => {
      const allSelected = result.items.every((p) => prev.has(p.id));
      if (allSelected) return new Set();
      return new Set(result.items.map((p) => p.id));
    });
  }

  async function handleTogglePublish(product: ProductListItem) {
    try {
      await api.patch(`/admin/products/${product.id}/publish`, { published: !product.published });
      showToast(product.published ? "Product unpublished" : "Product published");
      fetchProducts();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to update product", "error");
    }
  }

  async function handleDuplicate(product: ProductListItem) {
    try {
      await api.post(`/admin/products/${product.id}/duplicate`);
      showToast("Product duplicated");
      fetchProducts();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to duplicate product", "error");
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/products/${deleteTarget.id}`);
      showToast("Product deleted");
      fetchProducts();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to delete product", "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleBulkAction(action: "publish" | "unpublish" | "delete") {
    try {
      await api.post("/admin/products/bulk", { ids: Array.from(selectedIds), action });
      showToast(`${selectedIds.size} product(s) updated`);
      setSelectedIds(new Set());
      fetchProducts();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Bulk action failed", "error");
    } finally {
      setBulkConfirm(null);
    }
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          to="/admin/products/new"
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold hover:bg-accent-hover"
        >
          Add Product
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          placeholder="Search by name, SKU, or brand"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[220px] flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none focus:border-accent"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-white/10 bg-navy-soft px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-white/10 bg-navy-soft px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
        <select
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="rounded-xl border border-white/10 bg-navy-soft px-3 py-2 text-sm"
        >
          <option value="all">All stock levels</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      {selectedIds.size > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
          <span>{selectedIds.size} selected</span>
          <button onClick={() => handleBulkAction("publish")} className="text-accent hover:underline">
            Publish
          </button>
          <button onClick={() => handleBulkAction("unpublish")} className="text-accent hover:underline">
            Unpublish
          </button>
          <button onClick={() => setBulkConfirm("delete")} className="text-red-400 hover:underline">
            Delete
          </button>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-white/10 bg-navy-soft p-5">
        <ProductsTable
          products={result?.items ?? []}
          loading={loading}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          sort={sort}
          onSortChange={setSort}
          onTogglePublish={handleTogglePublish}
          onDuplicate={handleDuplicate}
          onDelete={setDeleteTarget}
        />

        {result && result.total > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-surface-muted">
            <span>
              {result.total} product{result.total === 1 ? "" : "s"}
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

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete product"
        message={`Delete "${deleteTarget?.name}"? This can't be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkConfirm !== null}
        title="Delete products"
        message={`Delete ${selectedIds.size} selected product(s)? This can't be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => handleBulkAction("delete")}
        onCancel={() => setBulkConfirm(null)}
      />
    </div>
  );
}
