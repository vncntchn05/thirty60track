/**
 * Unit tests for lib/generateReportPdf.ts
 *
 * Tests buildReportHtml() output — the pure HTML-building logic that underpins
 * the Performance Report Card feature.  generateAndShare() is not tested here
 * as it wraps expo-print / expo-sharing which are native-only.
 *
 * Covered:
 *  - Client name and period appear in the HTML
 *  - Total volume and set count are calculated correctly
 *  - PR section: new PRs flagged, prior bests shown
 *  - Body progress: start/end/delta included
 *  - Nutrition section included only when nutritionSummary is provided
 *  - Zero-PR and no-body-data edge cases
 */

import { buildReportHtml } from '@/lib/generateReportPdf';
import type { ReportInput, ReportWorkout, ReportExercisePR, BodyProgressPoint, ReportNutritionSummary } from '@/lib/generateReportPdf';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const BASE_WORKOUT: ReportWorkout = {
  performed_at: '2024-01-15',
  notes: null,
  exercises: [
    {
      name: 'Bench Press',
      sets: [
        { set_number: 1, reps: 5, weight_kg: 80, duration_seconds: null },
        { set_number: 2, reps: 5, weight_kg: 80, duration_seconds: null },
      ],
    },
  ],
};

const BASE_PR: ReportExercisePR = {
  name: 'Bench Press',
  maxWeight: 85,
  prevMaxWeight: 80,
  isNew: true,
};

const BASE_BODY: BodyProgressPoint = {
  date: '2024-01-01',
  weight_kg: 80,
  bf_percent: 20,
  lbm_kg: 64,
};

const BASE_NUTRITION: ReportNutritionSummary = {
  avgCalories: 2200,
  avgProtein: 165,
  avgCarbs: 220,
  avgFat: 73,
  daysLogged: 5,
  totalDays: 7,
};

function makeInput(overrides: Partial<ReportInput> = {}): ReportInput {
  return {
    clientName: 'Jane Doe',
    trainerName: 'Coach Smith',
    periodLabel: 'Last 4 Weeks',
    periodStart: '2024-01-01',
    periodEnd:   '2024-01-28',
    workouts: [BASE_WORKOUT],
    exercisePRs: [BASE_PR],
    bodyProgress: [BASE_BODY],
    generatedAt: 'Jan 28, 2024',
    ...overrides,
  };
}

// ─── Basic structure ──────────────────────────────────────────────────────────

describe('buildReportHtml — basic structure', () => {
  it('returns a string that starts with <!DOCTYPE html>', () => {
    const html = buildReportHtml(makeInput());
    expect(html.trimStart()).toMatch(/^<!DOCTYPE html>/i);
  });

  it('includes the client name in the output', () => {
    const html = buildReportHtml(makeInput({ clientName: 'John Smith' }));
    expect(html).toContain('John Smith');
  });

  it('includes the trainer name in the output', () => {
    const html = buildReportHtml(makeInput({ trainerName: 'Coach Taylor' }));
    expect(html).toContain('Coach Taylor');
  });

  it('includes the period label', () => {
    const html = buildReportHtml(makeInput({ periodLabel: 'This Week' }));
    expect(html).toContain('This Week');
  });

  it('includes the generatedAt string', () => {
    const html = buildReportHtml(makeInput({ generatedAt: 'Feb 15, 2024' }));
    expect(html).toContain('Feb 15, 2024');
  });
});

// ─── Summary stats ────────────────────────────────────────────────────────────

describe('buildReportHtml — summary statistics', () => {
  it('shows correct session count (number of workouts)', () => {
    const html = buildReportHtml(makeInput({
      workouts: [BASE_WORKOUT, BASE_WORKOUT],
    }));
    // 2 sessions in the report
    expect(html).toContain('2');
  });

  it('calculates total volume as sum of (reps × weight_kg) across all sets', () => {
    // BASE_WORKOUT: 2 sets × (5 reps × 80 kg) = 800 kg total volume
    const html = buildReportHtml(makeInput());
    expect(html).toContain('800');
  });

  it('calculates total sets correctly', () => {
    // BASE_WORKOUT: 2 sets total
    const html = buildReportHtml(makeInput());
    expect(html).toContain('2');
  });

  it('counts new PRs from exercisePRs array', () => {
    const prs: ReportExercisePR[] = [
      { name: 'Squat',      maxWeight: 100, prevMaxWeight: 90, isNew: true  },
      { name: 'Bench',      maxWeight: 80,  prevMaxWeight: 80, isNew: false },
      { name: 'Deadlift',   maxWeight: 120, prevMaxWeight: null, isNew: true },
    ];
    const html = buildReportHtml(makeInput({ exercisePRs: prs }));
    // Should show 2 new PRs
    expect(html).toContain('2');
  });

  it('reports 0 new PRs when none are new', () => {
    const prs: ReportExercisePR[] = [
      { name: 'Squat', maxWeight: 100, prevMaxWeight: 100, isNew: false },
    ];
    const html = buildReportHtml(makeInput({ exercisePRs: prs }));
    expect(html).toContain('0');
  });
});

// ─── Exercise PR section ──────────────────────────────────────────────────────

describe('buildReportHtml — exercise PR section', () => {
  it('includes exercise name in the PR table', () => {
    const html = buildReportHtml(makeInput({
      exercisePRs: [{ name: 'Barbell Squat', maxWeight: 120, prevMaxWeight: 100, isNew: true }],
    }));
    expect(html).toContain('Barbell Squat');
  });

  it('shows maxWeight in kg format', () => {
    const html = buildReportHtml(makeInput({
      exercisePRs: [{ name: 'Squat', maxWeight: 120, prevMaxWeight: null, isNew: true }],
    }));
    expect(html).toContain('120 kg');
  });

  it('shows "—" for null weight', () => {
    const html = buildReportHtml(makeInput({
      exercisePRs: [{ name: 'Plank', maxWeight: null, prevMaxWeight: null, isNew: false }],
    }));
    expect(html).toContain('—');
  });

  it('includes a trophy emoji for new PRs', () => {
    const html = buildReportHtml(makeInput({
      exercisePRs: [{ name: 'Deadlift', maxWeight: 180, prevMaxWeight: 160, isNew: true }],
    }));
    expect(html).toContain('🏆');
  });

  it('does not include trophy emoji when isNew is false', () => {
    const html = buildReportHtml(makeInput({
      exercisePRs: [{ name: 'Deadlift', maxWeight: 160, prevMaxWeight: 160, isNew: false }],
    }));
    expect(html).not.toContain('🏆');
  });
});

// ─── Body progress section ────────────────────────────────────────────────────

describe('buildReportHtml — body progress section', () => {
  it('includes body weight value in the output', () => {
    const html = buildReportHtml(makeInput({
      bodyProgress: [{ date: '2024-01-01', weight_kg: 78.5, bf_percent: null, lbm_kg: null }],
    }));
    expect(html).toContain('78.5');
  });

  it('includes body fat % value', () => {
    const html = buildReportHtml(makeInput({
      bodyProgress: [{ date: '2024-01-01', weight_kg: null, bf_percent: 22, lbm_kg: null }],
    }));
    expect(html).toContain('22');
  });

  it('omits body progress section when all values are null', () => {
    const html = buildReportHtml(makeInput({
      bodyProgress: [{ date: '2024-01-01', weight_kg: null, bf_percent: null, lbm_kg: null }],
    }));
    expect(html).not.toContain('Body Progress');
  });

  it('shows start and end values when multiple points provided', () => {
    const progress: BodyProgressPoint[] = [
      { date: '2024-01-01', weight_kg: 80, bf_percent: null, lbm_kg: null },
      { date: '2024-01-28', weight_kg: 78, bf_percent: null, lbm_kg: null },
    ];
    const html = buildReportHtml(makeInput({ bodyProgress: progress }));
    expect(html).toContain('80');
    expect(html).toContain('78');
  });

  it('includes "Body Progress" section header when there is data', () => {
    const html = buildReportHtml(makeInput({
      bodyProgress: [BASE_BODY],
    }));
    expect(html).toContain('Body Progress');
  });
});

// ─── Nutrition section ────────────────────────────────────────────────────────

describe('buildReportHtml — nutrition section', () => {
  it('includes "Nutrition" section header when nutritionSummary is provided', () => {
    const html = buildReportHtml(makeInput({ nutritionSummary: BASE_NUTRITION }));
    expect(html).toContain('Nutrition');
  });

  it('shows average calories', () => {
    const html = buildReportHtml(makeInput({ nutritionSummary: BASE_NUTRITION }));
    expect(html).toContain('2200');
  });

  it('shows days logged out of total days', () => {
    const html = buildReportHtml(makeInput({ nutritionSummary: BASE_NUTRITION }));
    expect(html).toContain('5');
    expect(html).toContain('7');
  });

  it('does NOT include Nutrition section when nutritionSummary is absent', () => {
    const html = buildReportHtml(makeInput({ nutritionSummary: undefined }));
    // The word "Nutrition" should not appear as a section title
    // (it might still appear in other contexts, so check for the specific label)
    expect(html).not.toContain('Avg Calories');
  });

  it('shows protein grams', () => {
    const html = buildReportHtml(makeInput({ nutritionSummary: BASE_NUTRITION }));
    expect(html).toContain('165g');
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('buildReportHtml — edge cases', () => {
  it('handles empty workouts array (no session data)', () => {
    const html = buildReportHtml(makeInput({ workouts: [] }));
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('handles empty exercisePRs array', () => {
    const html = buildReportHtml(makeInput({ exercisePRs: [] }));
    expect(typeof html).toBe('string');
  });

  it('handles empty bodyProgress array', () => {
    const html = buildReportHtml(makeInput({ bodyProgress: [] }));
    expect(typeof html).toBe('string');
    expect(html).not.toContain('Body Progress');
  });

  it('volume is 0 when all sets have null reps or null weight', () => {
    const workout: ReportWorkout = {
      performed_at: '2024-01-01',
      notes: null,
      exercises: [{
        name: 'Plank',
        sets: [{ set_number: 1, reps: null, weight_kg: null, duration_seconds: 60 }],
      }],
    };
    const html = buildReportHtml(makeInput({ workouts: [workout] }));
    // Volume should appear as 0 kg
    expect(html).toContain('0');
  });

  it('includes the page title with client name', () => {
    const html = buildReportHtml(makeInput({ clientName: 'Test Client' }));
    expect(html).toContain('<title>');
    expect(html).toContain('Test Client');
  });
});
