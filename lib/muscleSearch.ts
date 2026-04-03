const MUSCLE_SYNONYMS: Record<string, string[]> = {
  arms:        ['bicep', 'biceps', 'tricep', 'triceps', 'forearm', 'forearms', 'brachialis', 'brachioradialis', 'curl'],
  chest:       ['pec', 'pecs', 'pectoral', 'pectorals'],
  back:        ['lat', 'lats', 'latissimus', 'rhomboid', 'rhomboids', 'trap', 'traps', 'trapezius', 'erector', 'spinae'],
  legs:        ['quad', 'quads', 'quadricep', 'quadriceps', 'hamstring', 'hamstrings', 'calf', 'calves', 'thigh', 'tibialis'],
  shoulders:   ['delt', 'delts', 'deltoid', 'deltoids', 'rotator', 'cuff'],
  core:        ['abs', 'ab', 'abdominal', 'abdominals', 'oblique', 'obliques', 'transverse'],
  glutes:      ['glute', 'gluteus', 'gluteal', 'butt', 'hip'],
  hands:       ['wrist', 'wrists', 'finger', 'fingers', 'grip', 'palm', 'knuckle', 'thumb', 'pinch'],
  feet:        ['foot', 'ankle', 'ankles', 'toe', 'toes', 'plantar', 'achilles', 'heel', 'metatarsal'],
  'full body': ['compound', 'total body'],
};

/**
 * Returns the canonical muscle_group value(s) that match a lowercased query
 * via synonym lookup. E.g. "biceps" → ["arms"], "quads" → ["legs"].
 */
export function resolveGroupsFromQuery(q: string): string[] {
  if (!q) return [];
  const matches: string[] = [];
  for (const [group, synonyms] of Object.entries(MUSCLE_SYNONYMS)) {
    if (group.includes(q) || synonyms.some((s) => s.includes(q) || q.includes(s))) {
      matches.push(group);
    }
  }
  return matches;
}
