/**
 * Trainer AI utility — training recommendations, programming tips,
 * client management advice, and nutrition guidance for coaches.
 *
 * Mirrors the pattern in lib/nutritionAI.ts.
 * Set NUTRITION_AI_ENABLED = true and deploy the `nutrition-ai`
 * Edge Function to activate live responses.
 */

import { supabase } from '@/lib/supabase';
import { NUTRITION_AI_ENABLED, nRef, eRef } from '@/lib/nutritionAI';

// ─── Trainer context ──────────────────────────────────────────

export type TrainerAIContext = {
  full_name: string;
  email: string;
  total_clients?: number | null;
};

// ─── Mock responses ───────────────────────────────────────────

export function getTrainerMockResponse(
  message: string,
  context?: TrainerAIContext | null,
): string {
  const lower = message.toLowerCase();
  const name = context?.full_name?.split(' ')[0] ?? 'Coach';

  // ── Program design ────────────────────────────────────────
  if (lower.includes('beginner') || lower.includes('new client') || lower.includes('starting out')) {
    return (
      `**Beginner Program Template (${name})**\n\n` +
      "**Phase 1 — Foundation (Weeks 1–4):**\n" +
      "• 3 full-body sessions/week (Mon/Wed/Fri)\n" +
      "• Focus: movement patterns — squat, hinge, push, pull, carry\n" +
      "• Sets/reps: 3×8–10 at ~60–65% 1RM; rest 90s\n" +
      "• Priority: technique over load — video review every session\n\n" +
      "**Phase 2 — Volume Build (Weeks 5–8):**\n" +
      "• Add 1 session → 4 days (Upper/Lower split)\n" +
      "• Introduce progressive overload: +2.5kg or +1 rep each week\n" +
      "• Introduce RPE scale (target RPE 7–8)\n\n" +
      "**Key coaching points:**\n" +
      "• Keep session length ≤ 60 min initially — fatigue management\n" +
      "• Log everything from day 1 — clients who track progress retain longer\n" +
      "• Set a 4-week check-in: reassess goals, adjust program"
    );
  }

  if (lower.includes('progressive overload') || lower.includes('plateau') || lower.includes('stuck')) {
    return (
      "**Breaking Plateaus — Progressive Overload Toolkit:**\n\n" +
      "When load increases stall, try these levers in order:\n\n" +
      "1. **Double progression** — target rep range e.g. 3×8–12; add load only when all sets hit 12\n" +
      "2. **Volume increase** — add a set before increasing load (3×8 → 4×8 → 4×10 → add weight)\n" +
      "3. **Tempo manipulation** — 3-1-1 tempo increases TUT without changing load\n" +
      "4. **Mechanical drop sets** — start with hardest variation, fatigue into easier (pull-ups → lat pulldown)\n" +
      "5. **Periodisation shift** — 4-week deload then restart at 70% with new rep scheme\n\n" +
      "**Identify the real bottleneck first:**\n" +
      "• Sleep < 7h? Recovery is limiting, not programming\n" +
      "• Calories in a deficit? Can't build while undereating — reassess nutrition\n" +
      "• Technique breakdown at failure? Regression before progression"
    );
  }

  if (lower.includes('ppl') || lower.includes('push pull leg') || lower.includes('push/pull')) {
    return (
      "**PPL Split — 6-Day Template:**\n\n" +
      "**Push (Mon/Thu):** Chest, Shoulders, Triceps\n" +
      "• Flat bench / OHP / Incline DB press / Lateral raises / Tricep pushdown\n" +
      "• 4–5 exercises, 3–4 sets each, 8–12 reps\n\n" +
      "**Pull (Tue/Fri):** Back, Biceps, Rear Delts\n" +
      "• Deadlift or Romanian DL / Pull-up or lat pulldown / Cable row / Face pulls / Curl\n" +
      "• 4–5 exercises, 3–4 sets each, 6–12 reps (heavier on compounds)\n\n" +
      "**Legs (Wed/Sat):** Quads, Hamstrings, Calves\n" +
      "• Squat / Romanian DL / Leg press / Leg curl / Calf raise\n" +
      "• 5 exercises, 3–4 sets, 8–15 reps\n\n" +
      "**Notes:** Intermediate+ clients only; need 6 days/week commitment. Reduce to 3-day PPL for lower frequency."
    );
  }

  if (lower.includes('upper lower') || lower.includes('upper/lower')) {
    return (
      "**Upper/Lower Split — 4-Day Template:**\n\n" +
      "**Upper A (Mon):** Strength focus\n" +
      "• Bench press 4×5, Barbell row 4×5, OHP 3×8, Pull-up 3×6–8, Curl 3×10\n\n" +
      "**Lower A (Tue):** Strength focus\n" +
      "• Squat 4×5, Romanian DL 3×8, Leg press 3×10, Leg curl 3×10, Calf raise 4×15\n\n" +
      "**Upper B (Thu):** Hypertrophy focus\n" +
      "• Incline DB press 4×10, Cable row 4×12, DB shoulder press 3×12, Lat pulldown 3×12, Tricep/curl 3×15\n\n" +
      "**Lower B (Fri):** Hypertrophy focus\n" +
      "• Deadlift 4×4–6, Hack squat 3×12, Walking lunge 3×12, Leg curl 3×15, Calf raise 4×20\n\n" +
      "**Why it works:** Two frequency hits per muscle group/week. Ideal for intermediate clients (6–18 months training)."
    );
  }

  if (lower.includes('full body') || lower.includes('3 day') || lower.includes('three day')) {
    return (
      "**Full Body — 3-Day Template (Mon/Wed/Fri):**\n\n" +
      "**Session structure (each day):**\n" +
      "1. Compound lower — Squat or DL variation (3–4×5–8)\n" +
      "2. Compound upper push — Bench or OHP (3–4×6–10)\n" +
      "3. Compound upper pull — Row or pull-up (3–4×6–10)\n" +
      "4. Accessory — 2–3 isolation movements (3×10–15)\n" +
      "5. Core — Plank, pallof press, or carries (2–3 sets)\n\n" +
      "**Rotate variations each session:**\n" +
      "• Mon: Back squat / Bench / Barbell row\n" +
      "• Wed: RDL / OHP / Pull-up\n" +
      "• Fri: Front squat / Incline DB / Cable row\n\n" +
      "Best for: beginners, time-limited clients (45–60 min sessions), and deload weeks for advanced clients."
    );
  }

  // ── Warm-up / mobility ───────────────────────────────────
  if (lower.includes('warm') || lower.includes('mobility') || lower.includes('stretching') || lower.includes('cool down')) {
    return (
      "**Warm-Up Protocol (10–12 min):**\n\n" +
      "**General warm-up (3–4 min):**\n" +
      "• 3 min row/bike/skip — elevate HR to ~120 bpm\n\n" +
      "**Dynamic mobility (4–5 min):**\n" +
      `• ${eRef('Hips', 'Hip')} 90/90 switches × 5 each side\n` +
      `• ${eRef('Legs', 'Ankle')} circles + dorsiflexion stretch × 10\n` +
      `• ${eRef('Shoulders', 'Shoulder')} circles + band pull-aparts × 15\n` +
      "• Thoracic rotations × 10 each side\n" +
      "• Leg swings (front/back + lateral) × 10 each\n\n" +
      "**Activation (3 min):**\n" +
      `• ${eRef('Glutes', 'Glute')} bridges × 15 (bodyweight)\n` +
      `• ${eRef('Core', 'Core')} dead bugs × 10\n` +
      "• Scapular push-ups × 10\n\n" +
      "**Specific warm-up:** 2–3 progressively loaded sets of the first compound movement at 40%, 60%, 80% working weight."
    );
  }

  // ── Recovery ────────────────────────────────────────────
  if (lower.includes('recover') || lower.includes('rest day') || lower.includes('sleep') || lower.includes('soreness') || lower.includes('doms')) {
    return (
      "**Recovery Strategies for Clients:**\n\n" +
      "**Sleep (highest ROI):**\n" +
      "• 7–9 hours — GH release peaks in deep sleep; this is when muscle is actually built\n" +
      "• Advise clients: consistent sleep/wake time, phone out of bedroom\n\n" +
      "**Active recovery (rest days):**\n" +
      "• 20–30 min walk, light cycling, or swimming\n" +
      "• Yoga/mobility work — reduces soreness, improves range\n\n" +
      "**Nutrition on rest days:**\n" +
      `• Protein target unchanged (~1.8–2g/kg) — ${nRef('protein', 'protein synthesis')} continues during rest\n` +
      "• Reduce carbs by 20–30% — less glycogen demand off training\n\n" +
      "**DOMS management:**\n" +
      "• Light movement beats complete rest — increased blood flow clears metabolites\n" +
      "• Contrast showers (cold/hot alternation) — subjective benefit for soreness\n" +
      "• Avoid NSAIDs routinely — blunt hypertrophic signalling with chronic use\n\n" +
      "**Red flags:** Pain (sharp, localised, joint-based) ≠ soreness. Refer out if in doubt."
    );
  }

  // ── Deload ──────────────────────────────────────────────
  if (lower.includes('deload') || lower.includes('overtraining') || lower.includes('fatigue')) {
    return (
      "**Deload Protocol:**\n\n" +
      "**When to deload:**\n" +
      "• Every 4–6 weeks for high-volume clients\n" +
      "• Every 8–12 weeks for moderate volume\n" +
      "• Also trigger-based: declining performance, disturbed sleep, persistent joint aches\n\n" +
      "**Deload week options:**\n" +
      "1. **Volume deload:** Same intensity (load), cut sets by 50% — best for strength athletes\n" +
      "2. **Intensity deload:** Same volume, reduce load to 50–60% 1RM — best for hypertrophy clients\n" +
      "3. **Full rest:** Only for severe overreaching — rare, 5–7 days complete rest\n\n" +
      "**Communicate it clearly to clients:**\n" +
      "'This week we're training lighter intentionally — it's programmed recovery. The next block will be stronger for it.'\n\n" +
      "Clients who understand the why skip deload weeks less."
    );
  }

  // ── Client retention / motivation ───────────────────────
  if (lower.includes('motivation') || lower.includes('retention') || lower.includes('client drop') || lower.includes('adherence') || lower.includes('accountability')) {
    return (
      "**Client Retention & Adherence Tips:**\n\n" +
      "**The first 90 days are critical:**\n" +
      "• Set a concrete 12-week goal with measurable outcomes at week 4, 8, 12\n" +
      "• Weekly check-in (even a 2-min message) doubles retention vs monthly only\n\n" +
      "**Identify the real motivation layer:**\n" +
      "• Surface goal: 'lose weight' — underlying goal: 'more energy for my kids'\n" +
      "• Anchor motivation language to the deeper reason, not the scale number\n\n" +
      "**Habit stacking:**\n" +
      "• Tie gym sessions to existing habits (always after work, always before coffee)\n" +
      "• Remove friction: gym bag packed, session planned, time blocked in calendar\n\n" +
      "**When motivation dips:**\n" +
      "• Reduce complexity — simpler program, fewer decisions\n" +
      "• Celebrate process wins, not outcome wins (showed up 3× this week > scale didn't move)\n" +
      "• Reassess if the goal still resonates — life circumstances change"
    );
  }

  // ── Exercise substitution ────────────────────────────────
  if (lower.includes('substitut') || lower.includes('alternative') || lower.includes('no equipment') || lower.includes('injury') || lower.includes('replace')) {
    return (
      "**Exercise Substitution Guide:**\n\n" +
      `**${eRef('Chest', 'Chest')} (no bench):** Push-up variations (feet elevated = upper, wide = outer), floor press, cable flyes\n\n` +
      `**${eRef('Back', 'Back')} (no pull-up bar):** Lat pulldown, cable row, DB row, resistance band pull-aparts\n\n` +
      `**${eRef('Legs', 'Legs')} (knee pain):** Leg press (partial ROM), terminal knee extensions, step-ups, hip thrust instead of squat\n\n` +
      `**${eRef('Shoulders', 'Shoulders')} (shoulder impingement):** Neutral grip DB press, landmine press, side-lying external rotations\n\n` +
      `**${eRef('Core', 'Core')} (lower back issues):** Dead bug, bird dog, pallof press — avoid heavy spinal flexion (crunches, sit-ups)\n\n` +
      "**General rule:** Match the movement pattern and muscle group — the specific exercise matters less than the stimulus.\n\n" +
      "For injury-related modifications, always get medical clearance for the client first."
    );
  }

  // ── Nutrition (same capabilities as client AI) ───────────
  if (lower.includes('macro') || lower.includes('calorie') || lower.includes('protein') || lower.includes('carb') || lower.includes('fat')) {
    return (
      `**Macro Setting for Clients (${name})**\n\n` +
      "**Step 1 — Calculate TDEE:**\n" +
      "• BMR (Mifflin-St Jeor) × activity multiplier\n" +
      "• Sedentary: ×1.2 / Light: ×1.375 / Moderate: ×1.55 / Active: ×1.725\n\n" +
      "**Step 2 — Set goal calories:**\n" +
      "• Fat loss: TDEE − 300–500 kcal (0.5–1kg/week)\n" +
      "• Lean gain: TDEE + 200–300 kcal (0.25–0.5kg/week)\n" +
      "• Maintenance/recomp: TDEE ±0\n\n" +
      `**Step 3 — ${nRef('protein', 'Protein')} first:**\n` +
      "• 1.6–2.2g/kg bodyweight — non-negotiable for training clients\n" +
      `• ${nRef('carbohydrates', 'Carbs')}: fill remaining after protein (prioritise around training)\n` +
      `• ${nRef('fats', 'Fat')}: minimum 0.5g/kg — hormone health, do not drop below\n\n` +
      "**Track progress:** Weekly weigh-in (same conditions), adjust by ±150–200 kcal if no change after 2 weeks."
    );
  }

  if (lower.includes('supplement')) {
    return (
      "**Supplement Recommendations for Clients:**\n\n" +
      "**Tier 1 — evidence-backed, recommend universally:**\n" +
      `• ${nRef('protein', 'Whey/Casein protein')} — convenience; target post-workout window\n` +
      "• Creatine monohydrate 5g/day — most studied supplement; safe and effective\n" +
      `• ${nRef('vitamin-d', 'Vitamin D3')} 2000–4000 IU — most clients are deficient\n\n` +
      "**Tier 2 — recommend based on client needs:**\n" +
      `• ${nRef('omega3', 'Omega-3')} 2–3g EPA/DHA — anti-inflammatory, joint health\n` +
      `• ${nRef('magnesium', 'Magnesium Glycinate')} 300–400mg before bed — sleep and recovery\n` +
      `• ${nRef('zinc', 'Zinc')} 15–30mg — relevant for males with low testosterone symptoms\n\n` +
      "**Avoid recommending:** Proprietary blends, fat burners, pre-workout with excessive stimulants.\n\n" +
      "Always ask about medications before recommending — some supplements interact (e.g. fish oil + blood thinners)."
    );
  }

  if (lower.includes('cut') || lower.includes('deficit') || lower.includes('fat loss') || lower.includes('weight loss')) {
    return (
      "**Fat Loss Phase — Trainer Checklist:**\n\n" +
      "**Set the client up for success:**\n" +
      "• Deficit: 300–500 kcal/day — aggressive cuts kill adherence and muscle\n" +
      `• ${nRef('protein', 'Protein')} at the HIGH end: 2.0–2.4g/kg — preserves lean mass in a deficit\n` +
      "• Resistance training unchanged — do NOT switch to 'toning' circuits\n\n" +
      "**Common mistakes to watch:**\n" +
      "• Client adds extra cardio without telling you → now in too aggressive a deficit\n" +
      "• Calories too low → strength drops, muscle lost, metabolism adapts down\n" +
      "• Skipping meals → muscle protein breakdown increases, hunger increases\n\n" +
      "**Diet breaks (every 4–6 weeks at maintenance):** Reset leptin, improve adherence, and psychological relief.\n\n" +
      "**Track beyond the scale:** tape measurements, progress photos, performance in the gym."
    );
  }

  if (lower.includes('bulk') || lower.includes('muscle') || lower.includes('gain') || lower.includes('surplus')) {
    return (
      "**Muscle Gain Phase — Trainer Checklist:**\n\n" +
      "**Calorie surplus:**\n" +
      "• Lean bulk: +200–300 kcal/day over TDEE\n" +
      "• Target: 0.25–0.5kg/week; anything faster and it's mostly fat\n\n" +
      "**Training adjustments:**\n" +
      "• Volume should be at or above MV (minimum effective volume) for each muscle group\n" +
      "• Weekly sets per muscle: 10–20 sets is the hypertrophy sweet spot for most\n" +
      "• Track progressive overload: clients need to see their numbers going up\n\n" +
      `**${nRef('protein', 'Protein')} target:** 1.6–2g/kg — not necessary to go higher in a surplus\n\n` +
      "**When bulk isn't working:**\n" +
      "• Underreporting food? Most common issue\n" +
      "• Sleep under 7h? Recovery-limited\n" +
      "• Stress high? Cortisol elevates → impairs muscle protein synthesis"
    );
  }

  // ── Fallback ─────────────────────────────────────────────
  return (
    `Hi ${name}! I can help with:\n\n` +
    "• **Program design** — beginner templates, PPL, upper/lower, full body\n" +
    "• **Progressive overload** — breaking plateaus, periodisation\n" +
    "• **Exercise substitutions** — injury modifications, no-equipment alternatives\n" +
    "• **Warm-up & mobility** — protocols for different client types\n" +
    "• **Recovery & deload** — when and how to back off\n" +
    "• **Client adherence** — retention tips and motivation strategies\n" +
    "• **Nutrition for clients** — macros, cut/bulk phases, supplements\n\n" +
    "What would you like to explore?"
  );
}

// ─── Live AI (delegates to Edge Function) ─────────────────────

export async function getTrainerAIChatResponse(
  message: string,
  context: TrainerAIContext,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<{ reply: string | null; error: string | null }> {
  if (!NUTRITION_AI_ENABLED) {
    return { reply: getTrainerMockResponse(message, context), error: null };
  }
  try {
    const { data, error } = await supabase.functions.invoke('nutrition-ai', {
      body: { action: 'trainer-chat', message, context, history },
    });
    if (error) return { reply: null, error: error.message };
    return { reply: (data as { reply?: string })?.reply ?? null, error: null };
  } catch (err) {
    return { reply: null, error: err instanceof Error ? err.message : String(err) };
  }
}
