import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '@/lib/auth';
import { colors, useTheme } from '@/constants/theme';

function HeaderLogo() {
  return (
    <View style={styles.logoContainer}>
      <Image
        source={require('../assets/Thirty60_logo.png')}
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    marginRight: 8,
    borderRadius: 17,
    overflow: 'hidden',
  },
  logo: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
  },
});

function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const t = useTheme();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) router.replace('/(auth)/login');
    else if (session && inAuthGroup) router.replace('/(tabs)');
  }, [session, loading, segments]);

  const sharedHeaderOptions = {
    headerStyle: { backgroundColor: t.surface },
    headerTintColor: t.textPrimary,
    headerTitleStyle: { fontWeight: '700' as const },
    headerRight: () => <HeaderLogo />,
  };

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="client/new"  options={{ ...sharedHeaderOptions, headerShown: true, title: 'New Client', presentation: 'modal' }} />
      <Stack.Screen name="client/[id]" options={{ ...sharedHeaderOptions, headerShown: true, title: 'Client' }} />
      <Stack.Screen name="workout/new" options={{ ...sharedHeaderOptions, headerShown: true, title: 'Log Workout', presentation: 'modal' }} />
      <Stack.Screen name="workout/[id]" options={{ ...sharedHeaderOptions, headerShown: true, title: 'Workout' }} />
    </Stack>
  );
}

export default function RootLayout() {
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
      <Head>
        <title>thirty60track</title>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        <meta name="description" content="Thirty60 fitness tracking app" />
        <meta name="theme-color" content="#111111" />
        <style>{`html,body{background:#111111;}`}</style>
      </Head>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}
