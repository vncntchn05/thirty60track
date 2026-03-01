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

  // Surfaces (dark mode — site aesthetic: pure black + dark cards)
  backgroundDark: '#000000',
  surfaceDark:    '#111111',
  borderDark:     '#333333',

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

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return useMemo(() => ({
    background:    dark ? colors.backgroundDark    : colors.background,
    surface:       dark ? colors.surfaceDark       : colors.surface,
    border:        dark ? colors.borderDark        : colors.border,
    textPrimary:   dark ? colors.textPrimaryDark   : colors.textPrimary,
    textSecondary: dark ? colors.textSecondaryDark : colors.textSecondary,
    primary:       colors.primary,
    primaryLight:  colors.primaryLight,
    isDark:        dark,
  }), [dark]);
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
