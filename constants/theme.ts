// Design tokens for thirty60track.
// Brand palette sourced from thirty60fitness.com.
// Usage: import { colors, spacing, typography, useTheme } from '@/constants/theme';

import { useColorScheme } from 'react-native';
import { useMemo } from 'react';

export const colors = {
  // Brand — thirty60 gold
  primary:      '#B88C32', // Alpine gold (CTAs, active states, accents)
  primaryLight: '#DBAF55', // hover / highlight gold
  primaryDark:  '#8A6820', // pressed gold

  // Surfaces (light mode — warm off-white base)
  background: '#F9F6F0',
  surface:    '#FFFFFF',
  border:     '#E5D9C0',

  // Surfaces (dark mode — deep charcoal base, not pure black)
  backgroundDark: '#111111',
  surfaceDark:    '#1C1C1C',
  borderDark:     '#2E2E2E',

  // Text
  textPrimary:       '#000000',
  textSecondary:     '#555555', // Emperor
  textInverse:       '#FFFFFF',
  textPrimaryDark:   '#FFFFFF',
  textSecondaryDark: '#999999', // DustyGray

  // Semantic
  success: '#22c55e',
  warning: '#f59e0b',
  error:   '#ef4444',
  info:    '#3b82f6',

  // Chart palette — gold-forward to match brand
  chart: ['#B88C32', '#DBAF55', '#8A6820', '#22c55e', '#3b82f6', '#ef4444'],
} as const;

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const radius = {
  sm:   6,
  md:   12,
  lg:   20, // matches site's 20px rounded CTA buttons
  full: 9999,
} as const;

// ─── Theme hook ───────────────────────────────────────────────────
// Returns scheme-aware surface/text/accent colors.
// Spread into inline styles for elements that must adapt to dark mode.

export type Theme = {
  background:    string;
  surface:       string;
  border:        string;
  textPrimary:   string;
  textSecondary: string;
  primary:       string;       // brand gold — same in both schemes
  primaryLight:  string;
  isDark:        boolean;
};

// Theme is locked to dark to match the Thirty60 brand aesthetic (black + gold).
export function useTheme(): Theme {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = useColorScheme(); // kept so the hook rules are satisfied
  return useMemo(() => ({
    background:    colors.backgroundDark,
    surface:       colors.surfaceDark,
    border:        colors.borderDark,
    textPrimary:   colors.textPrimaryDark,
    textSecondary: colors.textSecondaryDark,
    primary:       colors.primary,
    primaryLight:  colors.primaryLight,
    isDark:        true,
  }), []);
}

export const typography = {
  heading1:  { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  heading2:  { fontSize: 22, fontWeight: '700' as const, lineHeight: 30 },
  heading3:  { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
  body:      { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  label:     { fontSize: 12, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 1 },
  // uppercase + letter-spacing for nav items (matches site nav style)
  navLabel:  { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1.5, textTransform: 'uppercase' as const },
} as const;
