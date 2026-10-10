import { Link } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import { useDocumentHead } from "../../hooks/useDocumentHead";
import { ProductCard } from "../../components/storefront/ProductCard";
import { useLocale } from "../../context/LocaleContext";

export function WishlistPage() {
  const { items } = useWishlist();
  const { t } = useLocale();
  useDocumentHead(t("wishlist.title"), t("wishlist.metaDescription"));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">{t("wishlist.title")}</h1>

      {items.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-surface-muted">{t("wishlist.empty")}</p>
          <Link to="/shop" className="mt-4 inline-block text-accent hover:underline">
            {t("wishlist.browseProducts")}
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
