import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useClient } from '@/hooks/useClients';
import { useClientIntake } from '@/hooks/useClientIntake';
import { useNutritionGuide } from '@/hooks/useNutritionGuide';
import { NutritionChat } from '@/components/nutrition/NutritionChat';
import { colors, useTheme } from '@/constants/theme';

export default function AIChatScreen() {
  const t = useTheme();
  const { clientId, role } = useAuth();

  const { client, loading: clientLoading } = useClient(clientId ?? '');
  const { intake } = useClientIntake(clientId ?? '');
  const { guide } = useNutritionGuide(clientId ?? '');

  const isClient  = role === 'client';
  const isTrainer = role === 'trainer';

  if (clientLoading || !client) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'AI Assistant' }} />
      <NutritionChat
        clientId={client.id}
        client={client}
        intake={intake ?? null}
        guide={guide?.content ?? null}
        isClient={isClient}
        isTrainer={isTrainer}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
