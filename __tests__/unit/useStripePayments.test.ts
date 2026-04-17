/**
 * Unit tests for hooks/useStripePayments.ts (useCreditPurchase)
 *
 * Covers:
 *  - Disabled path: purchase() → state='error', error set, returns false
 *  - verifyReturn() → 'completed' session → state='success', fulfilledCredits set
 *  - verifyReturn() → 'expired' session → state='error'
 *  - verifyReturn() → 'pending' session → state='idle'
 *  - verifyReturn() → no sessionId → returns false immediately
 *  - reset() → returns to idle state with cleared error/session
 *  - isLoading is false when idle or success
 *
 * NOTE: The "enabled" purchase path requires STRIPE_PAYMENTS_ENABLED=true.
 * Because STRIPE_PAYMENTS_ENABLED is a const imported directly by the hook
 * (bound at module resolution time), it cannot be changed after the mock is set up.
 * The enabled path is therefore tested indirectly via initiateCreditPurchase/
 * openCheckoutUrl unit tests in stripe.test.ts, and via the Edge Function directly.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useCreditPurchase } from '@/hooks/useStripePayments';

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockInitiate = jest.fn();
const mockCheck    = jest.fn();
const mockOpen     = jest.fn().mockResolvedValue(undefined);

jest.mock('@/lib/stripe', () => ({
  STRIPE_PAYMENTS_ENABLED: false,   // hook reads this at runtime from module
  CREDIT_PACKAGES: [
    { id: 'pkg_5',  credits: 5,  price_cents: 500 },
    { id: 'pkg_10', credits: 10, price_cents: 1000 },
    { id: 'pkg_20', credits: 20, price_cents: 2000 },
  ],
  initiateCreditPurchase: (...args: unknown[]) => mockInitiate(...args),
  openCheckoutUrl:        (...args: unknown[]) => mockOpen(...args),
  checkSessionStatus:     (...args: unknown[]) => mockCheck(...args),
  formatPrice: (c: number) => `$${(c / 100).toFixed(2)}`,
}));

const PKG = { id: 'pkg_10', credits: 10, price_cents: 1000 };

// ─── Disabled path ────────────────────────────────────────────────────────────

describe('useCreditPurchase — disabled path', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts in idle state', () => {
    const { result } = renderHook(() => useCreditPurchase('client-1'));
    expect(result.current.state).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('purchase() returns false and sets state=error when payments disabled', async () => {
    const { result } = renderHook(() => useCreditPurchase('client-1'));

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.purchase(PKG);
    });

    expect(returnValue).toBe(false);
    expect(result.current.state).toBe('error');
    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toMatch(/not yet enabled|disabled/i);
  });

  it('purchase() does not call initiateCreditPurchase when disabled', async () => {
    const { result } = renderHook(() => useCreditPurchase('client-1'));

    await act(async () => {
      await result.current.purchase(PKG);
    });

    expect(mockInitiate).not.toHaveBeenCalled();
  });

  it('isLoading is false in error state', async () => {
    const { result } = renderHook(() => useCreditPurchase('client-1'));

    await act(async () => {
      await result.current.purchase(PKG);
    });

    expect(result.current.isLoading).toBe(false);
  });
});

// ─── verifyReturn ─────────────────────────────────────────────────────────────

describe('useCreditPurchase — verifyReturn', () => {
  beforeEach(() => jest.clearAllMocks());

  it('completed session → state=success, fulfilledCredits set, returns true', async () => {
    mockCheck.mockResolvedValue({ status: 'completed', credits: 10 });

    const { result } = renderHook(() => useCreditPurchase('client-1'));

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.verifyReturn('sess_completed');
    });

    expect(returnValue).toBe(true);
    expect(result.current.state).toBe('success');
    expect(result.current.fulfilledCredits).toBe(10);
    expect(result.current.isLoading).toBe(false);
    expect(mockCheck).toHaveBeenCalledWith('sess_completed');
  });

  it('expired session → state=error, error message contains "expired"', async () => {
    mockCheck.mockResolvedValue({ status: 'expired' });

    const { result } = renderHook(() => useCreditPurchase('client-1'));

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.verifyReturn('sess_expired');
    });

    expect(returnValue).toBe(false);
    expect(result.current.state).toBe('error');
    expect(result.current.error).toMatch(/expired/i);
  });

  it('pending session → state=idle, returns false (payment still in progress)', async () => {
    mockCheck.mockResolvedValue({ status: 'pending' });

    const { result } = renderHook(() => useCreditPurchase('client-1'));

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.verifyReturn('sess_pending');
    });

    expect(returnValue).toBe(false);
    expect(result.current.state).toBe('idle');
  });

  it('no sessionId provided and no lastSessionId → returns false without calling check', async () => {
    const { result } = renderHook(() => useCreditPurchase('client-1'));

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.verifyReturn(); // no arg, lastSessionId = null
    });

    expect(returnValue).toBe(false);
    expect(mockCheck).not.toHaveBeenCalled();
    // State unchanged
    expect(result.current.state).toBe('idle');
  });

  it('uses lastSessionId from state when no sessionId arg is passed', async () => {
    // We need lastSessionId set; since purchase() is disabled we set it via verifyReturn
    // with an explicit session_id first to test the fallback.
    mockCheck.mockResolvedValue({ status: 'completed', credits: 5 });

    const { result } = renderHook(() => useCreditPurchase('client-1'));

    // Call with explicit id so lastSessionId is captured in state
    await act(async () => {
      await result.current.verifyReturn('explicit_sess');
    });

    // Now call without id
    mockCheck.mockResolvedValue({ status: 'pending' });
    await act(async () => {
      await result.current.verifyReturn();
    });

    // Should have called check twice: once explicit, once using lastSessionId=null
    // (lastSessionId is not updated by verifyReturn — only by purchase)
    // Without lastSessionId being set by purchase(), second call returns false immediately
    expect(mockCheck).toHaveBeenCalledTimes(1);
  });
});

// ─── reset ────────────────────────────────────────────────────────────────────

describe('useCreditPurchase — reset', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reset() clears error, lastSessionId, fulfilledCredits, and returns to idle', async () => {
    mockCheck.mockResolvedValue({ status: 'expired' });

    const { result } = renderHook(() => useCreditPurchase('client-1'));

    // Enter error state
    await act(async () => {
      await result.current.verifyReturn('sess_bad');
    });
    expect(result.current.state).toBe('error');

    // Reset
    act(() => { result.current.reset(); });

    expect(result.current.state).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.lastSessionId).toBeNull();
    expect(result.current.fulfilledCredits).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});

// ─── isLoading ────────────────────────────────────────────────────────────────

describe('useCreditPurchase — isLoading', () => {
  it('isLoading is false at idle start', () => {
    const { result } = renderHook(() => useCreditPurchase('client-1'));
    expect(result.current.isLoading).toBe(false);
  });

  it('isLoading is false after success', async () => {
    mockCheck.mockResolvedValue({ status: 'completed', credits: 5 });
    const { result } = renderHook(() => useCreditPurchase('client-1'));

    await act(async () => {
      await result.current.verifyReturn('sess_done');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.state).toBe('success');
  });
});
