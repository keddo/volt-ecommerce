import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { CategoryDTO, HomeBundle } from "@personal-ecommerce/shared";
import { api } from "../../lib/apiClient";
import { resolveImageUrl } from "../../lib/imageUrl";
import { useToast } from "../../context/ToastContext";
import { useLocale } from "../../context/LocaleContext";
import { useDocumentHead } from "../../hooks/useDocumentHead";
import { ProductCard } from "../../components/storefront/ProductCard";
import { CornerBrackets } from "../../components/CornerBrackets";

export function HomePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLocale();
  useDocumentHead();

  const SPEC_ROWS = [
    { label: t("home.dispatch"), value: t("home.dispatchValue") },
    { label: t("home.coverage"), value: t("home.coverageValue") },
    { label: t("home.checkoutLabel"), value: t("home.checkoutValue") },
    { label: t("home.returns"), value: t("home.returnsValue") },
  ];

  const [bundle, setBundle] = useState<HomeBundle | null>(null);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [newsletterEmail, setNewsletterEmail] = useState("");

  useEffect(() => {
    api.get<HomeBundle>("/home").then(setBundle);
    api.get<CategoryDTO[]>("/categories").then(setCategories);
  }, []);

  function handleShopNow() {
    navigate("/shop");
  }

  function handleNewsletterSubmit(e: FormEvent) {
    e.preventDefault();
    setNewsletterEmail("");
    showToast(t("home.subscribedToast"));
  }

  return (
    <div>
      {/* Full-bleed hero - sits behind the transparent nav (see PublicLayout) */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-navy">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="relative grid w-full max-w-6xl gap-12 px-6 py-28 mx-auto lg:grid-cols-[1fr_320px] lg:items-center lg:py-0">
          <div className="flex flex-col items-start gap-7">
            <h1 className="text-6xl font-bold leading-[0.95] text-white sm:text-7xl lg:text-8xl">
              {t("home.heroLine1")}
              <br />
              {t("home.heroLine2")}
            </h1>
            <p className="max-w-sm text-lg text-surface-muted">{t("home.heroSubhead")}</p>
            <div className="flex gap-4">
              <button
                onClick={handleShopNow}
                className="bg-accent px-7 py-3.5 font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
              >
                {t("home.shopCatalog")}
              </button>
              <a
                href="#categories"
                className="border border-white/25 px-7 py-3.5 font-semibold text-white transition-colors duration-200 hover:border-white/50 hover:bg-white/5"
              >
                {t("home.browseCategories")}
              </a>
            </div>
          </div>

          <div className="relative animate-rise-in border border-white/10 bg-navy-soft/80 p-5" style={{ animationDelay: "150ms" }}>
            <CornerBrackets />
            <div className="text-sm font-semibold text-white">{t("home.whatYouGet")}</div>
            <dl className="mt-3">
              {SPEC_ROWS.map((row, i) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-[auto_1fr] items-baseline gap-x-3 py-2.5 text-sm ${i === 0 ? "" : "border-t border-white/10"}`}
                >
                  <dt className="text-surface-muted">{row.label}</dt>
                  <dd className="text-right font-mono text-white">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section id="categories" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
          <h2 className="text-3xl font-bold">{t("home.shopByCategory")}</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((category, i) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className={`group relative block overflow-hidden border border-white/10 ${
                  i === 0 ? "col-span-2 row-span-2 aspect-square sm:aspect-auto sm:h-full" : "aspect-square"
                }`}
                style={{ minHeight: i === 0 ? 320 : undefined }}
              >
                {category.image ? (
                  <img
                    src={resolveImageUrl(category.image)}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-navy-soft transition-transform duration-500 ease-out group-hover:scale-105"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(135deg, rgba(194,65,12,0.18) 0px, rgba(194,65,12,0.18) 1px, transparent 1px, transparent 14px)",
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="text-lg font-semibold text-white">{category.name}</div>
                  <div className="text-xs text-surface-muted">
                    {category.productCount} {t("home.productsSuffix")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {bundle && bundle.featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">{t("home.featuredProducts")}</h2>
            <Link to="/shop" className="text-sm text-accent hover:underline">
              {t("home.viewAll")}
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {bundle.featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {bundle && bundle.newArrivals.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="border-t border-white/10 pt-16">
            <h2 className="text-3xl font-bold">{t("home.newArrivals")}</h2>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {bundle.newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="border border-white/10 bg-navy-soft px-8 py-14 text-center">
          <h2 className="text-3xl font-bold">{t("home.newsletterHeading")}</h2>
          <p className="mt-2 text-surface-muted">{t("home.newsletterBody")}</p>
          <form onSubmit={handleNewsletterSubmit} className="mx-auto mt-6 flex max-w-sm gap-2">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="flex-1 border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
            />
            <button
              type="submit"
              className="bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
            >
              {t("home.subscribe")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
