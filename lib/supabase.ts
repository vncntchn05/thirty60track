import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env.local and fill in your project values.'
  );
}

async function fetchWithBackoff(
  input: RequestInfo | URL,
  init?: RequestInit,
  attempt = 0
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status === 503 && attempt < 3) {
    const delayMs = 1000 * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return fetchWithBackoff(input, init, attempt + 1);
  }
  return response;
}

const isWeb = Platform.OS === 'web';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isWeb ? localStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb,
  },
  global: { fetch: fetchWithBackoff },
});

// ─── CI/CD keep-alive ─────────────────────────────────────────────
// Pings the CI/CD database so Supabase doesn't pause it for inactivity.
// Called fire-and-forget on every production auth session restore/sign-in.
// Set EXPO_PUBLIC_CICD_SUPABASE_URL + EXPO_PUBLIC_CICD_SUPABASE_ANON_KEY
// in .env.local (or CI env) to enable; no-ops silently if unset.
const _cicdUrl = process.env.EXPO_PUBLIC_CICD_SUPABASE_URL;
const _cicdKey = process.env.EXPO_PUBLIC_CICD_SUPABASE_ANON_KEY;

export function pingCicdDatabase(): void {
  if (!_cicdUrl || !_cicdKey) return;
  fetch(`${_cicdUrl}/rest/v1/`, {
    headers: { apikey: _cicdKey, Authorization: `Bearer ${_cicdKey}` },
  }).catch(() => {});
}
