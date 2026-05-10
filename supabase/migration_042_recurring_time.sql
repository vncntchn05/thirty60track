-- ============================================================
-- Migration 042 — Booking Time on Recurring Plans
-- ============================================================
-- Adds an optional preferred time of day to recurring plan series
-- and propagates it to each generated assigned_workout instance.

ALTER TABLE recurring_plans
  ADD COLUMN IF NOT EXISTS scheduled_time TIME;

ALTER TABLE assigned_workouts
  ADD COLUMN IF NOT EXISTS scheduled_time TIME;
