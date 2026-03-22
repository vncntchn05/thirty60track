import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

const GYM_ACCESS_CODE = 'thirty60fitness2026';

export default function SignupScreen() {
  const router = useRouter();
  const t = useTheme();
  const [roleTab, setRoleTab] = useState<'trainer' | 'client'>('client');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Call the SECURITY DEFINER RPC to write auth_user_id on the client row,
  // then sign out and back in so detectRole runs cleanly with the link in place.
  async function linkClientAndEnter(emailAddr: string, pwd: string) {
    // First verify a client row exists for this email (gives a useful error if not)
    const { data: clientRow } = await supabase
      .from('clients')
      .select('id, auth_user_id')
      .eq('email', emailAddr)
      .single();

    if (!clientRow) {
      await supabase.auth.signOut();
      setError('No client account found for this email. Ask your trainer to add you first.');
      return;
    }

    if (clientRow.auth_user_id) {
      // Already linked — just re-enter (detectRole will handle it on sign-in)
      await supabase.auth.signOut();
      await supabase.auth.signInWithPassword({ email: emailAddr, password: pwd });
      return;
    }

    // Use SECURITY DEFINER RPC to bypass the RLS catch-22:
    // auth.uid() = auth_user_id is always false when auth_user_id IS NULL.
    const { data: linkedId, error: rpcErr } = await supabase.rpc('link_client_to_auth_user');

    if (rpcErr || !linkedId) {
      await supabase.auth.signOut();
      setError('Failed to link your account. Please try again.');
      return;
    }

    await supabase.auth.signOut();
    await supabase.auth.signInWithPassword({ email: emailAddr, password: pwd });
  }

  async function handleSignUp() {
    setError(null);

    if (!fullName.trim()) { setError('Full name is required.'); return; }
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!password) { setError('Password is required.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    if (roleTab === 'trainer') {
      // Client-side access code validation — lightweight deterrent only
      if (accessCode !== GYM_ACCESS_CODE) {
        setError('Incorrect access code. Contact the gym.');
        return;
      }
    }

    setLoading(true);

    if (roleTab === 'trainer') {
      const { data, error: authErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim(), role: 'trainer' } },
      });
      if (authErr) {
        setError(formatSignUpError(authErr.message));
        setLoading(false);
        return;
      }
      if (data.user?.identities?.length === 0) {
        setError('An account with this email already exists. Please sign in instead.');
        setLoading(false);
        return;
      }
      // If email confirmation is disabled, session is returned immediately
      if (data.session) return; // auth listener will navigate
      setConfirmed(true);
    } else {
      // Client signup: sign up then link to existing client row
      const { data, error: authErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim(), role: 'client' } },
      });

      // Detect "user already exists" — either as an error (email confirm OFF) or
      // as a silent fake-success with empty identities (email confirm ON).
      const alreadyExists =
        (authErr && (authErr.message.toLowerCase().includes('already registered') ||
                     authErr.message.toLowerCase().includes('user already exists'))) ||
        (!authErr && data.user?.identities?.length === 0);

      if (alreadyExists) {
        // The auth user exists from a previous (possibly invisible) signup attempt.
        // Try signing in with the password they just entered — if that works, complete linking.
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(), password,
        });

        if (signInErr || !signInData.user) {
          // Wrong password or unconfirmed — they genuinely have no usable credentials.
          // Send a reset link so they can set a password and come back to sign in.
          await supabase.auth.resetPasswordForEmail(email.trim());
          setError(
            "An account already exists for this email. We've sent you a link to set your password — check your inbox, then sign in."
          );
          setLoading(false);
          return;
        }

        // Signed in successfully — link and enter
        await linkClientAndEnter(email.trim(), password);
        setLoading(false);
        return;
      }

      if (authErr) {
        setError(formatSignUpError(authErr.message));
        setLoading(false);
        return;
      }

      if (data.user) {
        await linkClientAndEnter(email.trim(), password);
      } else {
        setConfirmed(true);
      }
    }

    setLoading(false);
  }

  function formatSignUpError(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes('already registered') || lower.includes('user already exists')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (lower.includes('rate limit') || lower.includes('email rate') || lower.includes('over_email_send_rate_limit')) {
      return 'Too many signup attempts — Supabase has temporarily limited confirmation emails. Please wait a few minutes and try again.';
    }
    return message;
  }

  if (confirmed) {
    return (
      <View style={[styles.container, { backgroundColor: t.background }]}>
        <View style={styles.inner}>
          <Image
            source={require('../../assets/Thirty60_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={[styles.confirmBanner, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.confirmTitle, { color: t.textPrimary }]}>Account created!</Text>
            <Text style={[styles.confirmText, { color: t.textSecondary }]}>
              Check your email to confirm your account, then sign in.
            </Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.buttonText}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: t.background }]}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Image
          source={require('../../assets/Thirty60_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>thirty60track</Text>

        {/* Trainer / Client toggle */}
        <View style={[styles.roleToggle, { backgroundColor: t.surface, borderColor: t.border }]}>
          <TouchableOpacity
            style={[styles.roleTab, roleTab === 'client' && styles.roleTabActive]}
            onPress={() => { setRoleTab('client'); setError(null); }}
          >
            <Text style={[styles.roleTabText, { color: roleTab === 'client' ? colors.textInverse : t.textSecondary }]}>
              I'm a Client
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleTab, roleTab === 'trainer' && styles.roleTabActive]}
            onPress={() => { setRoleTab('trainer'); setError(null); }}
          >
            <Text style={[styles.roleTabText, { color: roleTab === 'trainer' ? colors.textInverse : t.textSecondary }]}>
              I'm a Trainer
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.subtitle, { color: t.textSecondary }]}>Create Account</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          style={[styles.input, { backgroundColor: t.surface, borderColor: t.border, color: t.textPrimary }]}
          placeholder="Full name"
          placeholderTextColor={t.textSecondary}
          autoCapitalize="words"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={[styles.input, { backgroundColor: t.surface, borderColor: t.border, color: t.textPrimary }]}
          placeholder="Email"
          placeholderTextColor={t.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.input, { backgroundColor: t.surface, borderColor: t.border, color: t.textPrimary }]}
          placeholder="Password"
          placeholderTextColor={t.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={[styles.input, { backgroundColor: t.surface, borderColor: t.border, color: t.textPrimary }]}
          placeholder="Confirm password"
          placeholderTextColor={t.textSecondary}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {roleTab === 'trainer' && (
          <TextInput
            style={[styles.input, { backgroundColor: t.surface, borderColor: t.border, color: t.textPrimary }]}
            placeholder="Gym Access Code"
            placeholderTextColor={t.textSecondary}
            secureTextEntry
            value={accessCode}
            onChangeText={setAccessCode}
          />
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.toggleRow}>
          <Text style={[styles.toggleText, { color: t.textSecondary }]}>
            {'Already have an account? '}
            <Text style={styles.toggleLink}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, gap: spacing.md },
  logo: { width: 96, height: 96, alignSelf: 'center', marginBottom: spacing.sm },
  appName: { ...typography.heading1, color: colors.primary, textAlign: 'center' },
  roleToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  roleTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.full,
  },
  roleTabActive: { backgroundColor: colors.primary },
  roleTabText: { ...typography.bodySmall, fontWeight: '600' },
  subtitle: { ...typography.body, textAlign: 'center', marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    ...typography.body,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...typography.body, fontWeight: '600', color: colors.textInverse },
  errorText: { ...typography.bodySmall, color: colors.error, textAlign: 'center' },
  toggleRow: { alignItems: 'center', marginTop: spacing.xs },
  toggleText: { ...typography.bodySmall, textAlign: 'center' },
  toggleLink: { color: colors.primary, fontWeight: '600' },
  confirmBanner: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  confirmTitle: { ...typography.heading3 },
  confirmText: { ...typography.body, textAlign: 'center' },
});
