# Design System

## Brand

**VOLT** — a placeholder brand name for a premium electronics store. "Volt" doubles as the design
concept: the storefront reads like engineered hardware (sharp edges, spec-sheet typography, a
single copper accent) rather than a generic SaaS dashboard. It's stored as plain text in
`apps/web/index.html` (`<title>`) and `AdminLayout`/`PublicLayout` headers, not threaded through
dozens of files, so renaming it later is a find-and-replace, not a refactor.

## Palette (`apps/web/tailwind.config.ts`)

| Token | Hex | Use |
|---|---|---|
| `navy` (DEFAULT) | `#17140F` | Page background — warm charcoal, not cool navy-black |
| `navy.soft` | `#211C15` | Elevated surfaces (sidebar, cards) |
| `white` (overrides Tailwind's default) | `#F2EEE4` | Primary text/foreground — warm paper, not pure white |
| `surface.muted` | `#9C9686` | Secondary text |
| `surface` (DEFAULT) | `#F2EEE4` | Light surfaces (reserved for future light-mode sections) |
| `accent` (DEFAULT) | `#C2410C` | CTAs, links, focus states, active nav — copper, the material electricity runs through |
| `accent.hover` | `#9A3412` | Hover state for accent-colored elements |

One accent color only. It's deliberately dark/saturated enough that the existing `bg-accent
text-white` button pattern (used ~25 places across the app) keeps working without per-site
contrast fixes — don't swap in a lighter/yellower accent without re-auditing those call sites.

## Type

- **Display** (`font-display`, applied globally to `h1`/`h2`/`h3` in `index.css`): Space Grotesk.
- **Body/UI** (`font-sans`, the Tailwind default): IBM Plex Sans.
- **Technical data** (`font-mono`, used deliberately for prices, specs, SKUs, quantities — not
  decorative labels): IBM Plex Mono with tabular numerals.

All three load from Google Fonts in `index.html`.

## Component conventions

- **Cards / inputs / buttons**: the shared `rounded-xl` Tailwind token is `0.125rem` (2px) — sharp,
  machined edges instead of soft bubbly cards. Changing this one token value is what keeps the
  whole app visually coherent; don't reach for one-off `rounded-*` utilities elsewhere.
- **Signature motif**: `components/CornerBrackets.tsx` draws small viewfinder-style corner marks.
  Used sparingly and large-scale only — the homepage hero spec plate and the product detail
  gallery image. Do not add it to small repeated elements (product card thumbnails, etc.) or it
  becomes the next generic tell.
- **Motion**: no scroll-triggered reveal-on-every-section/card animation (removed `Reveal` /
  `useScrollReveal` — it's the single most common "this looks AI-generated" tell). The one
  deliberate ambient animation is the pulsing copper square in the logo mark (`.animate-power-pulse`
  in `index.css`), evoking a power-on LED. Keep it that way — one orchestrated motion moment, not
  effects on every hover.
- **Interactive states**: hover darkens/lightens by one step (`bg-white/5` → `bg-white/10`), focus
  rings use the accent color border. Buttons get a plain color transition on hover, not a
  translate/shadow-glow combo.
- **Admin vs. public**: the admin shell (`AdminLayout`) uses `navy.soft` for its sidebar to read as
  a distinct "application" surface, while public pages sit on plain `navy`. Admin inherits the same
  tokens automatically; it hasn't been redesigned beyond that cascade.

## Where this will extend (later phases)

Product imagery and category cards reuse these same tokens — no new colors should be introduced
without updating this file and `tailwind.config.ts` together.
