import { useState } from "react";
import { Link } from "react-router-dom";
import type { ProductListItem } from "@personal-ecommerce/shared";
import { formatCurrency } from "../../lib/format";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { ApiError } from "../../lib/apiClient";
import { resolveImageUrl } from "../../lib/imageUrl";
import { HeartIcon, PhoneIcon, TelegramIcon } from "../Icons";
import { useLocale } from "../../context/LocaleContext";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF, TELEGRAM_HANDLE, TELEGRAM_URL } from "../../lib/contact";

export function ProductCard({ product }: { product: ProductListItem }) {
  const { isWishlisted, toggle } = useWishlist();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const { t, locale } = useLocale();
  const [adding, setAdding] = useState(false);
  const wishlisted = isWishlisted(product.id);

  async function handleAddToCart() {
    setAdding(true);
    try {
      await addItem(product.id, 1);
      showToast(t("product.addedToCart"));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("product.couldntAddToCart"), "error");
    } finally {
      setAdding(false);
    }
  }

  const discountPct = product.discountPrice
    ? Math.round((1 - product.discountPrice / product.price) * 100)
    : null;

  const stockLabel =
    product.stock === 0 ? t("product.outOfStock") : product.stock <= product.minStock ? t("product.lowStock") : t("product.inStock");
  const stockDotClass =
    product.stock === 0 ? "bg-red-400" : product.stock <= product.minStock ? "bg-amber-400" : "bg-emerald-400";

  return (
    <div className="group border border-white/10 bg-navy-soft p-4 transition-colors duration-200 hover:border-white/25">
      <div className="relative">
        <Link to={`/products/${product.slug}`} className="block overflow-hidden bg-white/5">
          {product.image ? (
            <img
              src={resolveImageUrl(product.image)}
              alt={product.name}
              loading="lazy"
              className="aspect-square w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="aspect-square w-full bg-white/10" />
          )}
        </Link>
        <button
          onClick={() => {
            toggle(product);
            showToast(wishlisted ? t("product.removedFromWishlist") : t("product.addedToWishlist"));
          }}
          aria-label={wishlisted ? t("product.removeFromWishlistAria") : t("product.addToWishlistAria")}
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center backdrop-blur transition-colors duration-200 ${
            wishlisted ? "bg-accent text-white" : "bg-black/40 text-white hover:bg-black/60"
          }`}
        >
          <HeartIcon className="h-4 w-4" filled={wishlisted} />
        </button>
        {discountPct !== null && (
          <span className="absolute left-2 top-2 bg-accent px-2 py-1 text-xs font-semibold text-white">
            -{discountPct}%
          </span>
        )}
      </div>

      <Link to={`/products/${product.slug}`} className="mt-3 block truncate font-medium text-white">
        {product.name}
      </Link>
      <div className="mt-1 text-xs text-surface-muted">{product.categoryName}</div>

      <div className="mt-2 flex items-center gap-2">
        <span className="font-mono font-semibold text-white">
          {formatCurrency(product.discountPrice ?? product.price, locale)}
        </span>
        {product.discountPrice && (
          <span className="font-mono text-xs text-surface-muted line-through">
            {formatCurrency(product.price, locale)}
          </span>
        )}
      </div>

      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-surface-muted">
        <span aria-hidden className={`h-1.5 w-1.5 ${stockDotClass}`} />
        {stockLabel}
      </div>

      <button
        disabled={product.stock === 0 || adding}
        onClick={handleAddToCart}
        className="mt-3 w-full bg-accent px-3 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-surface-muted"
      >
        {product.stock === 0 ? t("product.outOfStock") : adding ? t("product.adding") : t("product.addToCart")}
      </button>

      <div className="mt-2 flex items-center justify-center gap-3 border-t border-white/10 pt-2 font-mono text-xs text-surface-muted">
        <a
          href={CONTACT_PHONE_HREF}
          onClick={(e) => e.stopPropagation()}
          aria-label={t("product.callAria", { phone: CONTACT_PHONE_DISPLAY })}
          className="flex items-center gap-1 transition-colors hover:text-accent"
        >
          <PhoneIcon className="h-3.5 w-3.5" />
          {CONTACT_PHONE_DISPLAY}
        </a>
        <span aria-hidden className="h-3 w-px bg-white/10" />
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={t("product.telegramAria")}
          className="flex items-center gap-1 transition-colors hover:text-accent"
        >
          <TelegramIcon className="h-3.5 w-3.5" />@{TELEGRAM_HANDLE}
        </a>
      </div>
    </div>
  );
}
