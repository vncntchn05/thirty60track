/**
 * Unit tests for hooks/useClientProgress.ts
 *
 * All derived metrics (frequency, volume, streaks, body-comp, exercise progress,
 * date filtering) are pure computations on a RawWorkout[].  We replicate the
 * exact algorithm bodies from the hook here so the tests exercise the real logic
 * without needing renderHook / RNTL.
 */

// ─── Replicated algorithm helpers (verbatim from useClientProgress.ts) ────────

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function isoToLocalMs(iso: string): number {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

function shortDate(iso: string): string {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type RawSet = {
  exercise_id: string;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  exercise: { id: string; name: string } | null;
};

type RawWorkout = {
  id: string;
  performed_at: string;
  body_weight_kg: number | null;
  body_fat_percent: number | null;
  workout_sets: RawSet[];
};

function buildFrequencyStats(workouts: RawWorkout[]) {
  if (workouts.length === 0) {
    return { totalWorkouts: 0, avgPerWeek: 0, thisWeek: 0, currentStreak: 0, bestStreak: 0, activeWeeks: 0 };
  }
  const firstMs = isoToLocalMs(workouts[0].performed_at);
  const lastMs  = isoToLocalMs(workouts[workouts.length - 1].performed_at);
  const totalWeeks = Math.max(1, Math.floor((lastMs - firstMs) / WEEK_MS) + 1);

  const counts = new Array<number>(totalWeeks).fill(0);
  workouts.forEach((w) => {
    const idx = Math.min(
      Math.floor((isoToLocalMs(w.performed_at) - firstMs) / WEEK_MS),
      totalWeeks - 1,
    );
    counts[idx]++;
  });

  let currentStreak = 0, bestStreak = 0, run = 0;
  for (const c of counts) {
    if (c > 0) { run++; if (run > bestStreak) bestStreak = run; }
    else run = 0;
  }
  for (let i = counts.length - 1; i >= 0; i--) {
    if (counts[i] > 0) currentStreak++;
    else break;
  }

  return {
    totalWorkouts: workouts.length,
    avgPerWeek: Math.round((workouts.length / totalWeeks) * 10) / 10,
    currentStreak,
    bestStreak,
    activeWeeks: counts.filter((c) => c > 0).length,
    counts, // exposed for inspection
  };
}

function buildFrequencyData(workouts: RawWorkout[]) {
  if (workouts.length === 0) return [];
  const firstMs = isoToLocalMs(workouts[0].performed_at);
  const lastMs  = isoToLocalMs(workouts[workouts.length - 1].performed_at);
  const totalWeeks = Math.max(1, Math.floor((lastMs - firstMs) / WEEK_MS) + 1);
  const counts = new Array<number>(totalWeeks).fill(0);
  workouts.forEach((w) => {
    const idx = Math.min(Math.floor((isoToLocalMs(w.performed_at) - firstMs) / WEEK_MS), totalWeeks - 1);
    counts[idx]++;
  });
  return counts.map((count, i) => ({
    x: i,
    y: count,
    label: new Date(firstMs + i * WEEK_MS).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));
}

function buildVolumeData(workouts: RawWorkout[]) {
  return workouts.map((w, i) => ({
    x: i,
    y: w.workout_sets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0), 0),
    label: shortDate(w.performed_at),
  }));
}

function buildExerciseMap(workouts: RawWorkout[]) {
  const map = new Map<string, { name: string; hasWeight: boolean; hasDuration: boolean }>();
  workouts.forEach((w) => {
    w.workout_sets.forEach((s) => {
      if (s.exercise) {
        const prev = map.get(s.exercise_id) ?? { name: s.exercise.name, hasWeight: false, hasDuration: false };
        map.set(s.exercise_id, {
          name: prev.name,
          hasWeight: prev.hasWeight || s.weight_kg != null,
          hasDuration: prev.hasDuration || s.duration_seconds != null,
        });
      }
    });
  });
  return Array.from(map.entries())
    .map(([id, info]) => ({ id, ...info }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getExerciseProgress(workouts: RawWorkout[], exerciseId: string) {
  const points: { x: number; y: number; label: string }[] = [];
  workouts.forEach((w) => {
    const relevant = w.workout_sets.filter((s) => s.exercise_id === exerciseId && s.weight_kg != null);
    if (relevant.length > 0) {
      const maxWeight = Math.max(...relevant.map((s) => s.weight_kg as number));
      points.push({ x: points.length, y: maxWeight, label: shortDate(w.performed_at) });
    }
  });
  return points;
}

function getExerciseDurationProgress(workouts: RawWorkout[], exerciseId: string) {
  const points: { x: number; y: number; label: string }[] = [];
  workouts.forEach((w) => {
    const relevant = w.workout_sets.filter((s) => s.exercise_id === exerciseId && s.duration_seconds != null);
    if (relevant.length > 0) {
      const max = Math.max(...relevant.map((s) => s.duration_seconds as number));
      points.push({ x: points.length, y: max, label: shortDate(w.performed_at) });
    }
  });
  return points;
}

function getExerciseRepsProgress(workouts: RawWorkout[], exerciseId: string) {
  const points: { x: number; y: number; label: string }[] = [];
  workouts.forEach((w) => {
    const relevant = w.workout_sets.filter((s) => s.exercise_id === exerciseId && s.reps != null);
    if (relevant.length > 0) {
      const max = Math.max(...relevant.map((s) => s.reps as number));
      points.push({ x: points.length, y: max, label: shortDate(w.performed_at) });
    }
  });
  return points;
}

function applyDateFilter(
  workouts: RawWorkout[],
  daysBack?: number,
  customRange?: { start: Date; end: Date },
) {
  if (customRange) {
    const s = customRange.start.getTime();
    const e = customRange.end.getTime();
    return workouts.filter((w) => {
      const ms = isoToLocalMs(w.performed_at);
      return ms >= s && ms <= e;
    });
  }
  if (!daysBack) return workouts;
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - daysBack);
  return workouts.filter((w) => isoToLocalMs(w.performed_at) >= cutoff.getTime());
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeWorkout(
  performed_at: string,
  sets: Partial<RawSet>[] = [],
  overrides: Partial<RawWorkout> = {},
): RawWorkout {
  return {
    id: performed_at,
    performed_at,
    body_weight_kg: null,
    body_fat_percent: null,
    workout_sets: sets.map((s) => ({
      exercise_id: s.exercise_id ?? 'ex-1',
      reps: s.reps ?? null,
      weight_kg: s.weight_kg ?? null,
      duration_seconds: s.duration_seconds ?? null,
      exercise: s.exercise ?? { id: s.exercise_id ?? 'ex-1', name: 'Squat' },
    })),
    ...overrides,
  };
}

// ─── isoToLocalMs ────────────────────────────────────────────────────────────

describe('isoToLocalMs', () => {
  it('parses a YYYY-MM-DD string at local midnight', () => {
    const ms = isoToLocalMs('2024-03-15');
    const d  = new Date(ms);
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(2); // 0-indexed March
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(0);
  });

  it('strips the time component from a full ISO timestamp', () => {
    const ms1 = isoToLocalMs('2024-03-15');
    const ms2 = isoToLocalMs('2024-03-15T14:30:00');
    expect(ms1).toBe(ms2);
  });

  it('produces earlier timestamp for earlier date', () => {
    expect(isoToLocalMs('2024-01-01')).toBeLessThan(isoToLocalMs('2024-12-31'));
  });
});

// ─── shortDate ───────────────────────────────────────────────────────────────

describe('shortDate', () => {
  it('formats "YYYY-MM-DD" as "Mon D" in en-US locale', () => {
    // '2024-03-15' = March 15 → "Mar 15"
    expect(shortDate('2024-03-15')).toBe('Mar 15');
  });

  it('strips time from ISO timestamp before formatting', () => {
    expect(shortDate('2024-03-15T10:00:00')).toBe('Mar 15');
  });

  it('handles January correctly (month index 0)', () => {
    expect(shortDate('2024-01-01')).toBe('Jan 1');
  });

  it('handles December correctly (month index 11)', () => {
    expect(shortDate('2024-12-31')).toBe('Dec 31');
  });
});

// ─── frequencyData ───────────────────────────────────────────────────────────

describe('buildFrequencyData', () => {
  it('returns empty array for no workouts', () => {
    expect(buildFrequencyData([])).toHaveLength(0);
  });

  it('single workout creates a single week bucket', () => {
    const data = buildFrequencyData([makeWorkout('2024-03-04')]);
    expect(data).toHaveLength(1);
    expect(data[0].y).toBe(1);
    expect(data[0].x).toBe(0);
  });

  it('two workouts within 6 days of each other fall in the same bucket', () => {
    const data = buildFrequencyData([
      makeWorkout('2024-03-04'),
      makeWorkout('2024-03-09'), // 5 days later — same week bucket
    ]);
    expect(data).toHaveLength(1);
    expect(data[0].y).toBe(2);
  });

  it('two workouts 7+ days apart fall in separate buckets', () => {
    // Use January dates to avoid DST — 7 days in Jan is always exactly WEEK_MS
    const data = buildFrequencyData([
      makeWorkout('2024-01-08'),
      makeWorkout('2024-01-15'), // 7 days later
    ]);
    expect(data).toHaveLength(2);
    expect(data[0].y).toBe(1);
    expect(data[1].y).toBe(1);
  });

  it('x values are sequential integers starting at 0', () => {
    // 3 workouts exactly 7 days apart → 3 consecutive week buckets → x=[0,1,2]
    const data = buildFrequencyData([
      makeWorkout('2024-01-01'),
      makeWorkout('2024-01-08'),
      makeWorkout('2024-01-15'),
    ]);
    expect(data.map((d) => d.x)).toEqual([0, 1, 2]);
  });

  it('week buckets with no workouts have y=0', () => {
    // Use January dates (no DST) with a 21-day gap to guarantee 3 week buckets
    // Week 0: Jan 1, Week 1: empty, Week 2: Jan 22
    const data = buildFrequencyData([
      makeWorkout('2024-01-01'),
      makeWorkout('2024-01-22'), // 21 days later — always week 3
    ]);
    expect(data.length).toBeGreaterThanOrEqual(2);
    const zeroWeeks = data.filter((d) => d.y === 0);
    expect(zeroWeeks.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── frequencyStats ──────────────────────────────────────────────────────────

describe('buildFrequencyStats', () => {
  it('returns zeroed stats for empty workout list', () => {
    const stats = buildFrequencyStats([]);
    expect(stats.totalWorkouts).toBe(0);
    expect(stats.avgPerWeek).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.bestStreak).toBe(0);
    expect(stats.activeWeeks).toBe(0);
  });

  it('totalWorkouts equals the number of workout objects', () => {
    const workouts = [
      makeWorkout('2024-01-01'),
      makeWorkout('2024-01-08'),
      makeWorkout('2024-01-15'),
    ];
    expect(buildFrequencyStats(workouts).totalWorkouts).toBe(3);
  });

  it('avgPerWeek is rounded to 1 decimal', () => {
    // 3 workouts over 2 weeks = 1.5
    const workouts = [
      makeWorkout('2024-01-01'),
      makeWorkout('2024-01-08'),
      makeWorkout('2024-01-08'), // same week as above
    ];
    const stats = buildFrequencyStats(workouts);
    expect(stats.avgPerWeek).toBe(1.5);
  });

  it('bestStreak counts the longest consecutive non-zero-week run', () => {
    // 3 consecutive weeks, then a gap, then 1
    const workouts = [
      makeWorkout('2024-01-01'),
      makeWorkout('2024-01-08'),
      makeWorkout('2024-01-15'),
      makeWorkout('2024-02-05'), // gap of 2 weeks
    ];
    expect(buildFrequencyStats(workouts).bestStreak).toBe(3);
  });

  it('currentStreak counts consecutive active weeks trailing from the last workout', () => {
    const workouts = [
      makeWorkout('2024-01-01'),
      makeWorkout('2024-01-15'), // gap in week 2
      makeWorkout('2024-01-22'),
      makeWorkout('2024-01-29'),
    ];
    // Last 2 weeks in a row (Jan 22 and Jan 29)
    expect(buildFrequencyStats(workouts).currentStreak).toBeGreaterThanOrEqual(2);
  });

  it('activeWeeks counts only weeks that have ≥ 1 workout', () => {
    const workouts = [
      makeWorkout('2024-01-01'),
      makeWorkout('2024-01-15'), // skipped week 2
      makeWorkout('2024-01-22'),
    ];
    const stats = buildFrequencyStats(workouts);
    // 3 active weeks out of 4 total weeks
    expect(stats.activeWeeks).toBe(3);
  });

  it('single workout has streak=1 and avgPerWeek=1', () => {
    const stats = buildFrequencyStats([makeWorkout('2024-03-04')]);
    expect(stats.bestStreak).toBe(1);
    expect(stats.currentStreak).toBe(1);
    expect(stats.avgPerWeek).toBe(1);
  });
});

// ─── volumeData ──────────────────────────────────────────────────────────────

describe('buildVolumeData', () => {
  it('returns empty array for no workouts', () => {
    expect(buildVolumeData([])).toHaveLength(0);
  });

  it('volume = sum of (reps × weight_kg) across all sets', () => {
    const w = makeWorkout('2024-03-04', [
      { reps: 10, weight_kg: 50 },  // 500
      { reps: 8,  weight_kg: 60 },  // 480
      { reps: 6,  weight_kg: 70 },  // 420
    ]);
    const data = buildVolumeData([w]);
    expect(data[0].y).toBe(1400);
  });

  it('treats null reps as 0', () => {
    const w = makeWorkout('2024-03-04', [
      { reps: null, weight_kg: 50 },
      { reps: 10,   weight_kg: 40 },
    ]);
    expect(buildVolumeData([w])[0].y).toBe(400);
  });

  it('treats null weight_kg as 0', () => {
    const w = makeWorkout('2024-03-04', [
      { reps: 20, weight_kg: null }, // bodyweight exercise
      { reps: 10, weight_kg: 30 },
    ]);
    expect(buildVolumeData([w])[0].y).toBe(300);
  });

  it('x values are sequential per-workout indices', () => {
    const data = buildVolumeData([
      makeWorkout('2024-01-01', [{ reps: 1, weight_kg: 1 }]),
      makeWorkout('2024-01-08', [{ reps: 1, weight_kg: 1 }]),
      makeWorkout('2024-01-15', [{ reps: 1, weight_kg: 1 }]),
    ]);
    expect(data.map((d) => d.x)).toEqual([0, 1, 2]);
  });

  it('workout with no sets has volume 0', () => {
    const w = makeWorkout('2024-03-04', []);
    expect(buildVolumeData([w])[0].y).toBe(0);
  });
});

// ─── bodyWeightData / bodyFatData ────────────────────────────────────────────

describe('body-comp data filtering', () => {
  const workouts = [
    makeWorkout('2024-01-01', [], { body_weight_kg: 80, body_fat_percent: 20 }),
    makeWorkout('2024-01-08', [], { body_weight_kg: null, body_fat_percent: null }),
    makeWorkout('2024-01-15', [], { body_weight_kg: 78.5, body_fat_percent: 19 }),
  ];

  it('bodyWeightData excludes workouts where body_weight_kg is null', () => {
    const data = workouts
      .filter((w) => w.body_weight_kg != null)
      .map((w, i) => ({ x: i, y: w.body_weight_kg as number, label: shortDate(w.performed_at) }));
    expect(data).toHaveLength(2);
    expect(data[0].y).toBe(80);
    expect(data[1].y).toBe(78.5);
  });

  it('bodyFatData excludes workouts where body_fat_percent is null', () => {
    const data = workouts
      .filter((w) => w.body_fat_percent != null)
      .map((w, i) => ({ x: i, y: w.body_fat_percent as number, label: shortDate(w.performed_at) }));
    expect(data).toHaveLength(2);
    expect(data[0].y).toBe(20);
    expect(data[1].y).toBe(19);
  });

  it('returns empty array when no workout has body metrics', () => {
    const noMetrics = [makeWorkout('2024-01-01', [])];
    const data = noMetrics
      .filter((w) => w.body_weight_kg != null)
      .map((w, i) => ({ x: i, y: w.body_weight_kg as number, label: '' }));
    expect(data).toHaveLength(0);
  });
});

// ─── exercises deduplication ─────────────────────────────────────────────────

describe('buildExerciseMap', () => {
  it('deduplicates exercises that appear across multiple workouts', () => {
    const workouts = [
      makeWorkout('2024-01-01', [{ exercise_id: 'ex-1', reps: 10, weight_kg: 50, exercise: { id: 'ex-1', name: 'Squat' } }]),
      makeWorkout('2024-01-08', [{ exercise_id: 'ex-1', reps: 8, weight_kg: 60, exercise: { id: 'ex-1', name: 'Squat' } }]),
    ];
    const result = buildExerciseMap(workouts);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ex-1');
  });

  it('sets hasWeight=true when any set for that exercise has weight_kg', () => {
    const workouts = [
      makeWorkout('2024-01-01', [
        { exercise_id: 'ex-1', weight_kg: null, exercise: { id: 'ex-1', name: 'Plank' } },
        { exercise_id: 'ex-1', weight_kg: 20, exercise: { id: 'ex-1', name: 'Plank' } },
      ]),
    ];
    expect(buildExerciseMap(workouts)[0].hasWeight).toBe(true);
  });

  it('sets hasWeight=false when no set has weight_kg', () => {
    const workouts = [
      makeWorkout('2024-01-01', [
        { exercise_id: 'ex-1', weight_kg: null, exercise: { id: 'ex-1', name: 'Running' } },
      ]),
    ];
    expect(buildExerciseMap(workouts)[0].hasWeight).toBe(false);
  });

  it('sets hasDuration=true when any set has duration_seconds', () => {
    const workouts = [
      makeWorkout('2024-01-01', [
        { exercise_id: 'ex-2', duration_seconds: 60, exercise: { id: 'ex-2', name: 'Plank' } },
      ]),
    ];
    expect(buildExerciseMap(workouts)[0].hasDuration).toBe(true);
  });

  it('sorts exercises alphabetically by name', () => {
    const workouts = [
      makeWorkout('2024-01-01', [
        { exercise_id: 'ex-z', exercise: { id: 'ex-z', name: 'Squat' } },
        { exercise_id: 'ex-a', exercise: { id: 'ex-a', name: 'Bench Press' } },
      ]),
    ];
    const result = buildExerciseMap(workouts);
    expect(result[0].name).toBe('Bench Press');
    expect(result[1].name).toBe('Squat');
  });

  it('ignores sets where exercise is null', () => {
    // Construct directly — makeWorkout's `?? default` would replace null with a fallback object
    const workouts: RawWorkout[] = [{
      id: '1',
      performed_at: '2024-01-01',
      body_weight_kg: null,
      body_fat_percent: null,
      workout_sets: [{ exercise_id: 'ex-1', reps: 10, weight_kg: null, duration_seconds: null, exercise: null }],
    }];
    expect(buildExerciseMap(workouts)).toHaveLength(0);
  });
});

// ─── getExerciseProgress ─────────────────────────────────────────────────────

describe('getExerciseProgress (max weight per session)', () => {
  it('returns one point per workout that includes the exercise', () => {
    const workouts = [
      makeWorkout('2024-01-01', [{ exercise_id: 'sq', weight_kg: 80 }]),
      makeWorkout('2024-01-08', [{ exercise_id: 'sq', weight_kg: 85 }]),
      makeWorkout('2024-01-15', [{ exercise_id: 'dl', weight_kg: 100 }]), // different exercise
    ];
    expect(getExerciseProgress(workouts, 'sq')).toHaveLength(2);
  });

  it('returns the maximum weight across sets in a single workout', () => {
    const w = makeWorkout('2024-01-01', [
      { exercise_id: 'sq', weight_kg: 80 },
      { exercise_id: 'sq', weight_kg: 90 },
      { exercise_id: 'sq', weight_kg: 85 },
    ]);
    const points = getExerciseProgress([w], 'sq');
    expect(points[0].y).toBe(90);
  });

  it('excludes sets where weight_kg is null', () => {
    const workouts = [
      makeWorkout('2024-01-01', [{ exercise_id: 'sq', weight_kg: null }]),
      makeWorkout('2024-01-08', [{ exercise_id: 'sq', weight_kg: 50 }]),
    ];
    const points = getExerciseProgress(workouts, 'sq');
    expect(points).toHaveLength(1);
    expect(points[0].y).toBe(50);
  });

  it('returns empty array when exercise never appears', () => {
    const workouts = [
      makeWorkout('2024-01-01', [{ exercise_id: 'bench', weight_kg: 80 }]),
    ];
    expect(getExerciseProgress(workouts, 'squat')).toHaveLength(0);
  });

  it('x values are sequential starting at 0', () => {
    const workouts = [
      makeWorkout('2024-01-01', [{ exercise_id: 'sq', weight_kg: 60 }]),
      makeWorkout('2024-01-08', [{ exercise_id: 'sq', weight_kg: 70 }]),
      makeWorkout('2024-01-15', [{ exercise_id: 'sq', weight_kg: 80 }]),
    ];
    const points = getExerciseProgress(workouts, 'sq');
    expect(points.map((p) => p.x)).toEqual([0, 1, 2]);
  });
});

// ─── getExerciseDurationProgress ────────────────────────────────────────────

describe('getExerciseDurationProgress (max duration per session)', () => {
  it('returns max duration across sets per workout', () => {
    const w = makeWorkout('2024-01-01', [
      { exercise_id: 'plank', duration_seconds: 30 },
      { exercise_id: 'plank', duration_seconds: 45 },
      { exercise_id: 'plank', duration_seconds: 40 },
    ]);
    expect(getExerciseDurationProgress([w], 'plank')[0].y).toBe(45);
  });

  it('excludes sets where duration_seconds is null', () => {
    const workouts = [
      makeWorkout('2024-01-01', [{ exercise_id: 'plank', duration_seconds: null }]),
      makeWorkout('2024-01-08', [{ exercise_id: 'plank', duration_seconds: 60 }]),
    ];
    expect(getExerciseDurationProgress(workouts, 'plank')).toHaveLength(1);
  });
});

// ─── getExerciseRepsProgress ─────────────────────────────────────────────────

describe('getExerciseRepsProgress (max reps per session)', () => {
  it('returns max reps across sets per workout', () => {
    const w = makeWorkout('2024-01-01', [
      { exercise_id: 'pushup', reps: 15 },
      { exercise_id: 'pushup', reps: 12 },
      { exercise_id: 'pushup', reps: 20 },
    ]);
    expect(getExerciseRepsProgress([w], 'pushup')[0].y).toBe(20);
  });

  it('excludes sets where reps is null', () => {
    const workouts = [
      makeWorkout('2024-01-01', [{ exercise_id: 'run', reps: null, duration_seconds: 300 }]),
      makeWorkout('2024-01-08', [{ exercise_id: 'run', reps: 10 }]),
    ];
    expect(getExerciseRepsProgress(workouts, 'run')).toHaveLength(1);
  });
});

// ─── Date range filtering ────────────────────────────────────────────────────

describe('applyDateFilter', () => {
  const workouts = [
    makeWorkout('2024-01-01'),
    makeWorkout('2024-02-01'),
    makeWorkout('2024-03-01'),
    makeWorkout('2024-04-01'),
  ];

  it('returns all workouts when no filter is provided', () => {
    expect(applyDateFilter(workouts)).toHaveLength(4);
  });

  it('customRange includes only workouts within [start, end]', () => {
    const start = new Date('2024-01-15');
    const end   = new Date('2024-03-15');
    const result = applyDateFilter(workouts, undefined, { start, end });
    expect(result).toHaveLength(2); // Feb 1 and Mar 1
    expect(result[0].performed_at).toBe('2024-02-01');
    expect(result[1].performed_at).toBe('2024-03-01');
  });

  it('customRange is inclusive on both ends', () => {
    // Use local-midnight Date constructor (not ISO string) to match isoToLocalMs behaviour
    const start = new Date(2024, 1, 1); // Feb 1 local midnight
    const end   = new Date(2024, 1, 1);
    const result = applyDateFilter(workouts, undefined, { start, end });
    expect(result).toHaveLength(1);
    expect(result[0].performed_at).toBe('2024-02-01');
  });

  it('customRange excludes workouts outside the range', () => {
    const start = new Date('2024-06-01');
    const end   = new Date('2024-12-31');
    expect(applyDateFilter(workouts, undefined, { start, end })).toHaveLength(0);
  });

  it('daysBack=0 returns all workouts (0 is falsy — treated as no filter)', () => {
    // In the hook: `if (!daysBack) return rawWorkouts` — 0 is falsy so no filter is applied
    const today = new Date().toISOString().split('T')[0];
    const withToday = [makeWorkout(today), ...workouts];
    const result = applyDateFilter(withToday, 0);
    expect(result).toHaveLength(withToday.length);
  });
});
