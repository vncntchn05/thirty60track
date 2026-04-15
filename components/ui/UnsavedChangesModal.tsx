import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

type Props = {
  visible: boolean;
  /** Label for the affirmative save button (e.g. "Save Workout", "Save Changes") */
  saveLabel?: string;
  onDiscard: () => void;
  onSave: () => void;
  onKeepEditing: () => void;
};

export function UnsavedChangesModal({
  visible,
  saveLabel = 'Save',
  onDiscard,
  onSave,
  onKeepEditing,
}: Props) {
  const t = useTheme();

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onKeepEditing}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[styles.header, { borderBottomColor: t.border }]}>
            <Ionicons name="alert-circle-outline" size={22} color={colors.warning} />
            <Text style={[styles.title, { color: t.textPrimary }]}>Unsaved Changes</Text>
          </View>
          <Text style={[styles.body, { color: t.textSecondary }]}>
            You have unsaved changes. What would you like to do?
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.discardBtn, { borderColor: colors.error }]}
              onPress={onDiscard}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, { color: colors.error }]}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.saveBtn]}
              onPress={onSave}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, { color: colors.textInverse }]}>{saveLabel}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.keepEditing} onPress={onKeepEditing} activeOpacity={0.7}>
            <Text style={[styles.keepEditingText, { color: t.textSecondary }]}>Keep Editing</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.lg,
  },
  card: {
    width: '100%', borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { ...typography.body, fontWeight: '700' },
  body: { ...typography.body, padding: spacing.md, paddingBottom: spacing.sm },
  actions: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingTop: spacing.xs,
  },
  btn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md,
    alignItems: 'center', borderWidth: 1,
  },
  discardBtn: { backgroundColor: 'transparent' },
  saveBtn: { backgroundColor: colors.primary, borderColor: colors.primary },
  btnText: { ...typography.body, fontWeight: '600' },
  keepEditing: {
    alignItems: 'center', paddingVertical: spacing.md,
  },
  keepEditingText: { ...typography.bodySmall, fontWeight: '500' },
});
