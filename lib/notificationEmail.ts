import { supabase } from '@/lib/supabase';

type BookingEmailPayload =
  | { type: 'session_confirmed'; clientId: string; scheduledAt: string; durationMinutes: number; trainerName: string }
  | { type: 'assigned_workout'; clientId: string; title: string | null; scheduledDate: string; scheduledTime: string | null }
  | { type: 'recurring_plan'; clientId: string; title: string; occurrenceCount: number; startDate: string; scheduledTime: string | null };

/**
 * Fire-and-forget: calls the send-booking-email edge function.
 * Never throws — failures are logged but never surface to the caller.
 */
export function sendBookingEmail(payload: BookingEmailPayload): void {
  supabase.functions
    .invoke('send-booking-email', { body: payload })
    .catch((e) => console.warn('[sendBookingEmail] non-critical error:', e));
}
