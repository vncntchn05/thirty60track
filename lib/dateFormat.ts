export const DAY_ABBR   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/**
 * Parse an ISO date string (YYYY-MM-DD) as a local Date, avoiding the UTC
 * midnight → previous-day timezone shift that `new Date('YYYY-MM-DD')` produces.
 */
export function isoToLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Short date with weekday: "Mon, Jan 6, 2025" */
export function fmtDate(iso: string): string {
  return isoToLocal(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

/** Short date without year: "Mon, Jan 6" */
export function fmtDateShort(iso: string): string {
  return isoToLocal(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

/** Long date without weekday: "January 6, 2025" */
export function fmtDateLong(iso: string): string {
  return isoToLocal(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}
