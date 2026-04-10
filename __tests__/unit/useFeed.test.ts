/**
 * Unit tests for hooks/useFeed.ts
 *
 * Covers the exported standalone mutation functions:
 *  - createPost
 *  - deletePost
 *  - toggleReaction (remove, change type, insert)
 *  - addComment
 *  - deleteComment
 *  - uploadPostImage
 */

import {
  createPost,
  deletePost,
  toggleReaction,
  addComment,
  deleteComment,
  uploadPostImage,
} from '@/hooks/useFeed';
import { supabase } from '@/lib/supabase';

// ─── Module mocks ─────────────────────────────────────────────

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  },
}));

const mockFrom = supabase.from as jest.Mock;
const mockStorageFrom = supabase.storage.from as jest.Mock;

// ─── Helpers ──────────────────────────────────────────────────

function makeQueryMock(result: { data?: unknown; error?: unknown } = {}) {
  const { data = null, error = null } = result;
  const m: Record<string, jest.Mock | ((cb: (v: { data: unknown; error: unknown }) => unknown) => Promise<unknown>)> = {};
  for (const method of ['select', 'eq', 'delete', 'insert', 'update', 'order', 'limit', 'maybeSingle']) {
    m[method] = jest.fn().mockReturnValue(m);
  }
  m['single'] = jest.fn().mockResolvedValue({ data, error });
  m['then'] = (cb: (v: { data: unknown; error: unknown }) => unknown) =>
    Promise.resolve({ data, error }).then(cb);
  return m;
}

beforeEach(() => jest.clearAllMocks());

// ─── createPost ───────────────────────────────────────────────

describe('createPost', () => {
  it('returns null error on success', async () => {
    mockFrom.mockReturnValue(makeQueryMock({ error: null }));
    const { error } = await createPost({
      body: 'Hello world',
      author_role: 'trainer',
      author_name: 'John',
    });
    expect(error).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith('feed_posts');
  });

  it('returns error message on failure', async () => {
    mockFrom.mockReturnValue(makeQueryMock({ error: { message: 'insert failed' } }));
    const { error } = await createPost({
      body: 'oops',
      author_role: 'client',
      author_name: 'Jane',
    });
    expect(error).toBe('insert failed');
  });

  it('passes image_url when provided', async () => {
    const mock = makeQueryMock({ error: null });
    mockFrom.mockReturnValue(mock);
    await createPost({ body: 'With image', author_role: 'trainer', author_name: 'T', image_url: 'https://example.com/img.jpg' });
    expect(mock['insert']).toHaveBeenCalledWith(
      expect.objectContaining({ image_url: 'https://example.com/img.jpg' }),
    );
  });
});

// ─── deletePost ───────────────────────────────────────────────

describe('deletePost', () => {
  it('calls delete().eq() and returns null error on success', async () => {
    const mock = makeQueryMock({ error: null });
    mockFrom.mockReturnValue(mock);
    const { error } = await deletePost('post-uuid');
    expect(error).toBeNull();
    expect(mock['delete']).toHaveBeenCalled();
    expect(mock['eq']).toHaveBeenCalledWith('id', 'post-uuid');
  });

  it('returns error message on failure', async () => {
    mockFrom.mockReturnValue(makeQueryMock({ error: { message: 'not allowed' } }));
    const { error } = await deletePost('post-uuid');
    expect(error).toBe('not allowed');
  });
});

// ─── toggleReaction ───────────────────────────────────────────

describe('toggleReaction', () => {
  it('deletes reaction when same type is toggled off', async () => {
    const mock = makeQueryMock({ error: null });
    mockFrom.mockReturnValue(mock);
    const { error } = await toggleReaction('p1', 'u1', 'like', 'like');
    expect(error).toBeNull();
    expect(mock['delete']).toHaveBeenCalled();
  });

  it('updates reaction type when a different type is chosen', async () => {
    const mock = makeQueryMock({ error: null });
    mockFrom.mockReturnValue(mock);
    const { error } = await toggleReaction('p1', 'u1', 'fire', 'like');
    expect(error).toBeNull();
    expect(mock['update']).toHaveBeenCalledWith({ reaction_type: 'fire' });
  });

  it('inserts a new reaction when no current reaction exists', async () => {
    const mock = makeQueryMock({ error: null });
    mockFrom.mockReturnValue(mock);
    const { error } = await toggleReaction('p1', 'u1', 'clap', null);
    expect(error).toBeNull();
    expect(mock['insert']).toHaveBeenCalledWith(
      expect.objectContaining({ post_id: 'p1', reaction_type: 'clap' }),
    );
  });
});

// ─── addComment ───────────────────────────────────────────────

describe('addComment', () => {
  it('inserts a comment and returns null error on success', async () => {
    const mock = makeQueryMock({ error: null });
    mockFrom.mockReturnValue(mock);
    const { error } = await addComment({
      post_id: 'p1',
      body: 'Nice post!',
      author_role: 'client',
      author_name: 'Alice',
    });
    expect(error).toBeNull();
    expect(mock['insert']).toHaveBeenCalledWith(
      expect.objectContaining({ post_id: 'p1', body: 'Nice post!' }),
    );
  });
});

// ─── deleteComment ────────────────────────────────────────────

describe('deleteComment', () => {
  it('deletes a comment by id', async () => {
    const mock = makeQueryMock({ error: null });
    mockFrom.mockReturnValue(mock);
    const { error } = await deleteComment('c-uuid');
    expect(error).toBeNull();
    expect(mock['eq']).toHaveBeenCalledWith('id', 'c-uuid');
  });
});

// ─── uploadPostImage ──────────────────────────────────────────

describe('uploadPostImage', () => {
  const origFetch = global.fetch;

  afterEach(() => {
    global.fetch = origFetch;
  });

  it('returns the public URL on success', async () => {
    // Mock fetch to return a blob
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob(['img'])),
    }) as unknown as typeof fetch;

    mockStorageFrom.mockReturnValue({
      upload: jest.fn().mockResolvedValue({ error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/img.jpg' } }),
    });

    const { url, error } = await uploadPostImage('file:///local/photo.jpg', 'user-1');
    expect(error).toBeNull();
    expect(url).toBe('https://cdn.example.com/img.jpg');
  });

  it('returns an error when upload fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob(['img'])),
    }) as unknown as typeof fetch;

    mockStorageFrom.mockReturnValue({
      upload: jest.fn().mockResolvedValue({ error: { message: 'bucket not found' } }),
      getPublicUrl: jest.fn(),
    });

    const { url, error } = await uploadPostImage('file:///local/photo.jpg', 'user-1');
    expect(url).toBeNull();
    expect(error).toBe('bucket not found');
  });

  it('returns an error when fetch throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network error')) as unknown as typeof fetch;

    const { url, error } = await uploadPostImage('file:///bad.jpg', 'user-1');
    expect(url).toBeNull();
    expect(error).toBe('network error');
  });
});
