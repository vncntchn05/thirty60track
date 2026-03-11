// USDA FoodData Central API client
// Docs: https://fdc.nal.usda.gov/api-guide.html
// All nutrient values from the API are per 100 g — scale by (serving_size_g / 100) before saving.

const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
// DEMO_KEY is a built-in USDA fallback (30 req/hour). Set EXPO_PUBLIC_USDA_API_KEY for higher limits.
const API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY || 'DEMO_KEY';

// ─── USDA nutrient IDs ──────────────────────────────────────────

const NUTRIENT_IDS = {
  energy:  [1008, 2048], // kcal (1008 primary, 2048 fallback for branded foods)
  protein: [1003],
  carbs:   [1005],
  fat:     [1004],
  fiber:   [1079],
} as const;

// ─── API response shapes (typed, no `any`) ─────────────────────

type UsdaRawNutrient = {
  nutrientId: number;
  nutrientName: string;
  unitName: string;
  value: number;
};

type UsdaRawFood = {
  fdcId: number;
  description: string;
  brandOwner?: string;
  brandName?: string;
  foodNutrients: UsdaRawNutrient[];
};

type UsdaSearchResponse = {
  foods: UsdaRawFood[];
  totalHits: number;
};

// ─── Public types ───────────────────────────────────────────────

/** Macros per 100 g, as returned by USDA. Scale before saving. */
export type UsdaMacros = {
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
};

export type UsdaFood = {
  fdcId: string;
  name: string;
  brand: string | null;
  per100g: UsdaMacros;
};

// ─── In-memory cache ────────────────────────────────────────────

const searchCache = new Map<string, UsdaFood[]>();

// ─── Helpers ────────────────────────────────────────────────────

function pickNutrient(nutrients: UsdaRawNutrient[], ids: readonly number[]): number | null {
  for (const id of ids) {
    const found = nutrients.find((n) => n.nutrientId === id);
    if (found != null) return found.value;
  }
  return null;
}

function toUsdaFood(raw: UsdaRawFood): UsdaFood {
  return {
    fdcId: String(raw.fdcId),
    name: raw.description,
    brand: raw.brandOwner ?? raw.brandName ?? null,
    per100g: {
      calories:  pickNutrient(raw.foodNutrients, NUTRIENT_IDS.energy),
      protein_g: pickNutrient(raw.foodNutrients, NUTRIENT_IDS.protein),
      carbs_g:   pickNutrient(raw.foodNutrients, NUTRIENT_IDS.carbs),
      fat_g:     pickNutrient(raw.foodNutrients, NUTRIENT_IDS.fat),
      fiber_g:   pickNutrient(raw.foodNutrients, NUTRIENT_IDS.fiber),
    },
  };
}

/** Scale per-100g macros to a given serving size. */
export function scaleMacros(per100g: UsdaMacros, servingG: number): UsdaMacros {
  const factor = servingG / 100;
  const scale = (v: number | null) => v != null ? Math.round(v * factor * 10) / 10 : null;
  return {
    calories:  scale(per100g.calories),
    protein_g: scale(per100g.protein_g),
    carbs_g:   scale(per100g.carbs_g),
    fat_g:     scale(per100g.fat_g),
    fiber_g:   scale(per100g.fiber_g),
  };
}

// ─── API functions ───────────────────────────────────────────────

/** Search USDA foods by name. Results cached in memory per query. */
export async function searchFoods(query: string): Promise<{ foods: UsdaFood[]; error: string | null }> {
  const key = query.trim().toLowerCase();
  if (!key) return { foods: [], error: null };

  if (searchCache.has(key)) return { foods: searchCache.get(key)!, error: null };

  try {
    const url = `${BASE_URL}/foods/search?query=${encodeURIComponent(key)}&pageSize=20&api_key=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      const msg = res.status === 403
        ? 'Invalid API key — add EXPO_PUBLIC_USDA_API_KEY to .env.local'
        : res.status === 429
        ? 'USDA rate limit reached — add a free API key at fdc.nal.usda.gov'
        : `USDA API error ${res.status}`;
      return { foods: [], error: msg };
    }

    const json = (await res.json()) as UsdaSearchResponse;
    const foods = (json.foods ?? []).map(toUsdaFood);
    searchCache.set(key, foods);
    return { foods, error: null };
  } catch (e: unknown) {
    return { foods: [], error: e instanceof Error ? e.message : 'Network error' };
  }
}
