# Database Schema

Source of truth: [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma). This doc is
a human-readable map of it — if the two disagree, the Prisma file wins.

## Entity overview

| Model | Purpose | Built in |
|---|---|---|
| `User` | Customers and admins (`role`: `CUSTOMER` \| `ADMIN`) | Phase 1 |
| `RefreshToken` | Hashed refresh tokens per user, for session revocation | Phase 1 |
| `Category` | Product categories (slug-addressable) | Phase 3 |
| `Product` | Catalog item | Phase 3 |
| `ProductImage` | Ordered images belonging to a product | Phase 3 |
| `ProductSpecification` | Free-form key/value spec rows per product | Phase 3 |
| `Tag` / `ProductTag` | Many-to-many product tagging | Phase 3 |
| `Cart` / `CartItem` | Persisted cart, `userId` nullable for guest carts keyed by `sessionToken` | Phase 5 |
| `Order` / `OrderItem` | Placed orders and their line items | Phase 6 |
| `Review` | Customer product reviews, moderated via `status` | Phase 7 |
| `Coupon` | Checkout discount codes | Phase 6 |
| `SiteSetting` | Key/value store for homepage copy (hero text, banners) so content edits skip a deploy | Phase 4/admin content |

## Relationships

```
User 1──* RefreshToken
User 1──* Order
User 1──* Review
User 1──* Cart

Category 1──* Product
Product 1──* ProductImage
Product 1──* ProductSpecification
Product *──* Tag          (via ProductTag)
Product 1──* CartItem
Product 1──* OrderItem
Product 1──* Review

Cart 1──* CartItem
Order 1──* OrderItem
```

## Notable decisions

- **Money fields are `Decimal(10,2)`**, never `Float` — avoids floating-point rounding errors on
  prices/totals.
- **`Product.slug` / `sku` / `Category.slug` are unique** — slugs back the SEO-friendly URLs
  from spec section 23 (`/products/iphone-17-pro`), SKU is the inventory key.
- **`RefreshToken.tokenHash`, not the raw token**, is stored — the raw token only ever exists in
  the httpOnly cookie and the response body at issuance time.
- **`Cart.userId` is nullable** with a unique `sessionToken` — supports guest carts that later
  merge into a `User`'s cart on login (Phase 5 logic, table exists now).
- **`SiteSetting` is a simple EAV table** (`key` primary, `value` text) rather than a rigid
  "Hero" model — the admin section-22 requirement is "control content without touching code," and
  a key/value store is the cheapest way to let arbitrary homepage copy fields grow later without a
  migration each time.

## Migrations

Run from `apps/api`:

```
npm run prisma:migrate   # prisma migrate dev — creates/applies a migration
npm run prisma:generate  # regenerate the Prisma client after a schema change
npm run prisma:seed      # apps/api/prisma/seed.ts — seeds one ADMIN user + sample categories
npm run prisma:studio    # visual browser for the local database
```
