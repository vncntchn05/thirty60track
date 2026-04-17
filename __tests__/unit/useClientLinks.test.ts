/**
 * Unit tests for hooks/useClientLinks.ts
 *
 * Covers:
 *  - addToFamilyGroup() — inserts pairs for each new combination, ignores 23505 unique violations
 *  - addToFamilyGroup() — merges two existing groups into a full mesh
 *  - removeFromFamilyGroup() — deletes using OR clause (both directions)
 *  - removeFromFamilyGroup() — returns error on DB failure
 */

import { addToFamilyGroup, removeFromFamilyGroup } from '@/hooks/useClientLinks';
import { supabase } from '@/lib/supabase';
import { createQueryMock } from '@/__tests__/helpers/supabase-mock';

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const mockFrom = supabase.from as jest.Mock;

// ─── addToFamilyGroup ─────────────────────────────────────────────────────────

describe('addToFamilyGroup', () => {
  const trainerId = 'trainer-1';

  beforeEach(() => jest.clearAllMocks());

  it('links two brand-new clients by inserting one pair', async () => {
    // Neither anchor nor newMember has existing links
    const emptyLinks = createQueryMock({ data: [], error: null });
    const insertMock = createQueryMock({ data: null, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'client_links') {
        return {
          ...emptyLinks,
          select: jest.fn().mockReturnValue(emptyLinks),
          or: jest.fn().mockReturnValue(emptyLinks),
          insert: jest.fn().mockReturnValue(insertMock),
          then: emptyLinks.then,
        };
      }
      return createQueryMock({ data: null, error: null });
    });

    const result = await addToFamilyGroup(trainerId, 'client-A', 'client-B');

    expect(result.error).toBeNull();
    // Should have called insert with the pair
    const calls = mockFrom.mock.calls.filter((c: string[]) => c[0] === 'client_links');
    expect(calls.length).toBeGreaterThan(0);
  });

  it('ignores unique violation (23505) and continues', async () => {
    const emptyLinks = createQueryMock({ data: [], error: null });
    const duplicateError = createQueryMock({
      data: null,
      error: { code: '23505', message: 'duplicate key' },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'client_links') {
        return {
          ...emptyLinks,
          select: jest.fn().mockReturnValue(emptyLinks),
          or: jest.fn().mockReturnValue(emptyLinks),
          insert: jest.fn().mockReturnValue(duplicateError),
          then: emptyLinks.then,
        };
      }
      return createQueryMock({ data: null, error: null });
    });

    const result = await addToFamilyGroup(trainerId, 'client-A', 'client-B');

    // 23505 is ignored — function should return { error: null }
    expect(result.error).toBeNull();
  });

  it('returns error for non-23505 insert failure', async () => {
    const emptyLinks = createQueryMock({ data: [], error: null });
    const fatalError = createQueryMock({
      data: null,
      error: { code: '23000', message: 'FK violation' },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'client_links') {
        return {
          ...emptyLinks,
          select: jest.fn().mockReturnValue(emptyLinks),
          or: jest.fn().mockReturnValue(emptyLinks),
          insert: jest.fn().mockReturnValue(fatalError),
          then: emptyLinks.then,
        };
      }
      return createQueryMock({ data: null, error: null });
    });

    const result = await addToFamilyGroup(trainerId, 'client-A', 'client-B');

    expect(result.error).toBe('FK violation');
  });

  it('merges two groups: all pairs are inserted', async () => {
    // Anchor group: [A, B] (A is already linked to B)
    // New member group: [C, D] (C is already linked to D)
    // After merge: full mesh A-B-C-D → 6 pairs total, 4 new pairs needed

    const anchorLinks = createQueryMock({
      data: [{ client_id: 'client-A', linked_client_id: 'client-B' }],
      error: null,
    });
    const newMemberLinks = createQueryMock({
      data: [{ client_id: 'client-C', linked_client_id: 'client-D' }],
      error: null,
    });
    const insertMock = createQueryMock({ data: null, error: null });

    let callCount = 0;
    const insertSpy = jest.fn().mockReturnValue(insertMock);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'client_links') {
        callCount++;
        // First resolveGroupMembers call (anchor A), second (new member C)
        const linksData = callCount === 1 ? anchorLinks : callCount === 2 ? newMemberLinks : anchorLinks;
        return {
          ...linksData,
          select: jest.fn().mockReturnValue(linksData),
          or: jest.fn().mockReturnValue(linksData),
          insert: insertSpy,
          then: linksData.then,
        };
      }
      return createQueryMock({ data: null, error: null });
    });

    const result = await addToFamilyGroup(trainerId, 'client-A', 'client-C');

    expect(result.error).toBeNull();
    // With 4 members (A,B,C,D) the full mesh has C(4,2)=6 pairs; all should be inserted
    expect(insertSpy).toHaveBeenCalledTimes(6);
  });
});

// ─── removeFromFamilyGroup ────────────────────────────────────────────────────

describe('removeFromFamilyGroup', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes all links using OR clause for both directions', async () => {
    const deleteMock = createQueryMock({ data: null, error: null });
    const orSpy = jest.fn().mockReturnValue(deleteMock);

    mockFrom.mockReturnValue({
      ...deleteMock,
      delete: jest.fn().mockReturnValue({ or: orSpy, then: deleteMock.then }),
      then: deleteMock.then,
    });

    const result = await removeFromFamilyGroup('client-X');

    expect(result.error).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith('client_links');
    expect(orSpy).toHaveBeenCalledWith(
      expect.stringContaining('client-X'),
    );
  });

  it('returns error on DB failure', async () => {
    const failMock = createQueryMock({ data: null, error: { message: 'Delete failed' } });

    mockFrom.mockReturnValue({
      ...failMock,
      delete: jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue(failMock),
        then: failMock.then,
      }),
      then: failMock.then,
    });

    const result = await removeFromFamilyGroup('client-bad');
    expect(result.error).toBe('Delete failed');
  });
});
