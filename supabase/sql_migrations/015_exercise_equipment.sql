-- ─── Migration 015: Add equipment column to exercises ────────────────────────
-- Adds a nullable TEXT column `equipment` to the exercises table and populates
-- all 100 existing exercises with appropriate equipment values.
-- Valid values (enforced by app-level TS union, not DB constraint):
--   Barbell | Dumbbell | Cable | Machine | Bodyweight | Kettlebell | Band | Other

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS equipment TEXT DEFAULT NULL;

-- ─── Barbell (11) ────────────────────────────────────────────────────────────
UPDATE exercises SET equipment = 'Barbell' WHERE id IN (
  '0f4d1d9b-8cbb-47e3-8193-dd6b72d38707', -- Barbell Curl
  'fff3711b-38a4-487e-93d0-7c52efdbe890', -- Barbell Row
  '2fa2d1d3-4ea2-420a-a514-fd0800e0d90f', -- Bench Press
  'b6e39f07-c69d-4a85-8d00-114466ab6e12', -- Box Squat
  '300ee56b-df67-4e5e-aff8-51ce6416e171', -- Deadlift
  '2acc0a31-fc0a-4c2b-ba5d-8a7d7f0213f3', -- decline press
  '2be4ff68-fb19-42cc-afbf-beee30488728', -- flat bench
  '607f9637-4ba5-48cc-8034-736b22b5d04e', -- flat bench press
  'ef3cb3d8-f697-463a-b77e-a4692e2c9c01', -- Incline Bench Press
  '8ce1f9f7-cc52-4d9d-b530-f64766ffc3e8', -- Landmine
  'dabea74e-389c-4fa8-bcd4-a7f9cf2c652b'  -- Landmine Rotation
);

-- ─── Dumbbell (15) ───────────────────────────────────────────────────────────
UPDATE exercises SET equipment = 'Dumbbell' WHERE id IN (
  '0cf918e5-18dd-448c-962c-5acba7da0151', -- Alternate Hammer Curl
  '943d0c35-70bf-4fb3-993e-69782f63aee7', -- Bicep Curls
  '2da0485e-39b8-4bc6-98b5-e6965aa1d947', -- Burpee DB Press
  'bcd106ef-4d81-4360-8d5d-096f8d712a25', -- DB Bench Press
  '065a0722-2eb1-4a19-81f0-7d9f0cf918a4', -- DB Goblet Squat
  '3153bf6c-a798-47b4-87eb-92b2fb654c99', -- DB Incline Press
  'e4f70e4e-b998-4289-b2ba-8fd80d1d386e', -- DB Overhead Press
  '8996206f-c166-4c1a-b6b2-7c5228fc6a1f', -- DB Renegade Row
  'fb082ab1-e28e-4c32-bd10-c9bb21d23503', -- DB Split Squat
  '1ee110eb-9d11-442a-bacb-c06c4412dd13', -- DB Step-ups
  'b664e58f-b1b8-400f-b3b0-4be5f9d7339a', -- Deadbug (Weighted)
  '45d918fa-d696-48ae-9554-89761ec98837', -- decline DB press
  '99f25f33-e9a2-42ad-a230-7fab43488a11', -- Floor Press + Mod Push-up
  '8aed8c66-0166-490d-9a1b-a18c0b50e68b', -- Hammer Curl
  '15024e35-53be-4f6c-8641-ef99ef0d5783'  -- Lateral Raise
);

-- ─── Cable (12) ──────────────────────────────────────────────────────────────
UPDATE exercises SET equipment = 'Cable' WHERE id IN (
  '45de9606-18c3-4500-9a28-cdf440454d51', -- Cable Crunch
  'f6f05350-3435-48ba-af10-d377d0c08941', -- Cable Face Pulls
  'b3cf51a0-28e6-4669-8764-384cd46702fc', -- Cable Fly
  'e54ceba1-10c3-45a1-871f-e432d8fd1467', -- cable pullover (lowercase)
  'd8f7ec36-03ff-411d-a9b4-ed64773a3845', -- Cable Pullover
  'fd61b1ba-c236-4e99-8e02-cf48b6517ba4', -- Cable Squat Row
  '7414faf7-5b3d-4516-b547-402aef80f6cb', -- Cable Torso Rotations
  'b1254d46-2f3a-4be9-a649-cfbc86c40e71', -- Cable Woodchops
  'f13a998b-eb1a-4455-9105-33250861b7a1', -- Cable/Band Lateral Raise
  'bbf96dcd-7134-4afb-bd56-5ccd28737a24', -- Face Pull
  '96d2129b-2b8b-4284-b565-146fef29e5a3', -- high row
  '38d791b3-ce58-42e0-a1fb-445e0f5bd0f3'  -- isolated seated row
);

-- ─── Machine (8) ─────────────────────────────────────────────────────────────
UPDATE exercises SET equipment = 'Machine' WHERE id IN (
  'dd429076-07dc-48c4-8661-2971840c4090', -- Hamstring curl
  '6d0fcc06-23dc-4dd1-bf76-60cfb8726416', -- Hamstring Curl
  '07f6c3d0-1757-4f0c-8e81-d3629fb35b9b', -- Lat Pulldown
  '544f52ca-98f1-48d9-9a8d-fa7f12e05735', -- Leg Curl
  '71df72e3-8ced-4795-a005-b7a7671b04d8', -- leg extension
  'c895caaf-b8d5-4aed-807c-4cc2b1e226e1', -- Leg Extension
  '412295da-9c4c-4be5-9912-ec06c1a2ad5c', -- Leg Press
  '96cbdbec-8e99-4147-aa3a-846681eb2954'  -- Leg Press + Leg Machines
);

-- ─── Kettlebell (4) ──────────────────────────────────────────────────────────
UPDATE exercises SET equipment = 'Kettlebell' WHERE id IN (
  '9ff32d08-fab2-4657-a276-094f335e0b7d', -- Alternating Kettlebell Row
  '18be71da-bf4e-459d-9a6c-d58432d5f1ab', -- Farmer''s Walk
  '67c1a3ca-078a-4c75-8b65-9d53463579e6', -- Goblet Lateral Lunge
  '3e1a074f-5da1-49f8-9f44-3178d9747a04'  -- KB Deadlift
);

-- ─── Other — med ball, combo, template (6) ───────────────────────────────────
UPDATE exercises SET equipment = 'Other' WHERE id IN (
  '6ca47d6e-e9fa-4595-9892-281633b47a5e', -- Ball Squat Toss
  '546e0d13-6653-4d60-a113-a094fc6e1c97', -- Chest Pass (Med Ball)
  '1804af5b-0324-4a07-88d1-5d2710aaa75d', -- Day 1 Push
  'a2ccc581-cdd3-46fa-9d7b-71aee49f2aba', -- Dips/Band Flyes
  '2d62e96f-48b0-442a-9e47-cc402cf59e94', -- Jump Rope
  'b962ea3d-5055-40f6-a951-7d1b59731133'  -- Lunge Ball Throw
);

-- ─── Bodyweight (44) ─────────────────────────────────────────────────────────
UPDATE exercises SET equipment = 'Bodyweight' WHERE id IN (
  '6766b3a5-293c-438e-bbe4-e2e946b4a16d', -- Air Squat
  'd8ce097b-5caf-49ae-88d6-2e80bdadafe3', -- Bear Crawl
  'ad5739d0-0cf0-4850-8d38-10888a207ec2', -- Bench Sprint
  'e42fbdc9-2ae5-4813-9df9-1947777346f4', -- Bicycle Crunches
  '85d962a1-5274-4089-a627-624e783a81c2', -- Box Dips (Assist)
  '57854382-962e-41d6-9c02-09fe7de709fa', -- Box Jump
  '2a6c163b-5e09-4f99-8d26-805e3dfabe8e', -- Box Step-ups
  '5af004e8-94b3-4cbb-9b0e-df6ca4b28963', -- Burpees
  '1864aeec-79c9-4c11-84c2-1042e3878e09', -- Butt Kicks (s)
  '9357fd37-c9af-4342-b0d8-5bcab3f6a576', -- BW Back Extensions
  'e89a3b3a-1f94-45b6-b8ac-a04051d6e3fe', -- Calf Raise
  'eb1d1628-615c-42d2-b565-922f635fa96f', -- Center Decline
  'd28bad1f-9317-4fe5-8af9-c30d4f5a25ac', -- Chin-up Negatives
  '6cbdef15-f16c-43b0-b382-439659baf9dc', -- Cobra Stretch
  '12629028-b516-4911-ba6c-6bd9dd9f3b1a', -- Crab Walk
  'bb8a0810-ec61-4c99-a113-d7bb8798a6a0', -- Crunch
  '7bc2f8b9-d78d-4b23-b155-37cc23187b10', -- Cycling
  '7484fdbf-c56e-4a23-b291-efb688ed9136', -- Deadbugs
  'cf95ab21-d763-4b59-a32c-2bae48a03a1c', -- Decline Russian Twists
  'ecb029d5-ea2f-425a-8782-f42df8abc9fb', -- decline situp
  '77f163e9-432b-46d0-b862-11a98e9e9f4a', -- Diamond + Wide Pushups
  'd405ed82-6a39-4013-ac8c-7a4ada1a4f5d', -- Dips
  'c83f6c93-4404-4b34-8956-23d07f7d0f20', -- Flutter Kicks
  'd124b685-a77e-44c1-ae80-b39e94bf60d0', -- Foot Hop
  'fa1381de-be3e-44f5-a7bb-d7b12abdf552', -- Forward Leap
  '08e94c1d-f306-4734-9610-387b5626b503', -- Glute Bridge
  '8d897c23-bfc5-45f3-ab5b-4d3792224a63', -- Glute Bridge (Pulsing)
  'c7c8c551-9b6a-422c-999f-5e44afa14afe', -- Glute Bridge Hold
  '143eff06-5ce2-4a69-9191-2686cc9b90b7', -- Hanging Leg Raises
  '2106002e-fdc9-4285-a701-91fb8b6fa35f', -- High Knees (s)
  '18643250-2fc2-4d8a-9d5c-8d5175c18a67', -- Hip Circles
  '248244d3-4ba6-4f58-9772-1b5c0d15472e', -- Ice Skater Steps
  'be3a9444-ec1d-4e35-9ba3-f0dfa03d040d', -- In-Out Jumping Jacks
  'c8fca4fc-caa2-4753-9639-4ee7c8d6b945', -- Inchworm Push-Up
  '1b051178-b5a1-4122-8235-cad6594e81fe', -- Incline Push-up
  '4e62211d-c7e3-46ec-89f1-bed8b48972fe', -- Jump Squats
  '68c4185e-06bb-4c36-b162-bfb91d93b987', -- Jumping Jacks (s)
  '73392c4a-fd48-440b-94dd-22e66616b11f', -- knee raises
  '31152657-723a-4b30-8262-38d842dcaa2d', -- Knee to Elbows
  '69a4bf0e-0e20-4b65-b3cc-9882a3309062', -- Knee/Leg Raises
  '4bc16b71-dffb-4876-ad09-44b6011b9cbb', -- Lateral Bounds
  '21203646-8186-4017-916a-258936ec8d13', -- Lateral Lunge
  'ac37e8b1-2813-4760-8da8-17d07f1e3333', -- Lunge with Twist
  'f80f59e5-c30d-4f0c-a897-eb02435e9592'  -- Lunges
);
