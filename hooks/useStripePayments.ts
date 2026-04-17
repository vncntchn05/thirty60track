import { useCallback, useState } from 'react';
import {
  initiateCreditPurchase,
  openCheckoutUrl,
  checkSessionStatus,
  STRIPE_PAYMENTS_ENABLED,
  type CreditPackage,
} from '@/lib/stripe';

type PurchaseState = 'idle' | 'creating' | 'redirecting' | 'checking' | 'success' | 'error';

/**
 * Hook that manages the full Stripe credit-purchase lifecycle for a client.
 *
 * Usage:
 *   const { purchase, state, lastSessionId, error, reset } = useCreditPurchase(clientId);
 *   await purchase(CREDIT_PACKAGES[1]);
 */
export function useCreditPurchase(clientId: string) {
  const [state, setState]               = useState<PurchaseState>('idle');
  const [error, setError]               = useState<string | null>(null);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [fulfilledCredits, setFulfilledCredits] = useState<number | null>(null);

  /** Start a purchase for the given package. */
  const purchase = useCallback(async (pkg: CreditPackage): Promise<boolean> => {
    if (!STRIPE_PAYMENTS_ENABLED) {
      setError('Payments are not yet enabled.');
      setState('error');
      return false;
    }

    setState('creating');
    setError(null);
    setFulfilledCredits(null);

    const result = await initiateCreditPurchase(clientId, pkg);
    if (!result.ok) {
      setError(result.error);
      setState('error');
      return false;
    }

    setLastSessionId(result.session_id);
    setState('redirecting');
    await openCheckoutUrl(result.checkout_url);
    return true;
  }, [clientId]);

  /**
   * Poll the Edge Function to verify payment after the user returns from Stripe.
   * Call this from a deep-link handler or from a "Check payment status" button.
   */
  const verifyReturn = useCallback(async (sessionId?: string): Promise<boolean> => {
    const sid = sessionId ?? lastSessionId;
    if (!sid) return false;

    setState('checking');
    const { status, credits } = await checkSessionStatus(sid);

    if (status === 'completed') {
      setFulfilledCredits(credits ?? null);
      setState('success');
      return true;
    }
    if (status === 'expired') {
      setError('This payment session has expired. Please try again.');
      setState('error');
    } else {
      setState('idle');
    }
    return false;
  }, [lastSessionId]);

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
    setLastSessionId(null);
    setFulfilledCredits(null);
  }, []);

  return {
    purchase,
    verifyReturn,
    reset,
    state,
    error,
    lastSessionId,
    fulfilledCredits,
    isLoading: state === 'creating' || state === 'redirecting' || state === 'checking',
  };
}
