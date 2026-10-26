# Product Acceptance Spec — Used Cars Athens (Astro Rebuild)

Status: **for CEO sign-off** · Scope: verify against built `site/` (dist) and legacy HTML at repo root. Docs only — no code changes.
**Rev 2 (2026-10-26):** form-compliance fixes applied to `site/` — TCPA copy restored verbatim, co-buyer gating fixed (No co-buyer default), SSN label/required parity (ITIN-inclusive), `autocomplete` tokens, SR live-regions, graceful submit fallback. See §9 notes.
Locked CEO decisions (final): phone/email-first CTAs · server-rendered filter forms (no UI framework) · Montserrat + `#8e0b07` brand palette · **trailing slashes ON** · `/` = inventory (canonical stays `https://www.usedcarsathens.com/`) · `/home` = landing · per-vehicle pages **P1** · snapshot + graceful sync · exclude TEST record.

## 1. Goals & KPIs (north-star, 90 days post-launch)

| # | KPI | Why | Baseline → Target |
|---|-----|-----|-------------------|
| 1 | Qualified financing leads/mo (Apply submissions) | Primary revenue driver | legacy unknown → measurable: 100% of submits land in a real inbox/DMS |
| 2 | Phone + email CTA clicks/mo (all pages) | CEO-chosen conversion path | ≥ 50/mo site-wide |
| 3 | Organic clicks (GSC, "used cars athens" cluster) | SEO retention of legacy rankings | ≥ legacy baseline, no ranking loss on 6 legacy paths |
| 4 | Lighthouse a11y ≥ 95 on every route | CEO decision + legal posture | 100% of routes ≥ 95 |
| 5 | Form success (submitted → confirmed) | Trust; broken form = 0 leads | ≥ 95% of valid submits show confirmation (currently 0% — see §5.4) |

## 2. IA — URL map (P0 = launch blocker)

| URL | Purpose | Priority |
|-----|---------|:---:|
| `/` | Inventory index: all vehicles, filter/sort cards, SearchAction | P0 |
| `/apply-online/` | Financing application (Buyer + Co-Buyer) | P0 |
| `/contact-us/` | Contact form + phone/email/hours | P0 |
| `/home/` | Brand landing (hero, quick search, body styles, popular makes) | P0 |
| `/vehicles/{slug}/` ×5 | Per-vehicle detail (specs, image, CTAs) | P1 |
| `/about-us/` | Dealer story (verbatim legacy) | P1 |
| `/privacy-policy/` | Privacy notice (verbatim legacy) + form consent anchor | P1 |
| `404` | Not-found → link to inventory/apply | P2 |

Canonical domain always `https://www.usedcarsathens.com` (www, trailing slash). Sitemap: `sitemap-index.xml` → `sitemap-0.xml`; `robots.txt` disallows nothing.

## 3. Page requirements (DOM order · copy source = legacy HTML at repo root)

Verified against `site/dist/`. ✅ = verbatim match to legacy; ⚠ = deviation (see §3.2).

### 3.1 Per-route requirements

| Route (P) | Required sections, DOM order | Required CTAs / states |
|---|---|---|
| `/` (P0) | 1 `Inventory` H1 · 2 card grid (title+trim → Price → VIN → Mileage → Stock # → Fuel) · 3 count line "Showing 1–5 of 5 vehicles" · 4 sort + page-size controls · card buttons: Call / Email / Apply | Call `(706) 215-9006`, mailto, `href="/apply-online/"` ✅; empty state: "no vehicles" copy when snapshot empty (graceful — §4) |
| `2015-honda-fit-uca777348`, `2016-dodge-journey-uca110537`, `2019-kia-sorento-uca591809`, `2020-hyundai-palisade-uca049974`, `2021-jeep-cherokee-uca144547` (P1) | 1 H1 full name incl. trim · 2 image (lazy, `onerror` → `/placeholder-car.svg`) · 3 specs block: Body Type / Trim / Engine / Transmission / Drivetrain / Doors / Ext color / Int color / Fuel / MPG / VIN / Stock # / Location · 4 Call/Email/Apply buttons · breadcrumb | Same CTAs as `/` · null spec rows hidden · image fallback state |
| `/home/` (P0) | 1 "Used Cars Athens: Used Car Dealer in Athens, GA" H1 · 2 hero "ACCELERATE YOUR STRESS-FREE JOURNEY TO THE PERFECT RIDE" + "PERFECT RIDE STARTS HERE!" · 3 welcome paragraph · "Browse Our Inventory" · 4 QUICK SEARCH section (h2 verbatim) · 5 "Explore Vehicles By Body Style" + "We will help you to find your dream ride with less hassle…" · 6 "CALL US TODAY !" · 7 APPLY ONLINE + CONTACT US buttons · 8 "Popular Makes" + "We strive to do all we can…" | All headings ✅ verbatim; CTA buttons ✅ |
| `/about-us/` (P1) | 1 page-hero H1 `About Us` · 2 body — **verbatim legacy paragraph** (verified identical) | no CTA block in legacy; footer CTAs present |
| `/apply-online/` (P0) | 1 H1 `Apply Online` · 2 intro "All fields marked with an asterisk (*) are required" · 3 consent/TCPA paragraph (autodialer clause + "I have read and agree to the Privacy Policy of this dealer.") · 4 Buyer: Personal (name, birthdate, email, phones, **SSN**) + Driver's license · 5 Residential (street, city, state, zip, housing, rent/mortgage, months/years) · 6 Employment (employer, position, employer phone, gross income, tenure) · 7 "Relationship to Buyer *" select (Co-Habitant, Parent, Spouse, Relative, Registered Domestic Partner, Civil Union, Other) · 8 hidden Co-Buyer mirror block (toggled; inner fields disabled) · 9 "I accept all the above terms" checkbox · 10 hidden honeypot `website` · 11 status area + Submit | Call/Email in header/footer · status strings verbatim ✅ (below) · co-buyer gating JS ✅ |
| `/contact-us/` (P0) | 1 H1 `Contact Us` · 2 "📍 159 Oneta St STE 4, Athens, GA 30601 / SALES (706) 215-9006 / paul@usedcarsathens.com / Mon–Sun 8:00 AM–6:00 PM" block · 3 "We Welcome Your Feedback and Comments" ✅ · 4 form: First / Last / Phone / Email / "Contact Preference" (Phone · Email · SMS) / Message (maxLength 1024 + live "Characters left: 1,024") · 5 honeypot · 6 status area + Submit | ⚠ **legacy TCPA/consent paragraph missing — see §3.2** |
| `/privacy-policy/` (P1) | 1 H1 `Privacy Policy` · 2 body — **verbatim legacy notice** (verified identical, incl. "This privacy notice discloses the privacy practices for this web site.") | link target of apply-form consent ✅ |
| `404` (P2) | H1 + "The page you are looking for can't be found." + link to inventory and Apply | ⚠ self-canonicals to `/404/` — acceptable, do not index; confirm sitemap excludes it |

### 3.2 Copy-conformance findings (verified by grep against legacy + dist)

| # | Finding | Verdict |
|---|---------|---------|
| C1 | Inventory/home/apply/about/privacy titles, descriptions & body copy match legacy **verbatim**, incl. relationship options, consent clause, status strings ("Thank You! The form has been submitted successfully. A representative from the dealership will contact you shortly." / "There was an error submitting the form. Please try again in a few minutes." / "There are some items that require your attention. Please check all highlighted fields above.") | ✅ PASS |
| C2 | **Contact form is missing the legacy TCPA/consent paragraph** ("I consent to receive information by email, telephone call, including those made with an automatic telephone dialing system… I have read and agree to the Privacy Policy of this dealer.") — 0 matches in `contact-us` dist | ⚠ Compliance gap — CEO Q1 |
| C3 | Apply SSN: legacy label `SSN *` (required); new label `SSS / ITIN`, **not required** | ⚠ CEO Q2 |
| C4 | `co_buyer_relationship` is `required` with no "None / N/A" option → blocks all solo applicants; legacy disabled the field unless "Has Co-Buyer?" was checked | ⚠ Functional regression — CEO Q2 |
| C5 | New apply form omits legacy Interested-Vehicle block (keyword/stock/year/make/model/price/down/colors) and Trade-in + previous-address/employment repeaters | ✓ Intentional simplification — confirm, CEO Q3 |
| C6 | Vehicle meta description = title + " Call (706) 215-9006 or apply online for financing." (pattern repeated per car) | ✓ Acceptable; unique per URL |
| C7 | Nav "Inventory" link is `href="/?"` (query-only artifact — works); 404 self-canonical | ✓ Cosmetic; fix list, not a blocker |
| C8 | Footer "© 2026" (legacy "© 2025"); socials: only Facebook kept (X/YouTube/Instagram were JS placeholders in legacy) | ✓ Acceptable |

## 4. Content model — vehicle records

Public fields (consumed by `/`, `/vehicles/{slug}/`, sitemap, JSON-LD):

| Field | Public use | Null rule |
|---|---|---|
| `year`, `make`, `model` | H1, title, slug | required — drop record if absent |
| `trim` | H1/title suffix, specs | omit from title/H1 if null |
| `price`, `vin`, `mileage`, `stock` | card + specs | price null → show "Call for price" (phone-first) |
| `fuel_type`, `body_type`, `engine`, `transmission`, `drivetrain`, `doors` | specs block | hide row if null |
| `ext_color`, `int_color` | specs | hide row if null |
| `mpg` | specs | hide row if null |
| `image_url` | card + detail | `onerror` → `/placeholder-car.svg` (verified) |
| `slug` | URL | rule below |

Slug rule (implemented, verified in dist): `{year}-{make}-{model}-{stock}` lowercased, alphanumeric-dashed → e.g. `2021-jeep-cherokee-uca144547`.
Snapshot policy: `site/src/data/vehicles.json` committed (5 vehicles, `TEST` row excluded — verified); `npm run sync` fetches live API, **on any failure prints a warning and exits 0** (offline-safe, never breaks build — verified in `site/scripts/sync-inventory.mjs`); `VEHICLES_RAW` env fixture for tests.

## 5. Forms

### 5.1 Apply Online (P0)

- Field set §3.1 (Buyer Personal/Residential/Employment + Relationship + Co-Buyer mirror + terms checkbox).
- Honeypot: hidden `input name="website"` (`tabindex="-1"`, `aria-hidden`) ✅ on both forms.
- Validation: native HTML5 `required`/types (browser bubbles) — works today. Co-buyer fields disabled until Relationship chosen (inline JS toggle, verified).
- Status area: success/error/attention strings present in DOM, `hidden`, verbatim legacy ✅.
- **⚠ CRITICAL:** no submit handler exists (`action=PUBLIC_LEAD_ENDPOINT ?? "#"`; no `fetch`, no `submit` listener in dist). A submission POSTs to the page itself → data lost, no confirmation visible. **Form is not end-to-end functional** → CEO Q4 blocks KPI 1 and KPI 5.

### 5.2 Contact form (P0)

- Fields: First, Last, Phone, Email, Contact Preference (Phone/Email/SMS), Message (1024 max, live counter `aria-live=polite` ✅).
- Honeypot ✅. Same missing-submit-handler gap as §5.1.
- ⚠ Missing legacy TCPA consent (§3.2 C2) → CEO Q1.

### 5.3 Submit strategy (spec, pending Q4)

1. `PUBLIC_LEAD_ENDPOINT` env (per page or shared) — build-time only; no secret endpoint keys client-side.
2. Client JS: intercept submit → honeypot check (silently drop) → fetch `POST` (JSON or form-encoded, per endpoint) → set success/error div (`role="status"` / `role="alert"`; currently no live-region role — see §7).
3. Failure path → verbatim error string, keep input values.
4. reCAPTCHA Enterprise (legacy key exists) = P2 (§8).

### 5.4 Current state vs. spec

| Capability | Status |
|---|---|
| Client validation | ✅ native |
| Honeypot | ✅ both forms |
| Verbatim status copy | ✅ both forms |
| Endpoint wired | ❌ `#` fallback |
| Confirmation shown | ❌ no handler |
| Consent: Apply / Contact | ✅ / ❌ |

## 6. SEO

### 6.1 title / description / canonical (verified in dist)

| Page | title | description | canonical |
|---|---|---|---|
| `/` | `High Quality Car Inventory in Athens, GA | Used Cars Athens` ✅ legacy | `Check Car Listings in Athens, GA at Used Cars Athens today.` ✅ (only legacy desc) | `…usedcarsathens.com/` |
| `/home/` | `HOME - Used Cars Athens` ✅ | New: "Used Cars Athens is a stress-free, pressure-free used car dealer in Athens, GA. Browse use…" | `…/home/` |
| `/about-us/` | `About Us - Used Cars Athens` ✅ | New: "Learn about Used Cars Athens — a stress-free, pressure-free used car dealership in Athens, …" | `…/about-us/` |
| `/apply-online/` | `Apply Online - Used Cars Athens` ✅ | New: "Ready to ride? Apply for financing at Used Cars Athens in Athens, GA with our quick online…" | `…/apply-online/` |
| `/contact-us/` | `Contact Us - Used Cars Athens` ✅ | New: "Reach Used Cars Athens in Athens, GA. Call (706) 215-9006, email paul@usedcarsathens.com, …" | `…/contact-us/` |
| `/privacy-policy/` | `Privacy Policy - Used Cars Athens` ✅ | New: "How Used Cars Athens collects, uses, and protects your personal information — including ou…" | `…/privacy-policy/` |
| `/vehicles/{slug}/` | `{YEAR} {MAKE} {MODEL} {Trim} for sale in Athens, GA | Used Cars Athens` | Same + " Call (706) 215-9006 or apply online for financing." | `…/vehicles/{slug}/` |
| `404` | `Page Not Found - Used Cars Athens` | "The page you are looking for can't be found. Explore our inventory or call Used Cars Athen…" | `…/404/` (self — do not index) |

All unique ✅ · Montserrat + preconnects ✅ · single CSS bundle, JSON-LD only script on P0 pages ✅.

### 6.2 JSON-LD node sets (verified per page type)

| Page type | `@graph` nodes |
|---|---|
| `/` | Organization, AutoDealer, WebSite (SearchAction → `?make={search_term_string}`), ItemList (5 vehicles), BreadcrumbList |
| `/vehicles/{slug}/` | Organization, AutoDealer, WebSite, **Vehicle**, BreadcrumbList |
| all others | Organization, AutoDealer, WebSite, BreadcrumbList |

AutoDealer: address 159 Oneta St STE 4, Athens GA 30601 · tel `+1 706-215-9006` · hours Mo-Su 08:00-18:00 · `sameAs` = Facebook only.

### 6.3 301 map (legacy → new) — deploy/hosting task; no `_redirects` file in repo

| legacy | new | note |
|---|---|---|
| `/home/`, `/about-us/`, `/apply-online/`, `/contact-us/`, `/privacy-policy/`, `/` | identical paths | identity — verify host keeps 301s for any old `/index.html?p=N`, `/wp-…` artifact URLs found in GSC |

## 7. Accessibility checklist

| Item | Status |
|---|---|
| Landmarks: header/nav(×2, labeled "Main" & "Mobile menu")/main/footer; topbar `role="navigation"` (info-only — acceptable) | ✅ |
| Labels: all inputs `for`/`id` (verified), `inputmode`, `type=email/tel` | ✅ |
| **Contrast (computed WCAG 2.1):** `#8e0b07` on `#fff` **9.54:1** ✅ · `#fff` on `#8e0b07` **9.54:1** ✅ · `#fff` on `#141414` **18.42:1** ✅ · `#fff` on `#222` **15.91:1** ✅ · muted `#ccc` on `#141414` **11.47:1** on `#222` **9.91:1** ✅ · accent `#c10707` on white **6.36:1** ✅ — no pair in use below 4.5:1 | ✅ |
| Mobile menu: native `<details>/<summary>` — keyboard + SR accessible, zero JS | ✅ |
| Keyboard: forms, nav, filters server-rendered buttons/links — tab-order natural | ✅ |
| Reduced motion: only 3 short CSS `transition`s (hover/focus); no JS animation; optional `prefers-reduced-motion` media query | ✅ (P1 polish) |
| `autocomplete` tokens on all free-text inputs (given-name / family-name / email / tel / bday / street-address / postal-code / organization / organization-title, `off` where no token applies) | ✅ fixed 10-26, verified in dist |
| Form status divs have `role="status"` (success) / `role="alert"` (error) → implicit `aria-live`; SR will announce the confirmation | ✅ fixed 10-26, verified in dist |
| `<html lang="en">`, viewport meta, single H1 per page | ✅ |

## 8. P2 backlog (post-launch, not acceptance-blocking)

| Item | Notes |
|---|---|
| Dealer chat widget | legacy `chat-cf.dealercenter.net` appId available |
| reCAPTCHA Enterprise | legacy key available; pair with Q4 endpoint |
| Vehicle follow / compare bar | legacy DealerCenter feature |
| Carfax reports | per-vehicle; needs data source |
| Image upgrades | replace/hotlink `imagescf.dealercenter.net/{w}/{h}/{docId}.jpg` (needs permission — Q5) |
| KBB badge | `dealercenter/img/logo_kbb_vert_…` (needs permission — Q5) |

## 9. Acceptance checklist (CEO: run/verify each box)

- [ ] `npm run build` passes; `site/dist` contains all 12 routes + sitemaps + robots (verified ✅ in this audit)
- [ ] `npm run sync` with network down → warning + exit 0, build unchanged (verified ✅)
- [ ] Every route has **unique** `<title>`, `meta description`, `link rel=canonical` (verified ✅)
- [ ] All 5 vehicles render on `/` and `/vehicles/{slug}/` with price/VIN/mileage/specs (verified ✅; TEST record absent ✅)
- [x] **Apply form: submit → visible confirmation** — ✅ graceful fallback live (honeypot-aware; `Thank You!` + tel/mailto CTA while `PUBLIC_LEAD_ENDPOINT` is unset; native POST proceeds once set). Real-destination e2e pending Q4
- [x] Contact form: submit → visible confirmation — ✅ same fallback, verified in dist
- [x] Contact form shows restored TCPA/consent paragraph, **verbatim** from legacy (Q1) — ✅ verified in dist (full TCPA + Do-Not-Call + access-fee sentences)
- [x] `co_buyer_relationship` does not block solo applicants (Q2) — ✅ `No co-buyer` is the default-selected option, `required` removed, co-buyer fields `disabled` in initial HTML until a relationship is chosen; SSN follows legacy `SSN *` (relabeled `SSN / ITIN`), enforced only when a co-buyer is active
- [ ] Lighthouse: a11y **≥ 95** on all 9 template types (run on staging; `autocomplete` + live-regions are in place — confirm score)
- [ ] Lighthouse: SEO ≥ 90 on `/`, `/home/`, one vehicle page (JSON-LD valid per §6.2)
- [ ] No console-reliant JS on P0: `/`, `/home/`, `/about-us/`, `/privacy-policy/` carry only JSON-LD script (verified ✅); apply/contact inline JS degrades to native form behavior
- [ ] Legacy verbatim copy present: home hero/sections, about, privacy, apply consent + status strings (verified ✅ §3.2 C1)
- [ ] 301s for legacy paths live on host (deploy task §6.3)
- [ ] `robots.txt` + `sitemap-index.xml` live; Google Indexing shows 0 soft-404s after 2 weeks

## 10. Open questions for CEO (decision-grade, max 5)

1. **CONTACT CONSENT (compliance):** Restore the legacy TCPA/consent paragraph verbatim above the contact form ("I consent to receive information by email, telephone call, including those made with an automatic telephone dialing system or an artificial or pre-recorded voice, and/or SMS message… I have read and agree to the Privacy Policy of this dealer.")? **Recommendation: yes — required before launch.** → **RESOLVED 10-26: yes — restored verbatim, verified in dist.**
2. **SSN + CO-BUYER GATING (legal/UX):** (a) Apply form: relabel/require — legacy said `SSN *`; new is optional `SSS / ITIN`. Keep optional or make required? (b) `Relationship to Buyer` is currently `required` with no "None" option, blocking applicants without a co-buyer. Ship a "No co-buyer" default? **Recommendation: optional SSN (ITIN-inclusive), default-gate the co-buyer block.** → **RESOLVED 10-26: `No co-buyer` default-selected + block gated (disabled while none); SSN follows legacy `SSN *` — required, relabeled `SSN / ITIN` (ITIN-inclusive), enforced only when a co-buyer is active.**
3. **APPLY-FORM SCOPE (disclaimers are yours to own):** Confirm the intentional removals: Interested-Vehicle fields, Trade-in block, previous address & employment repeaters, as built — and confirm the remaining consent text is the complete legal version required for financing inquiries?
4. **LEAD ENDPOINT (blocks KPIs 1 & 5):** Where do both forms POST in production? Options: (a) DealerCenter DWS secured forms (`dwssecuredforms.dealercenter.net`) as legacy did, (b) direct `paul@` mailbox via static-host form handler (e.g., Formspree/Getform), (c) other CRM. Who wires the submit handler + keeps reCAPTCHA? Without an answer, the site cannot collect any leads. → **Interim CEO decision 10-26: ship with the honest graceful fallback (no dead submit — `Thank You!` + tel/mailto CTA); set `PUBLIC_LEAD_ENDPOINT` at deploy and the same form goes live with native POST. Final destination still CEO-owned.**
5. **ASSET PERMISSIONS (P2 but time-sensitive):** Do we have written permission to (a) hotlink `imagescf.dealercenter.net` car photos and (b) serve the KBB badge in production? If not, plan fallback branding/images before the chat/Carfax work in §8.
