import { useState, useCallback, useRef } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, StyleSheet, Pressable, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { searchFoods, scaleMacros } from '@/lib/usda';
import type { UsdaFood } from '@/lib/usda';
import type { MealType } from '@/types';
import { MEAL_TYPES } from '@/types';

// ─── Types ────────────────────────────────────────────────────────

type FormState = {
  foodName: string;
  servingG: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
};

type Props = {
  visible: boolean;
  initialMealType: MealType;
  onClose: () => void;
  onAdd: (entry: {
    meal_type: MealType;
    food_name: string;
    serving_size_g: number;
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    fiber_g: number | null;
    usda_food_id: string | null;
  }) => Promise<void>;
};

// ─── Helpers ──────────────────────────────────────────────────────

function toNum(v: string): number | null {
  const n = parseFloat(v);
  return v.trim() !== '' && !isNaN(n) ? Math.round(n * 10) / 10 : null;
}

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const EMPTY_FORM: FormState = { foodName: '', servingG: '100', calories: '', protein: '', carbs: '', fat: '', fiber: '' };

// ─── Component ────────────────────────────────────────────────────

export function AddFoodModal({ visible, initialMealType, onClose, onAdd }: Props) {
  const t = useTheme();
  const [mode, setMode] = useState<'search' | 'manual'>('search');
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UsdaFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<UsdaFood | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update form macros when serving size changes (USDA mode only)
  function handleServingChange(text: string) {
    setForm((prev) => {
      if (!selectedFood) return { ...prev, servingG: text };
      const g = parseFloat(text);
      if (isNaN(g) || g <= 0) return { ...prev, servingG: text };
      const scaled = scaleMacros(selectedFood.per100g, g);
      return {
        ...prev,
        servingG: text,
        calories: scaled.calories  != null ? String(scaled.calories)  : '',
        protein:  scaled.protein_g != null ? String(scaled.protein_g) : '',
        carbs:    scaled.carbs_g   != null ? String(scaled.carbs_g)   : '',
        fat:      scaled.fat_g     != null ? String(scaled.fat_g)     : '',
        fiber:    scaled.fiber_g   != null ? String(scaled.fiber_g)   : '',
      };
    });
  }

  // Debounced USDA search
  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    setSelectedFood(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      const { foods, error } = await searchFoods(text);
      setResults(foods);
      setSearchError(error);
      setSearching(false);
    }, 400);
  }, []);

  function handleSelectFood(food: UsdaFood) {
    setSelectedFood(food);
    const serving = 100;
    const scaled = scaleMacros(food.per100g, serving);
    setForm({
      foodName: food.name,
      servingG: String(serving),
      calories: scaled.calories  != null ? String(scaled.calories)  : '',
      protein:  scaled.protein_g != null ? String(scaled.protein_g) : '',
      carbs:    scaled.carbs_g   != null ? String(scaled.carbs_g)   : '',
      fat:      scaled.fat_g     != null ? String(scaled.fat_g)     : '',
      fiber:    scaled.fiber_g   != null ? String(scaled.fiber_g)   : '',
    });
    setResults([]);
  }

  function handleSwitchMode(next: 'search' | 'manual') {
    setMode(next);
    setQuery('');
    setResults([]);
    setSelectedFood(null);
    setForm(EMPTY_FORM);
  }

  function resetAndClose() {
    setMode('search');
    setQuery('');
    setResults([]);
    setSelectedFood(null);
    setForm(EMPTY_FORM);
    setSearchError(null);
    onClose();
  }

  async function handleAdd() {
    if (!form.foodName.trim()) return;
    setSaving(true);
    await onAdd({
      meal_type: mealType,
      food_name: form.foodName.trim(),
      serving_size_g: toNum(form.servingG) ?? 100,
      calories:  toNum(form.calories),
      protein_g: toNum(form.protein),
      carbs_g:   toNum(form.carbs),
      fat_g:     toNum(form.fat),
      fiber_g:   toNum(form.fiber),
      usda_food_id: selectedFood?.fdcId ?? null,
    });
    setSaving(false);
    resetAndClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <Pressable style={styles.overlay} onPress={resetAndClose}>
        <Pressable style={[styles.sheet, { backgroundColor: t.surface, borderColor: t.border }]} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: t.textPrimary }]}>Add Food</Text>
              <TouchableOpacity onPress={resetAndClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={t.textSecondary as string} />
              </TouchableOpacity>
            </View>

            {/* Meal type selector */}
            <View style={styles.chipRow}>
              {(Object.keys(MEAL_TYPES) as MealType[]).map((mt) => (
                <TouchableOpacity
                  key={mt}
                  style={[styles.chip, mealType === mt && styles.chipActive]}
                  onPress={() => setMealType(mt)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, { color: mealType === mt ? colors.textInverse : t.textSecondary }]}>
                    {MEAL_LABELS[mt]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mode toggle */}
            <View style={[styles.modeToggle, { backgroundColor: t.background, borderColor: t.border }]}>
              {(['search', 'manual'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                  onPress={() => handleSwitchMode(m)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modeBtnText, { color: mode === m ? colors.textInverse : t.textSecondary }]}>
                    {m === 'search' ? 'USDA Search' : 'Manual Entry'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* USDA search */}
            {mode === 'search' && !selectedFood && (
              <View style={styles.section}>
                <View style={[styles.searchRow, { borderColor: t.border, backgroundColor: t.background }]}>
                  <Ionicons name="search-outline" size={16} color={t.textSecondary as string} />
                  <TextInput
                    style={[styles.searchInput, { color: t.textPrimary }]}
                    value={query} onChangeText={handleQueryChange}
                    placeholder="Search foods…" placeholderTextColor={t.textSecondary as string}
                    autoFocus
                  />
                  {searching && <ActivityIndicator size="small" color={colors.primary} />}
                </View>
                {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}
                {results.length > 0 && (
                  <FlatList
                    data={results}
                    keyExtractor={(item) => item.fdcId}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.resultRow, { borderBottomColor: t.border }]}
                        onPress={() => handleSelectFood(item)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.resultName, { color: t.textPrimary }]} numberOfLines={1}>
                            {item.name}
                          </Text>
                          {item.brand ? (
                            <Text style={[styles.resultBrand, { color: t.textSecondary }]} numberOfLines={1}>
                              {item.brand}
                            </Text>
                          ) : null}
                        </View>
                        {item.per100g.calories != null ? (
                          <Text style={[styles.resultCal, { color: t.textSecondary }]}>
                            {Math.round(item.per100g.calories)} kcal/100g
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
            )}

            {/* Form (shown once food is selected in search mode, or always in manual mode) */}
            {(mode === 'manual' || selectedFood) && (
              <View style={styles.section}>
                {selectedFood && mode === 'search' && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={[styles.selectedText, { color: t.textSecondary }]} numberOfLines={1}>
                      {selectedFood.name}
                    </Text>
                    <TouchableOpacity onPress={() => { setSelectedFood(null); setForm(EMPTY_FORM); }}>
                      <Ionicons name="close-circle-outline" size={16} color={t.textSecondary as string} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Food name (editable) */}
                <FormField
                  label="Food name" value={form.foodName}
                  onChangeText={(v) => setForm((p) => ({ ...p, foodName: v }))}
                  placeholder="e.g. Chicken Breast" t={t}
                />

                {/* Serving size */}
                <FormField
                  label="Serving size (g)" value={form.servingG}
                  onChangeText={handleServingChange}
                  placeholder="100" numeric t={t}
                />

                {/* Macros */}
                <View style={styles.macroGrid}>
                  {[
                    { label: 'Calories (kcal)', key: 'calories' as const },
                    { label: 'Protein (g)',     key: 'protein' as const },
                    { label: 'Carbs (g)',       key: 'carbs' as const },
                    { label: 'Fat (g)',         key: 'fat' as const },
                    { label: 'Fiber (g)',       key: 'fiber' as const },
                  ].map(({ label, key }) => (
                    <View key={key} style={styles.macroField}>
                      <FormField
                        label={label} value={form[key]}
                        onChangeText={(v) => setForm((p) => ({ ...p, [key]: v }))}
                        placeholder="—" numeric t={t}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Add button */}
            {(mode === 'manual' || selectedFood) && (
              <TouchableOpacity
                style={[styles.addBtn, (!form.foodName.trim() || saving) && styles.btnDisabled]}
                onPress={handleAdd}
                disabled={!form.foodName.trim() || saving}
                activeOpacity={0.8}
              >
                {saving
                  ? <ActivityIndicator size="small" color={colors.textInverse} />
                  : <Text style={styles.addBtnText}>Add to {MEAL_LABELS[mealType]}</Text>}
              </TouchableOpacity>
            )}

          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── FormField helper ─────────────────────────────────────────────

type Theme = ReturnType<typeof useTheme>;
function FormField({ label, value, onChangeText, placeholder, numeric, t }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; numeric?: boolean; t: Theme;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { color: t.textPrimary, borderColor: t.border, backgroundColor: t.background }]}
        value={value} onChangeText={onChangeText}
        placeholder={placeholder} placeholderTextColor={t.textSecondary as string}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    borderWidth: 1, borderBottomWidth: 0,
    maxHeight: '90%', padding: spacing.md,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sheetTitle: { ...typography.heading3 },

  chipRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.primary,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.label, fontWeight: '600' },

  modeToggle: {
    flexDirection: 'row', borderWidth: 1, borderRadius: radius.sm,
    overflow: 'hidden', marginBottom: spacing.md,
  },
  modeBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center' },
  modeBtnActive: { backgroundColor: colors.primary },
  modeBtnText: { ...typography.label, fontWeight: '700' },

  section: { gap: spacing.sm, marginBottom: spacing.md },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm,
  },
  searchInput: { flex: 1, ...typography.body },
  errorText: { ...typography.bodySmall, color: colors.error },
  resultRow: { paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  resultName: { ...typography.body, fontWeight: '500' },
  resultBrand: { ...typography.bodySmall },
  resultCal: { ...typography.label, whiteSpace: 'nowrap' } as never,

  selectedBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs },
  selectedText: { ...typography.bodySmall, flex: 1 },

  field: { gap: 4 },
  fieldLabel: { ...typography.label },
  fieldInput: { borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm, ...typography.body },

  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  macroField: { width: '47%' },

  addBtn: {
    backgroundColor: colors.primary, borderRadius: radius.sm,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.5 },
  addBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
