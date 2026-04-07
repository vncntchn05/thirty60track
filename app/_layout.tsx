import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { Platform, Image, StyleSheet, View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '@/lib/auth';
import { UnreadProvider } from '@/lib/unreadContext';
import { SkiaAvailableContext } from '@/lib/skia';
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
  const { session, role, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const t = useTheme();

  useEffect(() => {
    if (loading) return;
    const seg = segments[0] as string;
    const inAuthGroup = seg === '(auth)';
    const inTabsGroup = seg === '(tabs)';
    const inClientGroup = seg === '(client)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && role === 'trainer' && (inAuthGroup || inClientGroup)) {
      router.replace('/(tabs)' as never);
    } else if (session && role === 'client' && (inAuthGroup || inTabsGroup)) {
      router.replace('/(client)' as never);
    }
  }, [session, role, loading, segments, router]);

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
      <Stack.Screen name="(client)" />
      <Stack.Screen name="client/new"  options={{ ...sharedHeaderOptions, headerShown: true, title: 'New Client', presentation: 'modal' }} />
      <Stack.Screen name="client/[id]" options={{ ...sharedHeaderOptions, headerShown: true, title: 'Client' }} />
      <Stack.Screen name="workout/new" options={{ ...sharedHeaderOptions, headerShown: true, title: 'Log Workout', presentation: 'modal' }} />
      <Stack.Screen name="workout/[id]" options={{ ...sharedHeaderOptions, headerShown: true, title: 'Workout' }} />
      <Stack.Screen name="messages/[id]" options={{ ...sharedHeaderOptions, headerShown: true, title: 'Message' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const isWeb = Platform.OS === 'web';
  const [skiaReady, setSkiaReady] = useState(!isWeb);
  const [skiaAvailable, setSkiaAvailable] = useState(!isWeb);

  useEffect(() => {
    if (isWeb) {
      import('@shopify/react-native-skia/lib/module/web')
        .then(({ LoadSkiaWeb }) =>
          LoadSkiaWeb({
            locateFile: (file: string) =>
              `https://cdn.jsdelivr.net/npm/canvaskit-wasm@0.39.1/bin/full/${file}`,
          })
        )
        .then(() => { setSkiaAvailable(true); setSkiaReady(true); })
        .catch(() => { setSkiaAvailable(false); setSkiaReady(true); });
    }
  }, [isWeb]);

  if (!skiaReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SkiaAvailableContext.Provider value={skiaAvailable}>
      <AuthProvider>
        <UnreadProvider>
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
        </UnreadProvider>
      </AuthProvider>
    </SkiaAvailableContext.Provider>
  );
}
