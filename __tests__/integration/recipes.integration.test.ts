/**
 * Integration tests for Recipes (migration 017).
 *
 * Covers: trainer creates/reads/deletes recipes + ingredients for a client,
 * client can read their own recipes (RLS), client cannot see recipes belonging
 * to a different client.
 *
 * Requires full trainer + client credentials and TEST_CLIENT_ID.
 * All created rows are cleaned up in afterAll.
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const TRAINER_EMAIL     = process.env.TEST_TRAINER_EMAIL;
const TRAINER_PASSWORD  = process.env.TEST_TRAINER_PASSWORD;
const CLIENT_EMAIL      = process.env.TEST_CLIENT_EMAIL;
const CLIENT_PASSWORD   = process.env.TEST_CLIENT_PASSWORD;
const CLIENT_ID         = process.env.TEST_CLIENT_ID;

const hasTrainerCreds = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && TRAINER_EMAIL && TRAINER_PASSWORD && CLIENT_ID,
);
const hasAllCreds = hasTrainerCreds && Boolean(CLIENT_EMAIL && CLIENT_PASSWORD);

const maybeDescribe     = hasTrainerCreds ? describe : describe.skip;
const maybeDescribeAll  = hasAllCreds     ? describe : describe.skip;

function buildClient() {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

maybeDescribe('Recipes integration — trainer operations', () => {
  let sb: SupabaseClient;
  let trainerId: string;
  let createdRecipeId: string | null = null;

  beforeAll(async () => {
    sb = buildClient();
    const { data, error } = await sb.auth.signInWithPassword({
      email: TRAINER_EMAIL!,
      password: TRAINER_PASSWORD!,
    });
    if (error || !data.user) throw new Error(`Sign-in failed: ${error?.message}`);
    trainerId = data.user.id;
  });

  afterAll(async () => {
    if (createdRecipeId) {
      await sb.from('recipe_ingredients').delete().eq('recipe_id', createdRecipeId);
      await sb.from('recipes').delete().eq('id', createdRecipeId);
    }
    await sb.auth.signOut();
  });

  it('trainer can create a recipe for a client', async () => {
    const { data, error } = await sb
      .from('recipes')
      .insert({
        client_id:   CLIENT_ID,
        trainer_id:  trainerId,
        name:        '__integration_recipe__',
        description: 'Integration test recipe',
      })
      .select('id, name, trainer_id, client_id')
      .single();

    expect(error).toBeNull();
    expect(data?.name).toBe('__integration_recipe__');
    expect(data?.trainer_id).toBe(trainerId);
    expect(data?.client_id).toBe(CLIENT_ID);
    createdRecipeId = data!.id;
  });

  it('trainer can add ingredients to the recipe', async () => {
    if (!createdRecipeId) return;

    const { error } = await sb
      .from('recipe_ingredients')
      .insert([
        {
          recipe_id:          createdRecipeId,
          food_name:          'Chicken Breast',
          weight_g:           150,
          calories_per_100g:  165,
          protein_per_100g:   31,
          carbs_per_100g:     0,
          fat_per_100g:       3.6,
          sort_order:         0,
        },
        {
          recipe_id:          createdRecipeId,
          food_name:          'Brown Rice',
          weight_g:           100,
          calories_per_100g:  112,
          protein_per_100g:   2.6,
          carbs_per_100g:     24,
          fat_per_100g:       0.9,
          sort_order:         1,
        },
      ]);

    expect(error).toBeNull();
  });

  it('recipe ingredients are fetchable via the recipe id', async () => {
    if (!createdRecipeId) return;

    const { data, error } = await sb
      .from('recipe_ingredients')
      .select('id, food_name, weight_g')
      .eq('recipe_id', createdRecipeId)
      .order('sort_order');

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data![0].food_name).toBe('Chicken Breast');
    expect(data![1].food_name).toBe('Brown Rice');
  });

  it('trainer can update a recipe name', async () => {
    if (!createdRecipeId) return;

    const { error } = await sb
      .from('recipes')
      .update({ name: '__integration_recipe_updated__' })
      .eq('id', createdRecipeId);

    expect(error).toBeNull();

    const { data } = await sb
      .from('recipes')
      .select('name')
      .eq('id', createdRecipeId)
      .single();

    expect(data?.name).toBe('__integration_recipe_updated__');
  });

  it('trainer can delete a recipe (cascades to ingredients)', async () => {
    // Create a separate recipe to delete so the primary recipe stays for client tests
    const { data: toDelete } = await sb
      .from('recipes')
      .insert({
        client_id:  CLIENT_ID,
        trainer_id: trainerId,
        name:       '__delete_me_recipe__',
      })
      .select('id')
      .single();

    await sb.from('recipe_ingredients').insert({
      recipe_id: toDelete!.id,
      food_name: 'Test Ingredient',
      weight_g:  50,
    });

    const { error, count } = await sb
      .from('recipes')
      .delete({ count: 'exact' })
      .eq('id', toDelete!.id);

    expect(error).toBeNull();
    expect(count).toBe(1);

    // Ingredients should have cascaded
    const { data: leftover } = await sb
      .from('recipe_ingredients')
      .select('id')
      .eq('recipe_id', toDelete!.id);

    expect(leftover).toHaveLength(0);
  });

  it('RLS — trainer only sees recipes belonging to their own clients', async () => {
    const { data, error } = await sb
      .from('recipes')
      .select('id, trainer_id');

    expect(error).toBeNull();
    for (const row of data ?? []) {
      expect(row.trainer_id).toBe(trainerId);
    }
  });
});

maybeDescribeAll('Recipes integration — client access', () => {
  let trainerSb: SupabaseClient;
  let clientSb:  SupabaseClient;
  let trainerId:  string;
  let recipeId:   string | null = null;

  beforeAll(async () => {
    trainerSb = buildClient();
    const { data: td, error: te } = await trainerSb.auth.signInWithPassword({
      email: TRAINER_EMAIL!,
      password: TRAINER_PASSWORD!,
    });
    if (te || !td.user) throw new Error(`Trainer sign-in failed: ${te?.message}`);
    trainerId = td.user.id;

    // Create a recipe for the client to read
    const { data: r } = await trainerSb
      .from('recipes')
      .insert({
        client_id:  CLIENT_ID,
        trainer_id: trainerId,
        name:       '__client_read_recipe__',
      })
      .select('id')
      .single();
    recipeId = r!.id;

    await trainerSb.from('recipe_ingredients').insert({
      recipe_id: recipeId,
      food_name: 'Oats',
      weight_g:  80,
      calories_per_100g: 389,
      protein_per_100g:  17,
      carbs_per_100g:    66,
      fat_per_100g:      7,
    });

    clientSb = buildClient();
    const { data: cd, error: ce } = await clientSb.auth.signInWithPassword({
      email: CLIENT_EMAIL!,
      password: CLIENT_PASSWORD!,
    });
    if (ce || !cd.user) throw new Error(`Client sign-in failed: ${ce?.message}`);
  });

  afterAll(async () => {
    if (recipeId) {
      await trainerSb.from('recipe_ingredients').delete().eq('recipe_id', recipeId);
      await trainerSb.from('recipes').delete().eq('id', recipeId);
    }
    await trainerSb.auth.signOut();
    await clientSb.auth.signOut();
  });

  it('client can read their own recipes', async () => {
    const { data, error } = await clientSb
      .from('recipes')
      .select('id, name, client_id')
      .eq('id', recipeId!);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].name).toBe('__client_read_recipe__');
    expect(data![0].client_id).toBe(CLIENT_ID);
  });

  it('client can read ingredients for their own recipe', async () => {
    const { data, error } = await clientSb
      .from('recipe_ingredients')
      .select('id, food_name')
      .eq('recipe_id', recipeId!);

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);
    expect(data![0].food_name).toBe('Oats');
  });

  it('RLS — client only sees recipes for their own client_id', async () => {
    const { data, error } = await clientSb
      .from('recipes')
      .select('id, client_id');

    expect(error).toBeNull();
    for (const row of data ?? []) {
      expect(row.client_id).toBe(CLIENT_ID);
    }
  });
});
