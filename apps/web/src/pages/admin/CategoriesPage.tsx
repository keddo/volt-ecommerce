import { useEffect, useState, type FormEvent } from "react";
import type { CategoryDTO } from "@personal-ecommerce/shared";
import { api, ApiError } from "../../lib/apiClient";
import { resolveImageUrl } from "../../lib/imageUrl";
import { useToast } from "../../context/ToastContext";
import { ConfirmDialog } from "../../components/ConfirmDialog";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium text-surface-muted";

interface CategoryFormState {
  id: string | null;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  imageFile: File | null;
  currentImage: string | null;
}

const EMPTY_FORM: CategoryFormState = {
  id: null,
  name: "",
  description: "",
  status: "ACTIVE",
  imageFile: null,
  currentImage: null,
};

export function CategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CategoryFormState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryDTO | null>(null);

  function fetchCategories() {
    setLoading(true);
    api
      .get<CategoryDTO[]>("/admin/categories")
      .then(setCategories)
      .finally(() => setLoading(false));
  }

  useEffect(fetchCategories, []);

  function openCreate() {
    setError(null);
    setForm({ ...EMPTY_FORM });
  }

  function openEdit(category: CategoryDTO) {
    setError(null);
    setForm({
      id: category.id,
      name: category.name,
      description: category.description ?? "",
      status: category.status,
      imageFile: null,
      currentImage: category.image,
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);

    const formData = new FormData();
    formData.append("name", form.name);
    if (form.description) formData.append("description", form.description);
    formData.append("status", form.status);
    if (form.imageFile) formData.append("image", form.imageFile);

    setSubmitting(true);
    try {
      if (form.id) {
        await api.put(`/admin/categories/${form.id}`, formData);
        showToast("Category updated");
      } else {
        await api.post("/admin/categories", formData);
        showToast("Category created");
      }
      setForm(null);
      fetchCategories();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/categories/${deleteTarget.id}`);
      showToast("Category deleted");
      fetchCategories();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to delete category", "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button
          onClick={openCreate}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold hover:bg-accent-hover"
        >
          Add Category
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-navy-soft p-5">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-white/5" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="py-10 text-center text-sm text-surface-muted">No categories yet.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-surface-muted">
                <th className="w-14 py-2" />
                <th className="py-2 pr-4 font-normal">Name</th>
                <th className="py-2 pr-4 font-normal">Slug</th>
                <th className="py-2 pr-4 font-normal">Products</th>
                <th className="py-2 pr-4 font-normal">Status</th>
                <th className="py-2 font-normal" />
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-white/5">
                  <td className="py-3">
                    {category.image ? (
                      <img src={resolveImageUrl(category.image)} alt="" loading="lazy" className="h-10 w-10 rounded-xl object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-white/10" />
                    )}
                  </td>
                  <td className="py-3 pr-4 text-white">{category.name}</td>
                  <td className="py-3 pr-4 text-surface-muted">{category.slug}</td>
                  <td className="py-3 pr-4 text-surface-muted">{category.productCount}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-xl px-2 py-1 text-xs font-medium ${
                        category.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-white/10 text-surface-muted"
                      }`}
                    >
                      {category.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-3 text-xs">
                      <button onClick={() => openEdit(category)} className="text-accent hover:underline">
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(category)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-navy-soft p-6">
            <h2 className="text-lg font-semibold text-white">{form.id ? "Edit Category" : "Add Category"}</h2>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
              <div>
                <label className={labelClass} htmlFor="category-name">Name</label>
                <input
                  id="category-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="category-description">Description</label>
                <textarea
                  id="category-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="category-status">Status</label>
                <select
                  id="category-status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "ACTIVE" | "INACTIVE" })}
                  className={inputClass}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Image</label>
                {form.currentImage && !form.imageFile && (
                  <img src={resolveImageUrl(form.currentImage)} alt="" className="mb-2 h-16 w-16 rounded-xl object-cover" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })}
                  className="text-sm text-surface-muted"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setForm(null)}
                  className="rounded-xl px-4 py-2 text-sm text-surface-muted hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold hover:bg-accent-hover disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete category"
        message={`Delete "${deleteTarget?.name}"? This can't be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
