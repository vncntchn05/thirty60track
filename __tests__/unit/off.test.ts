/**
 * Unit tests for lib/off.ts (Open Food Facts client)
 *
 * Both functions use module-level caches (Map). To avoid cross-test pollution,
 * each "live fetch" test uses a unique barcode/query key so it never hits a
 * previously cached result. Cache-behaviour tests call the same key twice and
 * verify fetch was only called once.
 */

import { lookupBarcode, searchOFF } from '@/lib/off';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

// ─── lookupBarcode ────────────────────────────────────────────────────────────

describe('lookupBarcode', () => {
  it('returns { food: null, error: null } for empty barcode without fetching', async () => {
    const { food, error } = await lookupBarcode('');
    expect(food).toBeNull();
    expect(error).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns { food: null, error: null } for whitespace-only barcode', async () => {
    const { food, error } = await lookupBarcode('   ');
    expect(food).toBeNull();
    expect(error).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns a mapped food for a found product', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        status: 1,
        product: {
          product_name: 'Test Protein Bar',
          brands: 'TestBrand, OtherBrand',
          nutriments: {
            'energy-kcal_100g': 380,
            proteins_100g: 25,
            carbohydrates_100g: 40,
            fat_g: 10,
            fat_100g: 10,
            fiber_100g: 5,
          },
        },
      }),
    });

    const { food, error } = await lookupBarcode('bc-found-001');

    expect(error).toBeNull();
    expect(food).not.toBeNull();
    expect(food!.name).toBe('Test Protein Bar');
    expect(food!.per100g.calories).toBe(380);
    expect(food!.per100g.protein_g).toBe(25);
    expect(food!.per100g.fat_g).toBe(10);
    expect(food!.per100g.fiber_g).toBe(5);
    // fdcId prefixed with 'off:'
    expect(food!.fdcId).toBe('off:bc-found-001');
    // Only first brand token used
    expect(food!.brand).toBe('TestBrand');
    // source tag
    expect(food!.source).toBe('off');
  });

  it('prefers product_name_en over product_name', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        status: 1,
        product: { product_name: 'Nom français', product_name_en: 'English Name', nutriments: {} },
      }),
    });

    const { food } = await lookupBarcode('bc-en-001');
    expect(food!.name).toBe('English Name');
  });

  it('falls back to kJ→kcal conversion when energy-kcal_100g is absent', async () => {
    // 418.4 kJ ÷ 4.184 ≈ 100 kcal
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        status: 1,
        product: { product_name: 'kJ Product', nutriments: { energy_100g: 418.4 } },
      }),
    });

    const { food } = await lookupBarcode('bc-kj-001');
    expect(food!.per100g.calories).toBeCloseTo(100, 0);
  });

  it('returns { food: null, error: null } when product status is 0 (not in DB)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ status: 0 }),
    });

    const { food, error } = await lookupBarcode('bc-notfound-001');
    expect(food).toBeNull();
    expect(error).toBeNull();
  });

  it('returns an error string on HTTP failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });

    const { food, error } = await lookupBarcode('bc-httperr-001');
    expect(food).toBeNull();
    expect(error).toMatch(/503/);
  });

  it('returns an error string on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network offline'));

    const { food, error } = await lookupBarcode('bc-neterr-001');
    expect(food).toBeNull();
    expect(error).toBe('Network offline');
  });

  it('caches the result — second call with same barcode skips fetch', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        status: 1,
        product: { product_name: 'Cached Bar', nutriments: {} },
      }),
    });

    await lookupBarcode('bc-cache-001');   // populate cache
    mockFetch.mockClear();
    await lookupBarcode('bc-cache-001');   // should use cache

    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ─── searchOFF ────────────────────────────────────────────────────────────────

describe('searchOFF', () => {
  it('returns { foods: [], error: null } for empty query without fetching', async () => {
    const { foods, error } = await searchOFF('');
    expect(foods).toHaveLength(0);
    expect(error).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns mapped foods from API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        count: 2,
        products: [
          { code: 'p1', product_name: 'Oat Milk',  nutriments: { 'energy-kcal_100g': 45 } },
          { code: 'p2', product_name: 'Soy Milk',  nutriments: { 'energy-kcal_100g': 33 } },
        ],
      }),
    });

    const { foods, error } = await searchOFF('off-search-milk-001');
    expect(error).toBeNull();
    expect(foods).toHaveLength(2);
    expect(foods[0].name).toBe('Oat Milk');
    expect(foods[0].source).toBe('off');
  });

  it('filters out products with no name field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        products: [
          { code: 'p-noname', nutriments: {} },
          { code: 'p-named', product_name: 'Named Product', nutriments: {} },
        ],
      }),
    });

    const { foods } = await searchOFF('off-search-noname-001');
    expect(foods).toHaveLength(1);
    expect(foods[0].name).toBe('Named Product');
  });

  it('filters out products that resolve to "Unknown product"', async () => {
    // product_name and product_name_en are both empty/absent
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        products: [{ code: 'p-empty', product_name: '', product_name_en: '', nutriments: {} }],
      }),
    });

    const { foods } = await searchOFF('off-search-unknown-001');
    expect(foods).toHaveLength(0);
  });

  it('returns an error string on HTTP failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const { foods, error } = await searchOFF('off-search-httperr-001');
    expect(foods).toHaveLength(0);
    expect(error).toMatch(/500/);
  });

  it('returns an error string on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Timeout'));

    const { foods, error } = await searchOFF('off-search-neterr-001');
    expect(foods).toHaveLength(0);
    expect(error).toBe('Timeout');
  });

  it('caches results — second identical query skips fetch', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        products: [{ code: 'cp1', product_name: 'Cached Product', nutriments: {} }],
      }),
    });

    await searchOFF('off-search-cache-001');  // populate
    mockFetch.mockClear();
    await searchOFF('off-search-cache-001');  // should use cache

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('query is normalised to lowercase before caching', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        products: [{ code: 'lc1', product_name: 'Lowercase Test', nutriments: {} }],
      }),
    });

    await searchOFF('OFF-LOWER-TEST-001');  // populate with uppercase
    mockFetch.mockClear();
    await searchOFF('off-lower-test-001');  // same key after lowercase normalisation

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
