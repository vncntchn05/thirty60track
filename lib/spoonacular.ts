// Spoonacular API client — barcode lookup only (preserves free-tier quota)
// Docs: https://spoonacular.com/food-api/docs#Product-Information-by-UPC
// Free tier: 150 points/day (barcode lookup = 1 point). Sign up at spoonacular.com/food-api.
// Spoonacular returns macros per serving; we convert to per-100g using weightPerServing.

import type { UsdaFood, UsdaMacros } from './usda';

const BASE_URL = 'https://api.spoonacular.com';
const API_KEY  = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY ?? '';

// ─── API response shapes ─────────────────────────────────────────

type SpoonacularNutrient = {
  name:   string;
  amount: number;
  unit:   string;
};

type SpoonacularProduct = {
  id:    number;
  title: string;
  brand?: string;
  nutrition?: {
    nutrients:        SpoonacularNutrient[];
    weightPerServing: { amount: number; unit: string };
  };
};

// ─── Helpers ─────────────────────────────────────────────────────

function findNutrient(nutrients: SpoonacularNutrient[], name: string): number | null {
  return nutrients.find((n) => n.name.toLowerCase() === name.toLowerCase())?.amount ?? null;
}

function toUsdaFood(p: SpoonacularProduct, barcode: string): UsdaFood {
  const nutrients  = p.nutrition?.nutrients ?? [];
  const servingG   = p.nutrition?.weightPerServing?.unit === 'g'
    ? p.nutrition.weightPerServing.amount
    : null;

  function per100g(v: number | null): number | null {
    if (v == null) return null;
    if (servingG == null || servingG <= 0) return v; // can't convert, return as-is
    return Math.round((v / servingG) * 100 * 10) / 10;
  }

  const per100gMacros: UsdaMacros = {
    calories:  per100g(findNutrient(nutrients, 'Calories')),
    protein_g: per100g(findNutrient(nutrients, 'Protein')),
    carbs_g:   per100g(findNutrient(nutrients, 'Carbohydrates')),
    fat_g:     per100g(findNutrient(nutrients, 'Fat')),
    fiber_g:   per100g(findNutrient(nutrients, 'Fiber')),
  };

  return {
    fdcId:   `spoon:${barcode}`,
    name:    p.title,
    brand:   p.brand ?? null,
    per100g: per100gMacros,
    source:  'usda',
  };
}

// ─── In-memory cache ─────────────────────────────────────────────

const barcodeCache = new Map<string, UsdaFood | null>();

// ─── Public API ──────────────────────────────────────────────────

/**
 * Look up a product by UPC/EAN barcode via Spoonacular.
 * Returns `{ food: null, error: null }` when the barcode is not found.
 * Returns `{ food: null, error: null }` silently when no API key is configured.
 */
export async function lookupBarcodeSpoonacular(
  barcode: string,
): Promise<{ food: UsdaFood | null; error: string | null }> {
  if (!API_KEY) return { food: null, error: null };

  const key = barcode.trim();
  if (!key) return { food: null, error: null };

  if (barcodeCache.has(key)) return { food: barcodeCache.get(key)!, error: null };

  try {
    const res = await fetch(
      `${BASE_URL}/food/products/upc/${encodeURIComponent(key)}?apiKey=${API_KEY}`,
    );

    if (res.status === 404) {
      barcodeCache.set(key, null);
      return { food: null, error: null };
    }
    if (!res.ok) {
      return { food: null, error: `Spoonacular error ${res.status}` };
    }

    const json = (await res.json()) as SpoonacularProduct;
    const food = toUsdaFood(json, key);
    barcodeCache.set(key, food);
    return { food, error: null };
  } catch (e: unknown) {
    return { food: null, error: e instanceof Error ? e.message : 'Network error' };
  }
}
