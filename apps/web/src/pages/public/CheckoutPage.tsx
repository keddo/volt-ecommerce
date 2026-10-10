import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import type { OrderDetailDTO } from "@personal-ecommerce/shared";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { useDocumentHead } from "../../hooks/useDocumentHead";
import { api, ApiError } from "../../lib/apiClient";
import { formatCurrency } from "../../lib/format";
import { useLocale } from "../../context/LocaleContext";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium text-surface-muted";

export function CheckoutPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { cart, loading: cartLoading, refresh } = useCart();
  const { showToast } = useToast();
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  useDocumentHead(t("checkout.title"), t("checkout.metaDescription"));

  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingCountry, setShippingCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) setShippingName(user.name);
  }, [user]);

  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (!cartLoading && cart.items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const order = await api.post<OrderDetailDTO>("/orders", {
        shippingName,
        shippingPhone,
        shippingAddress,
        shippingCity,
        shippingCountry,
      });
      await refresh();
      showToast(t("checkout.orderPlaced"));
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("checkout.orderError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || cartLoading) {
    return <div className="mx-auto max-w-4xl px-6 py-12 text-sm text-surface-muted">{t("checkout.loading")}</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">{t("checkout.title")}</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelClass} htmlFor="shipping-name">{t("checkout.fullName")}</label>
            <input id="shipping-name" required value={shippingName} onChange={(e) => setShippingName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="shipping-phone">{t("checkout.phone")}</label>
            <input id="shipping-phone" required value={shippingPhone} onChange={(e) => setShippingPhone(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="shipping-address">{t("checkout.address")}</label>
            <input id="shipping-address" required value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="shipping-city">{t("checkout.city")}</label>
              <input id="shipping-city" required value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="shipping-country">{t("checkout.country")}</label>
              <input id="shipping-country" required value={shippingCountry} onChange={(e) => setShippingCountry(e.target.value)} className={inputClass} />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? t("checkout.placingOrder") : t("checkout.placeOrder")}
          </button>
        </form>

        <div className="h-fit border border-white/10 bg-navy-soft p-5">
          <h2 className="text-sm font-semibold text-white">{t("cart.orderSummary")}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {cart.items.map((item) => (
              <li key={item.productId} className="flex justify-between text-surface-muted">
                <span className="truncate pr-2">
                  {item.name} × {item.quantity}
                </span>
                <span className="shrink-0 font-mono text-white">
                  {formatCurrency(item.unitPrice * item.quantity, locale)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-white/10 pt-4 font-mono text-sm">
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
        </div>
      </div>
    </div>
  );
}
