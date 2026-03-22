/**
 * Unit tests for lib/auth.tsx
 *
 * detectRole() is an internal function inside AuthProvider, so we test it
 * indirectly by:
 *   1. Rendering AuthProvider with a renderHook wrapper
 *   2. Capturing the onAuthStateChange callback
 *   3. Firing the callback with a mocked session
 *   4. Waiting for async state to settle (waitFor)
 *   5. Asserting the role/trainer/clientId state via useAuth()
 */
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { createQueryMock } from '../helpers/supabase-mock';

// ─── Module mock ──────────────────────────────────────────────────────────────
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TRAINER_ROW = {
  id: 'trainer-uid',
  full_name: 'Test Trainer',
  email: 'trainer@test.com',
  avatar_url: null,
  created_at: '2024-01-01',
};

const FAKE_SESSION = {
  user: { id: 'trainer-uid', email: 'trainer@test.com' },
  access_token: 'tok',
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

let authStateCallback: (event: string, session: unknown) => void;

beforeEach(() => {
  jest.clearAllMocks();

  // Capture the auth state change callback every time the hook sets it up
  (mockSupabase.auth.onAuthStateChange as jest.Mock).mockImplementation((cb) => {
    authStateCallback = cb;
    return { data: { subscription: { unsubscribe: jest.fn() } } };
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('detectRole — trainer path', () => {
  it('sets role to "trainer" and populates trainer object when trainer row exists', async () => {
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'trainers') return createQueryMock({ data: TRAINER_ROW });
      return createQueryMock({ data: null });
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      authStateCallback('INITIAL_SESSION', FAKE_SESSION);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.role).toBe('trainer');
    expect(result.current.trainer?.full_name).toBe('Test Trainer');
    expect(result.current.clientId).toBeNull();
  });
});

describe('detectRole — client path', () => {
  it('sets role to "client" when client row found by auth_user_id', async () => {
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'trainers') return createQueryMock({ data: null });
      if (table === 'clients') return createQueryMock({ data: { id: 'client-42' } });
      return createQueryMock({ data: null });
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      authStateCallback('INITIAL_SESSION', FAKE_SESSION);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.role).toBe('client');
    expect(result.current.clientId).toBe('client-42');
    expect(result.current.trainer).toBeNull();
  });
});

describe('detectRole — auto-link recovery path', () => {
  it('links auth_user_id via RPC and sets role to "client"', async () => {
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'trainers') return createQueryMock({ data: null });
      if (table === 'clients') return createQueryMock({ data: null }); // auth_user_id lookup misses
      return createQueryMock({ data: null });
    });
    (mockSupabase.rpc as jest.Mock).mockResolvedValue({ data: 'client-99', error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      authStateCallback('INITIAL_SESSION', { user: { id: 'new-uid', email: 'client@test.com' } });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.role).toBe('client');
    expect(result.current.clientId).toBe('client-99');
  });
});

describe('detectRole — neither role found', () => {
  it('calls signOut when the user exists in auth but has no trainer or client row', async () => {
    (mockSupabase.from as jest.Mock).mockImplementation(() =>
      createQueryMock({ data: null }),
    );
    (mockSupabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      authStateCallback('INITIAL_SESSION', { user: { id: 'orphan-uid', email: 'nobody@test.com' } });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(result.current.role).toBeNull();
    expect(result.current.trainer).toBeNull();
    expect(result.current.clientId).toBeNull();
  });
});

describe('detectRole — signed out session', () => {
  it('clears state when session becomes null', async () => {
    // First sign in as trainer
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'trainers') return createQueryMock({ data: TRAINER_ROW });
      return createQueryMock({ data: null });
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      authStateCallback('INITIAL_SESSION', FAKE_SESSION);
    });
    await waitFor(() => expect(result.current.role).toBe('trainer'));

    // Now sign out
    await act(async () => {
      authStateCallback('SIGNED_OUT', null);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.role).toBeNull();
    expect(result.current.trainer).toBeNull();
    expect(result.current.clientId).toBeNull();
  });
});

describe('signIn', () => {
  it('returns null error on success', async () => {
    (mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ error: null });
    (mockSupabase.from as jest.Mock).mockImplementation(() => createQueryMock({ data: null }));

    const { result } = renderHook(() => useAuth(), { wrapper });

    let signInResult: { error: string | null } | undefined;
    await act(async () => {
      signInResult = await result.current.signIn('test@test.com', 'password');
    });

    expect(signInResult?.error).toBeNull();
  });

  it('returns error message on failure', async () => {
    (mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });
    (mockSupabase.from as jest.Mock).mockImplementation(() => createQueryMock({ data: null }));

    const { result } = renderHook(() => useAuth(), { wrapper });

    let signInResult: { error: string | null } | undefined;
    await act(async () => {
      signInResult = await result.current.signIn('bad@test.com', 'wrong');
    });

    expect(signInResult?.error).toBe('Invalid login credentials');
  });
});
