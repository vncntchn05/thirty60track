import { lazy, Suspense } from 'react';
import { ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/auth';
import { colors, spacing, useTheme } from '@/constants/theme';
import ReportCardButton from '@/components/client/ReportCardButton';

const ProgressSection = lazy(() => import('@/components/charts/ProgressSection'));

export default function ClientProgressScreen() {
  const t = useTheme();
  const { clientId } = useAuth();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={styles.content}
    >
      {clientId ? (
        <>
          <ReportCardButton clientId={clientId} />
          <Suspense fallback={<ActivityIndicator size="small" color={colors.primary} style={styles.loader} />}>
            <ProgressSection clientId={clientId} />
          </Suspense>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  loader: { marginVertical: spacing.md },
});
