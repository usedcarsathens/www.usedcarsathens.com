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

| Variable       | Used in                          | Purpose                                            |
| -------------- | -------------------------------- | -------------------------------------------------- |
| `VEHICLES_RAW` | `scripts/sync-inventory.mjs`     | Offline inventory fixture file (skips network)     |

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
- **Client JS budget.** Two tiny scripts ship per form page — the Netlify honeypot guard
  (with the `?submitted` success reveal) plus the page utility: the contact-us character
  counter and the apply-online co-buyer field toggle. Car images use inline `onerror`
  fallbacks to `/placeholder-car.svg`.
- **SEO.** Every page declares `title`/`description`/canonical + `og:` + `twitter:` tags and
  a single `application/ld+json` `@graph` (Organization, AutoDealer with Mo–Su 08:00–18:00
  hours, WebSite + SearchAction, plus per-page BreadcrumbList, ItemList on inventory,
  Vehicle + AutoOffer on detail pages). `404.html` is `noindex`.
## Forms (Netlify)

- The apply-online and contact-us forms are native **Netlify Forms** — plain HTML forms with
  `method="post"`, a `name` attribute (`apply-online`, `contact-us`), and `data-netlify="true"`.
  Netlify detects them from the built `dist/` output on deploy: no submission library and no
  endpoint environment variable to configure.
- Both forms keep the exact legacy consent paragraphs, the required `accept_terms` checkbox,
  and hidden error/success blocks. Each includes the custom `website` honeypot plus the
  Netlify-native `_gotcha` hidden field. The inline script silently drops submissions where
  either honeypot is filled, and otherwise lets the native POST proceed — Netlify intercepts
  it and 302-redirects back to the page with `?submitted`, which reveals the success panel
  (verbatim legacy copy: "Thank You! / The form has been submitted successfully. / A
  representative from the dealership will contact you shortly.").
- **Action item (Netlify side).** In the Netlify site UI, go to **Forms → Notifications** and
  set the notification email to **paul@usedcarsathens.com** for both forms.
- **Optional later (P2).** Add `data-netlify-recaptcha="true"` to both forms and link
  Netlify reCAPTCHA in the site UI.

## Build output

`dist/` — one trailing-slash directory per page:
`/` (inventory), `/home/`, `/apply-online/`, `/about-us/`, `/contact-us/`,
`/privacy-policy/`, `/vehicles/<slug>/` (one per vehicle), `404.html`,
`robots.txt`, `sitemap-index.xml` + `sitemap-0.xml`.
