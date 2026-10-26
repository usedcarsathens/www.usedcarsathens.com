# Used Cars Athens — Legacy Site Audit (Research for Rebuild)

Audit date: 2026-10-25. Legacy site is a WordPress 6.6.2 site on the **DealerCenter** platform
(dcid `22286137`, site `68972`), exported as static HTML into this repo.

## 1. Business / Brand

| Field | Value |
|---|---|
| Name | Used Cars Athens |
| Address | 159 Oneta St STE 4, Athens, GA 30601 |
| Phone | SALES: (706) 215-9006 |
| Email | paul@usedcarsathens.com |
| Hours | Mon–Sun: 8:00 AM – 6:00 PM |
| Domain | https://www.usedcarsathens.com/ |
| DealerCenter dcid | 22286137 (site id 68972) |
| Logo | https://dcdws.blob.core.windows.net/dws-22286137-68972-media/sites/68972/2024/04/used-car-athens.png |

**Visual language (from theme CSS):**
- Primary red `#8e0b07`, hover/accent red `#a90c07` / `#c10707`, hover-icon red `#e60808`
- Dark grays: header/nav `#222222` / `#141414`, body black `#000`, footer `#141414`
- Text on dark: `#fff`, muted `#ccc`
- Font: **Montserrat** (Google Fonts), also Roboto loaded
- Buttons: red bg, white text, ~4px radius, uppercase-ish bold
- KBB vertical logo badge in footer (`dealercenter/img/logo_kbb_vert_60x110_darkbg.png`)

## 2. Sitemap (legacy)

| Path | Page | Notes |
|---|---|---|
| `/home/` | Home | Hero, welcome copy, quick search (Year/Price/Mileage + reset), "Explore Vehicles By Body Style", inventory widget, trust copy |
| `/` (inventory), canonical `/` | Inventory listing | Vehicle grid, filters, sort, pagination (9/page), compare bar |
| `/apply-online/` | Apply Online | Multi-tab financing application: Buyer + Co-Buyer; submits to DealerCenter secured forms (`https://dwssecuredforms.dealercenter.net`) |
| `/about-us/` | About Us | Mission copy, address, contact, hours, social |
| `/contact-us/` | Contact Us | Phone/address/hours, Google map, comment form |
| `/privacy-policy/` | Privacy Policy | Standard notice (full text in legacy HTML) |

**Nav order:** Home → Inventory → Apply Online → About Us → Contact Us (+ Privacy in footer).
Sticky header, mobile hamburger, phone number prominent in header right.

### Home page copy (verbatim, reuse in rebuild)
- H1/Hero: "ACCELERATE YOUR STRESS-FREE JOURNEY TO THE PERFECT" RIDE — "PERFECT RIDE STARTS HERE!"
- "Welcome to Used Cars Athens, where stress-free shopping meets your dream ride. Discover our diverse selection, personalized service, and seamless financing options. Drive away with confidence, only at Used Cars Athens"
- CTA: "Browse Our Inventory"
- Section: "Used Cars Athens: Used Car Dealer in Athens, GA"
- "Will help you to find your dream ride with less hassle – whether a basic or luxury sedan, a coupe/convertible, a crossover or an SUV..." (full text in `home/index.html`)

### About us copy (verbatim, reuse)
"Welcome to our stress-free, pressure-free car dealership, where finding the perfect vehicle for your needs is our top priority..." (full text in `about-us/index.html`)

## 3. SEO requirements (per-page, carry over)

- Home: title `HOME - Used Cars Athens`
- Inventory (root): title `High Quality Car Inventory in Athens, GA | Used Cars Athens`, desc `Check Car Listings in Athens, GA at Used Cars Athens today.`, canonical `https://www.usedcarsathens.com/`
- Yoast JSON-LD graph on legacy pages: `WebSite`, `Organization` (name, logo, address, phone), `WebPage`, `BreadcrumbList`.
- **Add in rebuild:** `AutoDealer` schema (address/phone/hours), `ItemList` of `Car` on inventory, `Car` (with `offers`, `vehicleIdentificationNumber`, `mileageFromOdometer`) on vehicle/detail pages, sitemap, OpenGraph, twitter card.

## 4. Inventory data source (the key integration)

**Legacy JSONP endpoints** (DealerCenter, base `https://www.usedcarsathens.com/inv-scripts-v2/inv/`):

1. `vehicles?vc=a&f=id|sn|ye|ma|mo|tr|dt|ta|td|en|mi|dr|ec|ic|bt|pr|im|eq|vd|vin|hpg|cpg|vc|co|hi|cfx|acr|vt|cy|di|ft|lo|cfk|tb|cs|nos|sc|fp|cohd|nop|vdf|ffmi|cfd|dc&ps=9&pn=0&sb=ma|a,mo|a&sp=n&cb=NAME&dcid=22286137` →
   JSONP `NAME({"TotalRecordCount":6,"Vehicles":[ ... ]})`
2. `filter?vc=a&sp=n&lpr=0&ftr=ye|ma|mi|pr|dtt|ect|ta|vc|bt|hpg|cpg|td&afo=y&cb=NAME&dcid=22286137` → flat list of `{OptionType, Count, Value, Value2, OptionChild}` (year, make, model, price, doors, engine, transmission, vehicle class, body type, …)
3. `grpbymake?vc=a&sp=n&cb=NAME&dcid=22286137` → makes with counts
4. `grpbybodytype?...` → body types with counts

**Vehicle record fields (full list):** VehicleInfoId, VehicleClass, StockNumber, Vin, Year, Make, Model, BodyType, Trim, Engine, Transmission, TransmissionDetail, Drivetrain, Doors, Equipments, ExteriorColor, InteriorColor, Odometer, VehiclePrice, PublishReportTypeOnWebsite, VehicleImages, VehicleImageCount, VideoUrl, CarfaxSecureUrl, CarfaxIconUrl, CarfaxReportStatus, CityMPG, HighwayMPG, CompanyId, DCId, AutoCheckReportTypeId, VehicleType, Cylinder, Displacement, AutoCheckScore, AutoCheckScoreRangeLow/High, AutoCheckNumOfOwners, AutoCheckNumOfAccident, AutoCheckHasOdometer, AutoCheckHasTitleBrandOrOtherProblems, AutoCheckAssured, FuelType, CustomStatus, Location, CarfaxKeyCode, VideoId, VideoSource, FlickFusion360MediaId, TitleBrand, NumberOfSlideouts, SleepingCount, CoachDesign, FloorPlan.

**Current inventory snapshot** (legacy repo `inv-scripts-v2/inv/`): 6 total vehicles; makes CHEVROLET, DODGE, HONDA, HYUNDAI, JEEP, KIA; body types HATCHBACK (1), SUV (5). Includes a TEST record (StockNumber "TEST", $5,000, 12,345 mi — exclude or flag).

**Images:** `https://imagescf.dealercenter.net/{width}/{height}/{DocumentId}.jpg` — NA placeholder `https://www.usedcarsathens.com/dealercenter/img/vehicle-image-notavailable-320x240.jpg`.

**Rebuild strategy (agreed):** build-time data pipeline → `site/src/data/vehicles.json` (normalized, sorted by Year desc). Provide `site/scripts/sync-inventory.mjs` that hits the live endpoint (strips JSONP wrapper, writes JSON) for deploy-time refresh; fall back to committed snapshot if network unavailable.

## 5. Legacy feature inventory (DealerCenter widgets)

Vehicle card actions (modals from `dealercenter.net/{Action}/index/22286137`):
Call Me, Request A Quote, Confirm Availability, Text Vehicle Detail, Follow Vehicle, Local Home Delivery, Virtual Appointment, Test Drive From Home, Email To Friend, Take Deposit.

Other: DealerCenter live chat (`chat-cf.dealercenter.net`, appId `MjIyODYxMzdqanNDcGRTNkdEdVhIZEs0`), Google reCAPTCHA Enterprise (key `6LfJ8mEnAAAAAIHeAILd4q4rShYgu-25ShxrzE0q`), AudioEye a11y widget, Google tag, Carfax reports, KBB badge.

**Rebuild stance:** keep phone/email CTAs first-class; wire "Request Quote / Call / Email" per vehicle to `tel:`/`mailto:` (optionally dealer chat as an enhancement, P2). Replace widget soup with native, accessible forms (Apply Online, Contact) — see product spec for endpoints.

## 6. Rebuild target

- **Framework:** Astro (static output, minimal client JS; islands only where interactivity needed: search/filter, mobile nav, forms).
- **Location:** new `site/` directory in this repo; legacy HTML stays put for reference.
- **Tooling:** TypeScript, plain CSS with design tokens (no framework), Astro integrations: `@astrojs/sitemap`, `@astrojs/rss` optional. Build must pass `npm run build` and preview with `npm run preview`.
- **Non-functional:** LCP-friendly (preconnect fonts, lazy images, no client JS on SEO pages beyond islands), semantic/accessible markup, mobile-first responsive, 100/100-ish Lighthouse a11y target.

## 7. Page copy sources

- Full verbatim copy exists in legacy HTML: `home/index.html`, `about-us/index.html`, `apply-online/index.html`, `contact-us/index.html`, `privacy-policy/index.html`.
- Apply Online form fields (from legacy, grouped): **Buyer** & **Co-Buyer** tabs — First/Last Name, Email, Cell Phone, Home Phone (opt), DOB, SSN, Driver's License # + State, mailing address (optional fields), employment info, monthly income, vehicle of interest, etc. (extract exact field list + validation messages from `apply-online/index.html`).
