import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Trainer } from '@/types';

/** Client row used as the public demo for guest sessions. */
export const GUEST_CLIENT_ID = 'df9f2ee4-4b84-4d52-bda2-3bc562a9011c';

export type UserRole = 'trainer' | 'client' | null;

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  trainer: Trainer | null;
  role: UserRole;
  clientId: string | null;  // populated when role === 'client'
  loading: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && s) {
        detectRole(s.user.id);
      } else if (!s) {
        setTrainer(null);
        setRole(null);
        setClientId(null);
        setIsGuest(false);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function detectRole(userId: string) {
    setLoading(true);

    // 0. Anonymous (guest) session — read-only view using the demo client
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.is_anonymous) {
      setIsGuest(true);
      setRole('client');
      setTrainer(null);
      setClientId(GUEST_CLIENT_ID);
      setLoading(false);
      return;
    }

    // 1. Check if user is a trainer
    const { data: trainerData } = await supabase
      .from('trainers')
      .select('id, full_name, email, avatar_url, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (trainerData) {
      setTrainer(trainerData);
      setRole('trainer');
      setClientId(null);
      setLoading(false);
      return;
    }

    // 2. Check if user is a client
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (clientData) {
      setTrainer(null);
      setRole('client');
      setClientId(clientData.id);
      setLoading(false);
      return;
    }

    // 3. Recovery: client exists in auth but auth_user_id was never written (e.g. signup race
    //    condition when email confirmation is disabled). Use the SECURITY DEFINER RPC to link —
    //    a direct UPDATE would fail RLS because auth.uid() = auth_user_id is false when NULL.
    const { data: linkedId } = await supabase.rpc('link_client_to_auth_user');
    if (linkedId) {
      setTrainer(null);
      setRole('client');
      setClientId(linkedId);
      setLoading(false);
      return;
    }

    // 4. Neither — sign out and clear state
    await supabase.auth.signOut();
    setTrainer(null);
    setRole(null);
    setClientId(null);
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    setIsGuest(false);
    await supabase.auth.signOut();
  }

  async function continueAsGuest() {
    setLoading(true);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      // Fallback: local guest state without a session (no read access to DB)
      setIsGuest(true);
      setRole('client');
      setTrainer(null);
      setClientId(GUEST_CLIENT_ID);
      setLoading(false);
    }
    // On success, onAuthStateChange fires → detectRole detects is_anonymous → sets guest state
  }

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, trainer, role, clientId, loading, isGuest, signIn, signOut, continueAsGuest }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
