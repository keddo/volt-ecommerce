import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { UPLOADS_DIR } from "./lib/storage";
import { asyncHandler } from "./lib/asyncHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { productsRouter } from "./modules/products/products.routes";
import { categoriesRouter } from "./modules/categories/categories.routes";
import { catalogRouter } from "./modules/catalog/catalog.routes";
import { cartRouter } from "./modules/cart/cart.routes";
import { ordersRouter } from "./modules/orders/orders.routes";
import { adminOrdersRouter } from "./modules/orders/admin-orders.routes";
import { reviewsRouter } from "./modules/reviews/reviews.routes";
import { adminReviewsRouter } from "./modules/reviews/admin-reviews.routes";
import { listActiveCategories, listPublicProducts } from "./modules/catalog/catalog.service";
import { apiRateLimiter } from "./middleware/rateLimiters";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

// crossOriginResourcePolicy relaxed to cross-origin so the web app (a different origin in dev)
// can load /uploads images directly in <img> tags - everything else still requires the bearer
// token, so this only affects static asset loading, not data exposure.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(UPLOADS_DIR));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(
    ["User-agent: *", "Allow: /", "Disallow: /admin", "Disallow: /cart", "Disallow: /checkout", "Disallow: /account", `Sitemap: ${env.CORS_ORIGIN}/sitemap.xml`].join(
      "\n"
    )
  );
});

app.get(
  "/sitemap.xml",
  asyncHandler(async (_req, res) => {
    const siteUrl = env.CORS_ORIGIN;
    const [categories, products] = await Promise.all([
      listActiveCategories(),
      listPublicProducts({ sort: "newest", page: 1, pageSize: 1000 }),
    ]);

    const staticUrls = [siteUrl, `${siteUrl}/shop`];
    const categoryUrls = categories.map((c) => `${siteUrl}/category/${c.slug}`);
    const productUrls = products.items.map((p) => `${siteUrl}/products/${p.slug}`);
    const urls = [...staticUrls, ...categoryUrls, ...productUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((url) => `  <url><loc>${url}</loc></url>`)
      .join("\n")}\n</urlset>`;

    res.type("application/xml").send(xml);
  })
);

app.use("/api", apiRateLimiter);

app.use("/api/auth", authRouter);
app.use("/api/admin/dashboard", dashboardRouter);
app.use("/api/admin/products", productsRouter);
app.use("/api/admin/categories", categoriesRouter);
app.use("/api/admin/orders", adminOrdersRouter);
app.use("/api/admin/reviews", adminReviewsRouter);
app.use("/api", catalogRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/reviews", reviewsRouter);

app.use(errorHandler);
