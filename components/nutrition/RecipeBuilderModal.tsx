import { useState, useCallback, useRef } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, StyleSheet, Pressable, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { searchFoods } from '@/lib/usda';
import { searchOFF } from '@/lib/off';
import { saveRecipe } from '@/hooks/useRecipes';
import type { UsdaFood } from '@/lib/usda';
import type { RecipeWithIngredients } from '@/types';

// ─── Types ────────────────────────────────────────────────────

type IngredientDraft = {
  food_name: string;
  usda_food_id: string | null;
  weight_g: number;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  fiber_per_100g: number | null;
  sort_order: number;
};

type Props = {
  visible: boolean;
  clientId: string;
  trainerId: string;
  recipe?: RecipeWithIngredients | null;
  onClose: () => void;
  onSaved: () => void;
};

// ─── Macro math ───────────────────────────────────────────────

function sumMacros(ings: IngredientDraft[]) {
  let cal = 0, pro = 0, carb = 0, fat = 0, fib = 0, total = 0;
  for (const ing of ings) {
    const w = ing.weight_g;
    cal  += (ing.calories_per_100g  ?? 0) * w / 100;
    pro  += (ing.protein_per_100g   ?? 0) * w / 100;
    carb += (ing.carbs_per_100g     ?? 0) * w / 100;
    fat  += (ing.fat_per_100g       ?? 0) * w / 100;
    fib  += (ing.fiber_per_100g     ?? 0) * w / 100;
    total += w;
  }
  return { cal, pro, carb, fat, fib, total };
}

function round1(n: number) { return Math.round(n * 10) / 10; }

// ─── Component ────────────────────────────────────────────────

export function RecipeBuilderModal({ visible, clientId, trainerId, recipe, onClose, onSaved }: Props) {
  const t = useTheme();
  const isEdit = !!recipe;

  const [name, setName] = useState(recipe?.name ?? '');
  const [description, setDescription] = useState(recipe?.description ?? '');
  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    recipe?.ingredients.map((ing, i) => ({
      food_name: ing.food_name,
      usda_food_id: ing.usda_food_id,
      weight_g: ing.weight_g,
      calories_per_100g: ing.calories_per_100g,
      protein_per_100g: ing.protein_per_100g,
      carbs_per_100g: ing.carbs_per_100g,
      fat_per_100g: ing.fat_per_100g,
      fiber_per_100g: ing.fiber_per_100g,
      sort_order: i,
    })) ?? [],
  );

  // Ingredient search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UsdaFood[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pending ingredient (food selected, awaiting weight input)
  const [pendingFood, setPendingFood] = useState<UsdaFood | null>(null);
  const [pendingWeight, setPendingWeight] = useState('100');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const [usda, off] = await Promise.all([searchFoods(text), searchOFF(text)]);
      setResults([...usda.foods, ...off.foods]);
      setSearching(false);
    }, 400);
  }, []);

  function handleSelectFood(food: UsdaFood) {
    setPendingFood(food);
    setPendingWeight('100');
    setQuery('');
    setResults([]);
  }

  function handleConfirmIngredient() {
    if (!pendingFood) return;
    const w = parseFloat(pendingWeight);
    if (isNaN(w) || w <= 0) return;
    const p = pendingFood.per100g;
    setIngredients((prev) => [
      ...prev,
      {
        food_name: pendingFood.name,
        usda_food_id: pendingFood.fdcId,
        weight_g: w,
        calories_per_100g: p.calories ?? null,
        protein_per_100g: p.protein_g ?? null,
        carbs_per_100g: p.carbs_g ?? null,
        fat_per_100g: p.fat_g ?? null,
        fiber_per_100g: p.fiber_g ?? null,
        sort_order: 0,
      },
    ]);
    setPendingFood(null);
    setPendingWeight('100');
  }

  function handleRemoveIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name.trim() || ingredients.length === 0) return;
    setSaving(true);
    setSaveError(null);
    const { error } = await saveRecipe(
      {
        id: recipe?.id,
        client_id: clientId,
        trainer_id: trainerId,
        name: name.trim(),
        description: description.trim() || null,
      },
      ingredients.map((ing, i) => ({ ...ing, sort_order: i })),
    );
    setSaving(false);
    if (error) { setSaveError(error); return; }
    onSaved();
    handleClose();
  }

  function handleClose() {
    setName(recipe?.name ?? '');
    setDescription(recipe?.description ?? '');
    setIngredients(
      recipe?.ingredients.map((ing, i) => ({
        food_name: ing.food_name,
        usda_food_id: ing.usda_food_id,
        weight_g: ing.weight_g,
        calories_per_100g: ing.calories_per_100g,
        protein_per_100g: ing.protein_per_100g,
        carbs_per_100g: ing.carbs_per_100g,
        fat_per_100g: ing.fat_per_100g,
        fiber_per_100g: ing.fiber_per_100g,
        sort_order: i,
      })) ?? [],
    );
    setQuery('');
    setResults([]);
    setPendingFood(null);
    setSaveError(null);
    onClose();
  }

  const macros = sumMacros(ingredients);
  const canSave = name.trim().length > 0 && ingredients.length > 0 && !saving;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={[styles.sheet, { backgroundColor: t.surface, borderColor: t.border }]} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: t.textPrimary }]}>
                {isEdit ? 'Edit Recipe' : 'New Recipe'}
              </Text>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={t.textSecondary as string} />
              </TouchableOpacity>
            </View>

            {/* Recipe name */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Recipe name *</Text>
              <TextInput
                style={[styles.fieldInput, { color: t.textPrimary, borderColor: t.border, backgroundColor: t.background }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Post-workout shake"
                placeholderTextColor={t.textSecondary as string}
              />
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Description (optional)</Text>
              <TextInput
                style={[styles.fieldInput, { color: t.textPrimary, borderColor: t.border, backgroundColor: t.background }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Notes about this recipe…"
                placeholderTextColor={t.textSecondary as string}
              />
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: t.border }]} />

            {/* Ingredient search */}
            <Text style={[styles.sectionLabel, { color: t.textPrimary }]}>Ingredients</Text>

            {pendingFood ? (
              /* Weight confirmation for selected food */
              <View style={[styles.pendingBox, { borderColor: t.border, backgroundColor: t.background }]}>
                <View style={styles.pendingHeader}>
                  <Text style={[styles.pendingName, { color: t.textPrimary }]} numberOfLines={1}>
                    {pendingFood.name}
                  </Text>
                  <TouchableOpacity onPress={() => setPendingFood(null)}>
                    <Ionicons name="close-circle-outline" size={18} color={t.textSecondary as string} />
                  </TouchableOpacity>
                </View>
                <View style={styles.pendingRow}>
                  <TextInput
                    style={[styles.weightInput, { color: t.textPrimary, borderColor: t.border, backgroundColor: t.surface }]}
                    value={pendingWeight}
                    onChangeText={setPendingWeight}
                    keyboardType="decimal-pad"
                    placeholder="100"
                    placeholderTextColor={t.textSecondary as string}
                  />
                  <Text style={[styles.weightUnit, { color: t.textSecondary }]}>g</Text>
                  <TouchableOpacity
                    style={[styles.confirmBtn, (!pendingWeight || parseFloat(pendingWeight) <= 0) && styles.btnDisabled]}
                    onPress={handleConfirmIngredient}
                    disabled={!pendingWeight || parseFloat(pendingWeight) <= 0}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={16} color={colors.textInverse} />
                    <Text style={styles.confirmBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
                {pendingFood.per100g.calories != null && (
                  <Text style={[styles.pendingMacroHint, { color: t.textSecondary }]}>
                    {round1((pendingFood.per100g.calories ?? 0) * parseFloat(pendingWeight || '0') / 100)} kcal
                    {' · '}P {round1((pendingFood.per100g.protein_g ?? 0) * parseFloat(pendingWeight || '0') / 100)}g
                    {' · '}C {round1((pendingFood.per100g.carbs_g ?? 0) * parseFloat(pendingWeight || '0') / 100)}g
                    {' · '}F {round1((pendingFood.per100g.fat_g ?? 0) * parseFloat(pendingWeight || '0') / 100)}g
                  </Text>
                )}
              </View>
            ) : (
              /* Search field */
              <View style={[styles.searchRow, { borderColor: t.border, backgroundColor: t.background }]}>
                <Ionicons name="search-outline" size={16} color={t.textSecondary as string} />
                <TextInput
                  style={[styles.searchInput, { color: t.textPrimary }]}
                  value={query}
                  onChangeText={handleQueryChange}
                  placeholder="Search foods to add…"
                  placeholderTextColor={t.textSecondary as string}
                />
                {searching && <ActivityIndicator size="small" color={colors.primary} />}
              </View>
            )}

            {/* Search results */}
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
                      <Text style={[styles.resultName, { color: t.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                      {item.brand ? (
                        <Text style={[styles.resultBrand, { color: t.textSecondary }]} numberOfLines={1}>{item.brand}</Text>
                      ) : null}
                    </View>
                    {item.per100g.calories != null && (
                      <Text style={[styles.resultCal, { color: t.textSecondary }]}>
                        {Math.round(item.per100g.calories)} kcal/100g
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Ingredient list */}
            {ingredients.length > 0 && (
              <View style={[styles.ingList, { borderColor: t.border }]}>
                {ingredients.map((ing, i) => {
                  const cal = round1((ing.calories_per_100g ?? 0) * ing.weight_g / 100);
                  return (
                    <View key={i} style={[styles.ingRow, { borderBottomColor: t.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.ingName, { color: t.textPrimary }]} numberOfLines={1}>{ing.food_name}</Text>
                        <Text style={[styles.ingMeta, { color: t.textSecondary }]}>
                          {ing.weight_g}g · {cal} kcal
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveIngredient(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Macro totals */}
            {ingredients.length > 0 && (
              <View style={[styles.totalsBox, { backgroundColor: t.background, borderColor: t.border }]}>
                <Text style={[styles.totalsTitle, { color: t.textSecondary }]}>
                  Total ({round1(macros.total)}g)
                </Text>
                <View style={styles.totalsRow}>
                  {[
                    { label: 'kcal', value: round1(macros.cal) },
                    { label: 'P',    value: round1(macros.pro) },
                    { label: 'C',    value: round1(macros.carb) },
                    { label: 'F',    value: round1(macros.fat) },
                    { label: 'Fib',  value: round1(macros.fib) },
                  ].map(({ label, value }) => (
                    <View key={label} style={styles.macroCell}>
                      <Text style={[styles.macroCellValue, { color: t.textPrimary }]}>{value}</Text>
                      <Text style={[styles.macroCellLabel, { color: t.textSecondary }]}>{label}</Text>
                    </View>
                  ))}
                </View>
                {macros.total > 0 && (
                  <Text style={[styles.per100Note, { color: t.textSecondary }]}>
                    Per 100g: {round1(macros.cal / macros.total * 100)} kcal ·{' '}
                    P {round1(macros.pro / macros.total * 100)}g ·{' '}
                    C {round1(macros.carb / macros.total * 100)}g ·{' '}
                    F {round1(macros.fat / macros.total * 100)}g
                  </Text>
                )}
              </View>
            )}

            {saveError && (
              <Text style={[styles.errorText, { marginTop: spacing.sm }]}>{saveError}</Text>
            )}

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveBtn, !canSave && styles.btnDisabled]}
              onPress={handleSave}
              disabled={!canSave}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator size="small" color={colors.textInverse} />
                : <Text style={styles.saveBtnText}>{isEdit ? 'Update Recipe' : 'Save Recipe'}</Text>}
            </TouchableOpacity>

          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    borderWidth: 1, borderBottomWidth: 0,
    maxHeight: '94%', padding: spacing.md,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.md,
  },
  title: { ...typography.heading3 },

  field: { gap: 4, marginBottom: spacing.sm },
  fieldLabel: { ...typography.label },
  fieldInput: {
    borderWidth: 1, borderRadius: radius.sm,
    padding: spacing.sm, ...typography.body,
  },

  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.md },

  sectionLabel: { ...typography.body, fontWeight: '700', marginBottom: spacing.sm },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, ...typography.body },

  resultRow: {
    paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  resultName: { ...typography.body, fontWeight: '500' },
  resultBrand: { ...typography.bodySmall },
  resultCal: { ...typography.label } as never,

  pendingBox: {
    borderWidth: 1, borderRadius: radius.sm,
    padding: spacing.sm, marginBottom: spacing.sm, gap: spacing.xs,
  },
  pendingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pendingName: { ...typography.body, fontWeight: '600', flex: 1 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  weightInput: {
    width: 80, borderWidth: 1, borderRadius: radius.sm,
    padding: spacing.xs, ...typography.body, textAlign: 'center',
  },
  weightUnit: { ...typography.body },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  confirmBtnText: { ...typography.label, color: colors.textInverse, fontWeight: '700' },
  pendingMacroHint: { ...typography.bodySmall },

  ingList: {
    borderWidth: 1, borderRadius: radius.sm,
    overflow: 'hidden', marginBottom: spacing.sm,
  },
  ingRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  ingName: { ...typography.body, fontWeight: '500' },
  ingMeta: { ...typography.bodySmall, marginTop: 2 },

  totalsBox: {
    borderWidth: 1, borderRadius: radius.sm,
    padding: spacing.sm, marginBottom: spacing.md, gap: spacing.xs,
  },
  totalsTitle: { ...typography.label, fontWeight: '700' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroCell: { alignItems: 'center', flex: 1 },
  macroCellValue: { ...typography.body, fontWeight: '700' },
  macroCellLabel: { ...typography.label },
  per100Note: { ...typography.bodySmall, marginTop: 4 },

  errorText: { ...typography.bodySmall, color: colors.error },

  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.sm,
    padding: spacing.md, alignItems: 'center', marginBottom: spacing.sm,
  },
  btnDisabled: { opacity: 0.5 },
  saveBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
