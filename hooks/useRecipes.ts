import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RecipeWithIngredients } from '@/types';

// ─── Read ─────────────────────────────────────────────────────

export function useRecipes(clientId: string) {
  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId) { setRecipes([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('recipes')
      .select('*, ingredients:recipe_ingredients(*)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    setRecipes((data as RecipeWithIngredients[]) ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  return { recipes, loading, refetch: load };
}

// ─── Write ────────────────────────────────────────────────────

type IngredientPayload = {
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

export async function saveRecipe(
  recipe: {
    id?: string;
    client_id: string;
    trainer_id: string;
    name: string;
    description?: string | null;
  },
  ingredients: IngredientPayload[],
): Promise<{ error: string | null }> {
  let recipeId = recipe.id;

  if (recipeId) {
    const { error } = await supabase
      .from('recipes')
      .update({
        name: recipe.name,
        description: recipe.description ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId);
    if (error) return { error: error.message };

    const { error: delErr } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', recipeId);
    if (delErr) return { error: delErr.message };
  } else {
    const { data, error } = await supabase
      .from('recipes')
      .insert({
        client_id: recipe.client_id,
        trainer_id: recipe.trainer_id,
        name: recipe.name,
        description: recipe.description ?? null,
      })
      .select('id')
      .single();
    if (error) return { error: error.message };
    recipeId = (data as { id: string }).id;
  }

  if (ingredients.length > 0) {
    const rows = ingredients.map((ing) => ({ ...ing, recipe_id: recipeId }));
    const { error } = await supabase.from('recipe_ingredients').insert(rows);
    if (error) return { error: error.message };
  }

  return { error: null };
}

export async function deleteRecipe(recipeId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
  return { error: error?.message ?? null };
}
