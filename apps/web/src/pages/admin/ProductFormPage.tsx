import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { CategoryDTO, ProductDetail } from "@personal-ecommerce/shared";
import { api, ApiError } from "../../lib/apiClient";
import { useToast } from "../../context/ToastContext";
import { ImageGrid, type ImageGridItem } from "../../components/products/ImageGrid";

interface SpecRow {
  key: string;
  value: string;
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium text-surface-muted";

export function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [minStock, setMinStock] = useState("0");
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [specs, setSpecs] = useState<SpecRow[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ImageGridItem[]>([]);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    api.get<CategoryDTO[]>("/admin/categories").then(setCategories);
  }, []);

  useEffect(() => {
    if (!id) return;
    api
      .get<ProductDetail>(`/admin/products/${id}`)
      .then((product) => {
        setName(product.name);
        setSku(product.sku);
        setCategoryId(product.categoryId);
        setBrand(product.brand ?? "");
        setDescription(product.description ?? "");
        setPrice(String(product.price));
        setDiscountPrice(product.discountPrice ? String(product.discountPrice) : "");
        setStock(String(product.stock));
        setMinStock(String(product.minStock));
        setFeatured(product.featured);
        setPublished(product.published);
        setSeoTitle(product.seoTitle ?? "");
        setMetaDescription(product.metaDescription ?? "");
        setSpecs(product.specifications.map((s) => ({ key: s.key, value: s.value })));
        setTags(product.tags);
        setExistingImages(product.images.map((img) => ({ key: img.id, url: img.url })));
      })
      .finally(() => setLoading(false));
  }, [id]);

  function addSpecRow() {
    setSpecs((prev) => [...prev, { key: "", value: "" }]);
  }
  function updateSpecRow(index: number, field: "key" | "value", value: string) {
    setSpecs((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }
  function removeSpecRow(index: number) {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  }

  function addTag(raw: string) {
    const tag = raw.trim();
    if (tag && !tags.includes(tag)) setTags((prev) => [...prev, tag]);
    setTagInput("");
  }
  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  }
  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleAddFiles(files: File[]) {
    if (!isEdit) {
      setPendingFiles((prev) => [...prev, ...files]);
      return;
    }
    setImageUploading(true);
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    api
      .post<ProductDetail>(`/admin/products/${id}/images`, formData)
      .then((product) => {
        setExistingImages(product.images.map((img) => ({ key: img.id, url: img.url })));
        showToast("Image added");
      })
      .catch((err) => showToast(err instanceof ApiError ? err.message : "Failed to upload image", "error"))
      .finally(() => setImageUploading(false));
  }

  function handleRemoveImage(key: string) {
    if (!isEdit) {
      setPendingFiles((prev) => {
        const index = existingImages.findIndex((img) => img.key === key);
        return prev.filter((_, i) => i !== index);
      });
      setExistingImages((prev) => prev.filter((img) => img.key !== key));
      return;
    }
    api
      .delete<ProductDetail>(`/admin/products/${id}/images/${key}`)
      .then((product) => setExistingImages(product.images.map((img) => ({ key: img.id, url: img.url }))))
      .catch((err) => showToast(err instanceof ApiError ? err.message : "Failed to remove image", "error"));
  }

  // Combined view for create mode: existingImages mirrors pendingFiles 1:1 as local blob previews.
  const displayImages: ImageGridItem[] = isEdit
    ? existingImages
    : pendingFiles.map((file, i) => ({ key: `pending-${i}`, url: URL.createObjectURL(file) }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("sku", sku);
    formData.append("categoryId", categoryId);
    if (brand) formData.append("brand", brand);
    if (description) formData.append("description", description);
    formData.append("price", price);
    if (discountPrice) formData.append("discountPrice", discountPrice);
    formData.append("stock", stock);
    formData.append("minStock", minStock);
    formData.append("featured", String(featured));
    formData.append("published", String(published));
    if (seoTitle) formData.append("seoTitle", seoTitle);
    if (metaDescription) formData.append("metaDescription", metaDescription);
    formData.append("specifications", JSON.stringify(specs.filter((s) => s.key && s.value)));
    formData.append("tags", JSON.stringify(tags));
    if (!isEdit) pendingFiles.forEach((f) => formData.append("images", f));

    setSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/admin/products/${id}`, formData);
        showToast("Product updated");
      } else {
        await api.post("/admin/products", formData);
        showToast("Product created");
      }
      navigate("/admin/products");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-surface-muted">Loading…</div>;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">{isEdit ? "Edit Product" : "Add Product"}</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass} htmlFor="product-name">Product name</label>
            <input id="product-name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="product-sku">SKU</label>
            <input id="product-sku" required value={sku} onChange={(e) => setSku(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="product-category">Category</label>
            <select
              id="product-category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="product-brand">Brand</label>
            <input id="product-brand" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className={labelClass} htmlFor="product-description">Description</label>
            <textarea
              id="product-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="product-price">Price</label>
            <input
              id="product-price"
              required
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="product-discount-price">Discount price (optional)</label>
            <input
              id="product-discount-price"
              type="number"
              min="0"
              step="0.01"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="product-stock">Stock quantity</label>
            <input
              id="product-stock"
              required
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="product-min-stock">Minimum stock level</label>
            <input
              id="product-min-stock"
              required
              type="number"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Product images</label>
          <ImageGrid
            images={displayImages}
            onAddFiles={handleAddFiles}
            onRemove={handleRemoveImage}
            uploading={imageUploading}
          />
        </div>

        <div>
          <label className={labelClass}>Specifications</label>
          <div className="flex flex-col gap-2">
            {specs.map((row, i) => (
              <div key={i} className="flex gap-2">
                <input
                  placeholder="Key (e.g. Color)"
                  value={row.key}
                  onChange={(e) => updateSpecRow(i, "key", e.target.value)}
                  className={inputClass}
                />
                <input
                  placeholder="Value (e.g. Black)"
                  value={row.value}
                  onChange={(e) => updateSpecRow(i, "value", e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeSpecRow(i)}
                  className="rounded-xl px-3 text-surface-muted hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addSpecRow}
              className="w-fit text-sm text-accent hover:underline"
            >
              + Add specification
            </button>
          </div>
        </div>

        <div>
          <label className={labelClass}>Tags</label>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 rounded-xl bg-white/10 px-2 py-1 text-xs">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="text-surface-muted hover:text-white">
                  ✕
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => tagInput && addTag(tagInput)}
              placeholder="Type and press Enter"
              className="min-w-[120px] flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="product-seo-title">SEO title</label>
            <input id="product-seo-title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="product-meta-description">Meta description</label>
            <input
              id="product-meta-description"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            Featured product
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Published
          </label>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create product"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="rounded-xl px-5 py-2.5 text-sm text-surface-muted hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
