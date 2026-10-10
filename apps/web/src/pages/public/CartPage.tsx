import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { resolveImageUrl } from "../../lib/imageUrl";
import { useDocumentHead } from "../../hooks/useDocumentHead";
import { ApiError } from "../../lib/apiClient";
import { formatCurrency } from "../../lib/format";
import { useLocale } from "../../context/LocaleContext";

export function CartPage() {
  const { user } = useAuth();
  const { cart, loading, updateQuantity, removeItem, applyCoupon, removeCoupon } = useCart();
  const { showToast } = useToast();
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  useDocumentHead(t("cart.title"), t("cart.metaDescription"));

  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);

  async function handleQuantityChange(productId: string, quantity: number) {
    setBusyProductId(productId);
    try {
      await updateQuantity(productId, quantity);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("cart.couldntUpdateQuantity"), "error");
    } finally {
      setBusyProductId(null);
    }
  }

  async function handleRemove(productId: string) {
    setBusyProductId(productId);
    try {
      await removeItem(productId);
    } finally {
      setBusyProductId(null);
    }
  }

  async function handleApplyCoupon(e: FormEvent) {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    try {
      await applyCoupon(couponInput.trim());
      showToast(t("cart.couponAppliedToast"));
      setCouponInput("");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("cart.invalidCoupon"), "error");
    } finally {
      setApplyingCoupon(false);
    }
  }

  async function handleRemoveCoupon() {
    await removeCoupon();
    showToast(t("cart.couponRemoved"));
  }

  function handleCheckout() {
    navigate(user ? "/checkout" : "/login");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="h-8 w-40 animate-pulse rounded bg-white/5" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">{t("cart.empty")}</h1>
        <Link to="/shop" className="mt-4 inline-block text-accent hover:underline">
          {t("cart.continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">{t("cart.title")}</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-navy-soft p-4"
            >
              {item.image ? (
                <img src={resolveImageUrl(item.image)} alt="" loading="lazy" className="h-20 w-20 rounded-xl object-cover" />
              ) : (
                <div className="h-20 w-20 rounded-xl bg-white/10" />
              )}
              <div className="flex-1">
                <Link to={`/products/${item.slug}`} className="font-medium text-white hover:text-accent">
                  {item.name}
                </Link>
                <div className="mt-1 font-mono text-sm text-surface-muted">{formatCurrency(item.unitPrice, locale)}</div>
                {item.quantity > item.stock && (
                  <div className="mt-1 text-xs text-amber-400">{t("cart.onlyXLeftInStock", { n: item.stock })}</div>
                )}
              </div>
              <div className="flex items-center rounded-xl border border-white/10">
                <button
                  disabled={busyProductId === item.productId}
                  onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                  className="px-3 py-2 text-surface-muted hover:text-white disabled:opacity-50"
                >
                  −
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  disabled={busyProductId === item.productId || item.quantity >= item.stock}
                  onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                  className="px-3 py-2 text-surface-muted hover:text-white disabled:opacity-30"
                >
                  +
                </button>
              </div>
              <div className="w-20 text-right font-mono font-semibold text-white">
                {formatCurrency(item.unitPrice * item.quantity, locale)}
              </div>
              <button
                disabled={busyProductId === item.productId}
                onClick={() => handleRemove(item.productId)}
                className="text-surface-muted hover:text-red-400"
                aria-label={t("cart.removeItemAria")}
              >
                ✕
              </button>
            </div>
          ))}

          <Link to="/shop" className="inline-block text-sm text-accent hover:underline">
            {t("cart.continueShoppingArrow")}
          </Link>
        </div>

        <div className="h-fit rounded-xl border border-white/10 bg-navy-soft p-5">
          <h2 className="text-sm font-semibold text-white">{t("cart.orderSummary")}</h2>

          {cart.couponCode ? (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-accent/10 px-3 py-2 text-sm">
              <span className="text-accent">{t("cart.couponApplied", { code: cart.couponCode })}</span>
              <button onClick={handleRemoveCoupon} className="text-surface-muted hover:text-white">
                {t("cart.remove")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} className="mt-4 flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder={t("cart.couponPlaceholder")}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={applyingCoupon}
                className="rounded-xl border border-white/20 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                {t("cart.apply")}
              </button>
            </form>
          )}

          <dl className="mt-4 space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <dt className="font-sans text-surface-muted">{t("cart.subtotal")}</dt>
              <dd className="text-white">{formatCurrency(cart.subtotal, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-sans text-surface-muted">{t("cart.shipping")}</dt>
              <dd className="text-white">
                {cart.shippingCost === 0 ? t("cart.free") : formatCurrency(cart.shippingCost, locale)}
              </dd>
            </div>
            {cart.discount > 0 && (
              <div className="flex justify-between">
                <dt className="font-sans text-surface-muted">{t("cart.discount")}</dt>
                <dd className="text-emerald-400">−{formatCurrency(cart.discount, locale)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-white/10 pt-2 text-base font-semibold">
              <dt className="font-sans text-white">{t("cart.total")}</dt>
              <dd className="text-white">{formatCurrency(cart.total, locale)}</dd>
            </div>
          </dl>

          <button
            onClick={handleCheckout}
            className="mt-5 w-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
          >
            {t("cart.proceedToCheckout")}
          </button>
        </div>
      </div>
    </div>
  );
}
