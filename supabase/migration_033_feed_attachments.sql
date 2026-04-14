-- ============================================================
-- Migration 033 — Feed Post Attachments
-- ============================================================
-- Adds 4 nullable columns to feed_posts so a post can carry
-- an optional reference to an exercise, workout, assigned
-- workout, or guide entry.
-- ============================================================

ALTER TABLE feed_posts
  ADD COLUMN IF NOT EXISTS attachment_type    TEXT CHECK (attachment_type IN ('exercise', 'workout', 'assigned_workout', 'guide')),
  ADD COLUMN IF NOT EXISTS attachment_id      TEXT,
  ADD COLUMN IF NOT EXISTS attachment_title   TEXT,
  ADD COLUMN IF NOT EXISTS attachment_subtitle TEXT;
