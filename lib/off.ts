// Open Food Facts API client
// Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
// No API key required. All nutrient values are per 100 g.

import type { UsdaFood, UsdaMacros } from './usda';

const BASE_URL = 'https://world.openfoodfacts.org';

// ─── OFF response shapes ─────────────────────────────────────────

type OffNutriments = {
  'energy-kcal_100g'?: number; // kcal (preferred)
  energy_100g?: number;        // kJ fallback
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  fiber_100g?: number;
};

type OffProduct = {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  nutriments?: OffNutriments;
};

type OffLookupResponse = {
  status: 0 | 1;
  product?: OffProduct;
};

type OffSearchResponse = {
  count: number;
  products?: OffProduct[];
};

// ─── In-memory caches ────────────────────────────────────────────

const barcodeCache = new Map<string, UsdaFood | null>();
const searchCache  = new Map<string, UsdaFood[]>();

// ─── Helpers ─────────────────────────────────────────────────────

function toMacros(n: OffNutriments): UsdaMacros {
  // OFF stores energy as kcal when available; fall back to kJ → kcal conversion
  const calories =
    n['energy-kcal_100g'] != null
      ? n['energy-kcal_100g']
      : n.energy_100g != null
      ? Math.round((n.energy_100g / 4.184) * 10) / 10
      : null;

  return {
    calories,
    protein_g: n.proteins_100g ?? null,
    carbs_g:   n.carbohydrates_100g ?? null,
    fat_g:     n.fat_100g ?? null,
    fiber_g:   n.fiber_100g ?? null,
  };
}

function toFood(p: OffProduct, barcode: string): UsdaFood {
  return {
    fdcId:   `off:${barcode}`,
    name:    (p.product_name_en || p.product_name || '').trim() || 'Unknown product',
    brand:   p.brands?.split(',')[0]?.trim() ?? null,
    per100g: p.nutriments ? toMacros(p.nutriments) : {
      calories: null, protein_g: null, carbs_g: null, fat_g: null, fiber_g: null,
    },
    source: 'off',
  };
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Look up a single product by barcode (EAN-8, EAN-13, UPC-A, UPC-E).
 * Returns `{ food: null, error: null }` when the barcode is not in the database.
 */
export async function lookupBarcode(
  barcode: string,
): Promise<{ food: UsdaFood | null; error: string | null }> {
  const key = barcode.trim();
  if (!key) return { food: null, error: null };

  if (barcodeCache.has(key)) return { food: barcodeCache.get(key)!, error: null };

  try {
    const res = await fetch(`${BASE_URL}/api/v0/product/${encodeURIComponent(key)}.json`);
    if (!res.ok) return { food: null, error: `Open Food Facts error ${res.status}` };

    const json = (await res.json()) as OffLookupResponse;
    if (json.status === 0 || !json.product) {
      barcodeCache.set(key, null);
      return { food: null, error: null };
    }

    const food = toFood({ ...json.product }, key);
    barcodeCache.set(key, food);
    return { food, error: null };
  } catch (e: unknown) {
    return { food: null, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * Text search across the Open Food Facts database.
 * Results are cached in memory per query string.
 */
export async function searchOFF(
  query: string,
): Promise<{ foods: UsdaFood[]; error: string | null }> {
  const key = query.trim().toLowerCase();
  if (!key) return { foods: [], error: null };

  if (searchCache.has(key)) return { foods: searchCache.get(key)!, error: null };

  try {
    const url =
      `${BASE_URL}/cgi/search.pl` +
      `?search_terms=${encodeURIComponent(key)}` +
      `&json=1&page_size=20` +
      `&fields=code,product_name,product_name_en,brands,nutriments`;

    const res = await fetch(url);
    if (!res.ok) return { foods: [], error: `Open Food Facts error ${res.status}` };

    const json = (await res.json()) as OffSearchResponse;
    const foods = (json.products ?? [])
      .filter((p) => p.product_name || p.product_name_en)
      .map((p) => toFood(p, p.code ?? ''))
      .filter((f) => f.name !== 'Unknown product');

    searchCache.set(key, foods);
    return { foods, error: null };
  } catch (e: unknown) {
    return { foods: [], error: e instanceof Error ? e.message : 'Network error' };
  }
}
