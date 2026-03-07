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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const t = useTheme();
  // Role toggle is UI-only — actual role is inferred from DB after sign-in
  const [roleTab, setRoleTab] = useState<'trainer' | 'client'>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setError(null);
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    const { error: authError } = await signIn(email.trim(), password);
    if (authError) setError(authError);
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: t.background }]}
    >
      <View style={styles.inner}>
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
            onPress={() => setRoleTab('client')}
          >
            <Text style={[styles.roleTabText, { color: roleTab === 'client' ? colors.textInverse : t.textSecondary }]}>
              I'm a Client
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleTab, roleTab === 'trainer' && styles.roleTabActive]}
            onPress={() => setRoleTab('trainer')}
          >
            <Text style={[styles.roleTabText, { color: roleTab === 'trainer' ? colors.textInverse : t.textSecondary }]}>
              I'm a Trainer
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.subtitle, { color: t.textSecondary }]}>Sign In</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
          onSubmitEditing={handleSignIn}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/signup' as never)} style={styles.toggleRow}>
          <Text style={[styles.toggleText, { color: t.textSecondary }]}>
            {"Don't have an account? "}
            <Text style={styles.toggleLink}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.md },
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
});
