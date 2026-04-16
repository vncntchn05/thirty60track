/**
 * Nutrition AI utility.
 *
 * Follows the same Edge Function delegation pattern as lib/anthropic.ts.
 * Set NUTRITION_AI_ENABLED = true and deploy the `nutrition-ai` Edge Function
 * with ANTHROPIC_API_KEY to activate live generation.
 *
 * While disabled, all functions return deterministic mock data so the UI is
 * fully testable without API costs.
 */

import { supabase } from '@/lib/supabase';
import type {
  NutritionGuideContent,
  MealPlanData,
  NutritionGuideSupplement,
} from '@/types';

// ─── Encyclopedia reference helpers ──────────────────────────
//
// Embed these markers in any AI response text. NutritionChat's
// MessageBubble parses them and renders tappable gold links.
//
// Format: [[N:topicId|display label]]  → Nutrition Encyclopedia
//         [[E:muscleGroup|display label]] → Exercise Encyclopedia

/** Create an inline Nutrition Encyclopedia reference. */
export function nRef(topicId: string, label: string): string {
  return `[[N:${topicId}|${label}]]`;
}

/** Create an inline Exercise Encyclopedia reference. */
export function eRef(muscleGroup: string, label: string): string {
  return `[[E:${muscleGroup}|${label}]]`;
}

// Valid Nutrition Encyclopedia topic IDs (from NutritionEncyclopedia.tsx)
export const NUTRITION_ENCYCLOPEDIA_IDS = [
  'protein', 'carbohydrates', 'fats', 'dieting', 'hydration',
  'vitamins', 'vitamin-a', 'thiamin', 'riboflavin', 'niacin',
  'pantothenic-acid', 'vitamin-b6', 'biotin', 'folate', 'vitamin-b12',
  'vitamin-c', 'vitamin-d', 'vitamin-e', 'vitamin-k',
  'minerals', 'calcium', 'iron', 'magnesium', 'zinc', 'potassium',
  'selenium', 'iodine', 'copper', 'chromium', 'manganese',
  'molybdenum', 'phosphorus', 'sodium', 'fluoride',
  'omega3', 'probiotics', 'coq10',
] as const;

// Valid Exercise Encyclopedia muscle groups (from EncyclopediaPanel.tsx)
export const EXERCISE_ENCYCLOPEDIA_MUSCLES = [
  'Chest', 'Shoulders', 'Arms', 'Core', 'Hips',
  'Back', 'Glutes', 'Hands', 'Feet', 'Legs',
] as const;

// ─── Feature flag ─────────────────────────────────────────────

/**
 * Master toggle for AI nutrition features.
 * Set to `true` to enable; requires the `nutrition-ai` Edge Function to be
 * deployed and ANTHROPIC_API_KEY set via `supabase secrets set`.
 */
export const NUTRITION_AI_ENABLED = false;

// ─── Client context fed to the AI ────────────────────────────

export type WorkoutHistorySummary = {
  performed_at: string;
  exercises: string[];
  muscle_groups: string[];
  total_sets: number;
  estimated_volume_kg: number;
};

export type PersonalRecordSummary = {
  exercise_name: string;
  muscle_group: string | null;
  max_weight_kg: number | null;
  max_reps: number | null;
};

export type WorkoutStatsContext = {
  total_workouts: number;
  avg_per_week: number;
  weeks_tracked: number;
  most_trained_muscles: string[];
  least_trained_muscles: string[];
  days_since_last_workout: number | null;
};

export type NutritionClientContext = {
  full_name: string;
  gender: 'male' | 'female' | 'other' | null;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  bf_percent: number | null;
  // intake fields
  goals: string | null;
  goal_timeframe: string | null;
  activity_level: string | null;
  current_injuries: string | null;
  chronic_conditions: string | null;
  medications: string | null;
  // M034 additions
  allergies: string | null;
  dietary_restrictions: string | null;
  training_frequency_per_week: number | null;
  typical_session_length_minutes: number | null;
  outside_gym_activity_level: string | null;
  // workout history (last ~8 weeks / 20 sessions) — optional; populated by NutritionChat
  recent_workouts?: WorkoutHistorySummary[] | null;
  personal_records?: PersonalRecordSummary[] | null;
  workout_stats?: WorkoutStatsContext | null;
};

// ─── Mock data ────────────────────────────────────────────────

const MOCK_GUIDE_CONTENT: NutritionGuideContent = {
  calories: 2400,
  protein_g: 180,
  carbs_g: 250,
  fat_g: 75,
  meal_timing:
    'Eat 4–5 meals spaced 3–4 hours apart. Prioritise protein at every meal. ' +
    'Consume 30–50g carbohydrates within 1 hour pre-workout for energy, and ' +
    '25–40g protein within 45 minutes post-workout to maximise muscle protein synthesis.',
  foods_to_prioritise: [
    'Chicken breast, turkey, lean beef, white fish',
    'Eggs and egg whites',
    'Oats, brown rice, sweet potato, quinoa',
    'Broccoli, spinach, mixed greens, bell peppers',
    'Greek yogurt (plain, non-fat), cottage cheese',
    'Blueberries, bananas, apples',
    'Olive oil, avocado, mixed nuts (in moderation)',
  ],
  foods_to_avoid: [
    'Heavily processed foods, refined white bread, pastries',
    'Sugary drinks, fruit juices, energy drinks',
    'Fried foods, fast food',
    'Alcohol — disrupts recovery and sleep quality',
    'Excessive sodium (processed meats, canned soups)',
  ],
  supplements: [
    {
      name: 'Creatine Monohydrate',
      dose: '5g daily',
      timing: 'Post-workout or any consistent time',
      encyclopediaId: null,
    },
    {
      name: 'Whey Protein',
      dose: '25–30g',
      timing: 'Post-workout within 45 minutes',
      encyclopediaId: 'protein',
    },
    {
      name: 'Omega-3 (Fish Oil)',
      dose: '2–3g EPA/DHA combined',
      timing: 'With a meal, once daily',
      encyclopediaId: 'omega3',
    },
    {
      name: 'Vitamin D3',
      dose: '2000–4000 IU',
      timing: 'Morning with food',
      encyclopediaId: 'vitamin-d',
    },
    {
      name: 'Magnesium Glycinate',
      dose: '300–400mg',
      timing: '30 minutes before bed — aids sleep and recovery',
      encyclopediaId: 'magnesium',
    },
  ],
  notes:
    'Adjust calorie intake based on weekly progress: if weight is not changing after 2 weeks, ' +
    'decrease by 150–200 kcal/day. Aim for 0.5–1kg per week rate of change for fat loss, or ' +
    '0.25–0.5kg per week for lean gains. Track for at least 5 days per week for meaningful data.',
};

const MOCK_MEAL_PLAN_DATA: MealPlanData = {
  days: [
    {
      day: 'Monday',
      meals: [
        {
          name: 'Breakfast',
          time: '7:00 AM',
          foods: ['Oats (80g dry) with mixed berries', '3 whole eggs scrambled', 'Black coffee or green tea'],
          calories: 620,
          protein_g: 38,
          carbs_g: 72,
          fat_g: 18,
        },
        {
          name: 'Lunch',
          time: '12:00 PM',
          foods: ['Grilled chicken breast (200g)', 'Brown rice (150g cooked)', 'Steamed broccoli + mixed greens', 'Olive oil drizzle (1 tsp)'],
          calories: 680,
          protein_g: 55,
          carbs_g: 68,
          fat_g: 14,
        },
        {
          name: 'Pre-workout Snack',
          time: '3:30 PM',
          foods: ['Banana', 'Greek yogurt (150g, plain)', '1 tbsp honey'],
          calories: 310,
          protein_g: 15,
          carbs_g: 58,
          fat_g: 3,
        },
        {
          name: 'Dinner',
          time: '7:30 PM',
          foods: ['Salmon fillet (180g, baked)', 'Sweet potato (200g, baked)', 'Large mixed salad with olive oil'],
          calories: 590,
          protein_g: 46,
          carbs_g: 45,
          fat_g: 22,
        },
        {
          name: 'Evening Snack',
          time: '9:30 PM',
          foods: ['Cottage cheese (200g)', 'Mixed nuts (20g)'],
          calories: 220,
          protein_g: 26,
          carbs_g: 7,
          fat_g: 10,
        },
      ],
      supplements: [
        { time: 'Morning', items: ['Vitamin D3 2000 IU', 'Omega-3 2g (with breakfast)'] },
        { time: 'Pre-workout', items: ['Creatine 5g (mixed with water)'] },
        { time: 'Post-workout', items: ['Whey Protein 30g (within 45 min)'] },
        { time: 'Night', items: ['Magnesium Glycinate 300mg (30 min before bed)'] },
      ],
      swap_suggestions: [
        'No chicken? Swap for turkey breast or canned tuna',
        'No salmon? Swap for white fish (cod, tilapia) + 1 tsp olive oil',
        'No sweet potato? Swap for 120g brown rice or 2 slices wholegrain bread',
      ],
    },
    {
      day: 'Tuesday',
      meals: [
        {
          name: 'Breakfast',
          time: '7:00 AM',
          foods: ['Wholegrain toast (2 slices)', '4 egg whites + 1 whole egg omelette', 'Sliced avocado (½)', 'Fresh fruit cup'],
          calories: 560,
          protein_g: 36,
          carbs_g: 55,
          fat_g: 18,
        },
        {
          name: 'Lunch',
          time: '12:00 PM',
          foods: ['Lean beef mince stir-fry (180g)', 'Stir-fried mixed vegetables', 'White rice (150g cooked)', 'Low-sodium soy sauce'],
          calories: 650,
          protein_g: 48,
          carbs_g: 65,
          fat_g: 16,
        },
        {
          name: 'Snack',
          time: '4:00 PM',
          foods: ['Apple', 'String cheese (2)', 'Rice cakes (3)'],
          calories: 300,
          protein_g: 14,
          carbs_g: 44,
          fat_g: 8,
        },
        {
          name: 'Dinner',
          time: '7:30 PM',
          foods: ['Turkey breast (200g, grilled)', 'Quinoa (150g cooked)', 'Roasted vegetables (courgette, capsicum, onion)'],
          calories: 610,
          protein_g: 52,
          carbs_g: 58,
          fat_g: 12,
        },
        {
          name: 'Evening Snack',
          time: '9:30 PM',
          foods: ['Greek yogurt (150g)', 'Blueberries (80g)', '10g hemp seeds'],
          calories: 220,
          protein_g: 17,
          carbs_g: 25,
          fat_g: 6,
        },
      ],
      supplements: [
        { time: 'Morning', items: ['Vitamin D3 2000 IU', 'Omega-3 2g'] },
        { time: 'Pre-workout', items: ['Creatine 5g'] },
        { time: 'Post-workout', items: ['Whey Protein 30g'] },
        { time: 'Night', items: ['Magnesium Glycinate 300mg'] },
      ],
      swap_suggestions: [
        'No turkey? Swap for chicken thigh (skinless) or lean pork loin',
        'No quinoa? Swap for brown rice or buckwheat',
      ],
    },
  ],
  notes:
    'Repeat Monday–Tuesday patterns across the week, adjusting portions to match hunger on rest days. ' +
    'Aim to hit protein target every day; carbs and fat can flex ±15% based on training intensity. ' +
    'Rest-day calories: reduce by 200–250 kcal by dropping the pre-workout snack.',
};

// ─── Mock AI chat responses ───────────────────────────────────

export function getMockChatResponse(
  message: string,
  context?: NutritionClientContext | null,
): string {
  const lower = message.toLowerCase();

  if (lower.includes('mcdonald') || lower.includes('mcdonalds') || lower.includes('burger king') || lower.includes('fast food')) {
    return (
      "**Fast Food Picks — Best Options:**\n\n" +
      "**McDonald's:**\n" +
      "• Grilled Chicken Sandwich (~360 kcal, 37g protein) — best choice\n" +
      "• Side salad + balsamic dressing\n" +
      "• Water or unsweetened iced tea\n" +
      "• Skip: fries (400+ kcal), milkshakes, sauces\n\n" +
      "**Tip:** Ask for extra chicken and no sauce. Protein first."
    );
  }
  if (lower.includes('kfc') || lower.includes('fried chicken')) {
    return (
      "**KFC Best Picks:**\n\n" +
      "• Grilled chicken pieces (not original recipe) — much lower fat\n" +
      "• Corn on the cob as your side\n" +
      "• Avoid biscuits, coleslaw with dressing, and extra gravy\n\n" +
      "Grilled breast: ~180 kcal, 33g protein. Solid if you're in a pinch."
    );
  }
  if (lower.includes('subway')) {
    return (
      "**Subway Best Picks:**\n\n" +
      "• 6\" Turkey or Chicken on wholegrain bread (~350–400 kcal)\n" +
      "• Load up on veggies (free macros)\n" +
      "• Mustard or vinegar instead of mayo/ranch\n" +
      "• Double meat if you need more protein (+~100 kcal, +20g protein)"
    );
  }
  if (lower.includes('breakfast') || lower.includes('morning')) {
    return (
      "**Breakfast Ideas (high-protein):**\n\n" +
      `1. **Egg & oat combo** — 3 eggs + 80g oats + berries → ~600 kcal, 38g ${nRef('protein', 'protein')}\n` +
      `2. **Greek yogurt bowl** — 200g plain Greek yogurt + banana + 15g honey + seeds → ~450 kcal, 24g ${nRef('protein', 'protein')}\n` +
      `3. **Protein pancakes** — 1 scoop protein powder + 1 egg + 50g oats blended → ~400 kcal, 32g ${nRef('protein', 'protein')}\n\n` +
      `Aim for 30–40g ${nRef('protein', 'protein')} at breakfast to kick-start muscle protein synthesis.`
    );
  }
  if (lower.includes('lunch')) {
    return (
      "**Lunch Ideas:**\n\n" +
      "1. **Chicken & rice bowl** — 180g grilled chicken, 150g rice, roasted veg, drizzle of olive oil → ~650 kcal\n" +
      "2. **Tuna salad wrap** — 1 can tuna, mixed greens, avocado, wholegrain wrap → ~500 kcal\n" +
      "3. **Lentil soup + bread** — 300ml lentil soup + 1 slice sourdough → ~480 kcal\n\n" +
      "Keep it simple — prep the night before to avoid off-plan choices."
    );
  }
  if (lower.includes('dinner') || lower.includes('supper')) {
    return (
      "**Dinner Ideas:**\n\n" +
      "1. **Salmon + sweet potato** — 180g baked salmon, 200g sweet potato, salad → ~590 kcal, 46g protein\n" +
      "2. **Turkey bolognese** — 180g turkey mince, tomato sauce, 100g pasta (dry) → ~620 kcal, 52g protein\n" +
      "3. **Stir-fry** — Lean beef strips, broccoli, snap peas, bok choy, brown rice → ~580 kcal, 45g protein\n\n" +
      "Keep dinner moderate in carbs if training in the morning."
    );
  }
  if (lower.includes('snack')) {
    return (
      "**Snack Ideas (aligned with your targets):**\n\n" +
      "• Greek yogurt + berries (~200 kcal, 17g protein)\n" +
      "• Cottage cheese + apple (~220 kcal, 20g protein)\n" +
      "• Rice cakes + nut butter (~280 kcal, 8g protein)\n" +
      "• Protein shake + banana (~280 kcal, 28g protein)\n" +
      "• Hard-boiled eggs × 2 + raw veg (~180 kcal, 14g protein)\n\n" +
      "Best pre-workout: banana + Greek yogurt (~310 kcal). Best pre-bed: cottage cheese (casein protein)."
    );
  }
  if (lower.includes('cheat') || lower.includes('treat')) {
    return (
      "**Cheat Meal Tips:**\n\n" +
      "Your trainer has set a cheat meal cadence to help you stay consistent without feeling deprived.\n\n" +
      "Best approach:\n" +
      "• Keep it to one meal, not a full day\n" +
      "• Eat normally before the cheat meal — don't 'save up' calories\n" +
      "• Choose what you genuinely enjoy; it's psychological, not just caloric\n" +
      "• Get back on plan at the next meal — no guilt, no overcompensation\n\n" +
      "Cheat meals, when planned, can actually support adherence and metabolic adaptation."
    );
  }
  if (lower.includes('recipe') || lower.includes('cook')) {
    return (
      "**Quick High-Protein Recipes:**\n\n" +
      "**1. Egg Muffins (meal-prep friendly)**\n" +
      "• 6 eggs, diced capsicum, spinach, feta → bake in muffin tin 18 min at 180°C\n" +
      "• Per muffin: ~90 kcal, 7g protein\n\n" +
      "**2. Overnight Oats**\n" +
      "• 80g oats, 250ml milk, 1 scoop protein powder, mixed berries — refrigerate overnight\n" +
      "• ~450 kcal, 38g protein\n\n" +
      "**3. One-pan Chicken**\n" +
      "• Season 2 chicken breasts, sear 3 min/side, finish in oven at 200°C for 15 min\n" +
      "• Serve with roasted veg on the same tray\n\n" +
      "Check your saved Recipes tab to add these to a meal log."
    );
  }
  if (lower.includes('supplement') || lower.includes('protein powder') || lower.includes('creatine')) {
    return (
      "**Supplement Guidance:**\n\n" +
      "Based on your nutrition guide:\n" +
      `• **Creatine Monohydrate 5g/day** — loading not required; consistent daily use saturates muscle stores in 2–3 weeks\n` +
      `• **Whey Protein** — post-workout, ideally within 45 min; see ${nRef('protein', 'Protein')} for complete guidance on timing and dosing\n` +
      `• **${nRef('omega3', 'Omega-3')} 2–3g EPA/DHA** — anti-inflammatory, supports joint health and mood\n` +
      `• **${nRef('vitamin-d', 'Vitamin D3')} 2000–4000 IU** — most people are deficient; critical for testosterone and immune function\n` +
      `• **${nRef('magnesium', 'Magnesium Glycinate')}** — vastly underrated for sleep quality and recovery\n\n` +
      `Also relevant: ${nRef('zinc', 'Zinc')} for testosterone, ${nRef('probiotics', 'Probiotics')} for gut health and immunity.`
    );
  }
  if (lower.includes('calorie') || lower.includes('macro') || lower.includes('protein') || lower.includes('carb') || lower.includes('fat')) {
    return (
      "**Your Current Macro Targets:**\n\n" +
      "Check your Nutrition Guide tab for personalised targets based on your body metrics, goals, and training volume.\n\n" +
      "**General principles:**\n" +
      `• ${nRef('protein', 'Protein')}: 1.6–2.2g per kg of bodyweight daily — the single most impactful lever\n` +
      `• ${nRef('carbohydrates', 'Carbs')}: fuel training sessions; higher on training days, lower on rest days\n` +
      `• ${nRef('fats', 'Fat')}: minimum 0.5g/kg for hormone health — don't drop below this\n` +
      `• ${nRef('hydration', 'Hydration')}: often overlooked; even 2% dehydration impairs strength and focus\n\n` +
      `Tracking daily in the Log tab gives you the most accurate picture of adherence. See ${nRef('dieting', 'Dieting & Calorie Targets')} for the science behind calorie management.`
    );
  }

  // ── Workout & exercise recommendations ──────────────────────────────
  if (lower.includes('workout') && (lower.includes('recommend') || lower.includes('suggest') || lower.includes('what should'))) {
    const stats = context?.workout_stats;
    const leastMuscles = stats?.least_trained_muscles?.slice(0, 2) ?? [];
    const leastLabels = leastMuscles
      .map((m) => eRef(m, m))
      .join(' and ') || `${eRef('Back', 'Back')} and ${eRef('Legs', 'Legs')}`;
    const daysSince = stats?.days_since_last_workout;
    const restNote = daysSince != null && daysSince >= 2
      ? `You last trained ${daysSince} day${daysSince !== 1 ? 's' : ''} ago — good time to hit it again.`
      : 'Make sure to include adequate rest between sessions.';
    return (
      "**Workout Recommendation:**\n\n" +
      `Based on your recent training history, consider focusing on ${leastLabels} — they appear underrepresented in your recent sessions.\n\n` +
      "**Suggested session structure:**\n" +
      "• 5–10 min warm-up (light cardio + dynamic stretching)\n" +
      "• 3–4 compound lifts (e.g. squat, deadlift, press, row) — 3–4 sets × 6–10 reps\n" +
      "• 2–3 isolation accessories — 3 sets × 10–15 reps\n" +
      "• 5–10 min cool-down + static stretching\n\n" +
      `${restNote}\n\n` +
      "**Nutrition around this session:**\n" +
      `• Pre-workout: 30–50g ${nRef('carbohydrates', 'carbs')} + 20g ${nRef('protein', 'protein')} 60–90 min before\n` +
      `• Post-workout: 25–40g ${nRef('protein', 'protein')} within 45 min; replenish ${nRef('carbohydrates', 'carbs')} within 2 hours`
    );
  }
  if (lower.includes('exercise') && (lower.includes('recommend') || lower.includes('suggest') || lower.includes('should i do'))) {
    const prs = context?.personal_records?.slice(0, 3) ?? [];
    const prText = prs.length > 0
      ? `Your current PRs include: ${prs.map((p) => `${p.exercise_name} (${p.max_weight_kg ?? 'BW'}kg × ${p.max_reps ?? '–'} reps)`).join(', ')}.`
      : '';
    return (
      "**Exercise Recommendations:**\n\n" +
      (prText ? `${prText}\n\n` : '') +
      "**For strength + body composition:**\n" +
      `• **Squat** — king of lower body; builds ${eRef('Legs', 'quads')}, ${eRef('Glutes', 'glutes')}, ${eRef('Core', 'core')}\n` +
      `• **Deadlift** — total posterior chain; high caloric cost — see ${eRef('Back', 'Back')} and ${eRef('Legs', 'Legs')}\n` +
      `• **Bench Press** — ${eRef('Chest', 'chest')}, ${eRef('Shoulders', 'shoulders')}, ${eRef('Arms', 'triceps')}\n` +
      `• **Pull-ups / Lat Pulldown** — ${eRef('Back', 'back')} width and thickness\n` +
      `• **Overhead Press** — ${eRef('Shoulders', 'shoulder')} strength and stability\n` +
      `• **Romanian Deadlift** — ${eRef('Legs', 'hamstring')} isolation\n\n` +
      "**Progressive overload tip:** Add 2.5–5kg when you can complete all reps with good form for 2 consecutive sessions."
    );
  }
  if (lower.includes('muscle') && (lower.includes('build') || lower.includes('gain') || lower.includes('grow') || lower.includes('weak'))) {
    const stats = context?.workout_stats;
    const leastMuscles = stats?.least_trained_muscles?.slice(0, 2) ?? [];
    const leastLabel = leastMuscles.length
      ? `Your training data shows ${leastMuscles.map((m) => eRef(m, m)).join(' and ')} are trained least frequently.`
      : '';
    return (
      "**Building Lagging Muscle Groups:**\n\n" +
      (leastLabel ? `${leastLabel} Prioritise these first in your sessions when energy is highest.\n\n` : '') +
      "**Key principles for muscle growth:**\n" +
      "• **Volume**: 10–20 sets per muscle group per week\n" +
      "• **Intensity**: Train in the 6–20 rep range with 2–4 RIR (reps in reserve)\n" +
      "• **Frequency**: Hit each muscle group 2× per week minimum\n" +
      `• **Nutrition**: ${nRef('protein', 'Protein')} at 2g/kg bodyweight; caloric surplus of 200–300 kcal for lean gaining\n\n` +
      "**Practical split:**\n" +
      `• Upper / Lower (4 days) — ${eRef('Chest', 'Chest')} + ${eRef('Back', 'Back')} + ${eRef('Shoulders', 'Shoulders')} vs ${eRef('Legs', 'Legs')} + ${eRef('Glutes', 'Glutes')}\n` +
      `• Push / Pull / Legs (6 days) — higher frequency per muscle`
    );
  }
  if (lower.includes('recovery') || lower.includes('rest day') || lower.includes('sore') || lower.includes('overtraining')) {
    const stats = context?.workout_stats;
    const freq = stats?.avg_per_week;
    const highFreqNote = freq && freq > 5
      ? `At ${freq.toFixed(1)} sessions/week, you may benefit from a dedicated deload week every 4–6 weeks.`
      : '';
    return (
      "**Recovery & Rest Day Nutrition:**\n\n" +
      (highFreqNote ? `${highFreqNote}\n\n` : '') +
      "**Rest day nutrition adjustments:**\n" +
      `• Reduce ${nRef('carbohydrates', 'carbs')} by 50–100g (less glycogen demand without training)\n` +
      `• Keep ${nRef('protein', 'protein')} the same or higher — muscle repair continues 24–48h post-workout\n` +
      "• Prioritise sleep: growth hormone peaks in deep sleep; 7–9 hours is the target\n\n" +
      "**Active recovery options:**\n" +
      "• 20–30 min low-intensity walking or cycling\n" +
      "• Foam rolling + stretching (10–15 min)\n" +
      "• Swimming or yoga\n\n" +
      "**Soreness (DOMS):**\n" +
      "• Tart cherry juice (480ml/day) has evidence for reducing DOMS\n" +
      `• ${nRef('magnesium', 'Magnesium Glycinate')} (bedtime) aids muscle relaxation and sleep quality\n` +
      "• Contrast shower (hot 3 min → cold 1 min × 3 rounds) can help"
    );
  }
  if (lower.includes('progressive overload') || lower.includes('plateau') || lower.includes('stuck') || lower.includes('not progressing')) {
    const prs = context?.personal_records ?? [];
    const prNote = prs.length > 0
      ? `Looking at your PRs: ${prs.slice(0, 2).map((p) => `${p.exercise_name} at ${p.max_weight_kg ?? 'BW'}kg`).join(', ')}. These are your current benchmarks to beat.`
      : '';
    return (
      "**Breaking Through a Plateau:**\n\n" +
      (prNote ? `${prNote}\n\n` : '') +
      "**Progression strategies:**\n" +
      "• **Double progression**: Add reps before weight (e.g. 3×8 → 3×10 → add weight → 3×8 again)\n" +
      "• **Microloading**: Use 1.25kg plates — smaller jumps allow more consistent progress\n" +
      "• **Deload week**: Drop volume/intensity 40–50% for 1 week; come back stronger\n" +
      "• **Technique work**: Sometimes a plateau = a technique cap, not a strength cap\n\n" +
      "**Nutrition checklist for plateaus:**\n" +
      `• Are you eating enough? Undereating stalls strength gains even at the same bodyweight — see ${nRef('dieting', 'Calorie Targets')}\n` +
      `• ${nRef('protein', 'Protein')}: hitting 1.8–2.2g/kg daily?\n` +
      "• Sleep: 7–9 hours? Sleep debt directly impairs force production"
    );
  }

  // Default
  return (
    "I can help you with:\n\n" +
    "• **Meal ideas** — 'What should I eat for breakfast?'\n" +
    "• **Fast food picks** — 'What to order from McDonald's?'\n" +
    "• **Snack suggestions** — 'What's a good pre-workout snack?'\n" +
    "• **Workout recommendations** — 'What workout should I do today?'\n" +
    "• **Exercise guidance** — 'What exercises should I do to build my back?'\n" +
    "• **Recovery tips** — 'How should I eat on rest days?'\n" +
    "• **Supplement questions** — 'When should I take creatine?'\n" +
    "• **Macro guidance** — 'How much protein do I need?'\n\n" +
    `Tap any highlighted term in my responses to open the ${nRef('protein', 'Nutrition')} or ` +
    `${eRef('Back', 'Exercise')} encyclopedia for deeper reading.\n\n` +
    "What would you like to know?"
  );
}

// ─── Edge Function calls ──────────────────────────────────────

export async function generateNutritionGuide(
  context: NutritionClientContext,
): Promise<{ content: NutritionGuideContent | null; error: string | null }> {
  if (!NUTRITION_AI_ENABLED) {
    return { content: MOCK_GUIDE_CONTENT, error: null };
  }
  try {
    const { data, error } = await supabase.functions.invoke('nutrition-ai', {
      body: { action: 'generate_guide', context },
    });
    if (error) return { content: null, error: error.message };
    return { content: data as NutritionGuideContent, error: null };
  } catch (err) {
    return { content: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function generateMealPlan(
  context: NutritionClientContext,
  guide: NutritionGuideContent,
  planType: 'daily' | 'weekly',
): Promise<{ data: MealPlanData | null; error: string | null }> {
  if (!NUTRITION_AI_ENABLED) {
    return { data: MOCK_MEAL_PLAN_DATA, error: null };
  }
  try {
    const { data, error } = await supabase.functions.invoke('nutrition-ai', {
      body: { action: 'generate_meal_plan', context, guide, planType },
    });
    if (error) return { data: null, error: error.message };
    return { data: data as MealPlanData, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getNutritionChatResponse(
  message: string,
  context: NutritionClientContext,
  guide: NutritionGuideContent | null,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<{ reply: string | null; error: string | null }> {
  if (!NUTRITION_AI_ENABLED) {
    return { reply: getMockChatResponse(message, context), error: null };
  }
  try {
    const { data, error } = await supabase.functions.invoke('nutrition-ai', {
      body: { action: 'chat', message, context, guide, history },
    });
    if (error) return { reply: null, error: error.message };
    return { reply: (data as { reply: string }).reply, error: null };
  } catch (err) {
    return { reply: null, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Helpers ──────────────────────────────────────────────────

/** Map macro/supplement names to NutritionEncyclopedia topic IDs. */
export const ENCYCLOPEDIA_ID_MAP: Record<string, string> = {
  protein: 'protein',
  carbs: 'carbohydrates',
  carbohydrates: 'carbohydrates',
  fat: 'fats',
  fats: 'fats',
  'dietary fat': 'fats',
  'omega-3': 'omega3',
  'omega 3': 'omega3',
  'fish oil': 'omega3',
  'vitamin d': 'vitamin-d',
  'vitamin d3': 'vitamin-d',
  magnesium: 'magnesium',
  zinc: 'zinc',
  calcium: 'calcium',
  iron: 'iron',
  potassium: 'potassium',
  selenium: 'selenium',
  probiotics: 'probiotics',
  'coq10': 'coq10',
  'coenzyme q10': 'coq10',
};

/** Returns days until the next cheat meal is due, or 0 if it's due today/overdue. */
export function daysUntilCheatMeal(
  lastDate: string | null,
  everyNDays: number,
): number {
  if (!lastDate) return 0; // never had one → overdue
  const last = new Date(lastDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);
  const daysSince = Math.floor((today.getTime() - last.getTime()) / 86_400_000);
  const remaining = everyNDays - daysSince;
  return Math.max(0, remaining);
}

export function isCheatMealDue(
  lastDate: string | null,
  everyNDays: number,
): boolean {
  return daysUntilCheatMeal(lastDate, everyNDays) === 0;
}
