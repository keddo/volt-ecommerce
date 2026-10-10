import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { CategoryDTO } from "@personal-ecommerce/shared";
import { api } from "../../lib/apiClient";
import { useDocumentHead } from "../../hooks/useDocumentHead";
import { ProductBrowser } from "../../components/storefront/ProductBrowser";
import { useLocale } from "../../context/LocaleContext";

export function CategoryPage() {
  const { slug } = useParams();
  const { t } = useLocale();
  const [category, setCategory] = useState<CategoryDTO | null>(null);

  useEffect(() => {
    api.get<CategoryDTO[]>("/categories").then((categories) => {
      setCategory(categories.find((c) => c.slug === slug) ?? null);
    });
  }, [slug]);

  useDocumentHead(category?.name, category?.description);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">{category?.name ?? t("category.fallbackTitle")}</h1>
      {category?.description && <p className="mt-2 text-surface-muted">{category.description}</p>}
      <div className="mt-6">{slug && <ProductBrowser lockedCategorySlug={slug} />}</div>
    </div>
  );
}
