import { ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '@/lib/auth';
import ProgressSection from '@/components/charts/ProgressSection';
import { spacing, useTheme } from '@/constants/theme';

export default function ClientProgressScreen() {
  const t = useTheme();
  const { clientId } = useAuth();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={styles.content}
    >
      {clientId ? <ProgressSection clientId={clientId} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
});
