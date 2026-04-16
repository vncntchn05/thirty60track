import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useClients } from '@/hooks/useClients';
import { TrainerAIChat } from '@/components/ai/TrainerAIChat';
import { colors, useTheme } from '@/constants/theme';

export default function TrainerAIChatScreen() {
  const t = useTheme();
  const { trainer } = useAuth();
  const { clients } = useClients();

  if (!trainer) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'AI Assistant' }} />
      <TrainerAIChat trainer={trainer} totalClients={clients.length} />
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
