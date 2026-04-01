/**
 * Unit tests for constants/workoutTemplates.ts
 *
 * Validates the static template data that ships with the app:
 *  - Correct count (16 templates)
 *  - Required fields present and non-empty
 *  - No duplicate IDs or names
 *  - Phase/category groupings
 */

import { WORKOUT_TEMPLATES } from '@/constants/workoutTemplates';

describe('WORKOUT_TEMPLATES — data integrity', () => {
  it('contains exactly 32 templates', () => {
    expect(WORKOUT_TEMPLATES).toHaveLength(32);
  });

  it('every template has a non-empty id', () => {
    WORKOUT_TEMPLATES.forEach((t) => {
      expect(typeof t.id).toBe('string');
      expect(t.id.trim().length).toBeGreaterThan(0);
    });
  });

  it('every template has a non-empty name', () => {
    WORKOUT_TEMPLATES.forEach((t) => {
      expect(typeof t.name).toBe('string');
      expect(t.name.trim().length).toBeGreaterThan(0);
    });
  });

  it('every template has at least one exercise name', () => {
    WORKOUT_TEMPLATES.forEach((t) => {
      expect(Array.isArray(t.exerciseNames)).toBe(true);
      expect(t.exerciseNames.length).toBeGreaterThan(0);
    });
  });

  it('all IDs are unique', () => {
    const ids = WORKOUT_TEMPLATES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all names are unique', () => {
    const names = WORKOUT_TEMPLATES.map((t) => t.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it('every exercise name within a template is a non-empty string', () => {
    WORKOUT_TEMPLATES.forEach((t) => {
      t.exerciseNames.forEach((name) => {
        expect(typeof name).toBe('string');
        expect(name.trim().length).toBeGreaterThan(0);
      });
    });
  });
});

describe('WORKOUT_TEMPLATES — phase groupings', () => {
  it('includes 4 Phase-1 templates (P1-A through P1-D)', () => {
    const p1 = WORKOUT_TEMPLATES.filter((t) => t.id.startsWith('P1-'));
    expect(p1).toHaveLength(4);
  });

  it('includes 4 Phase-2 templates (P2-A through P2-D)', () => {
    const p2 = WORKOUT_TEMPLATES.filter((t) => t.id.startsWith('P2-'));
    expect(p2).toHaveLength(4);
  });

  it('includes 4 Phase-3 templates (P3-A through P3-D)', () => {
    const p3 = WORKOUT_TEMPLATES.filter((t) => t.id.startsWith('P3-'));
    expect(p3).toHaveLength(4);
  });

  it('includes 4 Abs variation templates (Abs-A through Abs-D)', () => {
    const abs = WORKOUT_TEMPLATES.filter((t) => t.id.startsWith('Abs-'));
    expect(abs).toHaveLength(4);
  });
});

describe('WORKOUT_TEMPLATES — specific template content', () => {
  it('P1-A is named "Workout A: Push Focus"', () => {
    const t = WORKOUT_TEMPLATES.find((x) => x.id === 'P1-A');
    expect(t?.name).toBe('Workout A: Push Focus');
  });

  it('P1-B is named "Workout B: Pull Focus"', () => {
    const t = WORKOUT_TEMPLATES.find((x) => x.id === 'P1-B');
    expect(t?.name).toBe('Workout B: Pull Focus');
  });

  it('Abs-A and Abs-B have the same exercise names (in reverse order)', () => {
    const a = WORKOUT_TEMPLATES.find((x) => x.id === 'Abs-A')!;
    const b = WORKOUT_TEMPLATES.find((x) => x.id === 'Abs-B')!;
    expect([...a.exerciseNames].reverse()).toEqual(b.exerciseNames);
  });

  it('all Abs templates have the same set of exercise names', () => {
    const abs = WORKOUT_TEMPLATES.filter((t) => t.id.startsWith('Abs-'));
    const setA = new Set(abs[0].exerciseNames);
    abs.forEach((t) => {
      const setT = new Set(t.exerciseNames);
      expect(setT.size).toBe(setA.size);
      for (const name of setT) {
        expect(setA.has(name)).toBe(true);
      }
    });
  });

  it('Phase-1 templates each have exactly 10 exercises', () => {
    const p1 = WORKOUT_TEMPLATES.filter((t) => t.id.startsWith('P1-'));
    p1.forEach((t) => expect(t.exerciseNames).toHaveLength(10));
  });

  it('Abs templates have 12 exercises each', () => {
    const abs = WORKOUT_TEMPLATES.filter((t) => t.id.startsWith('Abs-'));
    abs.forEach((t) => expect(t.exerciseNames).toHaveLength(12));
  });
});
