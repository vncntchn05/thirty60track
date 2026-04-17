/**
 * Unit tests for lib/stripe.ts
 *
 * Covers:
 *  - STRIPE_PAYMENTS_ENABLED feature flag (false in non-prod)
 *  - CREDIT_PACKAGES structure and pricing ($1/credit)
 *  - formatPrice() cent-to-USD formatting
 *  - initiateCreditPurchase() disabled path → {ok: false, error}
 *  - openCheckoutUrl() platform branching (web vs native)
 */

import {
  STRIPE_PAYMENTS_ENABLED,
  CREDIT_PACKAGES,
  PRICE_PER_CREDIT_CENTS,
  formatPrice,
  initiateCreditPurchase,
  openCheckoutUrl,
} from '@/lib/stripe';

// Mock supabase (not called when disabled, but module-level import requires it)
jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
    auth: { onAuthStateChange: jest.fn() },
  },
}));

// Mock react-native so Platform and Linking work in Jest
jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
  Linking: { openURL: jest.fn().mockResolvedValue(undefined) },
}));

// ─── Feature flag ─────────────────────────────────────────────────────────────

describe('STRIPE_PAYMENTS_ENABLED', () => {
  it('is false by default', () => {
    expect(STRIPE_PAYMENTS_ENABLED).toBe(false);
  });
});

// ─── CREDIT_PACKAGES ──────────────────────────────────────────────────────────

describe('CREDIT_PACKAGES', () => {
  it('contains exactly 3 packages', () => {
    expect(CREDIT_PACKAGES).toHaveLength(3);
  });

  it('packages are priced at $1 per credit', () => {
    CREDIT_PACKAGES.forEach((pkg) => {
      expect(pkg.price_cents).toBe(pkg.credits * PRICE_PER_CREDIT_CENTS);
    });
  });

  it('has pkg_5, pkg_10, pkg_20 IDs', () => {
    const ids = CREDIT_PACKAGES.map((p) => p.id);
    expect(ids).toContain('pkg_5');
    expect(ids).toContain('pkg_10');
    expect(ids).toContain('pkg_20');
  });

  it('packages are ordered by ascending credit count', () => {
    for (let i = 1; i < CREDIT_PACKAGES.length; i++) {
      expect(CREDIT_PACKAGES[i].credits).toBeGreaterThan(CREDIT_PACKAGES[i - 1].credits);
    }
  });

  it('PRICE_PER_CREDIT_CENTS is 100 ($1.00 USD)', () => {
    expect(PRICE_PER_CREDIT_CENTS).toBe(100);
  });
});

// ─── formatPrice ──────────────────────────────────────────────────────────────

describe('formatPrice', () => {
  it('formats 100 cents as "$1.00"', () => {
    expect(formatPrice(100)).toBe('$1.00');
  });

  it('formats 500 cents as "$5.00"', () => {
    expect(formatPrice(500)).toBe('$5.00');
  });

  it('formats 1000 cents as "$10.00"', () => {
    expect(formatPrice(1000)).toBe('$10.00');
  });

  it('formats 2000 cents as "$20.00"', () => {
    expect(formatPrice(2000)).toBe('$20.00');
  });

  it('formats 150 cents as "$1.50"', () => {
    expect(formatPrice(150)).toBe('$1.50');
  });

  it('formats 0 cents as "$0.00"', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('all CREDIT_PACKAGES format correctly', () => {
    expect(formatPrice(CREDIT_PACKAGES[0].price_cents)).toBe('$5.00');
    expect(formatPrice(CREDIT_PACKAGES[1].price_cents)).toBe('$10.00');
    expect(formatPrice(CREDIT_PACKAGES[2].price_cents)).toBe('$20.00');
  });
});

// ─── initiateCreditPurchase — disabled path ───────────────────────────────────

describe('initiateCreditPurchase — disabled', () => {
  it('returns {ok: false, error} without calling Edge Function', async () => {
    const { supabase } = require('@/lib/supabase');
    supabase.functions.invoke.mockClear();

    const result = await initiateCreditPurchase('client-123', CREDIT_PACKAGES[0]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe('string');
      expect(result.error.length).toBeGreaterThan(0);
    }
    // Should NOT have called the Edge Function
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('returns error message mentioning "not yet enabled" or similar', async () => {
    const result = await initiateCreditPurchase('client-456', CREDIT_PACKAGES[1]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not yet enabled|disabled|not enabled/i);
    }
  });
});

// ─── openCheckoutUrl — platform branching ────────────────────────────────────

describe('openCheckoutUrl — platform handling', () => {
  const { Platform, Linking } = require('react-native');

  beforeEach(() => {
    jest.clearAllMocks();
    delete (global as Record<string, unknown>).window;
  });

  it('uses window.location.href on web platform', async () => {
    Platform.OS = 'web';
    // Provide a window mock
    const mockWindow = { location: { href: '' } };
    (global as Record<string, unknown>).window = mockWindow;

    await openCheckoutUrl('https://checkout.stripe.com/test-session');

    expect(mockWindow.location.href).toBe('https://checkout.stripe.com/test-session');
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it('uses Linking.openURL on native platforms', async () => {
    Platform.OS = 'ios';

    await openCheckoutUrl('https://checkout.stripe.com/native-session');

    expect(Linking.openURL).toHaveBeenCalledWith('https://checkout.stripe.com/native-session');
  });
});
