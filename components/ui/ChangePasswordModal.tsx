import { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

type Props = {
  visible: boolean;
  email: string;
  onClose: () => void;
};

export function ChangePasswordModal({ visible, email, onClose }: Props) {
  const t = useTheme();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
    setDone(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    setError(null);
    if (!current) { setError('Current password is required.'); return; }
    if (!next) { setError('New password is required.'); return; }
    if (next.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (next !== confirm) { setError('Passwords do not match.'); return; }
    if (next === current) { setError('New password must differ from current password.'); return; }

    setLoading(true);

    // Verify current password
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: current });
    if (signInErr) {
      setLoading(false);
      setError('Current password is incorrect.');
      return;
    }

    // Update to new password
    const { error: updateErr } = await supabase.auth.updateUser({ password: next });
    setLoading(false);
    if (updateErr) { setError(updateErr.message); return; }

    setDone(true);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: t.background }]}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.title, { color: t.textPrimary }]}>Change Password</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={[styles.cancel, { color: colors.primary }]}>
                {done ? 'Done' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>

          {done ? (
            <View style={styles.successBox}>
              <Text style={[styles.successText, { color: t.textPrimary }]}>Password updated successfully.</Text>
            </View>
          ) : (
            <>
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Text style={[styles.label, { color: t.textSecondary }]}>Current password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: t.surface, borderColor: t.border, color: t.textPrimary }]}
                placeholder="Enter current password"
                placeholderTextColor={t.textSecondary}
                secureTextEntry
                value={current}
                onChangeText={setCurrent}
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: t.textSecondary }]}>New password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: t.surface, borderColor: t.border, color: t.textPrimary }]}
                placeholder="At least 6 characters"
                placeholderTextColor={t.textSecondary}
                secureTextEntry
                value={next}
                onChangeText={setNext}
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: t.textSecondary }]}>Confirm new password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: t.surface, borderColor: t.border, color: t.textPrimary }]}
                placeholder="Repeat new password"
                placeholderTextColor={t.textSecondary}
                secureTextEntry
                value={confirm}
                onChangeText={setConfirm}
                autoCapitalize="none"
                onSubmitEditing={handleSubmit}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={colors.textInverse} />
                  : <Text style={styles.buttonText}>Update Password</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.sm },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.lg,
  },
  title: { ...typography.heading3 },
  cancel: { ...typography.body, fontWeight: '600' },
  label: { ...typography.bodySmall, marginTop: spacing.sm },
  input: {
    borderWidth: 1, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4,
    ...typography.body,
  },
  error: { ...typography.bodySmall, color: colors.error, textAlign: 'center' },
  button: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...typography.body, fontWeight: '600', color: colors.textInverse },
  successBox: { alignItems: 'center', paddingVertical: spacing.xxl },
  successText: { ...typography.body, fontWeight: '600' },
});
