import vehiclesRaw from './vehicles.json';

export interface Vehicle {
  id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  bodyType: string | null;
  trim: string | null;
  engine: string | null;
  transmission: string | null;
  drivetrain: string | null;
  doors: string | null;
  color: string | null;
  interiorColor: string | null;
  fuelType: string | null;
  odometer: number;
  price: number;
  cityMPG: number | null;
  highwayMPG: number | null;
  vin: string | null;
  stockNumber: string | null;
  location: string | null;
  imageDocId: string | null;
  imageCount: number;
}

const VEHICLES = vehiclesRaw as unknown as Vehicle[];

export const vehicles: Vehicle[] = [...VEHICLES].sort((a, b) => b.year - a.year);

export function vehicleBySlug(slug: string): Vehicle | undefined {
  return vehicles.find((v) => v.slug === slug);
}

/**
 * Build a DealerCenter image URL. `DocumentId` values from the live feed can
 * carry a trailing `/…` segment; the first segment is the canonical key.
 * Returns `null` when there is no usable image so callers fall back to the
 * local placeholder.
 */
export function vehicleImageUrl(v: Vehicle, size: 'thumb' | 'full' = 'thumb'): string | null {
  const part = v.imageDocId ? String(v.imageDocId).split('/')[0].trim() : '';
  if (!part) return null;
  const [w, h] = size === 'thumb' ? [320, 240] : [640, 480];
  return `https://imagescf.dealercenter.net/${w}/${h}/${part}.jpg`;
}

export function vehicleName(v: Vehicle): string {
  return [v.year, v.make, v.model].join(' ');
}

export function vehicleTitle(v: Vehicle): string {
  return v.trim ? `${vehicleName(v)} ${v.trim}` : vehicleName(v);
}

export function formatPrice(n: number | null): string {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatMiles(n: number | null): string {
  if (n === null || n === undefined) return '—';
  return `${new Intl.NumberFormat('en-US').format(Math.round(n))} mi`;
}

export type SortKey =
  | 'year_desc'
  | 'year_asc'
  | 'price_asc'
  | 'price_desc'
  | 'miles_asc'
  | 'miles_desc'
  | 'make_asc'
  | 'make_desc';

const SORTERS: Record<SortKey, (a: Vehicle, b: Vehicle) => number> = {
  year_desc: (a, b) => b.year - a.year,
  year_asc: (a, b) => a.year - b.year,
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  miles_asc: (a, b) => a.odometer - b.odometer,
  miles_desc: (a, b) => b.odometer - a.odometer,
  make_asc: (a, b) => a.make.localeCompare(b.make),
  make_desc: (a, b) => b.make.localeCompare(a.make),
};

/** `'default'` means "no sort param" — legacy default order (newest year first). */
export type SortOption = SortKey | 'default';

export const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'default', label: 'Default' },
  { key: 'price_asc', label: 'Price: Low - High' },
  { key: 'price_desc', label: 'Price: High - Low' },
  { key: 'miles_asc', label: 'Miles: Low - High' },
  { key: 'miles_desc', label: 'Miles: High - Low' },
  { key: 'year_asc', label: 'Year: Old - New' },
  { key: 'year_desc', label: 'Year: New - Old' },
  { key: 'make_asc', label: 'Make: A-Z' },
  { key: 'make_desc', label: 'Make: Z-A' },
];

export function sortVehicles(list: Vehicle[], sort: string): Vehicle[] {
  const key = (SORTERS[sort as SortKey] ? sort : 'year_desc') as SortKey;
  return [...list].sort(SORTERS[key]);
}

export interface InventoryFilter {
  make?: string;
  model?: string;
  bodyType?: string;
  year?: number;
  maxPrice?: number;
  maxMiles?: number;
}

export function filterVehicles(list: Vehicle[], f: InventoryFilter): Vehicle[] {
  return list.filter((v) => {
    if (f.make && v.make.toLowerCase() !== f.make.toLowerCase()) return false;
    if (f.model && v.model.toLowerCase() !== f.model.toLowerCase()) return false;
    if (f.bodyType && (v.bodyType ?? '').toLowerCase() !== f.bodyType.toLowerCase()) return false;
    if (f.year !== undefined && v.year !== f.year) return false;
    if (f.maxPrice !== undefined && v.price > f.maxPrice) return false;
    if (f.maxMiles !== undefined && v.odometer > f.maxMiles) return false;
    return true;
  });
}

export function distinct(list: Vehicle[], key: 'make' | 'bodyType' | 'year'): string[] {
  const out = new Set<string>();
  for (const v of list) {
    const val = v[key];
    if (val != null) out.add(String(val));
  }
  return [...out];
}
