// Design tokens for thirty60track.
// Usage: import { colors, spacing, typography, useTheme } from '@/constants/theme';

import { useColorScheme } from 'react-native';
import { useMemo } from 'react';

export const colors = {
  // Brand
  primary:   '#6366f1', // indigo-500
  primaryDark: '#4f46e5', // indigo-600

  // Surfaces (light)
  background: '#f8fafc',
  surface:    '#ffffff',
  border:     '#e2e8f0',

  // Surfaces (dark) — used when colorScheme === 'dark'
  backgroundDark: '#0f172a',
  surfaceDark:    '#1e293b',
  borderDark:     '#334155',

  // Text
  textPrimary:      '#0f172a',
  textSecondary:    '#64748b',
  textInverse:      '#ffffff',
  textPrimaryDark:  '#f1f5f9', // slate-100
  textSecondaryDark:'#94a3b8', // slate-400

  // Semantic
  success: '#22c55e',
  warning: '#f59e0b',
  error:   '#ef4444',
  info:    '#3b82f6',

  // Chart palette (Victory Native)
  chart: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7'],
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
  sm: 6,
  md: 12,
  lg: 20,
  full: 9999,
} as const;

// ─── Theme hook ───────────────────────────────────────────────────
// Returns scheme-aware surface/text colors. Spread into inline styles
// for elements whose background/text color must adapt to dark mode.

export type Theme = {
  background: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  isDark: boolean;
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return useMemo(() => ({
    background:    dark ? colors.backgroundDark  : colors.background,
    surface:       dark ? colors.surfaceDark     : colors.surface,
    border:        dark ? colors.borderDark      : colors.border,
    textPrimary:   dark ? colors.textPrimaryDark  : colors.textPrimary,
    textSecondary: dark ? colors.textSecondaryDark : colors.textSecondary,
    isDark: dark,
  }), [dark]);
}

export const typography = {
  heading1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  heading2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30 },
  heading3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
  body:     { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall:{ fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  label:    { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
} as const;
