import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { CategoryDTO } from "@personal-ecommerce/shared";
import { api } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { CartIcon, HeartIcon } from "../components/Icons";
import { useLocale } from "../context/LocaleContext";
import { LOCALES } from "../i18n/translations";

const HERO_SCROLL_THRESHOLD = 80;

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-white">
      <span aria-hidden className="h-2.5 w-2.5 animate-power-pulse bg-accent" />
      VOLT
    </Link>
  );
}

function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  return (
    <div className={`flex items-center border border-white/15 text-xs font-medium ${className}`}>
      {LOCALES.map((l) => (
        <button
          key={l.value}
          onClick={() => setLocale(l.value)}
          aria-pressed={locale === l.value}
          className={`px-2 py-1 transition-colors ${
            locale === l.value ? "bg-accent text-white" : "text-surface-muted hover:text-white"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

export function PublicLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const { itemCount } = useCart();
  const { t } = useLocale();

  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === "/";
  const transparentNav = isHome && !scrolled && !mobileMenuOpen;

  useEffect(() => {
    api.get<CategoryDTO[]>("/categories").then(setCategories);
  }, []);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > HERO_SCROLL_THRESHOLD);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    navigate(`/shop?search=${encodeURIComponent(search)}`);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
          transparentNav ? "border-transparent bg-transparent" : "border-white/10 bg-navy/95 backdrop-blur"
        }`}
      >
        <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-6">
          <Logo />

          <div className="hidden items-center gap-6 text-sm font-medium text-surface-muted md:flex">
            <Link to="/" className="transition-colors hover:text-white">
              {t("nav.home")}
            </Link>
            <Link to="/shop" className="transition-colors hover:text-white">
              {t("nav.shop")}
            </Link>
            <div ref={dropdownRef} className="relative">
              <button onClick={() => setCategoriesOpen((o) => !o)} className="transition-colors hover:text-white">
                {t("nav.categories")}
              </button>
              {categoriesOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 border border-white/10 bg-navy-soft p-2 shadow-lg">
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      to={`/category/${c.slug}`}
                      onClick={() => setCategoriesOpen(false)}
                      className="block px-3 py-2 text-sm hover:bg-white/5 hover:text-white"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="hidden flex-1 max-w-xs sm:block">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("nav.searchPlaceholder")}
              className="w-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none backdrop-blur transition-colors focus:border-accent"
            />
          </form>

          <div className="flex items-center gap-4 text-sm font-medium text-surface-muted">
            <LanguageSwitcher className="hidden sm:flex" />
            <Link to="/wishlist" className="relative hidden transition-colors hover:text-white sm:block" aria-label={t("nav.wishlist")}>
              <HeartIcon />
              {wishlistItems.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center bg-accent text-[10px] text-white">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative transition-colors hover:text-white" aria-label={t("nav.cart")}>
              <CartIcon />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center bg-accent text-[10px] text-white">
                  {itemCount}
                </span>
              )}
            </Link>
            {user ? (
              <div className="hidden items-center gap-3 md:flex">
                <Link to="/account" className="text-white transition-colors hover:text-accent">
                  {user.name.split(" ")[0]}
                </Link>
                <Link to="/orders" className="transition-colors hover:text-white">
                  {t("nav.orders")}
                </Link>
                <button onClick={() => logout()} className="transition-colors hover:text-white">
                  {t("nav.logout")}
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden transition-colors hover:text-white md:block">
                {t("nav.account")}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label={mobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              aria-expanded={mobileMenuOpen}
              className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 md:hidden"
            >
              <span className={`h-px w-5 bg-white transition-transform ${mobileMenuOpen ? "translate-y-[3px] rotate-45" : ""}`} />
              <span className={`h-px w-5 bg-white transition-transform ${mobileMenuOpen ? "-translate-y-[3px] -rotate-45" : ""}`} />
            </button>
          </div>
        </nav>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-20 bottom-0 z-40 overflow-y-auto border-t border-white/10 bg-navy px-6 py-5 md:hidden">
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("nav.searchPlaceholder")}
              className="w-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent"
            />
          </form>
          <LanguageSwitcher className="mb-4 w-fit" />
          <div className="flex flex-col gap-3 text-sm font-medium text-surface-muted">
            <Link to="/" className="hover:text-white">{t("nav.home")}</Link>
            <Link to="/shop" className="hover:text-white">{t("nav.shop")}</Link>
            {categories.map((c) => (
              <Link key={c.id} to={`/category/${c.slug}`} className="pl-3 hover:text-white">
                {c.name}
              </Link>
            ))}
            <Link to="/wishlist" className="hover:text-white">{t("nav.wishlist")}</Link>
            {user ? (
              <>
                <Link to="/account" className="hover:text-white">{user.name}</Link>
                <Link to="/orders" className="hover:text-white">{t("nav.orders")}</Link>
                <button onClick={() => logout()} className="text-left hover:text-white">{t("nav.logout")}</button>
              </>
            ) : (
              <Link to="/login" className="hover:text-white">{t("nav.account")}</Link>
            )}
          </div>
        </div>
      )}

      <main className={`flex-1 ${isHome ? "" : "pt-20"}`}>
        <Outlet />
      </main>

      <footer className="border-t border-white/10 bg-navy-soft">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-14 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-white">
              <span aria-hidden className="h-2.5 w-2.5 bg-accent" />
              VOLT
            </div>
            <p className="mt-3 max-w-[26ch] text-sm text-surface-muted">{t("footer.tagline")}</p>
          </div>

          <div>
            <div className="text-sm font-semibold text-white">{t("footer.shopHeading")}</div>
            <ul className="mt-4 space-y-2 text-sm text-surface-muted">
              <li>
                <Link to="/shop" className="transition-colors hover:text-white">
                  {t("footer.shopAll")}
                </Link>
              </li>
              <li>
                <Link to="/shop?sort=newest" className="transition-colors hover:text-white">
                  {t("footer.newArrivals")}
                </Link>
              </li>
              <li>
                <Link to="/shop?sort=featured" className="transition-colors hover:text-white">
                  {t("footer.featured")}
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="transition-colors hover:text-white">
                  {t("footer.wishlist")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold text-white">{t("footer.categoriesHeading")}</div>
            <ul className="mt-4 space-y-2 text-sm text-surface-muted">
              {categories.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link to={`/category/${c.slug}`} className="transition-colors hover:text-white">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold text-white">{t("footer.supportHeading")}</div>
            <p className="mt-4 text-sm text-surface-muted">
              <a href="mailto:support@volt.dev" className="transition-colors hover:text-white">
                support@volt.dev
              </a>
            </p>
          </div>
        </div>

        <div className="border-t border-white/5">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-surface-muted sm:flex-row">
            <span>{t("footer.rights", { year: new Date().getFullYear() })}</span>
            <div className="flex gap-4">
              <span>{t("footer.privacy")}</span>
              <span>{t("footer.terms")}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
