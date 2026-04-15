/**
 * Estimates kilocalories burned per exercise set using a combined formula:
 *
 *   kcal_met  = (MET - 1.0) × body_weight_kg × (reps × SEC_PER_REP / 3600)
 *   kcal_mech = (load_kg × g × displacement_m × reps × 2) / (J_per_kcal × muscle_efficiency)
 *   total     = kcal_met + kcal_mech
 *
 * MET values derived from Compendium of Physical Activities (Ainsworth et al., 2011):
 *   - Vigorous compound lifting (squat, deadlift, press, row): MET 5.0
 *   - Moderate isolation work (curl, extension, fly, raise):   MET 3.0
 *   - Bodyweight / calisthenics (push-up, pull-up, dip):       MET 3.8
 *   - Explosive / Olympic (clean, snatch, box jump):           MET 7.0
 *
 * Mechanical efficiency assumed at 22% (typical skeletal muscle).
 * Default body weight used when none provided: 75 kg.
 */

const DEFAULT_BODY_WEIGHT_KG = 75;
const SEC_PER_REP = 4;        // ~4 s eccentric + concentric per rep
const G = 9.81;               // m/s²
const J_PER_KCAL = 4184;      // joules per kcal
const EFF = 0.22;             // muscle mechanical efficiency

// ─── MET lookup ─────────────────────────────────────────────────────────────

type MetCategory = 'compound' | 'isolation' | 'bodyweight' | 'explosive';

const EXPLOSIVE_KEYWORDS = [
  'clean', 'snatch', 'jerk', 'thruster', 'box jump', 'plyometric', 'jump squat',
  'kettlebell swing', 'swing', 'med ball', 'battle rope',
];

const BODYWEIGHT_KEYWORDS = [
  'push-up', 'pushup', 'pull-up', 'pullup', 'chin-up', 'chinup',
  'dip', 'inverted row', 'body weight', 'bodyweight', 'plank',
  'mountain climber', 'burpee', 'sit-up', 'situp', 'crunch',
  'leg raise', 'l-sit', 'handstand', 'pistol squat',
];

const COMPOUND_KEYWORDS = [
  'squat', 'deadlift', 'bench press', 'overhead press', 'ohp', 'military press',
  'barbell row', 'bent-over row', 'pendlay row', 'sumo', 'front squat', 'hack squat',
  'leg press', 'romanian deadlift', 'rdl', 'stiff leg', 'good morning',
  'hip thrust', 'glute bridge', 'step-up', 'split squat', 'lunge',
  'cable row', 'seated row', 'lat pulldown', 't-bar row',
];

const MET_VALUES: Record<MetCategory, number> = {
  compound:   5.0,
  isolation:  3.0,
  bodyweight: 3.8,
  explosive:  7.0,
};

/**
 * EPOC (excess post-exercise oxygen consumption) multiplier per category.
 * Heavy compound lifts elevate metabolism for minutes after the set; this
 * factor scales the active-set calorie estimate to include that overhead,
 * producing numbers consistent with empirical per-set measurements.
 *   compound  × 3.0  — large muscle mass, high systemic demand, long recovery
 *   explosive × 2.0  — high peak output, shorter recovery window
 *   bodyweight× 2.0  — moderate systemic demand
 *   isolation × 1.5  — small muscle group, quick recovery
 */
const EPOC_MULTIPLIER: Record<MetCategory, number> = {
  compound:   3.0,
  isolation:  1.5,
  bodyweight: 2.0,
  explosive:  2.0,
};

function getMetCategory(exerciseName: string): MetCategory {
  const lower = exerciseName.toLowerCase();
  if (EXPLOSIVE_KEYWORDS.some((k) => lower.includes(k))) return 'explosive';
  if (BODYWEIGHT_KEYWORDS.some((k) => lower.includes(k))) return 'bodyweight';
  if (COMPOUND_KEYWORDS.some((k) => lower.includes(k))) return 'compound';
  return 'isolation';
}

// ─── Displacement lookup ─────────────────────────────────────────────────────
// Approximate one-way vertical displacement in metres (doubled in formula for
// eccentric + concentric phases).

const DISPLACEMENT_MAP: Array<{ keywords: string[]; metres: number }> = [
  { keywords: ['squat', 'front squat', 'hack squat', 'goblet', 'jump squat', 'pistol'], metres: 0.55 },
  { keywords: ['deadlift', 'sumo', 'rdl', 'romanian', 'stiff leg', 'good morning'], metres: 0.50 },
  { keywords: ['hip thrust', 'glute bridge'], metres: 0.20 },
  { keywords: ['overhead press', 'military press', 'ohp', 'shoulder press', 'push press'], metres: 0.50 },
  { keywords: ['incline', 'decline', 'bench press', 'chest press'], metres: 0.35 },
  { keywords: ['lunge', 'step-up', 'split squat', 'bulgarian'], metres: 0.40 },
  { keywords: ['pull-up', 'pullup', 'chin-up', 'chinup', 'lat pulldown'], metres: 0.45 },
  { keywords: ['row', 'pull', 'cable row'], metres: 0.30 },
  { keywords: ['dip'], metres: 0.35 },
  { keywords: ['push-up', 'pushup'], metres: 0.25 },
  { keywords: ['curl', 'bicep', 'hammer'], metres: 0.30 },
  { keywords: ['extension', 'tricep', 'skullcrusher', 'skull crusher'], metres: 0.30 },
  { keywords: ['leg press'], metres: 0.35 },
  { keywords: ['calf raise', 'calf'], metres: 0.10 },
  { keywords: ['shrug'], metres: 0.10 },
  { keywords: ['thruster', 'clean', 'snatch', 'jerk'], metres: 0.70 },
  { keywords: ['box jump', 'jump'], metres: 0.45 },
  { keywords: ['swing', 'kettlebell swing'], metres: 0.40 },
];

function getDisplacementM(exerciseName: string): number {
  const lower = exerciseName.toLowerCase();
  for (const entry of DISPLACEMENT_MAP) {
    if (entry.keywords.some((k) => lower.includes(k))) return entry.metres;
  }
  // Default for unrecognised isolation movements (lateral raise, fly, etc.)
  return 0.25;
}

// ─── Core calculation ────────────────────────────────────────────────────────

/**
 * Estimate kcal burned for a single set.
 *
 * @param reps           Number of repetitions (integer ≥ 1)
 * @param loadKg         External load in kg (0 for bodyweight-only)
 * @param bodyWeightKg   Lifter's body weight in kg (falls back to 75 kg if null)
 * @param exerciseName   Exercise name (used for MET + displacement lookup)
 * @returns              Estimated kcal as a positive number (rounds to 1 dp)
 */
export function estimateSetKcal(
  reps: number,
  loadKg: number,
  bodyWeightKg: number | null,
  exerciseName: string,
): number {
  if (reps <= 0) return 0;

  const bw = bodyWeightKg ?? DEFAULT_BODY_WEIGHT_KG;
  const cat = getMetCategory(exerciseName);
  const met = MET_VALUES[cat];
  const disp = getDisplacementM(exerciseName);
  const durationH = (reps * SEC_PER_REP) / 3600;

  // Metabolic cost during the active set (net of resting metabolic rate)
  const kcalMet = (met - 1.0) * bw * durationH;

  // Mechanical work component (external load lifted through range of motion)
  const kcalMech = loadKg > 0
    ? (loadKg * G * disp * reps * 2) / (J_PER_KCAL * EFF)
    : 0;

  // Apply EPOC multiplier to approximate total energy cost including
  // post-set elevated metabolism and rest-period cardiorespiratory demand.
  const epoc = EPOC_MULTIPLIER[cat];
  return Math.max(0, (kcalMet + kcalMech) * epoc);
}

/**
 * Estimate total kcal for a block of sets, given a unit (lbs | kg | secs).
 * Duration-based sets (unit='secs') produce zero mechanical work.
 *
 * @param sets           Array of { reps, amount } (strings as entered by user)
 * @param unit           Weight unit used in the block
 * @param bodyWeightKg   Lifter's body weight
 * @param exerciseName   Exercise name for lookup
 * @returns              Total estimated kcal for the block (rounded integer)
 */
export function estimateBlockKcal(
  sets: Array<{ reps: string; amount: string }>,
  unit: 'lbs' | 'kg' | 'secs',
  bodyWeightKg: number | null,
  exerciseName: string,
): number {
  let total = 0;
  for (const s of sets) {
    const reps = parseInt(s.reps, 10);
    if (!reps || reps <= 0) continue;

    let loadKg = 0;
    if (unit !== 'secs') {
      const raw = parseFloat(s.amount);
      if (!isNaN(raw) && raw > 0) {
        loadKg = unit === 'lbs' ? raw * 0.453592 : raw;
      }
    }

    total += estimateSetKcal(reps, loadKg, bodyWeightKg, exerciseName);
  }
  return Math.round(total);
}
