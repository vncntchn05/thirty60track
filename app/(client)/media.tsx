import { StyleSheet, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { useClientProfile } from '@/hooks/useClientProfile';
import { MediaGallery } from '@/components/client/MediaGallery';
import { useTheme } from '@/constants/theme';

export default function ClientMediaScreen() {
  const t = useTheme();
  const { clientId } = useAuth();
  const { client } = useClientProfile();

  // Pass the client's trainer_id so media inserts use the correct FK
  const trainerId = client?.trainer_id;

  if (!clientId) return null;

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <MediaGallery clientId={clientId} uploadTrainerId={trainerId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
