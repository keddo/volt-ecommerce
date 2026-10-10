import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { CategoryDTO, ProductListItem, PublicProductListResponse, ProductSort } from "@personal-ecommerce/shared";
import { api } from "../../lib/apiClient";
import { ProductCard } from "./ProductCard";
import { useLocale } from "../../context/LocaleContext";

const PAGE_SIZE = 12;

interface ProductBrowserProps {
  lockedCategorySlug?: string;
}

export function ProductBrowser({ lockedCategorySlug }: ProductBrowserProps) {
  const { t } = useLocale();
  const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
    { value: "featured", label: t("shop.sortFeatured") },
    { value: "newest", label: t("shop.sortNewest") },
    { value: "price_asc", label: t("shop.sortPriceAsc") },
    { value: "price_desc", label: t("shop.sortPriceDesc") },
  ];
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [result, setResult] = useState<PublicProductListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchVersion, setFetchVersion] = useState(0);

  const search = searchParams.get("search") ?? "";
  const category = lockedCategorySlug ?? searchParams.get("category") ?? "";
  const brand = searchParams.get("brand") ?? "";
  const sort = (searchParams.get("sort") as ProductSort) ?? "featured";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  useEffect(() => {
    if (!lockedCategorySlug) {
      api.get<CategoryDTO[]>("/categories").then(setCategories);
    }
  }, [lockedCategorySlug]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));

    api
      .get<PublicProductListResponse>(`/products?${params.toString()}`)
      .then((data) => {
        setResult(data);
        setFetchVersion((v) => v + 1);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, brand, sort, minPrice, maxPrice, page]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="flex flex-col gap-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-surface-muted" htmlFor="shop-search">
            {t("shop.search")}
          </label>
          <input
            id="shop-search"
            value={search}
            onChange={(e) => updateParam("search", e.target.value)}
            placeholder={t("nav.searchPlaceholder")}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>

        {!lockedCategorySlug && (
          <div>
            <div className="mb-2 text-sm font-medium text-surface-muted">{t("shop.category")}</div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => updateParam("category", "")}
                className={`rounded-xl px-2 py-1 text-left text-sm transition-colors ${!category ? "text-accent" : "text-surface-muted hover:text-white"}`}
              >
                {t("shop.all")}
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateParam("category", c.slug)}
                  className={`rounded-xl px-2 py-1 text-left text-sm transition-colors ${category === c.slug ? "text-accent" : "text-surface-muted hover:text-white"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 text-sm font-medium text-surface-muted">{t("shop.priceRange")}</div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder={t("shop.min")}
              value={minPrice}
              onChange={(e) => updateParam("minPrice", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
            />
            <span className="text-surface-muted">–</span>
            <input
              type="number"
              min="0"
              placeholder={t("shop.max")}
              value={maxPrice}
              onChange={(e) => updateParam("maxPrice", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-surface-muted" htmlFor="shop-brand">
            {t("shop.brand")}
          </label>
          <input
            id="shop-brand"
            value={brand}
            onChange={(e) => updateParam("brand", e.target.value)}
            placeholder={t("shop.anyBrand")}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>
      </aside>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-surface-muted">
            {result ? `${result.total} ${t("shop.productsCountSuffix")}` : ""}
          </span>
          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="rounded-xl border border-white/10 bg-navy-soft px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : !result || result.items.length === 0 ? (
          <div className="py-16 text-center text-sm text-surface-muted">{t("shop.noProducts")}</div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {result.items.map((product: ProductListItem) => (
                <ProductCard key={`${fetchVersion}-${product.id}`} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-surface-muted">
                <button
                  disabled={page <= 1}
                  onClick={() => updateParam("page", String(page - 1))}
                  className="rounded-xl px-3 py-1 hover:bg-white/5 disabled:opacity-30"
                >
                  {t("shop.previous")}
                </button>
                <span>{t("shop.pageOf", { page, total: totalPages })}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => updateParam("page", String(page + 1))}
                  className="rounded-xl px-3 py-1 hover:bg-white/5 disabled:opacity-30"
                >
                  {t("shop.next")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
