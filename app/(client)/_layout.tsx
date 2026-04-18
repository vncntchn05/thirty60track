import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, useTheme } from '@/constants/theme';
import { useUnread } from '@/lib/unreadContext';
import { useAuth } from '@/lib/auth';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconsName, focusedName: IoniconsName) {
  const Icon = ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? focusedName : name} size={24} color={color} />
  );
  Icon.displayName = 'TabIcon';
  return Icon;
}

function MessagesTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { unreadCount } = useUnread();
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={24} color={color} />
      {unreadCount > 0 && <View style={tabStyles.dot} />}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  dot: {
    position: 'absolute', top: 0, right: 0,
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 1.5, borderColor: '#000',
  },
});

function HeaderLogo() {
  return (
    <View style={styles.logoContainer}>
      <Image
        source={require('../../assets/Thirty60_logo.png')}
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    marginLeft: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  guestBanner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  guestBannerText: {
    ...typography.bodySmall,
    color: colors.textInverse,
    textAlign: 'center',
  },
  guestBannerLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

function GuestBanner() {
  const t = useTheme();
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[styles.guestBanner, { backgroundColor: colors.primary }]}
      onPress={() => router.push('/(auth)/signup' as never)}
      activeOpacity={0.85}
    >
      <Text style={styles.guestBannerText}>
        Ready to get started?{' '}
        <Text style={styles.guestBannerLink}>Sign up now</Text>
      </Text>
    </TouchableOpacity>
  );
}

export default function ClientLayout() {
  const t = useTheme();
  const router = useRouter();
  const { isGuest } = useAuth();
  return (
    <View style={{ flex: 1 }}>
      {isGuest && <GuestBanner />}
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: t.textSecondary,
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor: t.border,
        },
        headerStyle: { backgroundColor: t.surface },
        headerTintColor: t.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        headerShown: true,
        headerLeft: () => <HeaderLogo />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Progress',
          tabBarIcon: tabIcon('trending-up-outline', 'trending-up'),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Workouts',
          tabBarIcon: tabIcon('barbell-outline', 'barbell'),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: tabIcon('nutrition-outline', 'nutrition'),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: tabIcon('newspaper-outline', 'newspaper'),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => <MessagesTabIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: tabIcon('person-outline', 'person'),
        }}
      />
      <Tabs.Screen name="progress" options={{ href: null }} />
      <Tabs.Screen name="exercises" options={{ href: null }} />
      <Tabs.Screen name="media" options={{ href: null }} />
      {/* Push screens — not shown in tab bar */}
      <Tabs.Screen
        name="session/[id]"
        options={{
          href: null,
          title: 'Workout',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push('/(client)/workouts' as never)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginLeft: 8 }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen name="workout/log" options={{ href: null }} />
    </Tabs>
    </View>
  );
}
