import { useDocumentHead } from "../../hooks/useDocumentHead";
import { ProductBrowser } from "../../components/storefront/ProductBrowser";
import { useLocale } from "../../context/LocaleContext";

export function ShopPage() {
  const { t } = useLocale();
  useDocumentHead(t("shop.title"), t("shop.metaDescription"));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">{t("shop.title")}</h1>
      <div className="mt-6">
        <ProductBrowser />
      </div>
    </div>
  );
}
