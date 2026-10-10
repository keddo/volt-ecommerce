# Architecture Overview

## System shape

```
Browser (React + Vite, apps/web)
        │  fetch, credentials: "include"
        ▼
Express API (apps/api)  ──►  PostgreSQL (Prisma)
        │
        └─ future: object storage (Cloudinary / S3 / Supabase) behind a
           storage-adapter interface, swappable without touching callers
```

- **apps/web** — React 19 + TypeScript + Tailwind, built with Vite. React Router splits the app
  into a public section (`PublicLayout`) and an admin section (`AdminLayout`, gated by
  `ProtectedRoute`).
- **apps/api** — Express + TypeScript. Modules under `src/modules/<name>` each own their routes,
  service (business logic), and validation. `src/lib` holds cross-cutting helpers (Prisma client
  singleton, JWT/token helpers). `src/middleware` holds `authenticate`, `requireRole`,
  `errorHandler`, and rate limiters.
- **packages/shared** — TypeScript types and zod schemas imported by both apps, so a request/response
  shape (e.g. `LoginInput`, `AuthResponse`) is defined once and the two apps can't drift apart.
- **PostgreSQL** via Prisma — schema lives at `apps/api/prisma/schema.prisma`; see
  `database-schema.md`.

## Auth flow

1. `POST /api/auth/login` (or `/register`) validates credentials, issues a short-lived **access
   token** (JWT, 15 min, returned in the JSON body — kept in memory on the client, never in
   localStorage) and a long-lived **refresh token** (random 48-byte value, 30 days, set as an
   `httpOnly`/`secure`/`sameSite=lax` cookie scoped to `/api/auth`). Only a hash of the refresh
   token is persisted (`RefreshToken.tokenHash`), so leaking the database doesn't leak usable
   tokens.
2. Every API request from the browser carries `Authorization: Bearer <accessToken>`. The
   `authenticate` middleware verifies it and attaches `req.user = { id, role }`.
3. When an access token expires, the frontend's `apiClient` catches the resulting 401, calls
   `POST /api/auth/refresh` (cookie sent automatically), and retries the original request once.
   `/refresh` **rotates** the refresh token — the old one is revoked and a new one issued — so a
   stolen refresh token can't be replayed indefinitely after it's been used once by the real user.
4. `POST /api/auth/logout` revokes the current refresh token and clears the cookie.
5. Admin-only routes add `requireRole(Role.ADMIN)` after `authenticate`. The frontend's
   `ProtectedRoute` component mirrors this for `/admin/*` so unauthenticated or non-admin users are
   redirected to `/admin/login` before any admin UI renders.

## Why these choices

- **Separate access/refresh tokens** instead of one long-lived JWT: lets logout actually revoke
  access (a stateless JWT alone can't be invalidated before it expires) while keeping most
  requests fast (no DB hit — just a JWT signature check).
- **npm workspaces monorepo**: one `npm install` at the root wires up `apps/web`, `apps/api`, and
  `packages/shared` together via symlinks, with zero extra tooling.
- **Full Prisma schema written up front** (see `database-schema.md`): migrations are cheap to
  write now and expensive to redesign later once real data exists; only the auth-related tables
  get business logic in this phase, the rest are scaffolding for upcoming phases.

## What's deliberately not here yet

Product/category/order/review/inventory CRUD + admin UI, the public storefront catalog, cart,
checkout, SEO, cloud image storage, analytics/charts, automated tests, deployment config. These
map to Phases 2–10 of the original spec and are intentionally out of scope for this pass.
