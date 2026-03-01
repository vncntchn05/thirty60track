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
} from 'react-native';
import { useAuth } from '@/lib/auth';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const t = useTheme();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!email || !password) { setError('Email and password are required.'); return; }
    if (mode === 'signup' && !fullName.trim()) { setError('Full name is required.'); return; }
    setLoading(true);
    if (mode === 'signin') {
      const { error: authError } = await signIn(email.trim(), password);
      if (authError) setError(authError);
    } else {
      const { error: authError } = await signUp(email.trim(), password, fullName.trim());
      if (authError) setError(authError);
    }
    setLoading(false);
  }

  function toggleMode() {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError(null);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: t.background }]}
    >
      <View style={styles.inner}>
        <Text style={styles.appName}>thirty60track</Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          {mode === 'signin' ? 'Trainer Login' : 'Create Account'}
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {mode === 'signup' && (
          <TextInput
            style={[styles.input, { backgroundColor: t.surface, borderColor: t.border, color: t.textPrimary }]}
            placeholder="Full name"
            placeholderTextColor={t.textSecondary}
            autoCapitalize="words"
            value={fullName}
            onChangeText={setFullName}
          />
        )}

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
          onSubmitEditing={handleSubmit}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.buttonText}>
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleMode} style={styles.toggleRow}>
          <Text style={[styles.toggleText, { color: t.textSecondary }]}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <Text style={styles.toggleLink}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.md },
  appName: { ...typography.heading1, color: colors.primary, textAlign: 'center' },
  subtitle: { ...typography.body, textAlign: 'center', marginBottom: spacing.md },
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
});
