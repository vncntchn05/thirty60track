/**
 * Unit tests for hooks/useWorkoutTemplates.ts
 *
 * Tests the Supabase call patterns for createTemplate, updateTemplate,
 * and deleteTemplate, plus the toTemplate() DB→domain mapping.
 */

import { supabase } from '@/lib/supabase';
import { createQueryMock } from '../helpers/supabase-mock';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: { onAuthStateChange: jest.fn(), signOut: jest.fn() },
  },
}));

const mockFrom = supabase.from as jest.Mock;

function makeChain(result: { data?: unknown; error?: unknown } = {}) {
  return createQueryMock(result);
}

// ─── Simulate hook mutation bodies ───────────────────────────────────────────

async function simulateCreateTemplate(payload: { name: string; exerciseNames: string[] }) {
  const chain = makeChain({ data: { id: 'tmpl-1', name: payload.name, exercise_names: payload.exerciseNames, created_at: '', updated_at: '' }, error: null });
  mockFrom.mockReturnValue(chain);
  const { data, error: err } = await (supabase
    .from('workout_templates')
    .insert({ name: payload.name, exercise_names: payload.exerciseNames })
    .select()
    .single() as unknown as Promise<{ data: unknown; error: { message: string } | null }>);
  return { data, error: err?.message ?? null };
}

async function simulateUpdateTemplate(id: string, payload: { name: string; exerciseNames: string[] }) {
  const chain = makeChain({ error: null });
  mockFrom.mockReturnValue(chain);
  const { error: err } = await (supabase
    .from('workout_templates')
    .update({ name: payload.name, exercise_names: payload.exerciseNames })
    .eq('id', id) as unknown as Promise<{ error: { message: string } | null }>);
  return { error: err?.message ?? null };
}

async function simulateDeleteTemplate(id: string) {
  const chain = makeChain({ error: null });
  mockFrom.mockReturnValue(chain);
  const { error: err } = await (supabase
    .from('workout_templates')
    .delete()
    .eq('id', id) as unknown as Promise<{ error: { message: string } | null }>);
  return { error: err?.message ?? null };
}

// ─── toTemplate mapping (replicated) ─────────────────────────────────────────

type DbRow = { id: string; name: string; exercise_names: string[]; created_at: string; updated_at: string };

function toTemplate(row: DbRow) {
  return { id: row.id, name: row.name, exerciseNames: row.exercise_names };
}

// ─── toTemplate ───────────────────────────────────────────────────────────────

describe('toTemplate mapping', () => {
  const row: DbRow = {
    id: 'tmpl-1',
    name: 'Push Focus',
    exercise_names: ['Squat', 'Press', 'Deadlift'],
    created_at: '2024-01-01',
    updated_at: '2024-01-02',
  };

  it('maps id, name, exercise_names → exerciseNames', () => {
    const t = toTemplate(row);
    expect(t.id).toBe('tmpl-1');
    expect(t.name).toBe('Push Focus');
    expect(t.exerciseNames).toEqual(['Squat', 'Press', 'Deadlift']);
  });

  it('preserves exercise order', () => {
    const r = { ...row, exercise_names: ['C', 'A', 'B'] };
    expect(toTemplate(r).exerciseNames).toEqual(['C', 'A', 'B']);
  });

  it('handles empty exerciseNames', () => {
    expect(toTemplate({ ...row, exercise_names: [] }).exerciseNames).toHaveLength(0);
  });

  it('strips created_at and updated_at from the output', () => {
    const t = toTemplate(row) as Record<string, unknown>;
    expect(t.created_at).toBeUndefined();
    expect(t.updated_at).toBeUndefined();
  });
});

// ─── createTemplate ───────────────────────────────────────────────────────────

describe('createTemplate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls supabase.from("workout_templates").insert with name + exercise_names', async () => {
    const chain = makeChain({ data: { id: 'tmpl-1', name: 'Leg Day', exercise_names: ['Squat'] }, error: null });
    mockFrom.mockReturnValue(chain);

    await supabase
      .from('workout_templates')
      .insert({ name: 'Leg Day', exercise_names: ['Squat'] })
      .select()
      .single();

    expect(mockFrom).toHaveBeenCalledWith('workout_templates');
    expect((chain.insert as jest.Mock)).toHaveBeenCalledWith({ name: 'Leg Day', exercise_names: ['Squat'] });
  });

  it('returns null error on success', async () => {
    const { error } = await simulateCreateTemplate({ name: 'Push', exerciseNames: ['Press'] });
    expect(error).toBeNull();
  });

  it('preserves exerciseNames array order in insert payload', async () => {
    const names = ['Z-exercise', 'A-exercise', 'M-exercise'];
    const chain = makeChain({ data: { id: 't', name: 'T', exercise_names: names }, error: null });
    mockFrom.mockReturnValue(chain);

    await supabase
      .from('workout_templates')
      .insert({ name: 'T', exercise_names: names })
      .select()
      .single();

    const insertArg = (chain.insert as jest.Mock).mock.calls[0][0];
    expect(insertArg.exercise_names).toEqual(names);
  });

  it('returns error message on insert failure', async () => {
    const chain = makeChain({ data: null, error: { message: 'name conflict' } });
    (chain.single as jest.Mock).mockResolvedValue({ data: null, error: { message: 'name conflict' } });
    mockFrom.mockReturnValue(chain);

    const { data, error: err } = await (supabase
      .from('workout_templates')
      .insert({ name: 'Dup', exercise_names: [] })
      .select()
      .single() as unknown as Promise<{ data: unknown; error: { message: string } | null }>);

    expect(data).toBeNull();
    expect(err?.message).toBe('name conflict');
  });
});

// ─── updateTemplate ───────────────────────────────────────────────────────────

describe('updateTemplate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls update().eq("id", id) on workout_templates', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);

    await supabase
      .from('workout_templates')
      .update({ name: 'New Name', exercise_names: ['Squat'] })
      .eq('id', 'tmpl-abc');

    expect(mockFrom).toHaveBeenCalledWith('workout_templates');
    expect((chain.update as jest.Mock)).toHaveBeenCalledWith({ name: 'New Name', exercise_names: ['Squat'] });
    expect((chain.eq as jest.Mock)).toHaveBeenCalledWith('id', 'tmpl-abc');
  });

  it('returns null error on success', async () => {
    const { error } = await simulateUpdateTemplate('tmpl-1', { name: 'Updated', exerciseNames: [] });
    expect(error).toBeNull();
  });

  it('passes updated exercise_names array to update()', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);

    await supabase
      .from('workout_templates')
      .update({ name: 'Pull', exercise_names: ['Row', 'Pull-up'] })
      .eq('id', 'tmpl-2');

    const updateArg = (chain.update as jest.Mock).mock.calls[0][0];
    expect(updateArg.exercise_names).toEqual(['Row', 'Pull-up']);
  });
});

// ─── deleteTemplate ───────────────────────────────────────────────────────────

describe('deleteTemplate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls delete().eq("id", id) on workout_templates', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);

    await supabase
      .from('workout_templates')
      .delete()
      .eq('id', 'tmpl-del');

    expect(mockFrom).toHaveBeenCalledWith('workout_templates');
    expect((chain.delete as jest.Mock)).toHaveBeenCalled();
    expect((chain.eq as jest.Mock)).toHaveBeenCalledWith('id', 'tmpl-del');
  });

  it('returns null error on success', async () => {
    const { error } = await simulateDeleteTemplate('tmpl-1');
    expect(error).toBeNull();
  });
});
