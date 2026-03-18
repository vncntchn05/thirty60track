-- ============================================================
-- thirty60track — CI/CD Test Accounts Seed
-- Run AFTER schema.sql and seed.sql (exercise library must exist)
--
-- ┌──────────────────────────────────────────────────────────────┐
-- │  TRAINER  Marcus Webb                                         │
-- │  Email    trainer@thirty60test.dev                           │
-- │  Password Thirty60Trainer#1                                  │
-- ├──────────────────────────────────────────────────────────────┤
-- │  CLIENT   Jordan Reyes  (M, DOB 2000-07-15, 25 yrs)         │
-- │  Email    client@thirty60test.dev                            │
-- │  Password Thirty60Client#1                                   │
-- └──────────────────────────────────────────────────────────────┘
--
-- Programme  Push / Pull / Legs · 4–5 sessions / week
-- Period     2025-03-17 → 2026-03-15 (52 weeks)
-- Weight     102.4 kg → ~82.3 kg  |  BF 28.2 % → ~19.3 %
-- Nutrition  ~2 350 kcal (high protein) → ~2 050 kcal at 6 months
-- Injuries   • Shoulder strain (2025-05-12 – 2025-05-28)
--            • Low-back tightness (2025-08-01 – 2025-08-17)
--            • Patellar tendinopathy right knee (2025-11-08 – 2025-12-06)
-- ============================================================

-- ─── Idempotent cleanup ──────────────────────────────────────
-- Auth users are created/deleted by scripts/create-test-users.sh via the
-- Supabase Admin API (GoTrue). Deleting auth users cascades to trainers,
-- clients, workouts, etc. — so by the time this file runs, the slate is
-- clean. We delete application rows here only for manual/local runs where
-- the script was not invoked.
DELETE FROM assigned_workouts
  WHERE client_id = 'cccccccc-0000-4000-c000-000000000003';
DELETE FROM nutrition_logs
  WHERE client_id = 'cccccccc-0000-4000-c000-000000000003';
DELETE FROM workouts
  WHERE client_id = 'cccccccc-0000-4000-c000-000000000003';
DELETE FROM client_intake
  WHERE client_id = 'cccccccc-0000-4000-c000-000000000003';
DELETE FROM nutrition_goals
  WHERE client_id = 'cccccccc-0000-4000-c000-000000000003';
DELETE FROM clients
  WHERE id = 'cccccccc-0000-4000-c000-000000000003';

-- ─── 1. Client row ───────────────────────────────────────────
-- Auth users (trainer + client) must already exist in auth.users.
-- In CI: created by scripts/create-test-users.sh before this file runs.
-- Locally: run that script manually, or create via the Supabase dashboard.
INSERT INTO clients (
  id, trainer_id, auth_user_id,
  full_name, email, phone, date_of_birth, gender,
  weight_kg, height_cm, bf_percent,
  lean_body_mass,
  notes, intake_completed,
  created_at, updated_at
) VALUES (
  'cccccccc-0000-4000-c000-000000000003',
  'aaaaaaaa-0000-4000-a000-000000000001',
  'bbbbbbbb-0000-4000-b000-000000000002',
  'Jordan Reyes',
  'client@thirty60test.dev',
  '(555) 214-8830',
  '2000-07-15',
  'male',
  82.3, 180.5, 19.3,
  ROUND(82.3 * (1.0 - 0.193), 2),
  'Started PPL programme March 2025. Lost ~20 kg over 12 months. '
  'Had a shoulder strain in May, low-back episode in August, and '
  'patellar tendinopathy (right knee) Nov–Dec. Great adherence overall. '
  'Desk job (remote SW dev) — tends to stress-eat on weekends. '
  'Secondary goal: run a 5 K by year-end (achieved Nov 2025).',
  TRUE,
  '2025-03-17 09:15:00+00',
  NOW()
);

-- ─── 2. Client intake ────────────────────────────────────────
INSERT INTO client_intake (
  client_id,
  address,
  emergency_name, emergency_phone, emergency_relation,
  occupation,
  current_injuries, past_injuries, chronic_conditions, medications,
  activity_level, goals, goal_timeframe,
  completed_at
) VALUES (
  'cccccccc-0000-4000-c000-000000000003',
  '412 Birchwood Ave, Austin TX 78701',
  'Maria Reyes', '(555) 214-0042', 'Mother',
  'Software developer (fully remote, sedentary desk job)',
  'None at intake',
  'Right ankle sprain (2022, fully resolved). No surgeries.',
  'Mild acid reflux — diet-controlled, no medication needed.',
  'None',
  'light',
  'Lose body fat and build lean muscle. Improve energy and confidence. '
  'Secondary goal: complete a 5 K run within the year.',
  '12 months',
  '2025-03-17 10:30:00+00'
);

-- ─── 3. Nutrition goals (trainer-set; updated at 6-month check-in) ──
INSERT INTO nutrition_goals (
  id, client_id, trainer_id,
  calories, protein_pct, carbs_pct, fat_pct,
  created_at, updated_at
) VALUES (
  'dddddddd-0000-4000-d000-000000000004',
  'cccccccc-0000-4000-c000-000000000003',
  'aaaaaaaa-0000-4000-a000-000000000001',
  -- Final values after 6-month adjustment (Sept 2025); started at 2350/31/39/30
  2050, 33.0, 38.0, 29.0,
  '2025-03-17 10:30:00+00',
  '2025-09-22 11:00:00+00'
);

-- ─── 4. Bulk workout + nutrition generation (PL/pgSQL) ──────
DO $$
DECLARE
  -- Fixed IDs
  v_trainer_id  UUID := 'aaaaaaaa-0000-4000-a000-000000000001';
  v_client_id   UUID := 'cccccccc-0000-4000-c000-000000000003';
  v_client_auth UUID := 'bbbbbbbb-0000-4000-b000-000000000002';

  -- Loop state
  v_start_date  DATE    := '2025-03-17';
  v_end_date    DATE    := '2026-03-15';
  v_date        DATE;
  v_dow         INT;      -- 0=Sun .. 6=Sat
  v_days_el     INT;
  v_weeks_el    NUMERIC;
  v_ppl         INT := 1; -- 1=Push 2=Pull 3=Legs
  v_workout_id  UUID;
  v_skip        INT;
  v_noise       NUMERIC;

  -- Interpolated body metrics
  v_bw          NUMERIC;
  v_bf          NUMERIC;
  v_prog        NUMERIC;  -- 0..1 fitness progression

  -- Injury windows
  v_sh_inj      BOOLEAN; -- shoulder
  v_bk_inj      BOOLEAN; -- lower back
  v_kn_inj      BOOLEAN; -- knee

  -- Workout meta
  v_wkt_note    TEXT;
  v_logged_by   TEXT;
  v_logged_uid  UUID;

  -- Exercise UUIDs — Push
  e_bench       UUID; e_incline    UUID; e_ohp        UUID;
  e_lateral     UUID; e_tricep_pd  UUID; e_skull      UUID;
  e_cable_fly   UUID; e_dips_e     UUID; e_face_pull  UUID;
  e_db_bench    UUID; e_db_ohp     UUID;

  -- Exercise UUIDs — Pull
  e_deadlift    UUID; e_pullup     UUID; e_bb_row     UUID;
  e_lat_pd      UUID; e_seat_row   UUID; e_bb_curl    UUID;
  e_hammer      UUID;

  -- Exercise UUIDs — Legs
  e_squat       UUID; e_rdl        UUID; e_leg_press  UUID;
  e_leg_curl    UUID; e_leg_ext    UUID; e_calf       UUID;
  e_lunges      UUID; e_wall_sit   UUID;

  -- Exercise UUIDs — Accessory
  e_treadmill   UUID; e_plank      UUID;

  -- Set weight vars — Push
  bench_w       NUMERIC; incline_w   NUMERIC; ohp_w       NUMERIC;
  lateral_w     NUMERIC; tricep_w    NUMERIC; skull_w     NUMERIC;
  fly_w         NUMERIC; face_w      NUMERIC;

  -- Set weight vars — Pull
  dl_w          NUMERIC; bb_row_w    NUMERIC; lat_pd_w    NUMERIC;
  seat_row_w    NUMERIC; bb_curl_w   NUMERIC; hammer_w    NUMERIC;
  pullup_reps   INT;

  -- Set weight vars — Legs
  squat_w       NUMERIC; rdl_w       NUMERIC; leg_press_w NUMERIC;
  leg_curl_w    NUMERIC; leg_ext_w   NUMERIC; calf_w      NUMERIC;
  lunge_w       NUMERIC;

  -- Nutrition vars
  v_cal_base    NUMERIC; v_prot_g    NUMERIC;
  v_carb_g      NUMERIC; v_fat_g     NUMERIC;
  v_cal_noise   NUMERIC;

BEGIN
  -- ── Load exercise UUIDs once ──
  SELECT id INTO e_bench      FROM exercises WHERE name = 'Bench Press';
  SELECT id INTO e_incline    FROM exercises WHERE name = 'Incline Bench Press';
  SELECT id INTO e_ohp        FROM exercises WHERE name = 'Overhead Press';
  SELECT id INTO e_lateral    FROM exercises WHERE name = 'Lateral Raise';
  SELECT id INTO e_tricep_pd  FROM exercises WHERE name = 'Tricep Pushdown';
  SELECT id INTO e_skull      FROM exercises WHERE name = 'Skull Crusher';
  SELECT id INTO e_cable_fly  FROM exercises WHERE name = 'Cable Fly';
  SELECT id INTO e_dips_e     FROM exercises WHERE name = 'Dips';
  SELECT id INTO e_face_pull  FROM exercises WHERE name = 'Face Pull';
  SELECT id INTO e_db_bench   FROM exercises WHERE name = 'DB Bench Press';
  SELECT id INTO e_db_ohp     FROM exercises WHERE name = 'DB Overhead Press';
  SELECT id INTO e_deadlift   FROM exercises WHERE name = 'Deadlift';
  SELECT id INTO e_pullup     FROM exercises WHERE name = 'Pull-Up';
  SELECT id INTO e_bb_row     FROM exercises WHERE name = 'Barbell Row';
  SELECT id INTO e_lat_pd     FROM exercises WHERE name = 'Lat Pulldown';
  SELECT id INTO e_seat_row   FROM exercises WHERE name = 'Seated Cable Row';
  SELECT id INTO e_bb_curl    FROM exercises WHERE name = 'Barbell Curl';
  SELECT id INTO e_hammer     FROM exercises WHERE name = 'Hammer Curl';
  SELECT id INTO e_squat      FROM exercises WHERE name = 'Squat';
  SELECT id INTO e_rdl        FROM exercises WHERE name = 'Romanian Deadlift';
  SELECT id INTO e_leg_press  FROM exercises WHERE name = 'Leg Press';
  SELECT id INTO e_leg_curl   FROM exercises WHERE name = 'Leg Curl';
  SELECT id INTO e_leg_ext    FROM exercises WHERE name = 'Leg Extension';
  SELECT id INTO e_calf       FROM exercises WHERE name = 'Calf Raise';
  SELECT id INTO e_lunges     FROM exercises WHERE name = 'Lunges';
  SELECT id INTO e_wall_sit   FROM exercises WHERE name = 'Wall Sit';
  SELECT id INTO e_treadmill  FROM exercises WHERE name = 'Treadmill Run';
  SELECT id INTO e_plank      FROM exercises WHERE name = 'Plank';

  -- ── Main date loop ────────────────────────────────────────
  v_date := v_start_date;

  WHILE v_date <= v_end_date LOOP
    v_dow     := EXTRACT(DOW FROM v_date)::INT;        -- 0=Sun..6=Sat
    v_days_el := (v_date - v_start_date)::INT;
    v_weeks_el := v_days_el / 7.0;

    -- Injury window flags
    v_sh_inj := v_date BETWEEN '2025-05-12' AND '2025-05-28';
    v_bk_inj := v_date BETWEEN '2025-08-01' AND '2025-08-17';
    v_kn_inj := v_date BETWEEN '2025-11-08' AND '2025-12-06';

    -- Body weight: piecewise linear (+ day-to-day noise ±0.4 kg)
    v_bw := CASE
      WHEN v_weeks_el <=  13 THEN 102.4 + (97.2  - 102.4) * (v_weeks_el / 13.0)
      WHEN v_weeks_el <=  26 THEN  97.2 + (91.8  -  97.2) * ((v_weeks_el - 13) / 13.0)
      WHEN v_weeks_el <=  39 THEN  91.8 + (87.1  -  91.8) * ((v_weeks_el - 26) / 13.0)
      ELSE                          87.1 + (82.3  -  87.1) * ((v_weeks_el - 39) / 13.0)
    END;
    -- Slight plateau during each injury period
    IF v_sh_inj THEN v_bw := v_bw + 0.4; END IF;
    IF v_bk_inj THEN v_bw := v_bw + 0.3; END IF;
    IF v_kn_inj THEN v_bw := v_bw + 0.5; END IF;
    v_bw := ROUND(v_bw + ((abs(hashtext(v_date::text || 'bw')) % 9) - 4) * 0.1, 1);

    -- Body fat: piecewise linear
    v_bf := CASE
      WHEN v_weeks_el <=  13 THEN 28.2 + (25.8  - 28.2) * (v_weeks_el / 13.0)
      WHEN v_weeks_el <=  26 THEN 25.8 + (23.1  - 25.8) * ((v_weeks_el - 13) / 13.0)
      WHEN v_weeks_el <=  39 THEN 23.1 + (21.0  - 23.1) * ((v_weeks_el - 26) / 13.0)
      ELSE                         21.0 + (19.3  - 21.0) * ((v_weeks_el - 39) / 13.0)
    END;
    v_bf := ROUND(v_bf, 1);

    -- Overload progression factor (0 → 1 over the year)
    v_prog := LEAST(v_weeks_el / 52.0, 1.0);

    -- ── Skip rest days: Sunday (0) and Thursday (4) ──
    IF v_dow IN (0, 4) THEN
      v_date := v_date + 1;
      CONTINUE;
    END IF;

    -- ── Injury forced-rest: first week of each injury window ──
    IF v_sh_inj AND v_date <= '2025-05-17' THEN
      v_date := v_date + 1;
      CONTINUE;
    END IF;
    IF v_bk_inj AND v_date <= '2025-08-06' THEN
      v_date := v_date + 1;
      CONTINUE;
    END IF;
    IF v_kn_inj AND v_date <= '2025-11-13' THEN
      v_date := v_date + 1;
      CONTINUE;
    END IF;

    -- ── Pseudo-random skip (~13 %) — models missed sessions ──
    v_skip := abs(hashtext(v_date::text || 'skip')) % 100;
    IF v_skip < 13 THEN
      v_date := v_date + 1;
      CONTINUE;
    END IF;

    -- ── Per-session weight noise (±1.25 kg) ──
    v_noise := ((abs(hashtext(v_date::text || 'noise')) % 5) - 2) * 0.25;

    -- ── Logged-by: client self-logs ~20 % of sessions after week 26 ──
    IF v_weeks_el > 26 AND abs(hashtext(v_date::text || 'logger')) % 5 = 0 THEN
      v_logged_by  := 'client';
      v_logged_uid := v_client_auth;
    ELSE
      v_logged_by  := 'trainer';
      v_logged_uid := v_trainer_id;
    END IF;

    -- ── Workout notes — rotating pool + injury overrides ──
    v_wkt_note := CASE
      WHEN v_sh_inj THEN
        CASE abs(hashtext(v_date::text || 'note')) % 3
          WHEN 0 THEN 'Shoulder still tender — swapped barbell press for DB, avoided anything overhead heavy.'
          WHEN 1 THEN 'Kept pressing load light. Shoulder feeling slightly better today but not pushing it.'
          ELSE        'Modified push day per physio advice. No barbell OHP. Pain: 3/10 at start, 2/10 at end.'
        END
      WHEN v_bk_inj THEN
        CASE abs(hashtext(v_date::text || 'note')) % 3
          WHEN 0 THEN 'Lower back still tight — skipped deadlifts and heavy rows. Extra mobility work at the end.'
          WHEN 1 THEN 'Back improving. Did lat pulldown and cable rows only. Will reintroduce RDL next week.'
          ELSE        'Jordan says back feels 60 %. Upper-body focus today, no axial loading.'
        END
      WHEN v_kn_inj THEN
        CASE abs(hashtext(v_date::text || 'note')) % 4
          WHEN 0 THEN 'Right knee flared up post-squat. Switched to leg press (shallow ROM) + leg curls only.'
          WHEN 1 THEN 'Leg day modified — no deep knee flexion. Wall sits, leg ext, hip hinge focus.'
          WHEN 2 THEN 'Knee tracking better today. Still avoiding full-depth squats per sports physio.'
          ELSE        'Jordan ran into his first 5 K two weeks ago — knee held up. Being cautious now.'
        END
      ELSE
        CASE abs(hashtext(v_date::text || 'note')) % 12
          WHEN 0  THEN 'Great session — Jordan hit a new bench PR today.'
          WHEN 1  THEN NULL
          WHEN 2  THEN NULL
          WHEN 3  THEN 'Came in a bit tired from a late work deadline. Still got everything done.'
          WHEN 4  THEN NULL
          WHEN 5  THEN 'Energy was high — pushed the sets hard. Good progressive overload.'
          WHEN 6  THEN 'Mentioned stress-eating over the weekend. Reminded him about tracking on rest days.'
          WHEN 7  THEN NULL
          WHEN 8  THEN 'Solid effort. Form on squats is really improving — depth is consistent now.'
          WHEN 9  THEN 'Jordan mentioned soreness from last session but powered through.'
          WHEN 10 THEN NULL
          ELSE         'Quick check-in on nutrition — he''s been nailing his protein target. Good progress.'
        END
    END;

    -- ── Insert workout header ──
    v_workout_id := gen_random_uuid();
    INSERT INTO workouts (
      id, client_id, trainer_id, performed_at,
      body_weight_kg, body_fat_percent,
      notes,
      logged_by_role, logged_by_user_id,
      created_at, updated_at
    ) VALUES (
      v_workout_id,
      v_client_id,
      v_trainer_id,
      v_date,
      v_bw,
      -- Measure BF% only on Monday check-ins (roughly monthly)
      CASE WHEN v_dow = 1 AND abs(hashtext(v_date::text || 'bf')) % 4 = 0 THEN v_bf ELSE NULL END,
      v_wkt_note,
      v_logged_by,
      v_logged_uid,
      v_date::TIMESTAMPTZ + INTERVAL '9 hours',
      v_date::TIMESTAMPTZ + INTERVAL '10 hours 15 minutes'
    );

    -- ═══════════════════════════════════════════════════════
    --  PUSH DAY
    -- ═══════════════════════════════════════════════════════
    IF v_ppl = 1 THEN
      -- Bench: 60 → 85 kg; sub DB bench during shoulder injury
      bench_w   := ROUND(LEAST(60.0 + v_prog * 25.0, 85.0) + v_noise, 2);
      incline_w := ROUND(LEAST(50.0 + v_prog * 20.0, 70.0) + v_noise, 2);
      ohp_w     := ROUND(LEAST(40.0 + v_prog * 17.5, 57.5) + v_noise * 0.7, 2);
      lateral_w := ROUND(LEAST( 8.0 + v_prog *  7.0, 15.0) + v_noise * 0.3, 2);
      tricep_w  := ROUND(LEAST(25.0 + v_prog * 20.0, 45.0) + v_noise * 0.5, 2);
      skull_w   := ROUND(LEAST(20.0 + v_prog * 15.0, 35.0) + v_noise * 0.5, 2);
      fly_w     := ROUND(LEAST(15.0 + v_prog * 12.5, 27.5) + v_noise * 0.4, 2);
      face_w    := ROUND(LEAST(15.0 + v_prog * 10.0, 25.0) + v_noise * 0.3, 2);

      IF v_sh_inj THEN
        -- Shoulder injury: DB press instead of barbell, no heavy OHP, skip skull crusher
        INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg, notes) VALUES
          (v_workout_id, e_db_bench,  1, 10, ROUND(bench_w * 0.5, 2), 'Shoulder mod — DB only'),
          (v_workout_id, e_db_bench,  2, 10, ROUND(bench_w * 0.5, 2), NULL),
          (v_workout_id, e_db_bench,  3,  8, ROUND(bench_w * 0.5, 2), NULL),
          (v_workout_id, e_lateral,   1, 15, lateral_w,                'Light, pain-free ROM only'),
          (v_workout_id, e_lateral,   2, 15, lateral_w,                NULL),
          (v_workout_id, e_lateral,   3, 12, lateral_w,                NULL),
          (v_workout_id, e_tricep_pd, 1, 15, ROUND(tricep_w * 0.8, 2), NULL),
          (v_workout_id, e_tricep_pd, 2, 15, ROUND(tricep_w * 0.8, 2), NULL),
          (v_workout_id, e_tricep_pd, 3, 12, ROUND(tricep_w * 0.8, 2), NULL),
          (v_workout_id, e_face_pull, 1, 15, face_w,                   'Shoulder health — keep these'),
          (v_workout_id, e_face_pull, 2, 15, face_w,                   NULL),
          (v_workout_id, e_face_pull, 3, 15, face_w,                   NULL),
          (v_workout_id, e_plank,     1, NULL, NULL,                   '60 s hold');
      ELSE
        INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg, notes) VALUES
          -- Bench Press  4 x 6-8
          (v_workout_id, e_bench,     1, 8, bench_w,   NULL),
          (v_workout_id, e_bench,     2, 7, bench_w,   NULL),
          (v_workout_id, e_bench,     3, 6, bench_w,   NULL),
          (v_workout_id, e_bench,     4, 6, bench_w,   CASE WHEN v_skip % 7 = 0 THEN 'PR attempt' ELSE NULL END),
          -- Incline Bench  3 x 8-10
          (v_workout_id, e_incline,   1, 10, incline_w, NULL),
          (v_workout_id, e_incline,   2,  9, incline_w, NULL),
          (v_workout_id, e_incline,   3,  8, incline_w, NULL),
          -- OHP  3 x 8
          (v_workout_id, e_ohp,       1, 8, ohp_w,     NULL),
          (v_workout_id, e_ohp,       2, 7, ohp_w,     NULL),
          (v_workout_id, e_ohp,       3, 6, ohp_w,     NULL),
          -- Lateral Raise  3 x 12-15
          (v_workout_id, e_lateral,   1, 15, lateral_w, NULL),
          (v_workout_id, e_lateral,   2, 12, lateral_w, NULL),
          (v_workout_id, e_lateral,   3, 12, lateral_w, NULL),
          -- Tricep Pushdown  3 x 12
          (v_workout_id, e_tricep_pd, 1, 12, tricep_w,  NULL),
          (v_workout_id, e_tricep_pd, 2, 12, tricep_w,  NULL),
          (v_workout_id, e_tricep_pd, 3, 10, tricep_w,  NULL),
          -- Skull Crusher  3 x 10 (alternated with Cable Fly)
          (v_workout_id,
            CASE WHEN abs(hashtext(v_date::text || 'push_acc')) % 2 = 0 THEN e_skull ELSE e_cable_fly END,
           1, 10,
            CASE WHEN abs(hashtext(v_date::text || 'push_acc')) % 2 = 0 THEN skull_w ELSE fly_w END,
           NULL),
          (v_workout_id,
            CASE WHEN abs(hashtext(v_date::text || 'push_acc')) % 2 = 0 THEN e_skull ELSE e_cable_fly END,
           2, 10,
            CASE WHEN abs(hashtext(v_date::text || 'push_acc')) % 2 = 0 THEN skull_w ELSE fly_w END,
           NULL),
          (v_workout_id,
            CASE WHEN abs(hashtext(v_date::text || 'push_acc')) % 2 = 0 THEN e_skull ELSE e_cable_fly END,
           3, 8,
            CASE WHEN abs(hashtext(v_date::text || 'push_acc')) % 2 = 0 THEN skull_w ELSE fly_w END,
           NULL),
          -- Face Pull  2 x 15 (shoulder health — always included)
          (v_workout_id, e_face_pull, 1, 15, face_w,    NULL),
          (v_workout_id, e_face_pull, 2, 15, face_w,    NULL);
      END IF;

    -- ═══════════════════════════════════════════════════════
    --  PULL DAY
    -- ═══════════════════════════════════════════════════════
    ELSIF v_ppl = 2 THEN
      dl_w       := ROUND(LEAST(80.0  + v_prog * 40.0, 120.0) + v_noise * 1.5, 2);
      bb_row_w   := ROUND(LEAST(60.0  + v_prog * 30.0,  90.0) + v_noise,       2);
      lat_pd_w   := ROUND(LEAST(50.0  + v_prog * 25.0,  75.0) + v_noise,       2);
      seat_row_w := ROUND(LEAST(45.0  + v_prog * 25.0,  70.0) + v_noise,       2);
      bb_curl_w  := ROUND(LEAST(25.0  + v_prog * 15.0,  40.0) + v_noise * 0.5, 2);
      hammer_w   := ROUND(LEAST(12.0  + v_prog * 10.0,  22.0) + v_noise * 0.3, 2);
      -- Pull-ups: start at 5 reps assisted, reach 12 BW by end
      pullup_reps := GREATEST(5, LEAST(5 + ROUND(v_prog * 7)::INT, 12));

      IF v_bk_inj THEN
        -- Low-back injury: no deadlift, no barbell row
        INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg, notes) VALUES
          (v_workout_id, e_lat_pd,    1, 12, lat_pd_w,   'Back mod — no deadlifts'),
          (v_workout_id, e_lat_pd,    2, 12, lat_pd_w,   NULL),
          (v_workout_id, e_lat_pd,    3, 10, lat_pd_w,   NULL),
          (v_workout_id, e_seat_row,  1, 12, seat_row_w, NULL),
          (v_workout_id, e_seat_row,  2, 12, seat_row_w, NULL),
          (v_workout_id, e_seat_row,  3, 10, seat_row_w, NULL),
          (v_workout_id, e_bb_curl,   1, 12, bb_curl_w,  NULL),
          (v_workout_id, e_bb_curl,   2, 12, bb_curl_w,  NULL),
          (v_workout_id, e_hammer,    1, 12, hammer_w,   NULL),
          (v_workout_id, e_hammer,    2, 12, hammer_w,   NULL),
          (v_workout_id, e_face_pull, 1, 15, ROUND(LEAST(15.0 + v_prog * 10.0, 25.0) + v_noise * 0.3, 2), NULL),
          (v_workout_id, e_face_pull, 2, 15, ROUND(LEAST(15.0 + v_prog * 10.0, 25.0) + v_noise * 0.3, 2), NULL);
      ELSE
        INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg, notes) VALUES
          -- Deadlift  3 x 5 (heavy, kept lower volume)
          (v_workout_id, e_deadlift,  1, 5,  dl_w,       NULL),
          (v_workout_id, e_deadlift,  2, 5,  dl_w,       NULL),
          (v_workout_id, e_deadlift,  3, 4,  dl_w,       CASE WHEN v_skip % 9 = 0 THEN 'Felt strong today' ELSE NULL END),
          -- Pull-Up  3 x reps (progressing)
          (v_workout_id, e_pullup,    1, pullup_reps, NULL, NULL),
          (v_workout_id, e_pullup,    2, pullup_reps, NULL, NULL),
          (v_workout_id, e_pullup,    3, GREATEST(pullup_reps - 2, 3), NULL, NULL),
          -- Barbell Row  4 x 8
          (v_workout_id, e_bb_row,    1, 8,  bb_row_w,   NULL),
          (v_workout_id, e_bb_row,    2, 8,  bb_row_w,   NULL),
          (v_workout_id, e_bb_row,    3, 8,  bb_row_w,   NULL),
          (v_workout_id, e_bb_row,    4, 6,  bb_row_w,   NULL),
          -- Lat Pulldown  3 x 10
          (v_workout_id, e_lat_pd,    1, 10, lat_pd_w,   NULL),
          (v_workout_id, e_lat_pd,    2, 10, lat_pd_w,   NULL),
          (v_workout_id, e_lat_pd,    3,  8, lat_pd_w,   NULL),
          -- Seated Cable Row  3 x 12
          (v_workout_id, e_seat_row,  1, 12, seat_row_w, NULL),
          (v_workout_id, e_seat_row,  2, 12, seat_row_w, NULL),
          (v_workout_id, e_seat_row,  3, 10, seat_row_w, NULL),
          -- Barbell Curl  3 x 10 (or Hammer Curl alternated)
          (v_workout_id,
            CASE WHEN abs(hashtext(v_date::text || 'curl')) % 2 = 0 THEN e_bb_curl ELSE e_hammer END,
           1, 10,
            CASE WHEN abs(hashtext(v_date::text || 'curl')) % 2 = 0 THEN bb_curl_w ELSE hammer_w END,
           NULL),
          (v_workout_id,
            CASE WHEN abs(hashtext(v_date::text || 'curl')) % 2 = 0 THEN e_bb_curl ELSE e_hammer END,
           2, 10,
            CASE WHEN abs(hashtext(v_date::text || 'curl')) % 2 = 0 THEN bb_curl_w ELSE hammer_w END,
           NULL),
          (v_workout_id,
            CASE WHEN abs(hashtext(v_date::text || 'curl')) % 2 = 0 THEN e_bb_curl ELSE e_hammer END,
           3,  8,
            CASE WHEN abs(hashtext(v_date::text || 'curl')) % 2 = 0 THEN bb_curl_w ELSE hammer_w END,
           NULL);
      END IF;

    -- ═══════════════════════════════════════════════════════
    --  LEGS DAY
    -- ═══════════════════════════════════════════════════════
    ELSE
      squat_w     := ROUND(LEAST( 70.0 + v_prog * 35.0, 105.0) + v_noise * 1.5, 2);
      rdl_w       := ROUND(LEAST( 60.0 + v_prog * 30.0,  90.0) + v_noise,       2);
      leg_press_w := ROUND(LEAST(100.0 + v_prog * 60.0, 160.0) + v_noise * 2.0, 2);
      leg_curl_w  := ROUND(LEAST( 30.0 + v_prog * 20.0,  50.0) + v_noise * 0.5, 2);
      leg_ext_w   := ROUND(LEAST( 35.0 + v_prog * 20.0,  55.0) + v_noise * 0.5, 2);
      calf_w      := ROUND(LEAST( 50.0 + v_prog * 30.0,  80.0) + v_noise,       2);
      lunge_w     := ROUND(LEAST( 15.0 + v_prog * 15.0,  30.0) + v_noise * 0.5, 2);

      IF v_kn_inj THEN
        -- Knee injury: no deep squats / heavy RDL; leg press with shallow ROM
        INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg, notes) VALUES
          (v_workout_id, e_leg_press, 1, 15, ROUND(leg_press_w * 0.7, 2), 'Knee mod — shallow ROM'),
          (v_workout_id, e_leg_press, 2, 15, ROUND(leg_press_w * 0.7, 2), NULL),
          (v_workout_id, e_leg_press, 3, 12, ROUND(leg_press_w * 0.7, 2), NULL),
          (v_workout_id, e_leg_curl,  1, 15, leg_curl_w,                  NULL),
          (v_workout_id, e_leg_curl,  2, 15, leg_curl_w,                  NULL),
          (v_workout_id, e_leg_curl,  3, 12, leg_curl_w,                  NULL),
          (v_workout_id, e_leg_ext,   1, 15, ROUND(leg_ext_w * 0.8, 2),  'Pain-free range only'),
          (v_workout_id, e_leg_ext,   2, 12, ROUND(leg_ext_w * 0.8, 2),  NULL),
          (v_workout_id, e_calf,      1, 20, calf_w,                      NULL),
          (v_workout_id, e_calf,      2, 20, calf_w,                      NULL),
          (v_workout_id, e_calf,      3, 15, calf_w,                      NULL),
          (v_workout_id, e_wall_sit,  1, NULL, NULL,                      '45 s hold — isometric rehab'),
          (v_workout_id, e_wall_sit,  2, NULL, NULL,                      '45 s hold');
      ELSE
        INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg, notes) VALUES
          -- Squat  4 x 6-8
          (v_workout_id, e_squat,     1, 8,  squat_w,     NULL),
          (v_workout_id, e_squat,     2, 7,  squat_w,     NULL),
          (v_workout_id, e_squat,     3, 6,  squat_w,     NULL),
          (v_workout_id, e_squat,     4, 6,  squat_w,     CASE WHEN v_skip % 8 = 0 THEN 'Depth improving' ELSE NULL END),
          -- RDL  3 x 8
          (v_workout_id, e_rdl,       1, 8,  rdl_w,       NULL),
          (v_workout_id, e_rdl,       2, 8,  rdl_w,       NULL),
          (v_workout_id, e_rdl,       3, 7,  rdl_w,       NULL),
          -- Leg Press  3 x 10-12
          (v_workout_id, e_leg_press, 1, 12, leg_press_w, NULL),
          (v_workout_id, e_leg_press, 2, 10, leg_press_w, NULL),
          (v_workout_id, e_leg_press, 3, 10, leg_press_w, NULL),
          -- Leg Curl  3 x 12
          (v_workout_id, e_leg_curl,  1, 12, leg_curl_w,  NULL),
          (v_workout_id, e_leg_curl,  2, 12, leg_curl_w,  NULL),
          (v_workout_id, e_leg_curl,  3, 10, leg_curl_w,  NULL),
          -- Leg Ext  3 x 12
          (v_workout_id, e_leg_ext,   1, 12, leg_ext_w,   NULL),
          (v_workout_id, e_leg_ext,   2, 12, leg_ext_w,   NULL),
          (v_workout_id, e_leg_ext,   3, 10, leg_ext_w,   NULL),
          -- Calf Raise  3 x 15-20
          (v_workout_id, e_calf,      1, 20, calf_w,      NULL),
          (v_workout_id, e_calf,      2, 18, calf_w,      NULL),
          (v_workout_id, e_calf,      3, 15, calf_w,      NULL),
          -- Lunges  2 x 12 (every other legs session)
          (v_workout_id, e_lunges,    1, 12, lunge_w,
            CASE WHEN abs(hashtext(v_date::text || 'lunge')) % 2 = 0 THEN NULL ELSE 'Skipped today' END),
          (v_workout_id, e_lunges,    2, 12, lunge_w, NULL);
      END IF;
    END IF;

    -- ── Advance PPL cycle ──
    v_ppl := (v_ppl % 3) + 1;

    -- ═══════════════════════════════════════════════════════
    --  NUTRITION LOG  (logged ~5 days/week; skip ~15 %)
    -- ═══════════════════════════════════════════════════════
    IF abs(hashtext(v_date::text || 'nutr')) % 100 >= 15 THEN

      -- Calorie target: decreases as weight drops; injury periods often have weekend slippage
      v_cal_base := CASE
        WHEN v_weeks_el <= 13 THEN 2350
        WHEN v_weeks_el <= 26 THEN 2350 - (v_weeks_el - 13) / 13.0 * 200  -- 2350 → 2150
        ELSE                       2150 - (v_weeks_el - 26) / 26.0 * 100  -- 2150 → 2050
      END;
      -- Weekend cheat tendency: Sat (6) logs run slightly over
      IF v_dow = 6 AND abs(hashtext(v_date::text || 'cheat')) % 3 = 0 THEN
        v_cal_base := v_cal_base + abs(hashtext(v_date::text || 'cheat2')) % 300 + 100;
      END IF;
      -- Injury stress-eat bump
      IF (v_sh_inj OR v_bk_inj OR v_kn_inj)
         AND abs(hashtext(v_date::text || 'stress')) % 3 = 0 THEN
        v_cal_base := v_cal_base + 150;
      END IF;
      -- Day-to-day noise ±120 kcal
      v_cal_noise := ((abs(hashtext(v_date::text || 'calnoise')) % 25) - 12) * 10;
      v_cal_base  := ROUND(v_cal_base + v_cal_noise, 0);

      -- Macros (grams) — protein stays high throughout cut
      v_prot_g := ROUND(v_cal_base * 0.33 / 4.0 + ((abs(hashtext(v_date::text || 'pg')) % 11) - 5), 1);
      v_carb_g := ROUND(v_cal_base * 0.38 / 4.0 + ((abs(hashtext(v_date::text || 'cg')) % 9)  - 4), 1);
      v_fat_g  := ROUND(v_cal_base * 0.29 / 9.0 + ((abs(hashtext(v_date::text || 'fg')) % 5)  - 2), 1);

      -- ── Breakfast ──
      INSERT INTO nutrition_logs (
        client_id, trainer_id, logged_date, meal_type,
        food_name, serving_size_g,
        calories, protein_g, carbs_g, fat_g, fiber_g,
        logged_by_role, logged_by_user_id
      ) VALUES (
        v_client_id, v_trainer_id, v_date, 'breakfast',
        CASE abs(hashtext(v_date::text || 'bfast')) % 5
          WHEN 0 THEN 'Greek yogurt with berries and granola'
          WHEN 1 THEN 'Eggs and oatmeal with banana'
          WHEN 2 THEN 'Protein shake with oats and peanut butter'
          WHEN 3 THEN 'Egg white omelette with whole-grain toast'
          ELSE        'Chicken sausage with scrambled eggs and avocado'
        END,
        CASE abs(hashtext(v_date::text || 'bfast')) % 5
          WHEN 0 THEN 380 WHEN 1 THEN 350 WHEN 2 THEN 400
          WHEN 3 THEN 320 ELSE 360
        END,
        ROUND(v_cal_base  * 0.22, 1),  -- breakfast ~22% of daily cals
        ROUND(v_prot_g    * 0.25, 1),
        ROUND(v_carb_g    * 0.28, 1),
        ROUND(v_fat_g     * 0.22, 1),
        ROUND(4.0 + ((abs(hashtext(v_date::text || 'bff')) % 5)), 1),
        v_logged_by, v_logged_uid
      );

      -- ── Lunch ──
      INSERT INTO nutrition_logs (
        client_id, trainer_id, logged_date, meal_type,
        food_name, serving_size_g,
        calories, protein_g, carbs_g, fat_g, fiber_g,
        logged_by_role, logged_by_user_id
      ) VALUES (
        v_client_id, v_trainer_id, v_date, 'lunch',
        CASE abs(hashtext(v_date::text || 'lunch')) % 6
          WHEN 0 THEN 'Grilled chicken breast with brown rice and broccoli'
          WHEN 1 THEN 'Turkey wrap with spinach, hummus and tomato'
          WHEN 2 THEN 'Tuna salad with whole-grain crackers and mixed greens'
          WHEN 3 THEN 'Ground beef bowl with sweet potato and roasted peppers'
          WHEN 4 THEN 'Salmon fillet with quinoa and asparagus'
          ELSE        'Grilled shrimp stir-fry with jasmine rice and bok choy'
        END,
        CASE abs(hashtext(v_date::text || 'lunch')) % 6
          WHEN 0 THEN 520 WHEN 1 THEN 440 WHEN 2 THEN 380
          WHEN 3 THEN 560 WHEN 4 THEN 480 ELSE 510
        END,
        ROUND(v_cal_base  * 0.32, 1),
        ROUND(v_prot_g    * 0.38, 1),
        ROUND(v_carb_g    * 0.35, 1),
        ROUND(v_fat_g     * 0.30, 1),
        ROUND(5.0 + ((abs(hashtext(v_date::text || 'lff')) % 6)), 1),
        v_logged_by, v_logged_uid
      );

      -- ── Dinner ──
      INSERT INTO nutrition_logs (
        client_id, trainer_id, logged_date, meal_type,
        food_name, serving_size_g,
        calories, protein_g, carbs_g, fat_g, fiber_g,
        logged_by_role, logged_by_user_id
      ) VALUES (
        v_client_id, v_trainer_id, v_date, 'dinner',
        CASE abs(hashtext(v_date::text || 'dinner')) % 6
          WHEN 0 THEN 'Baked chicken thighs with roasted vegetables and rice'
          WHEN 1 THEN 'Lean beef stir-fry with noodles and mixed veg'
          WHEN 2 THEN 'Tilapia with steamed broccoli and sweet potato'
          WHEN 3 THEN 'Pork tenderloin with green beans and quinoa'
          WHEN 4 THEN 'Turkey meatballs with zucchini noodles and marinara'
          ELSE        'Grilled chicken thighs with black beans and corn salsa'
        END,
        CASE abs(hashtext(v_date::text || 'dinner')) % 6
          WHEN 0 THEN 610 WHEN 1 THEN 580 WHEN 2 THEN 490
          WHEN 3 THEN 540 WHEN 4 THEN 460 ELSE 590
        END,
        ROUND(v_cal_base  * 0.33, 1),
        ROUND(v_prot_g    * 0.32, 1),
        ROUND(v_carb_g    * 0.27, 1),
        ROUND(v_fat_g     * 0.35, 1),
        ROUND(6.0 + ((abs(hashtext(v_date::text || 'dff')) % 5)), 1),
        v_logged_by, v_logged_uid
      );

      -- ── Snack (logged ~70 % of days) ──
      IF abs(hashtext(v_date::text || 'snack')) % 10 < 7 THEN
        INSERT INTO nutrition_logs (
          client_id, trainer_id, logged_date, meal_type,
          food_name, serving_size_g,
          calories, protein_g, carbs_g, fat_g, fiber_g,
          logged_by_role, logged_by_user_id
        ) VALUES (
          v_client_id, v_trainer_id, v_date, 'snack',
          CASE abs(hashtext(v_date::text || 'snktype')) % 6
            WHEN 0 THEN 'Protein bar'
            WHEN 1 THEN 'Cottage cheese with pineapple'
            WHEN 2 THEN 'Rice cakes with almond butter'
            WHEN 3 THEN 'Whey protein shake'
            WHEN 4 THEN 'Apple with low-fat string cheese'
            ELSE        'Mixed nuts and dried cranberries'
          END,
          CASE abs(hashtext(v_date::text || 'snktype')) % 6
            WHEN 0 THEN 60 WHEN 1 THEN 180 WHEN 2 THEN 80
            WHEN 3 THEN 35 WHEN 4 THEN 140 ELSE 40
          END,
          ROUND(v_cal_base  * 0.13, 1),
          ROUND(v_prot_g    * 0.05, 1),
          ROUND(v_carb_g    * 0.10, 1),
          ROUND(v_fat_g     * 0.13, 1),
          ROUND(1.5 + ((abs(hashtext(v_date::text || 'sff')) % 4)), 1),
          v_logged_by, v_logged_uid
        );
      END IF;
    END IF;  -- end nutrition block

    v_date := v_date + 1;
  END LOOP;

END $$;

-- ─── 5. Assigned workouts (trainer planning sessions) ────────
-- A sample of Marcus assigning upcoming sessions to Jordan.
-- Uses a small window of upcoming dates relative to end of seed period.
DO $$
DECLARE
  v_trainer_id UUID := 'aaaaaaaa-0000-4000-a000-000000000001';
  v_client_id  UUID := 'cccccccc-0000-4000-c000-000000000003';
  v_aw_id      UUID;
  e_bench      UUID; e_incline UUID; e_ohp     UUID; e_lateral UUID;
  e_tricep_pd  UUID; e_cable_fly UUID;
  e_deadlift   UUID; e_pullup  UUID; e_bb_row  UUID; e_lat_pd  UUID;
  e_seat_row   UUID; e_bb_curl UUID; e_hammer  UUID;
  e_squat      UUID; e_rdl     UUID; e_leg_press UUID;
  e_leg_curl   UUID; e_leg_ext UUID; e_calf    UUID;
BEGIN
  SELECT id INTO e_bench      FROM exercises WHERE name = 'Bench Press';
  SELECT id INTO e_incline    FROM exercises WHERE name = 'Incline Bench Press';
  SELECT id INTO e_ohp        FROM exercises WHERE name = 'Overhead Press';
  SELECT id INTO e_lateral    FROM exercises WHERE name = 'Lateral Raise';
  SELECT id INTO e_tricep_pd  FROM exercises WHERE name = 'Tricep Pushdown';
  SELECT id INTO e_cable_fly  FROM exercises WHERE name = 'Cable Fly';
  SELECT id INTO e_deadlift   FROM exercises WHERE name = 'Deadlift';
  SELECT id INTO e_pullup     FROM exercises WHERE name = 'Pull-Up';
  SELECT id INTO e_bb_row     FROM exercises WHERE name = 'Barbell Row';
  SELECT id INTO e_lat_pd     FROM exercises WHERE name = 'Lat Pulldown';
  SELECT id INTO e_seat_row   FROM exercises WHERE name = 'Seated Cable Row';
  SELECT id INTO e_bb_curl    FROM exercises WHERE name = 'Barbell Curl';
  SELECT id INTO e_hammer     FROM exercises WHERE name = 'Hammer Curl';
  SELECT id INTO e_squat      FROM exercises WHERE name = 'Squat';
  SELECT id INTO e_rdl        FROM exercises WHERE name = 'Romanian Deadlift';
  SELECT id INTO e_leg_press  FROM exercises WHERE name = 'Leg Press';
  SELECT id INTO e_leg_curl   FROM exercises WHERE name = 'Leg Curl';
  SELECT id INTO e_leg_ext    FROM exercises WHERE name = 'Leg Extension';
  SELECT id INTO e_calf       FROM exercises WHERE name = 'Calf Raise';

  -- Assigned Push session (upcoming)
  v_aw_id := gen_random_uuid();
  INSERT INTO assigned_workouts (
    id, trainer_id, client_id, title, scheduled_date,
    notes, status, created_at, updated_at
  ) VALUES (
    v_aw_id, v_trainer_id, v_client_id,
    'Push Day — Week 53',
    '2026-03-16',
    'Aim for 85 kg bench if you are feeling it — you hit 82.5 last session. Keep OHP strict form.',
    'assigned',
    '2026-03-12 10:00:00+00', '2026-03-12 10:00:00+00'
  );
  INSERT INTO assigned_workout_exercises (assigned_workout_id, exercise_id, order_index) VALUES
    (v_aw_id, e_bench,     1),
    (v_aw_id, e_incline,   2),
    (v_aw_id, e_ohp,       3),
    (v_aw_id, e_lateral,   4),
    (v_aw_id, e_tricep_pd, 5),
    (v_aw_id, e_cable_fly, 6);

  -- Assigned Pull session (upcoming)
  v_aw_id := gen_random_uuid();
  INSERT INTO assigned_workouts (
    id, trainer_id, client_id, title, scheduled_date,
    notes, status, created_at, updated_at
  ) VALUES (
    v_aw_id, v_trainer_id, v_client_id,
    'Pull Day — Week 53',
    '2026-03-17',
    'Test 120 kg deadlift single — warm up properly. Finish with 3 × 12 lat pulldown and curls.',
    'assigned',
    '2026-03-12 10:05:00+00', '2026-03-12 10:05:00+00'
  );
  INSERT INTO assigned_workout_exercises (assigned_workout_id, exercise_id, order_index) VALUES
    (v_aw_id, e_deadlift,  1),
    (v_aw_id, e_pullup,    2),
    (v_aw_id, e_bb_row,    3),
    (v_aw_id, e_lat_pd,    4),
    (v_aw_id, e_seat_row,  5),
    (v_aw_id, e_bb_curl,   6),
    (v_aw_id, e_hammer,    7);

  -- Assigned Legs session (upcoming)
  v_aw_id := gen_random_uuid();
  INSERT INTO assigned_workouts (
    id, trainer_id, client_id, title, scheduled_date,
    notes, status, created_at, updated_at
  ) VALUES (
    v_aw_id, v_trainer_id, v_client_id,
    'Legs Day — Week 53',
    '2026-03-18',
    'Squat 100 kg × 4 × 6. Knee feels 100% now so no restrictions — stay controlled on the way down.',
    'assigned',
    '2026-03-12 10:10:00+00', '2026-03-12 10:10:00+00'
  );
  INSERT INTO assigned_workout_exercises (assigned_workout_id, exercise_id, order_index) VALUES
    (v_aw_id, e_squat,      1),
    (v_aw_id, e_rdl,        2),
    (v_aw_id, e_leg_press,  3),
    (v_aw_id, e_leg_curl,   4),
    (v_aw_id, e_leg_ext,    5),
    (v_aw_id, e_calf,       6);

END $$;

-- ─── Verification ────────────────────────────────────────────
-- Run these after seeding to sanity-check the output:
--
--   SELECT COUNT(*) FROM workouts
--     WHERE client_id = 'cccccccc-0000-4000-c000-000000000003';
--   -- expect ~185-210 rows
--
--   SELECT COUNT(*) FROM workout_sets ws
--     JOIN workouts w ON w.id = ws.workout_id
--     WHERE w.client_id = 'cccccccc-0000-4000-c000-000000000003';
--   -- expect ~3 000-4 500 rows
--
--   SELECT COUNT(*) FROM nutrition_logs
--     WHERE client_id = 'cccccccc-0000-4000-c000-000000000003';
--   -- expect ~700-900 rows
--
--   SELECT MIN(body_weight_kg), MAX(body_weight_kg)
--     FROM workouts
--     WHERE client_id = 'cccccccc-0000-4000-c000-000000000003';
--   -- expect ~81-103 range
