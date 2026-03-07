import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Trainer } from '@/types';

export type UserRole = 'trainer' | 'client' | null;

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  trainer: Trainer | null;
  role: UserRole;
  clientId: string | null;  // populated when role === 'client'
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && s) {
        detectRole(s.user.id);
      } else if (!s) {
        setTrainer(null);
        setRole(null);
        setClientId(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function detectRole(userId: string) {
    setLoading(true);

    // 1. Check if user is a trainer
    const { data: trainerData } = await supabase
      .from('trainers')
      .select('id, full_name, email, avatar_url, created_at')
      .eq('id', userId)
      .single();

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
      .single();

    if (clientData) {
      setTrainer(null);
      setRole('client');
      setClientId(clientData.id);
      setLoading(false);
      return;
    }

    // 3. Recovery: client exists in auth but auth_user_id was never written (e.g. signup race
    //    condition when email confirmation is disabled). Find by email and auto-link.
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { data: clientByEmail } = await supabase
        .from('clients')
        .select('id')
        .eq('email', user.email)
        .is('auth_user_id', null)
        .single();

      if (clientByEmail) {
        await supabase
          .from('clients')
          .update({ auth_user_id: userId })
          .eq('id', clientByEmail.id);
        setTrainer(null);
        setRole('client');
        setClientId(clientByEmail.id);
        setLoading(false);
        return;
      }
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
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, trainer, role, clientId, loading, signIn, signOut }}
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
