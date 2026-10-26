/**
 * sync-inventory.mjs
 *
 * Pulls the live DealerCenter inventory feed for Used Cars Athens, strips the
 * JSONP wrapper (`dws_inventory_listing_4({...})`), drops test rows
 * (StockNumber "TEST"), normalizes the records, and writes them to
 * src/data/vehicles.json (sorted by year, newest first).
 *
 * Any failure (network, DNS, payload shape) prints a warning and exits 0 so
 * static builds never break; the previously committed vehicles.json is left
 * untouched and the build falls back to it.
 *
 * Usage:
 *   npm run sync
 *
 * Offline testing:
 *   VEHICLES_RAW=/path/to/vehicles.raw npm run sync
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const INVENTORY_ENDPOINT =
  'https://www.usedcarsathens.com/inv-scripts-v2/inv/vehicles?vc=a' +
  '&f=id|sn|ye|ma|mo|tr|dt|ta|td|en|mi|dr|ec|ic|bt|pr|im|eq|vd|vin|hpg|cpg|vc|co|hi|cfx|acr|vt|cy|di|ft|lo|cfk|tb|cs|nos|sc|fp|cohd|nop|vdf|ffmi|cfd' +
  '&ps=1000&pn=0&dcid=22286137';

const OUTPUT_PATH = path.resolve(HERE, '../src/data/vehicles.json');
const FIXTURE_PATH = process.env.VEHICLES_RAW ? path.resolve(process.env.VEHICLES_RAW) : null;
const FETCH_TIMEOUT_MS = 20000;

/**
 * Body-style suffixes duplicated in `Trim` (e.g. "SE SPORT UTILITY 4D" -> "SE").
 * Mirrors the normalization verified against the live feed.
 */
const TRIM_SUFFIX =
  /\s+(SPORT UTILITY|SPORT SUV|SUV|CONVERSION|SEDAN|COUPE|4DR SEDAN|WAGON|HATCHBACK|2DR|4DR|EXTENDED|4 DOOR|2 DOOR|CAB|BOX TRUCK|TRUCK|LIFTGATE)\s*(4D|2D)?\s*$/i;

function slugify(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Keep short all-caps trims (SE, LX, EX, LS) as-is; title-case the rest. */
function titleWord(word) {
  if (/[A-Z]/.test(word) && word === word.toUpperCase() && word.length <= 3) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function trimDisplay(trim) {
  if (!trim) return null;
  const t = String(trim).trim().replace(TRIM_SUFFIX, '');
  if (!t) return null;
  return t
    .split(/\s+/)
    .map(titleWord)
    .join(' ');
}

function firstImageDocId(vehicle) {
  for (const image of vehicle.VehicleImages || []) {
    if (image && image.DocumentId) return image.DocumentId;
  }
  return null;
}

function normalize(v) {
  return {
    id: v.VehicleInfoId ?? null,
    slug: slugify(`${v.Year}-${v.Make}-${v.Model}-${v.StockNumber}`),
    year: v.Year ?? null,
    make: v.Make ?? null,
    model: v.Model ?? null,
    bodyType: v.BodyType ?? null,
    trim: trimDisplay(v.Trim),
    engine: v.Engine ?? null,
    transmission: v.TransmissionDetail || v.Transmission || null,
    drivetrain: v.Drivetrain ?? null,
    doors: v.Doors ?? null,
    color: v.ExteriorColor ?? null,
    interiorColor: v.InteriorColor ?? null,
    fuelType: v.FuelType ?? null,
    odometer: v.Odometer ?? null,
    price: v.VehiclePrice ?? null,
    cityMPG: v.CityMPG ?? null,
    highwayMPG: v.HighwayMPG ?? null,
    vin: v.Vin ?? null,
    stockNumber: v.StockNumber ?? null,
    location: v.Location ?? null,
    carfaxKeyCode: v.CarfaxKeyCode ?? null,
    videoUrl: v.VideoUrl ?? null,
    carfaxSecureUrl: v.CarfaxSecureUrl ?? null,
    imageDocId: firstImageDocId(v),
    imageCount: v.VehicleImageCount ?? 0,
    cylinders: v.Cylinder ?? null,
    displacement: v.Displacement ?? null,
  };
}

/** Strip the JSONP wrapper and parse the JSON payload. */
function parseFeed(text) {
  const strict = text.match(/^\w+\(\s*(\{[\s\S]*\})\s*\)\s*;?\s*$/);
  const payload = strict ? strict[1] : text;
  return JSON.parse(payload);
}

function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, {
    signal: controller.signal,
    headers: {
      accept: 'application/json, text/javascript, */*; q=0.01',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      referer: 'https://www.usedcarsathens.com/',
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .finally(() => clearTimeout(timer));
}

async function run() {
  const text = FIXTURE_PATH
    ? readFileSync(FIXTURE_PATH, 'utf8')
    : await fetchText(INVENTORY_ENDPOINT);

  let data;
  try {
    data = parseFeed(text);
  } catch (err) {
    throw new Error(`unexpected feed payload (${err.message})`);
  }

  const rows = (data.Vehicles || []).filter((v) => v.StockNumber !== 'TEST');
  if (!rows.length) throw new Error('feed returned no vehicles');

  const vehicles = rows.sort((a, b) => (b.Year || 0) - (a.Year || 0)).map(normalize);
  writeFileSync(OUTPUT_PATH, JSON.stringify(vehicles, null, 2) + '\n', 'utf8');
  console.log(`✓ Wrote ${vehicles.length} vehicles → ${path.relative(process.cwd(), OUTPUT_PATH)}`);
}

run().catch((err) => {
  console.warn(
    `⚠ sync-inventory: live feed unavailable (${err && err.message || err}). ` +
      'Falling back to the committed src/data/vehicles.json.',
  );
}).finally(() => process.exit(0));
