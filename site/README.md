# Used Cars Athens — static site

Static Astro 4 site (TypeScript strict) that replaces the legacy WordPress site at the
repository root. The legacy files are untouched; this site builds from `src/` to `dist/`.

## Commands

| Command            | What it does                                                        |
| ------------------ | ------------------------------------------------------------------- |
| `npm run dev`      | Dev server (query-param filtering on `/` is re-evaluated per request) |
| `npm run build`    | Static build to `dist/` + `sitemap-index.xml` (no client-side JS filtering) |
| `npm run preview`  | Serves `dist/` locally                                               |
| `npm run sync`     | Refreshes `src/data/vehicles.json` from the inventory feed; **never fails** — on any error it logs a warning and exits 0, leaving the committed JSON untouched |

## Data pipeline

- `scripts/sync-inventory.mjs` fetches the DealerCenter inventory feed, strips the JSONP
  wrapper, and writes `src/data/vehicles.json`.
- Offline/dev use: set `VEHICLES_RAW=/path/to/fixtures.json` — the script reads that file
  instead of hitting the network (same JSONP-stripping path).
- `src/data/inventory.ts` is the typed loader (`Vehicle` type, `sortVehicles`, `SORT_OPTIONS`,
  `vehicleImageUrl`, `formatPrice`, `formatMiles`, `vehicleTitle`).

## Environment

| Variable                | Used in                          | Purpose                                            |
| ----------------------- | -------------------------------- | -------------------------------------------------- |
| `PUBLIC_LEAD_ENDPOINT`  | `apply-online`, `contact-us`     | `action` target for the lead forms (falls back to `#`) |
| `VEHICLES_RAW`          | `scripts/sync-inventory.mjs`     | Offline inventory fixture file (skips network)     |

## Notable details

- **Sitemap pin (Astro 4 compatibility).** `@astrojs/sitemap` 3.7.4+ reads a `_routes` value
  set by the `astro:routes:resolved` hook, which only Astro 5 fires — on Astro 4.16 the build
  crashes with `Cannot read properties of undefined (reading 'reduce')`. The dependency spec
  stays `^3.2.1` and an `overrides` entry pins the installed version to **3.4.1** (last
  release that works off `astro:build:done`). Remove the override only when moving to Astro 5.
- **Inventory page (`/`).** Filter/sort/pagination are server-side (page source reads
  `Astro.url.searchParams` — `keyword, make, model, body_type, year, max_price, max_miles,
  sort_by, pager ∈ {9,12,16,24}, page_no`). The toolbar is a plain `method="get"` form; no
  client-side JS. Because the logic lives in page source (not the browser), the page
  re-renders filtered whenever the host executes it (dev server or a rendering host); a
  purely static host that serves `index.html` for any query simply shows the unfiltered
  inventory, and the toolbar degrades to a "search this full list" UX rather than failing
  silently.
- **Client JS budget.** At most two tiny scripts ship in the build — the contact-us
  character counter and the apply-online co-buyer field toggle (≈9 logical lines each).
  Car images use inline `onerror` fallbacks to `/placeholder-car.svg`. Total is comfortably
  under the 40-line budget.
- **SEO.** Every page declares `title`/`description`/canonical + `og:` + `twitter:` tags and
  a single `application/ld+json` `@graph` (Organization, AutoDealer with Mo–Su 08:00–18:00
  hours, WebSite + SearchAction, plus per-page BreadcrumbList, ItemList on inventory,
  Vehicle + AutoOffer on detail pages). `404.html` is `noindex`.
- **Forms.** Both lead forms include a honeypot (`website`), the exact legacy consent
  paragraphs, a required `accept_terms` checkbox, and hidden
  error/success blocks with verbatim legacy copy.

## Build output

`dist/` — one trailing-slash directory per page:
`/` (inventory), `/home/`, `/apply-online/`, `/about-us/`, `/contact-us/`,
`/privacy-policy/`, `/vehicles/<slug>/` (one per vehicle), `404.html`,
`robots.txt`, `sitemap-index.xml` + `sitemap-0.xml`.
