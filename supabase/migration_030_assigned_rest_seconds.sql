-- Migration 030: Prescribed rest seconds per exercise in assigned workouts
-- Trainers can specify how long clients should rest after each exercise.

ALTER TABLE assigned_workout_exercises
  ADD COLUMN IF NOT EXISTS rest_seconds INT;
