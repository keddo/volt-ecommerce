import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { PublicProductDetail } from "@personal-ecommerce/shared";
import { api, ApiError } from "../../lib/apiClient";
import { formatCurrency } from "../../lib/format";
import { resolveImageUrl } from "../../lib/imageUrl";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { useDocumentHead } from "../../hooks/useDocumentHead";
import { useJsonLd } from "../../hooks/useJsonLd";
import { ProductCard } from "../../components/storefront/ProductCard";
import { CornerBrackets } from "../../components/CornerBrackets";
import { HeartIcon } from "../../components/Icons";
import { useLocale } from "../../context/LocaleContext";

export function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isWishlisted, toggle } = useWishlist();
  const { addItem } = useCart();
  const { t, locale } = useLocale();

  const [product, setProduct] = useState<PublicProductDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setProduct(null);
    setNotFound(false);
    setActiveImage(0);
    setQuantity(1);
    api
      .get<PublicProductDetail>(`/products/${slug}`)
      .then(setProduct)
      .catch(() => setNotFound(true));
  }, [slug]);

  useDocumentHead(product?.seoTitle || product?.name, product?.metaDescription || product?.description, {
    type: "product",
    image: product?.images[0]?.url,
  });

  useJsonLd(
    product
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description ?? undefined,
          image: product.images.map((img) => img.url),
          sku: product.sku,
          brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
          offers: {
            "@type": "Offer",
            price: product.discountPrice ?? product.price,
            priceCurrency: "ETB",
            availability:
              product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
          ...(product.reviewCount > 0 && product.averageRating
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: product.averageRating,
                  reviewCount: product.reviewCount,
                },
              }
            : {}),
        }
      : null
  );

  if (notFound) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">{t("product.notFound")}</h1>
        <Link to="/shop" className="mt-4 inline-block text-accent hover:underline">
          {t("product.backToShop")}
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl bg-white/5" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-white/5" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-white/5" />
            <div className="h-24 animate-pulse rounded bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const discountPct = product.discountPrice
    ? Math.round((1 - product.discountPrice / product.price) * 100)
    : null;

  async function addToCart() {
    setAddingToCart(true);
    try {
      await addItem(product!.id, quantity);
      showToast(t("product.addedToCart"));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("product.couldntAddToCart"), "error");
    } finally {
      setAddingToCart(false);
    }
  }

  async function buyNow() {
    setAddingToCart(true);
    try {
      await addItem(product!.id, quantity);
      navigate("/cart");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("product.couldntAddToCart"), "error");
    } finally {
      setAddingToCart(false);
    }
  }

  async function submitReview(e: FormEvent) {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.post("/reviews", { productId: product!.id, rating: reviewRating, comment: reviewComment || undefined });
      showToast(t("product.reviewSubmitted"));
      setReviewComment("");
      setReviewRating(5);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("product.couldntSubmitReview"), "error");
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden border border-white/10 bg-navy-soft">
            <CornerBrackets />
            {product.images[activeImage] ? (
              <img
                key={activeImage}
                src={resolveImageUrl(product.images[activeImage].url)}
                alt={product.images[activeImage].altText ?? product.name}
                className="h-full w-full animate-fade-in object-cover"
              />
            ) : (
              <div className="h-full w-full bg-white/10" />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 overflow-hidden border transition-colors duration-200 ${
                    i === activeImage ? "border-accent" : "border-white/10"
                  }`}
                >
                  <img src={resolveImageUrl(img.url)} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-xs text-surface-muted">{product.categoryName}</span>
          <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>

          <div className="mt-2 text-sm">
            {product.reviewCount > 0 ? (
              <span className="text-surface-muted">
                ★ {product.averageRating?.toFixed(1)} (
                {product.reviewCount} {product.reviewCount === 1 ? t("product.review") : t("product.reviews")})
              </span>
            ) : (
              <span className="text-surface-muted">{t("product.noReviewsShort")}</span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="font-mono text-3xl font-bold">
              {formatCurrency(product.discountPrice ?? product.price, locale)}
            </span>
            {product.discountPrice && (
              <>
                <span className="font-mono text-lg text-surface-muted line-through">
                  {formatCurrency(product.price, locale)}
                </span>
                <span className="bg-accent px-2 py-1 text-xs font-semibold text-white">-{discountPct}%</span>
              </>
            )}
          </div>

          <div className="mt-2 text-sm">
            {product.stock === 0 ? (
              <span className="text-red-400">{t("product.outOfStock")}</span>
            ) : product.stock <= product.minStock ? (
              <span className="text-amber-400">{t("product.onlyXLeft", { n: product.stock })}</span>
            ) : (
              <span className="text-emerald-400">{t("product.inStock")}</span>
            )}
          </div>

          {product.description && <p className="mt-4 text-surface-muted">{product.description}</p>}

          {product.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="rounded-xl bg-white/5 px-2 py-1 text-xs text-surface-muted">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center border border-white/10 font-mono">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-surface-muted hover:text-white"
              >
                −
              </button>
              <span className="w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                className="px-3 py-2 text-surface-muted hover:text-white"
              >
                +
              </button>
            </div>
            <button
              disabled={product.stock === 0 || addingToCart}
              onClick={addToCart}
              className="flex-1 bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-surface-muted"
            >
              {addingToCart ? t("product.adding") : t("product.addToCart")}
            </button>
            <button
              disabled={product.stock === 0 || addingToCart}
              onClick={buyNow}
              className="border border-white/20 px-5 py-2.5 text-sm font-semibold transition-colors duration-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {t("product.buyNow")}
            </button>
            <button
              onClick={() => {
                toggle(product);
                showToast(wishlisted ? t("product.removedFromWishlist") : t("product.addedToWishlist"));
              }}
              aria-label={t("product.toggleWishlistAria")}
              className={`flex items-center justify-center border px-4 py-2.5 transition-colors duration-200 ${
                wishlisted ? "border-accent text-accent" : "border-white/20 text-surface-muted hover:text-white"
              }`}
            >
              <HeartIcon filled={wishlisted} />
            </button>
          </div>

          {product.specifications.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold">{t("product.specifications")}</h2>
              <table className="mt-3 w-full font-mono text-sm">
                <tbody>
                  {product.specifications.map((spec) => (
                    <tr key={spec.id} className="border-t border-white/5">
                      <td className="py-2 pr-4 font-sans text-surface-muted">{spec.key}</td>
                      <td className="py-2 text-white">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="mt-16 max-w-2xl">
        <h2 className="text-xl font-bold">{t("product.reviewsHeading")}</h2>
        {product.reviews.length === 0 ? (
          <p className="mt-3 text-sm text-surface-muted">{t("product.noReviewsLong")}</p>
        ) : (
          <div className="mt-4 space-y-4">
            {product.reviews.map((review) => (
              <div key={review.id} className="border border-white/10 bg-navy-soft p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-white">{review.authorName}</span>
                  <span className="text-surface-muted">★ {review.rating}</span>
                </div>
                {review.comment && <p className="mt-2 text-sm text-surface-muted">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 border border-white/10 bg-navy-soft p-5">
          <h3 className="text-sm font-semibold text-white">{t("product.leaveReview")}</h3>
          {user ? (
            <form onSubmit={submitReview} className="mt-3 flex flex-col gap-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    aria-label={`${star} ${star === 1 ? t("product.star") : t("product.stars")}`}
                    className={`text-2xl leading-none ${star <= reviewRating ? "text-accent" : "text-white/20"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={t("product.shareThoughts")}
                rows={3}
                className="border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="w-fit bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {submittingReview ? t("product.submitting") : t("product.submitReview")}
              </button>
            </form>
          ) : (
            <p className="mt-2 text-sm text-surface-muted">
              <Link to="/login" className="text-accent hover:underline">
                {t("product.loginToReview")}
              </Link>{" "}
              {t("product.toLeaveReview")}
            </p>
          )}
        </div>
      </div>

      {product.relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold">{t("product.relatedProducts")}</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {product.relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
