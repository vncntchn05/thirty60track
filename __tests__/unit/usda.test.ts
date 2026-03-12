/**
 * Unit tests for lib/usda.ts
 *
 * Covers:
 *  - scaleMacros() — all fields, nulls, rounding, edge serving sizes
 *  - searchFoods() — empty query guard, cache hit, HTTP errors, network
 *    error, USDA JSON → UsdaFood mapping (brand, nutrient picking)
 */

import { scaleMacros, searchFoods, type UsdaMacros } from '@/lib/usda';

// ─── scaleMacros ─────────────────────────────────────────────────────────────

const FULL_MACROS: UsdaMacros = {
  calories:  400,
  protein_g: 30,
  carbs_g:   50,
  fat_g:     10,
  fiber_g:   5,
};

describe('scaleMacros', () => {
  it('scales all fields correctly for a 100 g serving (factor=1)', () => {
    const result = scaleMacros(FULL_MACROS, 100);
    expect(result.calories).toBe(400);
    expect(result.protein_g).toBe(30);
    expect(result.carbs_g).toBe(50);
    expect(result.fat_g).toBe(10);
    expect(result.fiber_g).toBe(5);
  });

  it('halves all values for a 50 g serving', () => {
    const result = scaleMacros(FULL_MACROS, 50);
    expect(result.calories).toBe(200);
    expect(result.protein_g).toBe(15);
    expect(result.carbs_g).toBe(25);
    expect(result.fat_g).toBe(5);
    expect(result.fiber_g).toBe(2.5);
  });

  it('doubles all values for a 200 g serving', () => {
    const result = scaleMacros(FULL_MACROS, 200);
    expect(result.calories).toBe(800);
    expect(result.protein_g).toBe(60);
    expect(result.carbs_g).toBe(100);
    expect(result.fat_g).toBe(20);
    expect(result.fiber_g).toBe(10);
  });

  it('returns 0 for all fields when serving is 0 g', () => {
    const result = scaleMacros(FULL_MACROS, 0);
    expect(result.calories).toBe(0);
    expect(result.protein_g).toBe(0);
    expect(result.carbs_g).toBe(0);
    expect(result.fat_g).toBe(0);
    expect(result.fiber_g).toBe(0);
  });

  it('preserves null fields — does not convert null to 0', () => {
    const partial: UsdaMacros = {
      calories: 200, protein_g: null, carbs_g: null, fat_g: 5, fiber_g: null,
    };
    const result = scaleMacros(partial, 50);
    expect(result.calories).toBe(100);
    expect(result.protein_g).toBeNull();
    expect(result.carbs_g).toBeNull();
    expect(result.fat_g).toBe(2.5);
    expect(result.fiber_g).toBeNull();
  });

  it('handles all-null macros', () => {
    const empty: UsdaMacros = {
      calories: null, protein_g: null, carbs_g: null, fat_g: null, fiber_g: null,
    };
    const result = scaleMacros(empty, 150);
    expect(result.calories).toBeNull();
    expect(result.protein_g).toBeNull();
    expect(result.carbs_g).toBeNull();
    expect(result.fat_g).toBeNull();
    expect(result.fiber_g).toBeNull();
  });

  it('rounds to 1 decimal place', () => {
    // 333 kcal × (75/100) = 249.75 → rounds to 249.8
    const macros: UsdaMacros = { calories: 333, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
    const result = scaleMacros(macros, 75);
    expect(result.calories).toBe(249.8);
  });

  it('handles fractional serving sizes', () => {
    const macros: UsdaMacros = { calories: 100, protein_g: 20, carbs_g: 0, fat_g: 0, fiber_g: 0 };
    const result = scaleMacros(macros, 33.3);
    expect(result.calories).toBe(33.3);
    expect(result.protein_g).toBe(6.7); // 20 * 0.333 = 6.66 → 6.7
  });

  it('handles a typical 28 g (1 oz) serving', () => {
    // 100g = 550 kcal; 28g = 550 * 0.28 = 154.0
    const macros: UsdaMacros = { calories: 550, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
    const result = scaleMacros(macros, 28);
    expect(result.calories).toBe(154);
  });
});

// ─── searchFoods ──────────────────────────────────────────────────────────────

// Mock fetch globally — usda.ts uses the global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

/** Build a minimal USDA API response with one food item. */
function buildUsdaResponse(overrides: {
  fdcId?: number;
  description?: string;
  brandOwner?: string;
  brandName?: string;
  nutrients?: Array<{ nutrientId: number; nutrientName: string; unitName: string; value: number }>;
}) {
  return {
    foods: [
      {
        fdcId: overrides.fdcId ?? 12345,
        description: overrides.description ?? 'Test Food',
        brandOwner: overrides.brandOwner,
        brandName: overrides.brandName,
        foodNutrients: overrides.nutrients ?? [
          { nutrientId: 1008, nutrientName: 'Energy', unitName: 'kcal', value: 250 },
          { nutrientId: 1003, nutrientName: 'Protein', unitName: 'g', value: 12 },
          { nutrientId: 1005, nutrientName: 'Carbohydrate', unitName: 'g', value: 30 },
          { nutrientId: 1004, nutrientName: 'Total Fat', unitName: 'g', value: 8 },
          { nutrientId: 1079, nutrientName: 'Fiber', unitName: 'g', value: 3 },
        ],
      },
    ],
    totalHits: 1,
  };
}

function mockOkResponse(body: object) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => body,
  });
}

function mockErrorResponse(status: number) {
  mockFetch.mockResolvedValueOnce({ ok: false, status });
}

beforeEach(() => {
  mockFetch.mockReset();
  // Reset module cache between tests by using unique query strings
});

describe('searchFoods — guard clauses', () => {
  it('returns empty array without calling fetch when query is empty string', async () => {
    const { foods, error } = await searchFoods('');
    expect(foods).toHaveLength(0);
    expect(error).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns empty array without calling fetch when query is only whitespace', async () => {
    const { foods, error } = await searchFoods('   ');
    expect(foods).toHaveLength(0);
    expect(error).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('searchFoods — successful response mapping', () => {
  it('maps fdcId to a string', async () => {
    mockOkResponse(buildUsdaResponse({ fdcId: 999888 }));
    const { foods } = await searchFoods('unique-query-fdcid-string');
    expect(typeof foods[0].fdcId).toBe('string');
    expect(foods[0].fdcId).toBe('999888');
  });

  it('uses description as food name', async () => {
    mockOkResponse(buildUsdaResponse({ description: 'Grilled Chicken Breast' }));
    const { foods } = await searchFoods('unique-query-name');
    expect(foods[0].name).toBe('Grilled Chicken Breast');
  });

  it('uses brandOwner when available', async () => {
    mockOkResponse(buildUsdaResponse({ brandOwner: 'Tyson Foods', brandName: 'Tyson' }));
    const { foods } = await searchFoods('unique-query-brand-owner');
    expect(foods[0].brand).toBe('Tyson Foods');
  });

  it('falls back to brandName when brandOwner is absent', async () => {
    mockOkResponse(buildUsdaResponse({ brandOwner: undefined, brandName: 'Generic Brand' }));
    const { foods } = await searchFoods('unique-query-brand-name-fallback');
    expect(foods[0].brand).toBe('Generic Brand');
  });

  it('returns null brand when neither brandOwner nor brandName exists', async () => {
    mockOkResponse(buildUsdaResponse({ brandOwner: undefined, brandName: undefined }));
    const { foods } = await searchFoods('unique-query-no-brand');
    expect(foods[0].brand).toBeNull();
  });

  it('maps all five macros correctly from nutrient array', async () => {
    mockOkResponse(buildUsdaResponse({}));
    const { foods } = await searchFoods('unique-query-five-macros');
    const macros = foods[0].per100g;
    expect(macros.calories).toBe(250);
    expect(macros.protein_g).toBe(12);
    expect(macros.carbs_g).toBe(30);
    expect(macros.fat_g).toBe(8);
    expect(macros.fiber_g).toBe(3);
  });

  it('falls back to nutrientId 2048 for energy when 1008 is absent', async () => {
    mockOkResponse(buildUsdaResponse({
      nutrients: [
        { nutrientId: 2048, nutrientName: 'Energy (Atwater)', unitName: 'kcal', value: 320 },
        { nutrientId: 1003, nutrientName: 'Protein', unitName: 'g', value: 25 },
        { nutrientId: 1005, nutrientName: 'Carbohydrate', unitName: 'g', value: 0 },
        { nutrientId: 1004, nutrientName: 'Total Fat', unitName: 'g', value: 0 },
        { nutrientId: 1079, nutrientName: 'Fiber', unitName: 'g', value: 0 },
      ],
    }));
    const { foods } = await searchFoods('unique-query-energy-fallback');
    expect(foods[0].per100g.calories).toBe(320);
  });

  it('returns null for a nutrient that is completely missing from the array', async () => {
    // No fiber nutrient in the response
    mockOkResponse(buildUsdaResponse({
      nutrients: [
        { nutrientId: 1008, nutrientName: 'Energy', unitName: 'kcal', value: 100 },
        { nutrientId: 1003, nutrientName: 'Protein', unitName: 'g', value: 10 },
        { nutrientId: 1005, nutrientName: 'Carbohydrate', unitName: 'g', value: 5 },
        { nutrientId: 1004, nutrientName: 'Total Fat', unitName: 'g', value: 2 },
        // No 1079 (fiber)
      ],
    }));
    const { foods } = await searchFoods('unique-query-missing-fiber');
    expect(foods[0].per100g.fiber_g).toBeNull();
  });

  it('returns error: null on success', async () => {
    mockOkResponse(buildUsdaResponse({}));
    const { error } = await searchFoods('unique-query-no-error');
    expect(error).toBeNull();
  });
});

describe('searchFoods — HTTP errors', () => {
  it('returns an error message for 403 (invalid API key)', async () => {
    mockErrorResponse(403);
    const { foods, error } = await searchFoods('unique-query-403');
    expect(foods).toHaveLength(0);
    expect(error).toMatch(/api key/i);
  });

  it('returns a rate-limit message for 429', async () => {
    mockErrorResponse(429);
    const { foods, error } = await searchFoods('unique-query-429');
    expect(foods).toHaveLength(0);
    expect(error).toMatch(/rate limit/i);
  });

  it('returns a generic error for other non-ok statuses', async () => {
    mockErrorResponse(500);
    const { foods, error } = await searchFoods('unique-query-500');
    expect(foods).toHaveLength(0);
    expect(error).toMatch(/500/);
  });
});

describe('searchFoods — network error', () => {
  it('returns the error message when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));
    const { foods, error } = await searchFoods('unique-query-network-error');
    expect(foods).toHaveLength(0);
    expect(error).toBe('Failed to fetch');
  });

  it('returns "Network error" for non-Error throws', async () => {
    mockFetch.mockRejectedValueOnce('some string error');
    const { foods, error } = await searchFoods('unique-query-string-throw');
    expect(foods).toHaveLength(0);
    expect(error).toBe('Network error');
  });
});

describe('searchFoods — in-memory cache', () => {
  it('returns cached result on the second call with the same query (no extra fetch)', async () => {
    const query = 'unique-query-cache-test-' + Date.now();
    mockOkResponse(buildUsdaResponse({ description: 'Cached Food' }));

    const first  = await searchFoods(query);
    const second = await searchFoods(query);

    // fetch should only have been called once
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(first.foods[0].name).toBe('Cached Food');
    expect(second.foods[0].name).toBe('Cached Food');
  });

  it('normalises the cache key to lowercase and trimmed', async () => {
    const query = 'unique-query-case-' + Date.now();
    mockOkResponse(buildUsdaResponse({ description: 'Case Test Food' }));

    await searchFoods('  ' + query.toUpperCase() + '  ');
    const second = await searchFoods(query.toLowerCase());

    // Same normalised key — only one fetch
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(second.foods[0].name).toBe('Case Test Food');
  });
});
