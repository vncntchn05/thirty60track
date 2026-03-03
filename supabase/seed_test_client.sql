-- ============================================================
-- Test Client Seed Data — "Test" (Youth Hockey Player)
-- Run in Supabase SQL Editor AFTER schema.sql
--
-- Realistic human variability:
--   • ~20% session skip rate (higher during injury)
--   • Day-of-week shifts (+/- 1 day randomly)
--   • ±8–15% weight noise per session
--   • Occasional set/rep drops ("off day")
--   • Knee injury weeks 14–18 (modified programming)
--   • Body metrics logged irregularly (~every 3–5 weeks)
--   • Body weight fluctuates around the downward trend
--
-- Overall trend (despite noise):
--   • Strength: +40–50 kg on main lifts over the year
--   • Cardio: 10 min → 28+ min sustained
--   • Body fat: ~18 % → ~11.5 %
--   • Body weight: ~72 kg → ~69 kg
-- ============================================================

DO $$
DECLARE
  v_trainer_id      UUID;
  v_client_id       UUID;

  -- Exercise IDs
  ex_box_squat      UUID;
  ex_rdl            UUID;
  ex_lat_pulldown   UUID;
  ex_goblet_squat   UUID;
  ex_rowing         UUID;
  ex_cycling        UUID;
  ex_lat_bounds     UUID;
  ex_skater_jumps   UUID;
  ex_plank          UUID;
  ex_russian_twists UUID;
  ex_deadbugs       UUID;

  -- Loop state
  v_week            INT;
  v_session         INT;
  v_date            DATE;
  v_workout_id      UUID;
  v_day_offset      INT;

  -- Per-workout helpers
  v_phase_sets      INT;    -- target sets for this training phase
  v_actual_sets     INT;    -- sets actually done this workout
  v_reps            INT;
  v_weight          NUMERIC;
  v_duration        INT;
  v_body_weight     NUMERIC;
  v_body_fat        NUMERIC;
  v_noise           NUMERIC;
  s                 INT;

  -- State flags
  v_injured_knee    BOOLEAN;
  v_last_bf_week    INT;
  v_notes           TEXT;

BEGIN

  -- ── Trainer ────────────────────────────────────────────────
  SELECT id INTO v_trainer_id FROM trainers ORDER BY created_at LIMIT 1;
  IF v_trainer_id IS NULL THEN
    RAISE EXCEPTION 'No trainer found. Create an account in the app first.';
  END IF;

  -- ── Client ─────────────────────────────────────────────────
  INSERT INTO clients (
    trainer_id, full_name, email, date_of_birth,
    height_cm, weight_kg, bf_percent, lean_body_mass, notes
  ) VALUES (
    v_trainer_id,
    'Test',
    'test@thirtysixtyfitness.com',
    '2009-08-15',
    170.0, 72.0, 18.0,
    ROUND(72.0 * 0.82, 2),
    'Youth AAA hockey player. Off-season endurance and strength program. ' ||
    'Goals: skating power, aerobic base, core stability, body recomp.'
  ) RETURNING id INTO v_client_id;

  -- ── Ensure required exercises exist ────────────────────────
  INSERT INTO exercises (name, muscle_group, category) VALUES
    ('Box Squat',       'Legs', 'strength'),
    ('RDL (Dumbbells)', 'Legs', 'strength'),
    ('Lat Pulldown',    'Back', 'strength'),
    ('DB Goblet Squat', 'Legs', 'strength'),
    ('Rowing Machine',  NULL,   'cardio'),
    ('Cycling',         NULL,   'cardio'),
    ('Lateral Bounds',  'Legs', 'cardio'),
    ('Skater Jumps',    'Legs', 'cardio'),
    ('Plank',           'Core', 'strength'),
    ('Russian Twists',  'Core', 'strength'),
    ('Deadbugs',        'Core', 'strength')
  ON CONFLICT (name) DO NOTHING;

  -- ── Exercise IDs ───────────────────────────────────────────
  SELECT id INTO ex_box_squat      FROM exercises WHERE name = 'Box Squat'       LIMIT 1;
  SELECT id INTO ex_rdl            FROM exercises WHERE name = 'RDL (Dumbbells)' LIMIT 1;
  SELECT id INTO ex_lat_pulldown   FROM exercises WHERE name = 'Lat Pulldown'    LIMIT 1;
  SELECT id INTO ex_goblet_squat   FROM exercises WHERE name = 'DB Goblet Squat' LIMIT 1;
  SELECT id INTO ex_rowing         FROM exercises WHERE name = 'Rowing Machine'  LIMIT 1;
  SELECT id INTO ex_cycling        FROM exercises WHERE name = 'Cycling'         LIMIT 1;
  SELECT id INTO ex_lat_bounds     FROM exercises WHERE name = 'Lateral Bounds'  LIMIT 1;
  SELECT id INTO ex_skater_jumps   FROM exercises WHERE name = 'Skater Jumps'    LIMIT 1;
  SELECT id INTO ex_plank          FROM exercises WHERE name = 'Plank'           LIMIT 1;
  SELECT id INTO ex_russian_twists FROM exercises WHERE name = 'Russian Twists'  LIMIT 1;
  SELECT id INTO ex_deadbugs       FROM exercises WHERE name = 'Deadbugs'        LIMIT 1;

  IF ex_box_squat IS NULL OR ex_rdl IS NULL OR ex_lat_pulldown IS NULL
     OR ex_goblet_squat IS NULL OR ex_rowing IS NULL OR ex_cycling IS NULL
     OR ex_lat_bounds IS NULL OR ex_skater_jumps IS NULL OR ex_plank IS NULL
     OR ex_russian_twists IS NULL OR ex_deadbugs IS NULL
  THEN
    RAISE EXCEPTION 'One or more exercise IDs could not be resolved. Check the exercises table.';
  END IF;

  v_last_bf_week := -6;  -- ensures first check can log metrics

  -- ── 52 weeks × up to 3 sessions ────────────────────────────
  -- Week 0 starts Monday 2025-01-06
  FOR v_week IN 0..51 LOOP

    -- Injury flag: knee strain weeks 14–18
    v_injured_knee := v_week BETWEEN 14 AND 18;

    -- Phase set targets
    v_phase_sets := CASE
                      WHEN v_week < 13 THEN 3
                      WHEN v_week < 27 THEN 4
                      ELSE 5
                    END;

    FOR v_session IN 1..3 LOOP

      -- Skip session: ~18% normally, ~35% during injury
      CONTINUE WHEN random() < CASE WHEN v_injured_knee THEN 0.35 ELSE 0.18 END;

      -- Base schedule: Mon / Wed / Fri (offsets 0 / 2 / 4)
      v_day_offset := CASE v_session WHEN 1 THEN 0 WHEN 2 THEN 2 ELSE 4 END;

      -- Occasionally shift day ±1 (busy schedule, travel, school)
      IF    random() < 0.12 THEN v_day_offset := v_day_offset - 1;
      ELSIF random() < 0.12 THEN v_day_offset := v_day_offset + 1;
      END IF;
      v_day_offset := GREATEST(0, LEAST(6, v_day_offset));

      v_date := DATE '2025-01-06' + (v_week * 7) + v_day_offset;
      EXIT WHEN v_date > DATE '2025-12-31';

      -- Sets actually done: sometimes one less (tired/short on time)
      v_actual_sets := v_phase_sets;
      IF random() < 0.15 THEN v_actual_sets := GREATEST(2, v_actual_sets - 1); END IF;

      -- Body composition: log irregularly, roughly every 3–5 weeks
      v_body_fat    := GREATEST(11.5, ROUND(18.0 - v_week * 0.125, 1));
      -- Weight fluctuates ±0.5 kg around the trend
      v_body_weight := GREATEST(69.0, ROUND((72.0 - v_week * 0.058 + (random() * 1.0 - 0.5))::NUMERIC, 1));

      -- Session notes
      v_notes := CASE
        WHEN v_injured_knee AND v_session = 1 THEN
          CASE WHEN v_week = 14 THEN 'Knee strain — modified, no lower body today'
               WHEN v_week = 15 THEN 'Knee still sore — upper body only'
               WHEN v_week = 16 THEN 'Knee improving — light upper + core'
               ELSE                  'Modified — avoiding heavy leg load' END
        WHEN v_injured_knee AND v_session = 3 THEN
          'Light session — knee not 100%, extra cycling'
        WHEN v_session = 1 THEN 'Lower body power + lateral conditioning'
        WHEN v_session = 2 THEN 'Cardio intervals + upper pull + core'
        ELSE                    'Full-body power circuit'
      END;

      -- Insert workout row (with metrics if due)
      IF v_session = 1 AND (v_week - v_last_bf_week) >= 3 AND random() < 0.65 THEN
        INSERT INTO workouts (
          client_id, trainer_id, performed_at,
          body_weight_kg, body_fat_percent, notes
        ) VALUES (
          v_client_id, v_trainer_id, v_date,
          v_body_weight, v_body_fat, v_notes
        ) RETURNING id INTO v_workout_id;
        v_last_bf_week := v_week;
      ELSE
        INSERT INTO workouts (client_id, trainer_id, performed_at, notes)
        VALUES (v_client_id, v_trainer_id, v_date, v_notes)
        RETURNING id INTO v_workout_id;
      END IF;

      -- ──────────────────────────────────────────────────────────
      -- SESSION A — Monday: Lower body + skating power
      -- ──────────────────────────────────────────────────────────
      IF v_session = 1 THEN

        IF NOT v_injured_knee THEN

          -- Box Squat: 30 → 72 kg with ±10% session noise
          v_noise  := random() * 0.20 - 0.10;
          v_weight := GREATEST(20.0,
                        ROUND((30.0 + v_week * 0.8) * (1.0 + v_noise) / 2.5, 0) * 2.5);
          v_reps   := CASE WHEN (v_week % 4) < 2 THEN 10 ELSE 12 END;
          IF random() < 0.12 THEN v_reps := v_reps - 2; END IF;  -- tough day
          FOR s IN 1..v_actual_sets LOOP
            INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg)
            VALUES (v_workout_id, ex_box_squat, s, GREATEST(6, v_reps), v_weight);
          END LOOP;

          -- RDL (Dumbbells): 15 → 50 kg with ±8% noise
          v_noise  := random() * 0.16 - 0.08;
          v_weight := GREATEST(10.0,
                        ROUND((15.0 + v_week * 0.67) * (1.0 + v_noise) / 2.5, 0) * 2.5);
          FOR s IN 1..v_actual_sets LOOP
            INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg)
            VALUES (v_workout_id, ex_rdl, s, 10, v_weight);
          END LOOP;

          -- Lateral Bounds: 12 → 24 reps ±1–2
          v_reps := GREATEST(8,
                      12 + (v_week / 4) + ROUND(random() * 4 - 2)::INT);
          FOR s IN 1..v_actual_sets LOOP
            INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps)
            VALUES (v_workout_id, ex_lat_bounds, s, v_reps);
          END LOOP;

        ELSE
          -- Injury substitute: Lat Pulldown + extra plank work
          v_noise  := random() * 0.12 - 0.06;
          v_weight := GREATEST(20.0,
                        ROUND((25.0 + v_week * 0.9) * (1.0 + v_noise) / 2.5, 0) * 2.5);
          FOR s IN 1..v_actual_sets LOOP
            INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg)
            VALUES (v_workout_id, ex_lat_pulldown, s, 10, v_weight);
          END LOOP;
        END IF;

        -- Plank: 30 s → 82 s with ±5 s noise (always done, even injured)
        v_duration := GREATEST(20,
                        30 + v_week + ROUND(random() * 10 - 5)::INT);
        FOR s IN 1..LEAST(v_actual_sets, 3) LOOP
          INSERT INTO workout_sets (workout_id, exercise_id, set_number, duration_seconds)
          VALUES (v_workout_id, ex_plank, s, v_duration);
        END LOOP;

      -- ──────────────────────────────────────────────────────────
      -- SESSION B — Wednesday: Cardio + Upper pull + Core
      -- ──────────────────────────────────────────────────────────
      ELSIF v_session = 2 THEN

        -- Rowing: occasionally skipped if low energy (~10%)
        IF random() > 0.10 THEN
          v_duration := GREATEST(480,
                          600 + v_week * 18 + ROUND(random() * 80 - 40)::INT);
          FOR s IN 1..CASE WHEN v_week < 13 THEN 1 WHEN v_week < 27 THEN 2 ELSE 3 END LOOP
            INSERT INTO workout_sets (workout_id, exercise_id, set_number, duration_seconds)
            VALUES (v_workout_id, ex_rowing, s, v_duration);
          END LOOP;
        END IF;

        -- Lat Pulldown: 25 → 72 kg with ±8% noise
        v_noise  := random() * 0.16 - 0.08;
        v_weight := GREATEST(20.0,
                      ROUND((25.0 + v_week * 0.9) * (1.0 + v_noise) / 2.5, 0) * 2.5);
        v_reps   := CASE WHEN (v_week % 4) < 2 THEN 10 ELSE 12 END;
        FOR s IN 1..v_actual_sets LOOP
          INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg)
          VALUES (v_workout_id, ex_lat_pulldown, s, v_reps, v_weight);
        END LOOP;

        -- Russian Twists: progressive weight, 16 → 30 reps ±2
        v_weight := CASE
                      WHEN v_week <  8 THEN 0.0
                      WHEN v_week < 20 THEN 5.0
                      WHEN v_week < 35 THEN 7.5
                      ELSE 10.0
                    END;
        v_reps := GREATEST(12,
                    16 + (v_week / 6) * 2 + ROUND(random() * 4 - 2)::INT);
        FOR s IN 1..v_actual_sets LOOP
          INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg)
          VALUES (v_workout_id, ex_russian_twists, s, v_reps, NULLIF(v_weight, 0));
        END LOOP;

        -- Deadbugs: 8 → 18 reps ±1
        v_reps := GREATEST(6,
                    8 + (v_week / 5) + ROUND(random() * 2 - 1)::INT);
        FOR s IN 1..v_actual_sets LOOP
          INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps)
          VALUES (v_workout_id, ex_deadbugs, s, v_reps);
        END LOOP;

      -- ──────────────────────────────────────────────────────────
      -- SESSION C — Friday: Full-body power circuit
      -- ──────────────────────────────────────────────────────────
      ELSE

        IF NOT v_injured_knee THEN

          -- DB Goblet Squat: 12 → 38 kg with ±10% noise
          v_noise  := random() * 0.20 - 0.10;
          v_weight := GREATEST(10.0,
                        ROUND((12.0 + v_week * 0.5) * (1.0 + v_noise) / 2.5, 0) * 2.5);
          FOR s IN 1..v_actual_sets LOOP
            INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg)
            VALUES (v_workout_id, ex_goblet_squat, s, 12, v_weight);
          END LOOP;

          -- Skater Jumps: 8 → 21 reps ±1–2
          v_reps := GREATEST(6,
                      8 + (v_week / 4) + ROUND(random() * 4 - 2)::INT);
          FOR s IN 1..v_actual_sets LOOP
            INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps)
            VALUES (v_workout_id, ex_skater_jumps, s, v_reps);
          END LOOP;

        END IF;

        -- Cycling: 12 min → 33 min ±1 min; longer during injury (low-impact sub)
        v_duration := GREATEST(600,
                        720 + v_week * 25 + ROUND(random() * 120 - 60)::INT);
        IF v_injured_knee THEN v_duration := v_duration + 360; END IF;
        INSERT INTO workout_sets (workout_id, exercise_id, set_number, duration_seconds)
        VALUES (v_workout_id, ex_cycling, 1, v_duration);

      END IF;

    END LOOP; -- v_session
  END LOOP;   -- v_week

  -- ── Update client to reflect end-of-year metrics ───────────
  UPDATE clients
  SET weight_kg      = 69.0,
      bf_percent     = 11.5,
      lean_body_mass = ROUND(69.0 * (1.0 - 11.5 / 100.0), 2)
  WHERE id = v_client_id;

  RAISE NOTICE 'Done. Client ID: %  Trainer ID: %', v_client_id, v_trainer_id;

END $$;
