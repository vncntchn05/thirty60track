/**
 * Stripe payments utility.
 *
 * Set STRIPE_PAYMENTS_ENABLED = true and deploy the `stripe-checkout`
 * Supabase Edge Function with STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET
 * secrets to activate live payments.
 *
 * While disabled, no API calls are made and the UI renders a "coming soon" state.
 *
 * Required env vars (Supabase Edge Function secrets):
 *   STRIPE_SECRET_KEY        — sk_live_... or sk_test_...
 *   STRIPE_WEBHOOK_SECRET    — whsec_... (from Stripe Dashboard → Webhooks)
 *   APP_URL                  — e.g. https://thirty60track.onrender.com (return URL base)
 *
 * Required env var (Expo bundle, optional — used for deep-link return on native):
 *   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY — pk_live_... or pk_test_...
 */

import { Linking, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// ─── Feature flag ─────────────────────────────────────────────

/**
 * Master toggle for Stripe credit purchases.
 * Flip to `true` once the `stripe-checkout` Edge Function is deployed.
 */
export const STRIPE_PAYMENTS_ENABLED = false;

// ─── Pricing ──────────────────────────────────────────────────

/** Price in US cents per credit ($1.00 USD). */
export const PRICE_PER_CREDIT_CENTS = 100;

export type CreditPackage = {
  id: string;
  credits: number;
  price_cents: number;
};

/** Available purchase packages. All priced at $1/credit. */
export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'pkg_5',  credits: 5,  price_cents: 500  },
  { id: 'pkg_10', credits: 10, price_cents: 1000 },
  { id: 'pkg_20', credits: 20, price_cents: 2000 },
];

/** Format a cent amount as a USD price string, e.g. 500 → "$5.00". */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ─── Purchase flow ────────────────────────────────────────────

export type InitiatePurchaseResult =
  | { ok: true;  checkout_url: string; session_id: string }
  | { ok: false; error: string };

/**
 * Request a Stripe Checkout Session URL from the Edge Function.
 * Returns the hosted payment URL and the session ID (for status polling).
 */
export async function initiateCreditPurchase(
  clientId: string,
  pkg: CreditPackage,
): Promise<InitiatePurchaseResult> {
  if (!STRIPE_PAYMENTS_ENABLED) {
    return { ok: false, error: 'Payments are not yet enabled.' };
  }

  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: {
      action:      'create_session',
      client_id:   clientId,
      credits:     pkg.credits,
      amount_cents: pkg.price_cents,
      package_id:  pkg.id,
    },
  });

  if (error || !data?.checkout_url) {
    return { ok: false, error: error?.message ?? 'Failed to create checkout session.' };
  }

  return { ok: true, checkout_url: data.checkout_url, session_id: data.session_id };
}

/**
 * Open the Stripe Checkout URL.
 * Web: navigate in the same tab (Stripe redirects back to APP_URL).
 * Native: open in the device browser (deep-link return needs EXPO_PUBLIC_APP_URL).
 */
export async function openCheckoutUrl(url: string): Promise<void> {
  if (Platform.OS === 'web') {
    // Stripe will redirect back to success_url / cancel_url after payment
    window.location.href = url;
  } else {
    await Linking.openURL(url);
  }
}

/**
 * Poll the Edge Function to check whether a Stripe session was paid.
 * Call this when the user returns to the app after checkout.
 */
export async function checkSessionStatus(
  sessionId: string,
): Promise<{ status: 'completed' | 'pending' | 'expired'; credits?: number }> {
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: { action: 'check_session', session_id: sessionId },
  });

  if (error || !data) return { status: 'pending' };
  return { status: data.status ?? 'pending', credits: data.credits };
}
