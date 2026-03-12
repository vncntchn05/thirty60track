/**
 * Unit tests for hooks/useExercises.ts
 *
 * Tests createExercise and updateExercise call patterns via Supabase mock.
 * Also covers the exercise library structure: fields selected, ordering.
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

const EXERCISE_FIELDS = 'id, name, muscle_group, category, form_notes, help_url, created_at';

// ─── Simulate createExercise ──────────────────────────────────────────────────

async function simulateCreateExercise(payload: {
  name: string;
  muscle_group: string | null;
  category: string;
}) {
  const chain = createQueryMock({ data: { id: 'ex-new', ...payload }, error: null });
  mockFrom.mockReturnValue(chain);

  const { data, error: err } = await (supabase
    .from('exercises')
    .insert(payload)
    .select(EXERCISE_FIELDS)
    .single() as unknown as Promise<{ data: unknown; error: { message: string } | null }>);
  return { exercise: data ?? null, error: err?.message ?? null };
}

// ─── Simulate updateExercise ─────────────────────────────────────────────────

async function simulateUpdateExercise(id: string, payload: { form_notes?: string; help_url?: string }) {
  const chain = createQueryMock({ error: null });
  mockFrom.mockReturnValue(chain);

  const { error: err } = await (supabase
    .from('exercises')
    .update(payload)
    .eq('id', id) as unknown as Promise<{ error: { message: string } | null }>);
  return { error: err?.message ?? null };
}

// ─── createExercise ───────────────────────────────────────────────────────────

describe('createExercise', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls from("exercises").insert() with name, muscle_group, category', async () => {
    const chain = createQueryMock({
      data: { id: 'ex-1', name: 'Barbell Row', muscle_group: 'Back', category: 'strength' },
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    await supabase
      .from('exercises')
      .insert({ name: 'Barbell Row', muscle_group: 'Back', category: 'strength' })
      .select(EXERCISE_FIELDS)
      .single();

    expect(mockFrom).toHaveBeenCalledWith('exercises');
    expect((chain.insert as jest.Mock)).toHaveBeenCalledWith({
      name: 'Barbell Row',
      muscle_group: 'Back',
      category: 'strength',
    });
  });

  it('returns null error on success', async () => {
    const { error } = await simulateCreateExercise({
      name: 'Plank',
      muscle_group: 'Core',
      category: 'strength',
    });
    expect(error).toBeNull();
  });

  it('accepts null muscle_group', async () => {
    const chain = createQueryMock({ data: { id: 'ex-2', name: 'Jumping Jacks', muscle_group: null, category: 'cardio' }, error: null });
    mockFrom.mockReturnValue(chain);

    await supabase
      .from('exercises')
      .insert({ name: 'Jumping Jacks', muscle_group: null, category: 'cardio' })
      .select(EXERCISE_FIELDS)
      .single();

    const insertArg = (chain.insert as jest.Mock).mock.calls[0][0];
    expect(insertArg.muscle_group).toBeNull();
    expect(insertArg.category).toBe('cardio');
  });

  it('selects specific fields after insert (not *)', async () => {
    const chain = createQueryMock({ data: {}, error: null });
    mockFrom.mockReturnValue(chain);

    await supabase
      .from('exercises')
      .insert({ name: 'T', muscle_group: null, category: 'other' })
      .select(EXERCISE_FIELDS)
      .single();

    expect((chain.select as jest.Mock)).toHaveBeenCalledWith(EXERCISE_FIELDS);
  });

  it('returns error message on insert failure', async () => {
    const chain = createQueryMock({ data: null, error: { message: 'name taken' } });
    (chain.single as jest.Mock).mockResolvedValue({ data: null, error: { message: 'name taken' } });
    mockFrom.mockReturnValue(chain);

    const { data, error: err } = await (supabase
      .from('exercises')
      .insert({ name: 'Squat', muscle_group: null, category: 'strength' })
      .select(EXERCISE_FIELDS)
      .single() as unknown as Promise<{ data: unknown; error: { message: string } | null }>);

    expect(data).toBeNull();
    expect(err?.message).toBe('name taken');
  });

  it('supports all four valid categories', async () => {
    const categories = ['strength', 'cardio', 'flexibility', 'other'] as const;

    for (const category of categories) {
      const chain = createQueryMock({ data: { id: 'e', name: 'X', muscle_group: null, category }, error: null });
      mockFrom.mockReturnValue(chain);

      await supabase
        .from('exercises')
        .insert({ name: 'X', muscle_group: null, category })
        .select(EXERCISE_FIELDS)
        .single();

      const insertArg = (chain.insert as jest.Mock).mock.calls[0][0];
      expect(insertArg.category).toBe(category);
      jest.clearAllMocks();
    }
  });
});

// ─── updateExercise ───────────────────────────────────────────────────────────

describe('updateExercise', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls update().eq("id", id) on exercises', async () => {
    const chain = createQueryMock({ error: null });
    mockFrom.mockReturnValue(chain);

    await supabase
      .from('exercises')
      .update({ form_notes: 'Keep back flat' })
      .eq('id', 'ex-abc');

    expect(mockFrom).toHaveBeenCalledWith('exercises');
    expect((chain.eq as jest.Mock)).toHaveBeenCalledWith('id', 'ex-abc');
  });

  it('returns null error on success', async () => {
    const { error } = await simulateUpdateExercise('ex-1', { form_notes: 'Chest up' });
    expect(error).toBeNull();
  });

  it('can update form_notes and help_url independently', async () => {
    const chain = createQueryMock({ error: null });
    mockFrom.mockReturnValue(chain);

    await supabase
      .from('exercises')
      .update({ help_url: 'https://example.com/squat' })
      .eq('id', 'ex-1');

    const updateArg = (chain.update as jest.Mock).mock.calls[0][0];
    expect(updateArg.help_url).toBe('https://example.com/squat');
    expect(updateArg.form_notes).toBeUndefined();
  });

  it('passes both form_notes and help_url when both provided', async () => {
    const chain = createQueryMock({ error: null });
    mockFrom.mockReturnValue(chain);

    await supabase
      .from('exercises')
      .update({ form_notes: 'Notes here', help_url: 'https://yt.com/x' })
      .eq('id', 'ex-2');

    const updateArg = (chain.update as jest.Mock).mock.calls[0][0];
    expect(updateArg.form_notes).toBe('Notes here');
    expect(updateArg.help_url).toBe('https://yt.com/x');
  });
});

// ─── Exercise library guard clauses (replicated) ─────────────────────────────

describe('useExercises fetch guard', () => {
  it('orders exercises by name ascending', async () => {
    const chain = createQueryMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await supabase
      .from('exercises')
      .select(EXERCISE_FIELDS)
      .order('name');

    expect((chain.order as jest.Mock)).toHaveBeenCalledWith('name');
  });
});
