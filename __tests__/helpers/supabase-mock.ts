/**
 * Creates a chainable Supabase query builder mock.
 * Every non-terminal method returns the same mock object (enabling chaining).
 * Terminal methods (single, maybeSingle) return resolved promises.
 * The mock object itself is thenable — it can be directly `await`ed (for
 * calls like `await supabase.from('x').insert(data)` with no further chaining).
 */
export function createQueryMock(result: { data?: unknown; error?: unknown; count?: number | null } = {}) {
  const { data = null, error = null, count = null } = result;
  const resolved = { data, error, count };

  const mock: Record<string, jest.Mock | ((onFulfilled: (v: typeof resolved) => unknown) => Promise<unknown>)> = {};

  const chainMethods = [
    'select', 'eq', 'neq', 'is', 'in', 'order', 'insert',
    'update', 'delete', 'upsert', 'limit', 'range', 'match',
    'filter', 'not', 'or', 'contains', 'containedBy',
  ];

  for (const method of chainMethods) {
    mock[method] = jest.fn().mockReturnValue(mock);
  }

  (mock as Record<string, jest.Mock>).single = jest.fn().mockResolvedValue({ data, error });
  (mock as Record<string, jest.Mock>).maybeSingle = jest.fn().mockResolvedValue({ data, error });

  // Make mock thenable so `await supabase.from('x').insert(...)` works
  mock.then = (onFulfilled: (v: typeof resolved) => unknown) =>
    Promise.resolve(resolved).then(onFulfilled as Parameters<Promise<typeof resolved>['then']>[0]);

  return mock;
}

/** Build a full supabase mock where each table can have a different response. */
export function createSupabaseMock(
  tableResponses: Record<string, ReturnType<typeof createQueryMock>> = {},
  defaultResponse: { data?: unknown; error?: unknown } = {},
) {
  const fromMock = jest.fn((table: string) => {
    return tableResponses[table] ?? createQueryMock(defaultResponse);
  });

  const onAuthStateChangeMock = jest.fn(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  }));

  return {
    supabase: {
      from: fromMock,
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({ data: null, error: null }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        onAuthStateChange: onAuthStateChangeMock,
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      },
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn().mockResolvedValue({ data: null, error: null }),
          remove: jest.fn().mockResolvedValue({ data: null, error: null }),
          getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/file.jpg' } })),
        })),
      },
    },
    fromMock,
    onAuthStateChangeMock,
  };
}
