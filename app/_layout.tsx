import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, useColorScheme, View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '@/lib/auth';
import { colors } from '@/constants/theme';

function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) router.replace('/(auth)/login');
    else if (session && inAuthGroup) router.replace('/(tabs)');
  }, [session, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="client/new"  options={{ headerShown: true, title: 'New Client', presentation: 'modal' }} />
      <Stack.Screen name="client/[id]" options={{ headerShown: true, title: 'Client' }} />
      <Stack.Screen name="workout/new" options={{ headerShown: true, title: 'Log Workout', presentation: 'modal' }} />
      <Stack.Screen name="workout/[id]" options={{ headerShown: true, title: 'Workout' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const [skiaReady, setSkiaReady] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS === 'web') {
      import('@shopify/react-native-skia/lib/module/web')
        .then(({ LoadSkiaWeb }) =>
          LoadSkiaWeb({
            locateFile: (file: string) =>
              `https://cdn.jsdelivr.net/npm/canvaskit-wasm@0.39.1/bin/full/${file}`,
          })
        )
        .finally(() => setSkiaReady(true));
    }
  }, []);

  if (!skiaReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </AuthProvider>
  );
}
