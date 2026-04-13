-- ================================================================
-- Migration 029c-pre: Clear all help_url values set by migrations
-- 029 and 029b that were not verified against the actual video.
-- Run this FIRST, then run migration_029c_youtube_urls.sql after
-- the fetch script produces it.
-- ================================================================

-- We keep only the handful of URLs that were already in the DB
-- before our migrations (those were set by the trainer manually
-- and are presumed correct).
--
-- Everything we added via migration_029 / migration_029b is cleared
-- so no wrong link remains visible in the app.

UPDATE exercises SET help_url = NULL WHERE id IN (
  -- migration_029 batch (set by name, may have landed on wrong video)
  '2fa2d1d3-4ea2-420a-a514-fd0800e0d90f', -- Bench Press (keep — verify below)
  '300ee56b-df67-4e5e-aff8-51ce6416e171', -- Deadlift (keep — verify below)
  'fff3711b-38a4-487e-93d0-7c52efdbe890', -- Barbell Row
  '0f4d1d9b-8cbb-47e3-8193-dd6b72d38707', -- Barbell Curl
  'ef3cb3d8-f697-463a-b77e-a4692e2c9c01', -- Incline Bench Press
  'b6e39f07-c69d-4a85-8d00-114466ab6e12', -- Box Squat
  '02e7f245-0725-4261-97f4-0179712feccb', -- Alternate Incline Dumbbell Curl
  'dcc2bc2c-8436-4029-be41-f16d955ace31', -- triceps rope extensions
  '466b9aa8-8659-4964-9a53-43404ada9965', -- squat dumbbell
  '85dfe48f-985c-4d70-a2d3-d4afb5f7a95f', -- wood chopper
  'dd429076-07dc-48c4-8661-2971840c4090', -- Hamstring curl
  '71df72e3-8ced-4795-a005-b7a7671b04d8', -- leg extension
  '38d791b3-ce58-42e0-a1fb-445e0f5bd0f3', -- isolated seated row
  'a95c5e14-e5dc-4d9d-9670-646dd14d8c00', -- pullover
  'e54ceba1-10c3-45a1-871f-e432d8fd1467', -- cable pullover
  'd8f7ec36-03ff-411d-a9b4-ed64773a3845', -- Cable Pullover (seed)
  '742ee1d0-6919-4fa3-9abe-a610b1e38ce8', -- Rear Delt Dly
  '565ee894-de36-4714-b32b-e3de67484552', -- Incline bench row narrow
  '8d669b2a-4e11-42c8-9603-1eb66fbaca6a', -- Smith Incline Press
  '0c96823a-ec35-42f0-86be-baa13b2fb2fc', -- Smith Flat Bench Press
  '32737aab-5a3d-454a-8cd4-5900559d8cd7', -- Smith Machine Decline Press
  '2acc0a31-fc0a-4c2b-ba5d-8a7d7f0213f3', -- decline press
  '2be4ff68-fb19-42cc-afbf-beee30488728', -- flat bench
  '607f9637-4ba5-48cc-8034-736b22b5d04e', -- flat bench press
  '45d918fa-d696-48ae-9554-89761ec98837', -- decline DB press
  'ca50548c-d937-4474-991b-cf8afa17ebba', -- Barbell Ab Rollout
  '96d2129b-2b8b-4284-b565-146fef29e5a3', -- high row
  '29a3c98a-7878-454c-95ff-5e8f0af75eca', -- Standing Single-Arm Press
  '31b86a08-c898-4703-9da4-aa980254d32c', -- Dumbbell Squat and Press
  '363cc770-2a65-40f8-a2d2-b652e96564bb', -- seated high row
  '25395c37-9145-4a61-89de-271ae067a7e5', -- Standing Cable Wood Chop
  '73392c4a-fd48-440b-94dd-22e66616b11f', -- knee raises
  '0a51bc2e-6b1e-4931-a080-2c5fb572aa31'  -- Bent Over Barbell Row
);

-- Clear URLs set by name in migration_029 (these may have hit the
-- wrong exercise if there was a name mismatch)
UPDATE exercises SET help_url = NULL WHERE name IN (
  'Squat', 'Back Squat', 'Barbell Squat',
  'Romanian Deadlift', 'RDL', 'RDL (Dumbbells)',
  'Hip Thrust',
  'Bulgarian Split Squat', 'DB Split Squat',
  'Plank', 'Forearm Plank',
  'Lateral Raise', 'Cable Lateral Raise',
  'Lat Pulldown',
  'Seated Cable Row', 'Cable Row', 'Seated Row',
  'Face Pull', 'Cable Face Pulls', 'Face Pulls',
  'Goblet Squat', 'DB Goblet Squat',
  'Single-Arm Dumbbell Row',
  'Hammer Curl',
  'Dips',
  'Tricep Pushdown', 'Tricep Rope Pushdown',
  'Skull Crusher',
  'Leg Press',
  'Lunges', 'Reverse Lunge', 'Reverse Lunges',
  'Front Squat',
  'Incline Bench Press',
  'Glute Bridge', 'Glute Bridges',
  'Dead Bug', 'Deadbugs',
  'Bird Dog', 'Bird-Dog',
  'Pallof Press',
  'Bicycle Crunches',
  'Hanging Leg Raises', 'Hanging Leg Raise',
  'Ab Wheel Rollout',
  'Leg Curl', 'Hamstring Curl', 'Hamstring Curls',
  'Leg Extension', 'Leg Extensions Machine',
  'Calf Raise', 'Standing Calf Raises',
  'Overhead Tricep Extension',
  'Walking Lunges',
  'Step-ups',
  'Dumbbell Shoulder Press',
  'DB Bench Press', 'Dumbbell Chest Press',
  'Chest-Supported Row',
  'Scapular Pull-up',
  'McGill Curl-Up',
  'Copenhagen Plank',
  'Side Plank',
  'Dragon Flag',
  'Toes to Bar',
  'Pull-Up',
  'Push-Up',
  'Overhead Press',
  'Dumbbell Overhead Press', 'DB Overhead Press',
  'Incline Dumbbell Press', 'DB Incline Press',
  'Cable Fly',
  'Cable Woodchops'
)
AND help_url IS NOT NULL;
