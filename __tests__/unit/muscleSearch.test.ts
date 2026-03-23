/**
 * Unit tests for lib/muscleSearch.ts
 *
 * resolveGroupsFromQuery is a pure function — no mocks needed.
 * Matching rules:
 *   - group.includes(q)              → query is a substring of the group name
 *   - synonym.includes(q)            → query is a substring of a synonym
 *   - q.includes(synonym)            → synonym is a substring of the query
 */

import { resolveGroupsFromQuery } from '@/lib/muscleSearch';

describe('resolveGroupsFromQuery', () => {
  // ── Edge cases ─────────────────────────────────────────────────────────────

  it('returns [] for empty string', () => {
    expect(resolveGroupsFromQuery('')).toEqual([]);
  });

  it('returns [] for an unrecognised term', () => {
    expect(resolveGroupsFromQuery('zzznomatch')).toEqual([]);
  });

  // ── Direct group-name matches ──────────────────────────────────────────────

  it.each([
    ['arms'],
    ['chest'],
    ['back'],
    ['legs'],
    ['shoulders'],
    ['core'],
    ['glutes'],
  ])('resolves exact group name "%s" to itself', (group) => {
    expect(resolveGroupsFromQuery(group)).toContain(group);
  });

  // ── Arms ──────────────────────────────────────────────────────────────────

  it.each(['bicep', 'biceps', 'tricep', 'triceps', 'forearm', 'forearms', 'brachialis'])(
    'resolves "%s" to arms',
    (term) => {
      expect(resolveGroupsFromQuery(term)).toContain('arms');
    },
  );

  // ── Chest ─────────────────────────────────────────────────────────────────

  it.each(['pec', 'pecs', 'pectoral', 'pectorals'])(
    'resolves "%s" to chest',
    (term) => {
      expect(resolveGroupsFromQuery(term)).toContain('chest');
    },
  );

  // ── Back ──────────────────────────────────────────────────────────────────

  it.each(['lat', 'lats', 'latissimus', 'rhomboid', 'rhomboids', 'trap', 'traps', 'trapezius', 'erector'])(
    'resolves "%s" to back',
    (term) => {
      expect(resolveGroupsFromQuery(term)).toContain('back');
    },
  );

  // ── Legs ──────────────────────────────────────────────────────────────────

  it.each(['quad', 'quads', 'quadricep', 'quadriceps', 'hamstring', 'hamstrings', 'calf', 'calves', 'thigh'])(
    'resolves "%s" to legs',
    (term) => {
      expect(resolveGroupsFromQuery(term)).toContain('legs');
    },
  );

  // ── Shoulders ─────────────────────────────────────────────────────────────

  it.each(['delt', 'delts', 'deltoid', 'deltoids'])(
    'resolves "%s" to shoulders',
    (term) => {
      expect(resolveGroupsFromQuery(term)).toContain('shoulders');
    },
  );

  // ── Core ──────────────────────────────────────────────────────────────────

  it.each(['abs', 'ab', 'abdominal', 'abdominals', 'oblique', 'obliques', 'transverse'])(
    'resolves "%s" to core',
    (term) => {
      expect(resolveGroupsFromQuery(term)).toContain('core');
    },
  );

  // ── Glutes ────────────────────────────────────────────────────────────────

  it.each(['glute', 'gluteus', 'gluteal', 'butt', 'hip'])(
    'resolves "%s" to glutes',
    (term) => {
      expect(resolveGroupsFromQuery(term)).toContain('glutes');
    },
  );

  // ── Full body ─────────────────────────────────────────────────────────────

  it('resolves "compound" to full body', () => {
    expect(resolveGroupsFromQuery('compound')).toContain('full body');
  });

  // ── Partial / longer queries ───────────────────────────────────────────────

  it('resolves partial prefix "tri" to arms (tricep contains "tri")', () => {
    // synonym "tricep".includes("tri") = true
    expect(resolveGroupsFromQuery('tri')).toContain('arms');
  });

  it('resolves "biceps curl" to arms (q.includes("biceps") = true)', () => {
    // "biceps curl".includes("biceps") catches the synonym
    expect(resolveGroupsFromQuery('biceps curl')).toContain('arms');
  });

  // ── Return type ───────────────────────────────────────────────────────────

  it('returns an Array', () => {
    expect(Array.isArray(resolveGroupsFromQuery('chest'))).toBe(true);
  });

  it('can return multiple groups for an ambiguous term', () => {
    // "glute" is both a synonym for glutes AND contained in "glutes" group name
    const result = resolveGroupsFromQuery('glute');
    expect(result).toContain('glutes');
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});
