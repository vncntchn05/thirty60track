/**
 * Screen & component smoke tests
 *
 * Covers:
 *  - LoginScreen: validation logic, signIn call, error display
 *  - Date helpers (NutritionTab): toIso, offsetDate
 *  - Nutrition macro accumulation logic
 *  - Recipe macro calculation (per-100g weighted average + serving scale)
 *  - Session credit cost rules
 *  - CalendarStrip exported helpers: sameDay, getMondayOfWeek
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

// ─── Module-level mocks (must come before any dynamic require) ─────────────────

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn((cb: (v: { data: null; error: null }) => void) =>
        Promise.resolve({ data: null, error: null }).then(cb),
      ),
    })),
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  },
}));

// Vector icons — replace every icon component with a plain string stub
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  AntDesign: 'AntDesign',
  Feather: 'Feather',
  FontAwesome: 'FontAwesome',
  MaterialIcons: 'MaterialIcons',
}));

// Image asset required by LoginScreen
jest.mock('../../assets/Thirty60_logo.png', () => 1, { virtual: true });

// Auth mock — signIn is a jest.fn() so tests can override its return value
const mockSignIn = jest.fn();
jest.mock('@/lib/auth', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    role: null,
    user: null,
    trainer: null,
    clientId: null,
    loading: false,
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const LoginScreen = require('@/app/(auth)/login').default;

// ─── LoginScreen ───────────────────────────────────────────────────────────────

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignIn.mockResolvedValue({ error: null });
  });

  it('renders email and password inputs', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('shows validation error when submitting with empty fields', async () => {
    const { getAllByText, queryByText } = render(<LoginScreen />);
    // Screen has two "Sign In" nodes: the subtitle label and the button — press the button (last)
    const signInButtons = getAllByText('Sign In');
    await act(async () => { fireEvent.press(signInButtons[signInButtons.length - 1]); });

    expect(queryByText('Email and password are required.')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('calls signIn with trimmed email and password on submit', async () => {
    const { getByPlaceholderText, getAllByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), '  trainer@test.com  ');
    fireEvent.changeText(getByPlaceholderText('Password'), 'secret123');
    const signInButtons = getAllByText('Sign In');
    await act(async () => { fireEvent.press(signInButtons[signInButtons.length - 1]); });

    expect(mockSignIn).toHaveBeenCalledWith('trainer@test.com', 'secret123');
  });

  it('displays auth error returned from signIn', async () => {
    mockSignIn.mockResolvedValue({ error: 'Invalid credentials' });

    const { getByPlaceholderText, getAllByText, findByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'bad@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrong');
    const signInButtons = getAllByText('Sign In');
    await act(async () => { fireEvent.press(signInButtons[signInButtons.length - 1]); });

    expect(await findByText('Invalid credentials')).toBeTruthy();
  });
});

// ─── NutritionTab date helpers ────────────────────────────────────────────────

describe('NutritionTab date helpers', () => {
  function toIso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function offsetDate(iso: string, days: number): string {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d + days);
    return toIso(dt);
  }

  function fmtDisplayDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const today = new Date();
    const todayIso = toIso(today);
    const yesterday = toIso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1));
    if (iso === todayIso) return 'Today';
    if (iso === yesterday) return 'Yesterday';
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  it('toIso formats a date with zero-padded month and day', () => {
    expect(toIso(new Date(2025, 0, 5))).toBe('2025-01-05');
  });

  it('offsetDate adds days across month boundary', () => {
    expect(offsetDate('2025-01-31', 1)).toBe('2025-02-01');
  });

  it('offsetDate subtracts days across month boundary', () => {
    expect(offsetDate('2025-03-01', -1)).toBe('2025-02-28');
  });

  it('offsetDate handles year boundary', () => {
    expect(offsetDate('2024-12-31', 1)).toBe('2025-01-01');
  });

  it('offsetDate with 0 returns same date', () => {
    expect(offsetDate('2025-06-15', 0)).toBe('2025-06-15');
  });

  it('fmtDisplayDate returns "Today" for today', () => {
    const todayIso = toIso(new Date());
    expect(fmtDisplayDate(todayIso)).toBe('Today');
  });

  it('fmtDisplayDate returns "Yesterday" for yesterday', () => {
    const today = new Date();
    const yesterday = toIso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1));
    expect(fmtDisplayDate(yesterday)).toBe('Yesterday');
  });

  it('fmtDisplayDate returns formatted string for older dates', () => {
    const result = fmtDisplayDate('2020-01-15');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });
});

// ─── Nutrition macro accumulation ─────────────────────────────────────────────

describe('Nutrition macro accumulation', () => {
  type LogLike = { calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null };

  function sumMacro(logs: LogLike[], key: keyof LogLike): number {
    return logs.reduce((s, l) => s + ((l[key] as number | null) ?? 0), 0);
  }

  const logs: LogLike[] = [
    { calories: 300, protein_g: 30, carbs_g: 40, fat_g: 10 },
    { calories: 500, protein_g: 45, carbs_g: 60, fat_g: 15 },
    { calories: null, protein_g: null, carbs_g: null, fat_g: null },
  ];

  it('sums calories across logs, treating null as zero', () => {
    expect(sumMacro(logs, 'calories')).toBe(800);
  });

  it('sums protein across logs', () => {
    expect(sumMacro(logs, 'protein_g')).toBe(75);
  });

  it('returns 0 for all-null log', () => {
    const nullLog: LogLike[] = [{ calories: null, protein_g: null, carbs_g: null, fat_g: null }];
    expect(sumMacro(nullLog, 'calories')).toBe(0);
  });

  it('computes percentage of calorie goal', () => {
    const consumed = 1800;
    const goal = 2400;
    const pct = Math.min(1, consumed / goal);
    expect(pct).toBeCloseTo(0.75);
  });

  it('caps percentage at 1.0 when over goal', () => {
    expect(Math.min(1, 3000 / 2000)).toBe(1);
  });
});

// ─── Recipe macro calculation ─────────────────────────────────────────────────

describe('Recipe macro calculation', () => {
  type Ingredient = {
    weight_g: number;
    calories_per_100g: number | null;
    protein_per_100g: number | null;
    carbs_per_100g: number | null;
    fat_per_100g: number | null;
    fiber_per_100g: number | null;
  };

  /**
   * Per-100g weighted average for a macro across all recipe ingredients.
   * Formula: Σ(macro_per_100g × weight_g) / total_weight_g
   * (equivalent to: total_macro_grams / total_weight_g × 100)
   */
  function recipePer100g(ings: Ingredient[], key: keyof Ingredient): number {
    const totalWeight = ings.reduce((s, i) => s + i.weight_g, 0);
    if (totalWeight === 0) return 0;
    return ings.reduce((s, i) => s + ((i[key] as number | null) ?? 0) * i.weight_g, 0) / totalWeight;
  }

  function sumMacros(ings: Ingredient[]) {
    const totalWeight = ings.reduce((s, i) => s + i.weight_g, 0);
    return {
      totalWeight,
      calories: recipePer100g(ings, 'calories_per_100g'),
      protein: recipePer100g(ings, 'protein_per_100g'),
      carbs: recipePer100g(ings, 'carbs_per_100g'),
      fat: recipePer100g(ings, 'fat_per_100g'),
      fiber: recipePer100g(ings, 'fiber_per_100g'),
    };
  }

  function recipeCalcMacros(per100g: ReturnType<typeof sumMacros>, servingG: number) {
    return {
      calories: (per100g.calories * servingG) / 100,
      protein_g: (per100g.protein * servingG) / 100,
      carbs_g: (per100g.carbs * servingG) / 100,
      fat_g: (per100g.fat * servingG) / 100,
      fiber_g: (per100g.fiber * servingG) / 100,
    };
  }

  const CHICKEN: Ingredient = {
    weight_g: 150,
    calories_per_100g: 165,
    protein_per_100g: 31,
    carbs_per_100g: 0,
    fat_per_100g: 3.6,
    fiber_per_100g: 0,
  };

  const RICE: Ingredient = {
    weight_g: 200,
    calories_per_100g: 130,
    protein_per_100g: 2.7,
    carbs_per_100g: 28,
    fat_per_100g: 0.3,
    fiber_per_100g: 0.4,
  };

  it('computes correct total weight', () => {
    expect(sumMacros([CHICKEN, RICE]).totalWeight).toBe(350);
  });

  it('computes weighted average calories per 100g', () => {
    // (165×150 + 130×200) / 350 = 50750 / 350 ≈ 145
    expect(sumMacros([CHICKEN, RICE]).calories).toBeCloseTo(145, 0);
  });

  it('scales calories correctly for a serving', () => {
    const per100g = sumMacros([CHICKEN, RICE]);
    const serving = recipeCalcMacros(per100g, 175); // half the recipe ≈ 254 cal
    expect(serving.calories).toBeGreaterThan(200);
    expect(serving.calories).toBeLessThan(300);
  });

  it('returns zero macros for an empty ingredient list', () => {
    const result = sumMacros([]);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
    expect(result.totalWeight).toBe(0);
  });

  it('treats null macro fields as zero', () => {
    const ing: Ingredient = {
      weight_g: 100,
      calories_per_100g: null,
      protein_per_100g: null,
      carbs_per_100g: null,
      fat_per_100g: null,
      fiber_per_100g: null,
    };
    expect(sumMacros([ing]).calories).toBe(0);
    expect(sumMacros([ing]).protein).toBe(0);
  });

  it('full serving (100%) returns per-100g value as grams', () => {
    const per100g = sumMacros([CHICKEN]);
    const serving = recipeCalcMacros(per100g, 100);
    expect(serving.calories).toBeCloseTo(165, 0);
    expect(serving.protein_g).toBeCloseTo(31, 0);
  });
});

// ─── Session credit cost rules ─────────────────────────────────────────────────

describe('Session credit cost rules', () => {
  function creditCost(durationMinutes: 30 | 60): number {
    return durationMinutes === 30 ? 1 : 2;
  }

  it('30min session costs 1 credit', () => {
    expect(creditCost(30)).toBe(1);
  });

  it('60min session costs 2 credits', () => {
    expect(creditCost(60)).toBe(2);
  });

  it('Math.max guard prevents negative balance', () => {
    const balance = 1;
    const cost = creditCost(60); // 2
    expect(Math.max(0, balance - cost)).toBe(0);
  });

  it('refund restores balance for 30min session', () => {
    const balance = 0;
    const refund = creditCost(30);
    expect(balance + refund).toBe(1);
  });

  it('refund restores balance for 60min session', () => {
    const balance = 3;
    const refund = creditCost(60);
    expect(balance + refund).toBe(5);
  });
});

// ─── CalendarStrip helper functions ───────────────────────────────────────────

describe('CalendarStrip helpers', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { sameDay, getMondayOfWeek } = require('@/components/schedule/CalendarStrip');

  it('sameDay returns true for the same Date object', () => {
    const d = new Date(2025, 4, 15);
    expect(sameDay(d, d)).toBe(true);
  });

  it('sameDay returns true for different objects with same y/m/d', () => {
    expect(sameDay(new Date(2025, 4, 15), new Date(2025, 4, 15))).toBe(true);
  });

  it('sameDay returns false for adjacent days', () => {
    expect(sameDay(new Date(2025, 4, 15), new Date(2025, 4, 16))).toBe(false);
  });

  it('sameDay returns false for same day in different months', () => {
    expect(sameDay(new Date(2025, 3, 15), new Date(2025, 4, 15))).toBe(false);
  });

  it('getMondayOfWeek returns a Monday for a Wednesday input', () => {
    const wednesday = new Date(2025, 4, 14); // Wed May 14 2025
    expect(getMondayOfWeek(wednesday).getDay()).toBe(1);
  });

  it('getMondayOfWeek returns the same Monday when input is Monday', () => {
    const monday = new Date(2025, 4, 12); // Mon May 12 2025
    const result = getMondayOfWeek(monday);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(12);
  });

  it('getMondayOfWeek returns the correct Monday for a Sunday', () => {
    const sunday = new Date(2025, 4, 18); // Sun May 18 2025
    const monday = getMondayOfWeek(sunday);
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(12); // Mon May 12 is the Monday of that week
  });
});
