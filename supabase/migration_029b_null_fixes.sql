-- ================================================================
-- Migration 029b: Fix all remaining null values in exercises table
-- Uses UUIDs from the live DB dump for exact targeting.
-- Run in Supabase SQL editor after migration_029.
-- ================================================================

-- ─── muscle_group fixes ──────────────────────────────────────────

UPDATE exercises SET muscle_group = 'Chest'      WHERE id = '2acc0a31-fc0a-4c2b-ba5d-8a7d7f0213f3'; -- decline press
UPDATE exercises SET muscle_group = 'Chest'      WHERE id = '2be4ff68-fb19-42cc-afbf-beee30488728'; -- flat bench
UPDATE exercises SET muscle_group = 'Chest'      WHERE id = '607f9637-4ba5-48cc-8034-736b22b5d04e'; -- flat bench press
UPDATE exercises SET muscle_group = 'Chest'      WHERE id = '45d918fa-d696-48ae-9554-89761ec98837'; -- decline DB press
UPDATE exercises SET muscle_group = 'Chest'      WHERE id = '8d669b2a-4e11-42c8-9603-1eb66fbaca6a'; -- Smith Incline Press
UPDATE exercises SET muscle_group = 'Chest'      WHERE id = '0c96823a-ec35-42f0-86be-baa13b2fb2fc'; -- Smith Flat Bench Press
UPDATE exercises SET muscle_group = 'Arms'       WHERE id = 'dcc2bc2c-8436-4029-be41-f16d955ace31'; -- triceps rope extensions
UPDATE exercises SET muscle_group = 'Legs'       WHERE id = '466b9aa8-8659-4964-9a53-43404ada9965'; -- squat dumbbell
UPDATE exercises SET muscle_group = 'Core'       WHERE id = '85dfe48f-985c-4d70-a2d3-d4afb5f7a95f'; -- wood chopper
UPDATE exercises SET muscle_group = 'Core'       WHERE id = 'ecb029d5-ea2f-425a-8782-f42df8abc9fb'; -- decline situp
UPDATE exercises SET muscle_group = 'Core'       WHERE id = '73392c4a-fd48-440b-94dd-22e66616b11f'; -- knee raises
UPDATE exercises SET muscle_group = 'Back'       WHERE id = '38d791b3-ce58-42e0-a1fb-445e0f5bd0f3'; -- isolated seated row
UPDATE exercises SET muscle_group = 'Back'       WHERE id = 'a95c5e14-e5dc-4d9d-9670-646dd14d8c00'; -- pullover
UPDATE exercises SET muscle_group = 'Back'       WHERE id = 'e54ceba1-10c3-45a1-871f-e432d8fd1467'; -- cable pullover
UPDATE exercises SET muscle_group = 'Back'       WHERE id = '565ee894-de36-4714-b32b-e3de67484552'; -- Incline bench row narrow
UPDATE exercises SET muscle_group = 'Legs'       WHERE id = 'dd429076-07dc-48c4-8661-2971840c4090'; -- Hamstring curl
UPDATE exercises SET muscle_group = 'Legs'       WHERE id = '71df72e3-8ced-4795-a005-b7a7671b04d8'; -- leg extension
UPDATE exercises SET muscle_group = 'Shoulders'  WHERE id = '742ee1d0-6919-4fa3-9abe-a610b1e38ce8'; -- Rear Delt Dly

-- ─── equipment fixes ─────────────────────────────────────────────

-- Barbell
UPDATE exercises SET equipment = 'Barbell' WHERE id IN (
  '0a51bc2e-6b1e-4931-a080-2c5fb572aa31', -- Bent Over Barbell Row
  'ca50548c-d937-4474-991b-cf8afa17ebba'  -- Barbell Ab Rollout
);

-- Dumbbell
UPDATE exercises SET equipment = 'Dumbbell' WHERE id IN (
  '02e7f245-0725-4261-97f4-0179712feccb', -- Alternate Incline Dumbbell Curl
  '466b9aa8-8659-4964-9a53-43404ada9965', -- squat dumbbell
  'd4dd009c-4867-47b5-b062-5d508479e8b6', -- Teapots
  'bdb7a488-5369-4dbb-ac9c-f2057d6f3def', -- Alt side lunge Plus Dumbbell Rows
  '31b86a08-c898-4703-9da4-aa980254d32c', -- Dumbbell Squat and Press
  '29a3c98a-7878-454c-95ff-5e8f0af75eca'  -- Standing Single-Arm Press
);

-- Cable
UPDATE exercises SET equipment = 'Cable' WHERE id IN (
  'dcc2bc2c-8436-4029-be41-f16d955ace31', -- triceps rope extensions
  '85dfe48f-985c-4d70-a2d3-d4afb5f7a95f', -- wood chopper
  '25395c37-9145-4a61-89de-271ae067a7e5', -- Standing Cable Wood Chop
  'c21e455b-5d68-44c9-81d8-7f61be87cb7f'  -- Seated Torso Rotation Controlled
);

-- Machine
UPDATE exercises SET equipment = 'Machine' WHERE id IN (
  '363cc770-2a65-40f8-a2d2-b652e96564bb', -- seated high row
  'edb9bf16-8024-4b84-9902-c793b62e5efc', -- Standing Wide Row
  '4e7a5a46-149f-4ad6-849f-80fc15d80622', -- Standing Narrow Row
  '6e3153e3-97f9-4407-8b23-141f5b8515c8', -- standing row narrow
  '565ee894-de36-4714-b32b-e3de67484552', -- Incline bench row narrow
  '742ee1d0-6919-4fa3-9abe-a610b1e38ce8', -- Rear Delt Dly
  '32737aab-5a3d-454a-8cd4-5900559d8cd7', -- Smith Machine Decline Press
  '8d669b2a-4e11-42c8-9603-1eb66fbaca6a', -- Smith Incline Press
  '0c96823a-ec35-42f0-86be-baa13b2fb2fc', -- Smith Flat Bench Press
  'ed4488e7-1a31-40c1-83d3-60a3f90b530a', -- Step Mill
  'be037b2d-b31c-4335-ab11-d5dd4700afc1'  -- Seated Chest Press
);

-- Kettlebell
UPDATE exercises SET equipment = 'Kettlebell' WHERE id IN (
  '271097db-9be9-4f37-8155-905e648d1ab1'  -- Front Squats With Two Kettlebells
);

-- Bodyweight
UPDATE exercises SET equipment = 'Bodyweight' WHERE id IN (
  '3cf9bfff-d021-43fe-adc7-627e1f5b3795', -- Side Lunge
  'ab73d889-e546-4d6a-b571-10b81f12d63d', -- Side Iso Hops
  'f298ee0b-3d2a-4dac-afe2-486cd6bc6887', -- Pistol Squat
  '38d4d123-5560-4c33-a9d5-28e3b64ea3e6', -- Pushup
  'f774f5fc-300e-43ab-b364-6f060162ba5d', -- reverse lunges
  '21d5a91e-7e45-4245-8df4-58365c7a4664', -- Mid Row
  'ea65b8dd-aaa9-4926-bd24-ab92a25104a6', -- Ankle Circles
  'da6ae97d-5308-4bc8-9c72-6bf21f6a9e02', -- Single-Leg Reach (Bulg Squat)
  'ad5739d0-0cf0-4850-8d38-10888a207ec2', -- Bench Sprint
  'b96ac656-28d0-4f95-99b3-4fd8c9dd935e', -- 3/4 Sit-Up
  '5981cea0-33c0-4371-ab64-98231f667235', -- teapot situp
  '237564e8-643a-47a8-9f55-417295de2b19', -- isolate leg single leg decline situp
  'ecb029d5-ea2f-425a-8782-f42df8abc9fb', -- decline situp (note: may be on decline bench)
  '4e352135-601e-454b-a834-df1ef6decbce', -- Pushups
  'd119b685-a77e-44c1-ae80-b39e94bf60d0', -- Foot Hop
  'fa1381de-be3e-44f5-a7bb-d7b12abdf552', -- Forward Leap
  '2cf86bf5-422b-4803-b964-148253a27efc', -- Cat-Cow
  '92aa8624-b7f4-4d04-9100-a8f3dad21764', -- Diaphragmatic Breathing
  'b7568ee2-2827-4c6b-925c-80ef80d110d6', -- Pursed-Lip Breathing
  '2b40e477-b31c-4335-ab11-d5dd4700afc1', -- Child's Pose Decompression
  'c567cae0-fd9a-4a9c-b0a5-e5de8e34094c', -- Seated Sciatic Nerve Glide
  '25eac4dd-2c82-4d31-b241-632e63e5f929', -- 90/90 Hip Switches
  '197f4354-5e8c-4ddf-b675-eba24d388e0d', -- Hip Flexor Stretch Half-Kneeling
  '751dff92-2ad4-4a84-a285-32e80a7cccad', -- Figure-4 Glute Stretch
  '4be0496d-cade-44db-a167-5483c5eb1ff6', -- Wrist & Ankle Circles
  '0057a976-ec3f-4f88-b599-1c87acd8bd3c', -- Tai Chi Lunges
  '41495cbd-1a8b-47bb-b2ba-7987dcc25495', -- Pendulum Swings
  'f9310ae6-817b-424e-811c-5b22316a7719', -- Crossover Arm Stretch
  'e228a3dc-b2ce-4b82-bd59-f654a68e9d6b', -- Sleeper Stretch
  'a4726fd3-05a2-42d0-8a99-cd793a17c89c', -- Knee Extension Stretch
  '1f38d576-56aa-4645-8f37-6ad4276304dd', -- Child's Pose with Side Reach
  '6f020cb2-f3ed-4062-96f1-7883da1861a7', -- Hip Flexor & Chest Stretch
  '04d15626-cea2-4eaa-b9fe-9c09a1b0132a', -- Arm Circles & Shoulder Mobility
  '3deb5d82-d16e-4676-a8a3-912fb2654691', -- Modified Child's Pose
  '8a06c63e-e89b-4156-bf41-d2a4698a693d', -- Relaxation Breathwork
  'd42e85af-6852-48f0-9402-ce88e08d9c1b', -- Deep Breathing Cool-Down
  'eb6b8419-9055-4fbe-8a66-fd81f3314f0d', -- Seated Forward Fold Stretch
  '13a39bb1-ef8a-4b85-8930-13d98a2ec9ca', -- Progressive Muscle Relaxation
  '33588261-5e0b-4d2a-846b-d37e1914229d', -- Lying Stretches
  'f49246b1-c18a-4464-9060-50e163b08176', -- Seated Arm Circles
  'e853e3ac-19aa-4582-b0b8-2e3caee8540a', -- Rest Periods Between Every Set
  -- Stretch exercises (all bodyweight)
  '6cf2b6b8-622c-4231-8d5a-442776194098', -- Thoracic Spine Rotation
  '941e9820-69b0-42e3-86ee-ea96c79513ff', -- Thread the Needle
  '2fec7a78-a8f1-421a-92c1-02a682ea2e71', -- Prone Cobra
  'dad51a7c-f1ec-4e11-867f-493c67fe45fe', -- Supine Twist
  '178dd043-84e0-4f32-84a4-6203c0d6c414', -- Lat Doorway Stretch
  '4c63c00f-12ca-4d06-8660-08c65a51c7d6', -- Levator Scapulae Stretch
  '64a364d9-efcf-4f13-adc7-28d129afb28c', -- Doorway Chest Stretch
  '3600076a-d91b-4653-aec8-9dbe1a4c38a4', -- Chest Opener Stretch
  'd8078b91-d499-439e-b418-fd7eab7efa1d', -- Pec Minor Stretch
  '3c6389cc-09bb-40f7-b72a-ac12c4d60b9b', -- Cross-Body Shoulder Stretch
  '4cebc36a-6b49-4779-af1b-d14e6cac33fd', -- Shoulder Sleeper Stretch
  'a4b1239d-26ca-4110-8833-a302e2a20f91', -- Neck Side Stretch
  '28f95059-92b4-4c06-be15-3a662cdfe816', -- Neck Flexion Stretch
  '61aa2277-6cc3-4331-adea-4e3c3b1204a2', -- Posterior Shoulder Stretch
  '075ed000-6fba-4e71-bd25-47eec853294c', -- Bicep Wall Stretch
  '34afc986-8a2c-4e73-a47f-66cddf004f20', -- Forearm Flexor Stretch
  '919fce78-c74c-44cb-ad1f-d18d4fb14959', -- Hip Flexor Stretch
  'febdf791-c9bc-476b-b72c-a5dc834eafdc', -- 90/90 Hip Stretch
  '0285b0e9-4cea-4aa4-ac1c-f296e799b152', -- Butterfly Stretch
  'a4b1f027-1420-498c-824c-ce9b39cf6148', -- Figure Four Stretch
  '78ea4d3c-a29e-49d2-9a38-e39188022c4f', -- Piriformis Stretch
  '750c8572-09c3-4754-91f1-0201d5bd3f26', -- Seated Glute Stretch
  'c2fc7398-6a0d-458f-ad1c-814ee3e79e5f', -- Standing Quad Stretch
  '8b74c192-8310-44a4-b418-34246625b8f2', -- Lying Quad Stretch
  '3813831a-8a99-4af3-bcf4-3f5982f9f058', -- Standing Hamstring Stretch
  'a6dde5d3-f633-4ee9-8dde-45b9e6944fe4', -- Seated Hamstring Stretch
  '86826a31-7033-400b-818f-ab9e1282fa4a', -- Seated Forward Fold
  'b8700034-51a3-4f2a-999f-cb6354d9cc24', -- IT Band Stretch
  'd7cefd33-1222-4277-9414-0b3db7b1d1e8', -- Couch Stretch
  'c12a4afd-ef45-4255-b087-cc232e0b2179', -- Standing Calf Stretch
  '7d381adb-2d3f-44e6-b08a-07f28cd5e23d', -- World's Greatest Stretch
  'b3bfa485-1df8-4bb9-a439-43e35e80c610', -- Wrist Flexor Stretch
  '6844a583-4c6e-491c-99ad-c602803fbfd0', -- Wrist Extensor Stretch
  '92c01251-6aaf-4332-9624-163ea241a28a', -- Prayer Stretch
  '259ef0ba-2328-4135-b4e9-2fda23c4e289', -- Reverse Prayer Stretch
  '23e811f4-b56b-43e5-852e-64d53d770515', -- Finger Extension Stretch
  '2401c894-2638-4f25-a37d-b8fcf466e74c', -- Thumb Stretch
  '3855a501-0355-4ef9-b924-ac3cc7a37ba6', -- Wrist Circles
  'ff1e84ad-9f6c-45b4-8abe-6165ea95190a', -- Tendon Glide
  'dce0b1fe-11a4-4281-8e6c-951e058c27a1', -- Plantar Fascia Stretch
  '24a9ba79-26de-4908-9cb9-44a698faca46', -- Achilles Tendon Stretch
  '91408e7e-fb4a-4e56-a3b0-5d81bb3c48d8', -- Toe Flexor Stretch
  'ce8e07a5-b7ff-4e5d-9c4c-228cc2f67051', -- Toe Spread Stretch
  '193001a3-eebe-4761-9861-0fc3b316aee7', -- Ankle Dorsiflexion Stretch
  '23bbc036-3eb2-496a-9a7a-18fa3517393f', -- Seated Calf & Ankle Stretch
  '43a8ef72-e170-4ec1-a7d3-64fc99851ac8'  -- Intrinsic Foot Strengthening
);

-- Other
UPDATE exercises SET equipment = 'Other' WHERE id IN (
  'c4eec08e-8fb9-4d52-965b-2b9ce21ded0a', -- Sled Push
  '904ff81f-9e75-4455-87c1-bfb604607164', -- pull up assists
  'c66be6d6-9aea-49b8-b4ba-c4e11ae4f86d', -- Rhomboids-SMR (foam roller)
  '8797b3d2-3f4c-4e72-921d-a08bc95415e5', -- strength 1 (placeholder)
  '783acc3b-dc2f-4498-a31e-995e367ef176'  -- Pec Minor Release (foam roller / lacrosse ball)
);

-- ─── form_notes fixes ────────────────────────────────────────────

UPDATE exercises SET form_notes =
  'Hinge forward ~45° with flat back, overhand grip just outside shoulder-width. Pull bar to lower chest or navel, driving elbows straight back. Squeeze shoulder blades at the top. Lower with control. Keep spine neutral throughout — do not round the upper back.'
WHERE id = '0a51bc2e-6b1e-4931-a080-2c5fb572aa31' AND form_notes IS NULL; -- Bent Over Barbell Row

UPDATE exercises SET form_notes =
  'Set bench to 30–45°. Alternate arms — curl one dumbbell while the other lowers. Keep the working elbow pinned to the side. At the top of each rep, supinate the wrist fully (palm faces ceiling). Lower slowly over 3 seconds. Keep shoulders relaxed and stable.'
WHERE id = '02e7f245-0725-4261-97f4-0179712feccb' AND form_notes IS NULL; -- Alternate Incline Dumbbell Curl

UPDATE exercises SET form_notes =
  'Stand with a dumbbell in one hand at your side. Keeping your body rigid, perform a lateral side-bend toward the dumbbell — let it travel down the outside of your thigh. Control the return using the opposite obliques. Do not jerk or use momentum. Keep hips square and do not lean forward or back.'
WHERE id = 'd4dd009c-4867-47b5-b062-5d508479e8b6' AND form_notes IS NULL; -- Teapots

UPDATE exercises SET form_notes =
  'Sit on a decline board with feet secured, hands behind head or crossed on chest. Lower torso ¾ of the way back — do not go fully flat. Curl back up to upright by flexing the hip flexors and abs. Controlled tempo throughout. Avoid pulling the neck.'
WHERE id = 'b96ac656-28d0-4f95-99b3-4fd8c9dd935e' AND form_notes IS NULL; -- 3/4 Sit-Up

UPDATE exercises SET form_notes =
  'Secure feet on the decline bench. Perform a crunch with a lateral rotation, touching or pointing elbow toward the opposite knee at the top. Lower under control. Alternate sides each rep. The "teapot" shape comes from the side-flexion of the trunk as you rotate and crunch.'
WHERE id = '5981cea0-33c0-4371-ab64-98231f667235' AND form_notes IS NULL; -- teapot situp

UPDATE exercises SET form_notes =
  'Position one leg on the decline board. Perform a single-leg crunch, isolating one side of the abs. Lower under full control — do not drop back. Hands lightly behind head; do not pull on the neck. Focus on quality contraction through the targeted side.'
WHERE id = '237564e8-643a-47a8-9f55-417295de2b19' AND form_notes IS NULL; -- isolate leg single leg decline situp

UPDATE exercises SET form_notes =
  'Secure feet on the decline board. Lower torso fully back, then curl all the way up to an upright sit — full range of motion. Hands across chest or lightly behind head. Engage abs throughout. Avoid using momentum or jerking at the bottom.'
WHERE id = '1de702f5-6e9f-46e0-874a-a84cc38e35ab' AND form_notes IS NULL; -- Decline situp

UPDATE exercises SET form_notes =
  'Stand or sit facing a wide-grip machine row. Pull the bar to upper chest with elbows flaring wide. At the end position squeeze the rear delts and upper traps. Return slowly — do not let the weight stack crash. Upright torso throughout; do not lean back to generate momentum.'
WHERE id = 'edb9bf16-8024-4b84-9902-c793b62e5efc' AND form_notes IS NULL; -- Standing Wide Row

UPDATE exercises SET form_notes =
  'Stand or sit at a narrow-grip cable or machine row. Pull the handle to your lower sternum with elbows staying close to your ribs. Retract and depress shoulder blades at the peak. Slow eccentric — 3 seconds back to start. Sit tall; do not round the upper back.'
WHERE id = '4e7a5a46-149f-4ad6-849f-80fc15d80622' AND form_notes IS NULL; -- Standing Narrow Row

UPDATE exercises SET form_notes =
  'Attach a rope or bar to a high cable. Standing or kneeling, hinge from the shoulder — keep a slight elbow bend throughout. Pull the attachment in an arc from overhead down to your hips, feeling the lats engage. Slowly return to full overhead stretch. Alternate arms if prescribed.'
WHERE id = '3d97b250-6c50-48b7-a272-e717fe098224' AND form_notes IS NULL; -- Alternating Pullover

UPDATE exercises SET form_notes =
  'Seated at a rear-delt machine. Grip the handles with palms facing in. Lead with elbows, sweeping arms out and back to a T-position — feel the rear deltoids and rhomboids contract. Pause 1 second at the end range. Slow controlled return. Do not rock the torso.'
WHERE id = '742ee1d0-6919-4fa3-9abe-a610b1e38ce8' AND form_notes IS NULL; -- Rear Delt Dly

UPDATE exercises SET form_notes =
  'Stand or sit at a narrow-grip cable or machine row. Pull handle to lower sternum; elbows stay close to the body throughout. Retract scapulae fully at the top. Return with a 3-second eccentric. Keep spine long and neutral — no leaning back.'
WHERE id = '6e3153e3-97f9-4407-8b23-141f5b8515c8' AND form_notes IS NULL; -- standing row narrow

UPDATE exercises SET form_notes =
  'Lie on an incline bench facing the weight stack. Use a narrow grip. Pull the bar to your lower chest, keeping elbows close to the body. Squeeze lats and rhomboids at the top. Lower slowly with full control. The incline eliminates lower back involvement and isolates the back.'
WHERE id = '565ee894-de36-4714-b32b-e3de67484552' AND form_notes IS NULL; -- Incline bench row narrow

UPDATE exercises SET form_notes =
  'Sit tall at the high-row machine. Grip handles at shoulder width. Pull to upper chest with elbows flaring wide — engage rear delts and upper traps. Squeeze at the end range. Return slowly. Keep chest up and shoulders back; do not let them round forward.'
WHERE id = '363cc770-2a65-40f8-a2d2-b652e96564bb' AND form_notes IS NULL; -- seated high row

UPDATE exercises SET form_notes =
  'Position barbell in Smith machine at incline angle (30–45°). Unrack with grip just outside shoulder width. Lower to upper chest or clavicle. Press to full extension. The Smith machine tracks the bar path — focus on chest engagement and shoulder blade retraction. Keep feet flat and stable.'
WHERE id = '8d669b2a-4e11-42c8-9603-1eb66fbaca6a' AND form_notes IS NULL; -- Smith Incline Press

UPDATE exercises SET form_notes =
  'Set Smith machine bar at flat bench height. Lie flat, feet on floor. Lower bar to mid-chest under control. Press to full extension. Keep shoulder blades retracted and depressed. The fixed bar path reduces stabiliser demand — focus on chest drive and full range of motion.'
WHERE id = '0c96823a-ec35-42f0-86be-baa13b2fb2fc' AND form_notes IS NULL; -- Smith Flat Bench Press

UPDATE exercises SET form_notes =
  'Set Smith machine to decline angle; secure feet on footpad. Lower bar to lower chest. Press to full extension. Keep shoulder blades pinched. The decline targets the lower pec — avoid locking out aggressively at the top.'
WHERE id = '32737aab-5a3d-454a-8cd4-5900559d8cd7' AND form_notes IS NULL; -- Smith Machine Decline Press

UPDATE exercises SET form_notes =
  'Load barbell and kneel on it (or use a barbell with ab wheel attachment). Arms extended, core braced hard. Roll the bar forward as far as you can while keeping the lower back from arching — hips should be in line. Pull back by contracting the lats and core. Do not drop the hips or pike.'
WHERE id = 'ca50548c-d937-4474-991b-cf8afa17ebba' AND form_notes IS NULL; -- Barbell Ab Rollout

UPDATE exercises SET form_notes =
  'Step wide to one side, bending that knee into a lateral squat while keeping the opposite leg straight. Hold dumbbells at your sides for added resistance. At the bottom of each lunge, row the dumbbells to your hips — engaging the lats. Press off the bent leg to return. Alternate sides.'
WHERE id = 'bdb7a488-5369-4dbb-ac9c-f2057d6f3def' AND form_notes IS NULL; -- Alt side lunge Plus Dumbbell Rows

UPDATE exercises SET form_notes =
  'Stand with dumbbells at shoulders. Squat to depth — hip crease below parallel — then drive up explosively. At the top of the squat, use the momentum to press both dumbbells overhead. Lower DBs back to shoulders as you drop into the next squat. Core braced throughout.'
WHERE id = '31b86a08-c898-4703-9da4-aa980254d32c' AND form_notes IS NULL; -- Dumbbell Squat and Press

UPDATE exercises SET form_notes =
  'On hands and knees, inhale and drop your belly toward the floor while lifting your head and tailbone (cow). Exhale and round your spine toward the ceiling, tucking chin to chest (cat). Move slowly and smoothly through the full range. 10 reps per set. Breathe rhythmically.'
WHERE id = '2cf86bf5-422b-4803-b964-148253a27efc' AND form_notes IS NULL; -- Cat-Cow

UPDATE exercises SET form_notes =
  'Lie on your back or sit comfortably. Place one hand on your belly. Inhale slowly through your nose for 4 counts — feel the belly rise, not the chest. Exhale fully through pursed lips for 6–8 counts — belly falls. The diaphragm does the work. Repeat for the prescribed duration.'
WHERE id = '92aa8624-b7f4-4d04-9100-a8f3dad21764' AND form_notes IS NULL; -- Diaphragmatic Breathing

UPDATE exercises SET form_notes =
  'Inhale gently through the nose. Exhale slowly through pursed lips (as if cooling hot soup) for twice as long as the inhale. This keeps airways open and reduces the work of breathing. Ideal for COPD and respiratory rehab. Use during rest periods and cool-downs.'
WHERE id = 'b7568ee2-2827-4c6b-925c-80ef80d110d6' AND form_notes IS NULL; -- Pursed-Lip Breathing

UPDATE exercises SET form_notes =
  'Sit tall on the chest press machine; adjust seat so handles are at chest height. Grip handles with palms facing down or forward. Press handles out to full extension; avoid locking elbows aggressively. Return slowly — feel the chest stretch at the end range. Core braced throughout.'
WHERE id = 'be037b2d-b31c-4335-ab11-d5dd4700afc1' AND form_notes IS NULL; -- Seated Chest Press

UPDATE exercises SET form_notes =
  'Kneel or sit comfortably. Hinge forward and reach both arms forward, lowering the chest toward the floor. Hold 30–60 seconds. To decompress the spine, actively reach your fingertips forward while pushing your hips gently back toward your heels. Breathe deeply into the lower back.'
WHERE id = '2b40e477-b31c-4335-ab11-d5dd4700afc1' AND form_notes IS NULL; -- Child's Pose Decompression

UPDATE exercises SET form_notes =
  'Sit tall with one leg extended. Slowly straighten the knee while flexing the foot — you will feel a pull down the back of the leg (sciatic nerve). Hold for 5–10 seconds. Release. Repeat 10 times per side. Move gently — this mobilises the nerve, not a muscle stretch. Stop if sharp pain occurs.'
WHERE id = 'c567cae0-fd9a-4a9c-b0a5-e5de8e34094c' AND form_notes IS NULL; -- Seated Sciatic Nerve Glide

UPDATE exercises SET form_notes =
  'Sit on the floor with both legs bent at 90°. Rotate the pelvis to switch between internal and external hip rotation, lowering both knees toward the floor alternately. Keep a tall spine. Move smoothly — controlled transitions. Use hands behind you for support if needed.'
WHERE id = '25eac4dd-2c82-4d31-b241-632e63e5f929' AND form_notes IS NULL; -- 90/90 Hip Switches

UPDATE exercises SET form_notes =
  'Kneel on one knee with the other foot forward. Keep your torso upright and tuck the pelvis (posterior pelvic tilt) to maximise the stretch on the rear hip flexor (psoas). You should feel a deep stretch at the front of the rear hip. Hold 30–60 seconds per side. Breathe normally.'
WHERE id = '197f4354-5e8c-4ddf-b675-eba24d388e0d' AND form_notes IS NULL; -- Hip Flexor Stretch Half-Kneeling

UPDATE exercises SET form_notes =
  'Lie on your back. Cross one ankle over the opposite knee. Pull both legs toward your chest — or push the crossed knee away — to feel a stretch in the outer glute/piriformis of the crossed leg. Hold 30–60 seconds. Keep the lower back relaxed on the floor.'
WHERE id = '751dff92-2ad4-4a84-a285-32e80a7cccad' AND form_notes IS NULL; -- Figure-4 Glute Stretch

UPDATE exercises SET form_notes =
  'Rotate the wrists in full circles — 10 times clockwise, 10 counterclockwise. Then rotate the ankles in the same way. Move through the maximum pain-free range. Excellent warm-up drill for joint lubrication and proprioception. Move slowly and deliberately.'
WHERE id = '4be0496d-cade-44db-a167-5483c5eb1ff6' AND form_notes IS NULL; -- Wrist & Ankle Circles

UPDATE exercises SET form_notes =
  'Step slowly and deliberately with a slight knee bend on each stride. Shift weight fluidly from foot to foot. Arms move slowly in opposition. Focus on balance and control rather than speed. Each movement should feel like a slow, flowing transition. Used as a warm-up or active recovery mobility drill.'
WHERE id = '0057a976-ec3f-4f88-b599-1c87acd8bd3c' AND form_notes IS NULL; -- Tai Chi Lunges

UPDATE exercises SET form_notes =
  'Stand and lean slightly forward. Let the arm hang freely and swing gently in small circles — gravity decompresses the shoulder joint. 10 circles clockwise, 10 counter-clockwise. Then pendulum side-to-side and front-to-back. Keep the shoulder completely relaxed — do not actively swing. Excellent post-injury shoulder warm-up.'
WHERE id = '41495cbd-1a8b-47bb-b2ba-7987dcc25495' AND form_notes IS NULL; -- Pendulum Swings

UPDATE exercises SET form_notes =
  'Extend one arm across your body at chest height. Use your opposite hand to gently pull it closer to your chest. You will feel a stretch in the posterior deltoid and outer rotator cuff. Hold 20–30 seconds per side. Keep the shoulder depressed — do not shrug. Also called cross-body shoulder stretch.'
WHERE id = 'f9310ae6-817b-424e-811c-5b22316a7719' AND form_notes IS NULL; -- Crossover Arm Stretch

UPDATE exercises SET form_notes =
  'Lie on your side on the affected shoulder. Bend the elbow to 90°. Gently push the forearm down toward the floor with your opposite hand — you should feel a stretch in the back of the shoulder (posterior capsule). Hold 20–30 seconds. Stop if shoulder pain increases. Perform after warming up.'
WHERE id = 'e228a3dc-b2ce-4b82-bd59-f654a68e9d6b' AND form_notes IS NULL; -- Sleeper Stretch

UPDATE exercises SET form_notes =
  'Standing or seated, hold the knee in a slightly bent position and gently straighten it as far as comfortable. Hold 5–10 seconds, then relax. Repeat 10 times. Used post-surgery or injury to gradually restore terminal knee extension. Progress range of motion as tolerated.'
WHERE id = 'a4726fd3-05a2-42d0-8a99-cd793a17c89c' AND form_notes IS NULL; -- Knee Extension Stretch

UPDATE exercises SET form_notes =
  'Use a foam roller or lacrosse ball placed under the pectoralis minor (below the clavicle, upper-inner chest). Apply moderate pressure and make slow passes or hold on tender spots for 20–30 seconds. Helps reduce pec minor tightness that contributes to forward shoulder posture and impingement.'
WHERE id = '783acc3b-dc2f-4498-a31e-995e367ef176' AND form_notes IS NULL; -- Pec Minor Release

UPDATE exercises SET form_notes =
  'Stand in a staggered stance with one foot forward. Hold a dumbbell at shoulder height in the opposite hand. Press straight up to full extension — avoid leaning to one side. Core braced to resist the unilateral load. Lower slowly. Complete all reps on one side then switch.'
WHERE id = '29a3c98a-7878-454c-95ff-5e8f0af75eca' AND form_notes IS NULL; -- Standing Single-Arm Press

UPDATE exercises SET form_notes =
  'Sit tall on a bench or machine seat. Holding a handle or weight, rotate the torso through a controlled range of motion to one side and back. Movement comes from the thoracic spine — do not rotate from the lower back or hips. Slow tempo: 2 seconds each direction. No jerking.'
WHERE id = 'c21e455b-5d68-44c9-81d8-7f61be87cb7f' AND form_notes IS NULL; -- Seated Torso Rotation Controlled

UPDATE exercises SET form_notes =
  'From child''s pose, walk both hands to one side to deepen the stretch in the lateral trunk and lat of the opposite side. Hold 20–30 seconds. Return to centre and switch sides. Breathe into the stretched side. Excellent for QL and lat tightness.'
WHERE id = '1f38d576-56aa-4645-8f37-6ad4276304dd' AND form_notes IS NULL; -- Child's Pose with Side Reach

UPDATE exercises SET form_notes =
  'Kneel in a low lunge with one foot forward. Lean the front knee forward and slightly outward. Simultaneously reach the opposite arm overhead and across toward the front foot, opening the hip flexor and chest. Hold 5 seconds. Return. Great thoracic + hip mobility combo.'
WHERE id = '6f020cb2-f3ed-4062-96f1-7883da1861a7' AND form_notes IS NULL; -- Hip Flexor & Chest Stretch

UPDATE exercises SET form_notes =
  'Extend both arms forward and rotate in large, controlled circles — small to large. Then perform shoulder rolls forward and back. Move through the full shoulder range. 10 repetitions each direction. Warms up the glenohumeral joint and activates the rotator cuff before pressing or pulling work.'
WHERE id = '04d15626-cea2-4eaa-b9fe-9c09a1b0132a' AND form_notes IS NULL; -- Arm Circles & Shoulder Mobility

UPDATE exercises SET form_notes =
  'From a kneeling position, hinge forward and reach both arms out in front with palms flat, chest toward the floor. Walk knees slightly forward. Hold 20–30 seconds. A gentler version of child''s pose suitable for those with knee or hip limitations. Breathe into the lower back.'
WHERE id = '3deb5d82-d16e-4676-a8a3-912fb2654691' AND form_notes IS NULL; -- Modified Child's Pose

UPDATE exercises SET form_notes =
  'Lie comfortably on your back or sit in a quiet space. Close your eyes. Take slow, deep diaphragmatic breaths — 4 counts in, 6–8 counts out. Focus entirely on the sensation of breathing. Used at the end of sessions for parasympathetic recovery. Also effective for sleep preparation and stress management.'
WHERE id = '8a06c63e-e89b-4156-bf41-d2a4698a693d' AND form_notes IS NULL; -- Relaxation Breathwork

UPDATE exercises SET form_notes =
  'After a session, walk slowly for 3–5 minutes, then perform 3–5 minutes of slow diaphragmatic breathing — 4 counts in, 6 counts out. This activates the parasympathetic nervous system (rest-and-digest), lowers heart rate and cortisol, and improves recovery between sessions.'
WHERE id = 'd42e85af-6852-48f0-9402-ce88e08d9c1b' AND form_notes IS NULL; -- Deep Breathing Cool-Down

UPDATE exercises SET form_notes =
  'Sit tall on the floor or on a chair. Extend both legs forward. Hinge at the hips — not the waist — reaching hands toward feet while keeping the spine as long as possible. Hold 20–30 seconds. Breathe into the hamstrings on each exhale to progressively deepen the range.'
WHERE id = 'eb6b8419-9055-4fbe-8a66-fd81f3314f0d' AND form_notes IS NULL; -- Seated Forward Fold Stretch

UPDATE exercises SET form_notes =
  'Lie comfortably on your back. Systematically tense each muscle group for 5 seconds, then completely release it for 10–20 seconds. Work from feet to face: feet, calves, thighs, glutes, abdomen, hands, arms, shoulders, face. Used for recovery, stress management, and improving sleep quality.'
WHERE id = '13a39bb1-ef8a-4b85-8930-13d98a2ec9ca' AND form_notes IS NULL; -- Progressive Muscle Relaxation

UPDATE exercises SET form_notes =
  'Perform a series of gentle full-body stretches: lying hamstring pulls, quad stretch on the side, supine spinal twist, figure-4, and a gentle child''s pose. Hold each 20–30 seconds. Breathe normally. Used as a cool-down routine to reduce post-exercise soreness and improve flexibility.'
WHERE id = '33588261-5e0b-4d2a-846b-d37e1914229d' AND form_notes IS NULL; -- Lying Stretches

UPDATE exercises SET form_notes =
  'Sit tall in a chair or on the floor. Raise both arms to shoulder height, slightly bent. Rotate in large, controlled circles forward — 10 rotations, then reverse. Keep the core braced and do not shrug. Excellent shoulder warm-up for those with limited mobility who cannot stand.'
WHERE id = 'f49246b1-c18a-4464-9060-50e163b08176' AND form_notes IS NULL; -- Seated Arm Circles

UPDATE exercises SET form_notes =
  'This is a structured rest period, not a movement. Sit or stand quietly between sets. Breathe slowly and deeply to restore heart rate and ATP-PCr stores. Duration varies by goal: 1–2 min for hypertrophy, 2–3 min for strength, 3–5 min for maximal power. Do not skip rest — it directly impacts performance quality.'
WHERE id = 'e853e3ac-19aa-4582-b0b8-2e3caee8540a' AND form_notes IS NULL; -- Rest Periods Between Every Set

UPDATE exercises SET form_notes =
  'Sit or stand. Squeeze and spread your toes repeatedly. Try to lift each toe independently. Progress to short-foot exercises: draw the ball of the foot toward the heel without curling the toes — this domes the arch. Strengthens the intrinsic foot muscles that support the arch and improve ankle stability.'
WHERE id = '43a8ef72-e170-4ec1-a7d3-64fc99851ac8' AND form_notes IS NULL; -- Intrinsic Foot Strengthening

-- Stretch exercises: concise, practical form notes

UPDATE exercises SET form_notes =
  'Sit or lie and reach one arm in front of you. Use the opposite hand to gently pull it further across the body, creating a stretch in the posterior shoulder and outer rotator cuff. Hold 20–30 seconds. Keep the shoulder depressed — do not hike it up.'
WHERE id = '3c6389cc-09bb-40f7-b72a-ac12c4d60b9b' AND form_notes IS NULL; -- Cross-Body Shoulder Stretch

UPDATE exercises SET form_notes =
  'Lie on your side on the affected shoulder. Bend elbow 90°. Use your other hand to gently press the forearm toward the floor, stretching the posterior capsule. Hold 20–30 seconds. Perform after warming up. Stop if shoulder pain worsens.'
WHERE id = '4cebc36a-6b49-4779-af1b-d14e6cac33fd' AND form_notes IS NULL; -- Shoulder Sleeper Stretch

UPDATE exercises SET form_notes =
  'Sit or stand tall. Tilt your right ear toward your right shoulder. Hold 20–30 seconds — you will feel a stretch along the left side of the neck (left upper trapezius and levator scapulae). Return to centre. Switch sides. Do not rotate the neck — pure lateral flexion only.'
WHERE id = 'a4b1239d-26ca-4110-8833-a302e2a20f91' AND form_notes IS NULL; -- Neck Side Stretch

UPDATE exercises SET form_notes =
  'Stand or sit tall. Tuck your chin gently toward your chest until you feel a stretch in the back of your neck and upper thoracic spine. Hold 20–30 seconds. Do not forcefully flex — just gentle overpressure. Relieves upper cervical tension common from sitting and screen use.'
WHERE id = '28f95059-92b4-4c06-be15-3a662cdfe816' AND form_notes IS NULL; -- Neck Flexion Stretch

UPDATE exercises SET form_notes =
  'Reach one arm behind you (as if into a back pocket), palm out. Use the opposite hand to gently pull the wrist further back and toward the midline, creating a stretch in the posterior shoulder. Hold 20–30 seconds per side. Targets the posterior capsule and infraspinatus.'
WHERE id = '61aa2277-6cc3-4331-adea-4e3c3b1204a2' AND form_notes IS NULL; -- Posterior Shoulder Stretch

UPDATE exercises SET form_notes =
  'Stand with arm extended, palm up. With the other hand, gently press the fingers back (extending the wrist) to stretch the bicep tendon and anterior elbow. You can also press the palm against a wall with arm straight and rotate away. Hold 20–30 seconds per side.'
WHERE id = '075ed000-6fba-4e71-bd25-47eec853294c' AND form_notes IS NULL; -- Bicep Wall Stretch

UPDATE exercises SET form_notes =
  'Extend one arm in front, elbow straight, palm up. With the other hand, gently press the fingers down (wrist extension) to stretch the forearm flexors and medial elbow tendons. Hold 20–30 seconds per side. Perform 2–3 times. Essential for those with golfer''s elbow or high grip-work volume.'
WHERE id = '34afc986-8a2c-4e73-a47f-66cddf004f20' AND form_notes IS NULL; -- Forearm Flexor Stretch

UPDATE exercises SET form_notes =
  'Kneel on one knee with the other foot forward. Shift hips forward and squeeze the glute of the rear leg to intensify the stretch on the hip flexor (psoas). Keep the torso upright. Hold 30–60 seconds per side. Adding a slight lean away from the rear leg deepens the lateral hip flexor stretch.'
WHERE id = '919fce78-c74c-44cb-ad1f-d18d4fb14959' AND form_notes IS NULL; -- Hip Flexor Stretch

UPDATE exercises SET form_notes =
  'Sit on the floor with both legs bent at 90° — one internally rotated in front, one externally rotated behind. Hold 30–60 seconds, then switch sides. Stretches hip external rotators on the front leg and hip flexors on the rear. The gold standard hip mobility drill.'
WHERE id = 'febdf791-c9bc-476b-b72c-a5dc834eafdc' AND form_notes IS NULL; -- 90/90 Hip Stretch

UPDATE exercises SET form_notes =
  'Sit on the floor. Bring the soles of your feet together and let your knees fall out to the sides. Hold ankles and gently press knees down. Hold 30–60 seconds. You will feel a stretch in the inner thighs (adductors) and groin. Do not force the knees down — relax and breathe.'
WHERE id = '0285b0e9-4cea-4aa4-ac1c-f296e799b152' AND form_notes IS NULL; -- Butterfly Stretch

UPDATE exercises SET form_notes =
  'Lie on your back. Cross one ankle over the opposite knee. Pull both legs toward your chest to feel a stretch in the crossed leg''s glute (piriformis, hip external rotators). Hold 30–60 seconds. Alternatively sit upright and lean forward over crossed legs.'
WHERE id = 'a4b1f027-1420-498c-824c-ce9b39cf6148' AND form_notes IS NULL; -- Figure Four Stretch

UPDATE exercises SET form_notes =
  'Lie on your back. Cross one ankle over the opposite knee and pull both legs toward your chest. Hold the shin or thigh of the straight leg. You will feel a stretch in the piriformis and deep hip external rotators of the crossed leg. Hold 30–60 seconds per side. Breathe deeply.'
WHERE id = '78ea4d3c-a29e-49d2-9a38-e39188022c4f' AND form_notes IS NULL; -- Piriformis Stretch

UPDATE exercises SET form_notes =
  'Sit on a chair or bench. Cross one ankle over the opposite knee. Lean gently forward from the hips while keeping the back straight. You should feel a stretch in the glute and outer hip. Hold 30–60 seconds. Breathe normally. Switch sides.'
WHERE id = '750c8572-09c3-4754-91f1-0201d5bd3f26' AND form_notes IS NULL; -- Seated Glute Stretch

UPDATE exercises SET form_notes =
  'Stand on one foot. Bend the other knee and hold the ankle or foot behind you, pulling it toward the glutes. Keep knees together and stand tall. Hold 20–30 seconds. If balance is difficult, hold a wall for support. Stretches the rectus femoris and hip flexors.'
WHERE id = 'c2fc7398-6a0d-458f-ad1c-814ee3e79e5f' AND form_notes IS NULL; -- Standing Quad Stretch

UPDATE exercises SET form_notes =
  'Lie on your side. Bend the top knee and hold the foot or ankle behind you (same as standing quad stretch but lying). Keep hips stacked. Hold 30–60 seconds per side. Use if standing balance is difficult. Press the hip slightly forward for a deeper hip flexor component.'
WHERE id = '8b74c192-8310-44a4-b418-34246625b8f2' AND form_notes IS NULL; -- Lying Quad Stretch

UPDATE exercises SET form_notes =
  'Stand tall. Place one foot on a step or box. Keep the knee of the raised leg straight. Lean gently forward from the hips — not the waist — until you feel a stretch in the hamstring. Hold 20–30 seconds. Alternatively stand and reach hands toward the floor with soft knees.'
WHERE id = '3813831a-8a99-4af3-bcf4-3f5982f9f058' AND form_notes IS NULL; -- Standing Hamstring Stretch

UPDATE exercises SET form_notes =
  'Sit with one or both legs extended in front. Hinge at the hips and reach toward your feet with a long spine — do not round the back aggressively. Hold 30–60 seconds. Breathe into the hamstrings. On each exhale, try to reach slightly further forward.'
WHERE id = 'a6dde5d3-f633-4ee9-8dde-45b9e6944fe4' AND form_notes IS NULL; -- Seated Hamstring Stretch

UPDATE exercises SET form_notes =
  'Sit with both legs extended, feet flexed. Hinge forward from the hips reaching both hands toward the feet. Keep the spine long — this is a hip hinge, not a spinal flexion. Hold 30–60 seconds. Breathe deeply and allow the hamstrings to progressively relax.'
WHERE id = '86826a31-7033-400b-818f-ab9e1282fa4a' AND form_notes IS NULL; -- Seated Forward Fold

UPDATE exercises SET form_notes =
  'Stand and cross one foot over the opposite ankle. Lean into a wall or pole, bending the outside knee. You will feel a stretch along the IT band and outer thigh of the crossed leg. Hold 30 seconds. Shift the pelvis slightly away from the wall to deepen. Switch sides.'
WHERE id = 'b8700034-51a3-4f2a-999f-cb6354d9cc24' AND form_notes IS NULL; -- IT Band Stretch

UPDATE exercises SET form_notes =
  'Kneel facing a couch or bench. Place one foot up on the bench behind you (similar to a rear-elevated lunge). Sit the hips down and forward until you feel a deep stretch in the front of the rear thigh (rectus femoris) and hip flexor. Hold 60–90 seconds per side.'
WHERE id = 'd7cefd33-1222-4277-9414-0b3db7b1d1e8' AND form_notes IS NULL; -- Couch Stretch

UPDATE exercises SET form_notes =
  'Stand facing a wall. Place the ball of one foot against the base of the wall with the heel on the floor. Lean into the wall with a straight knee to stretch the calf (gastrocnemius). Bend the knee slightly to stretch the soleus. Hold 30 seconds each variation per side.'
WHERE id = 'c12a4afd-ef45-4255-b087-cc232e0b2179' AND form_notes IS NULL; -- Standing Calf Stretch

UPDATE exercises SET form_notes =
  'Step forward into a deep lunge. Place the hand on the same side as the front foot on the floor. Rotate the thoracic spine, reaching the top arm toward the ceiling. Hold 5 seconds. Return and step forward with the other foot. Combines hip flexor stretch, thoracic rotation, and hamstring mobility in one efficient movement.'
WHERE id = '7d381adb-2d3f-44e6-b08a-07f28cd5e23d' AND form_notes IS NULL; -- World's Greatest Stretch

UPDATE exercises SET form_notes =
  'Extend one arm forward, palm up. With the other hand, gently bend the wrist back (extend) until you feel a stretch on the inside of the forearm. Hold 20–30 seconds. Switch and flex the wrist to stretch the extensors. Perform 2–3 times each direction per arm. Essential for desk workers and climbers.'
WHERE id = 'b3bfa485-1df8-4bb9-a439-43e35e80c610' AND form_notes IS NULL; -- Wrist Flexor Stretch

UPDATE exercises SET form_notes =
  'Extend one arm in front with palm facing down. With the other hand, gently press the hand down (flex the wrist) until you feel a stretch on top of the forearm and wrist extensors. Hold 20–30 seconds. Switch sides. Relieves tennis elbow and forearm extensor tension.'
WHERE id = '6844a583-4c6e-491c-99ad-c602803fbfd0' AND form_notes IS NULL; -- Wrist Extensor Stretch

UPDATE exercises SET form_notes =
  'Place palms together in front of the chest (prayer position). Press hands together gently, then lower the hands toward the waist while keeping palms touching. You will feel a stretch in the wrist flexors. Hold 20–30 seconds. Then reverse (reverse prayer) for the extensors.'
WHERE id = '92c01251-6aaf-4332-9624-163ea241a28a' AND form_notes IS NULL; -- Prayer Stretch

UPDATE exercises SET form_notes =
  'Place the backs of the hands together in front of the chest, fingers pointing down. Press gently together and raise the hands. You will feel a stretch in the wrist extensors and forearm. Hold 20–30 seconds. Pair with Prayer Stretch for a complete wrist mobility routine.'
WHERE id = '259ef0ba-2328-4135-b4e9-2fda23c4e289' AND form_notes IS NULL; -- Reverse Prayer Stretch

UPDATE exercises SET form_notes =
  'Start with fingers straight and extended. Curl fingertips to touch the top of the palm (hook fist), then curl into a full fist, then open fully again. Perform each position slowly and with control. Repeat 10 times. Maintains finger tendon mobility and reduces risk of tendon adhesions.'
WHERE id = '23e811f4-b56b-43e5-852e-64d53d770515' AND form_notes IS NULL; -- Finger Extension Stretch

UPDATE exercises SET form_notes =
  'Extend one thumb outward. Use the opposite hand to gently press the thumb into extension (away from the palm), then into flexion (toward the palm). Hold each 10–15 seconds. Helps maintain CMC joint mobility and reduce de Quervain''s tendinopathy risk. Especially important for those with high grip volume.'
WHERE id = '2401c894-2638-4f25-a37d-b8fcf466e74c' AND form_notes IS NULL; -- Thumb Stretch

UPDATE exercises SET form_notes =
  'Rotate each wrist slowly in full circles — 10 rotations clockwise, 10 counter-clockwise. Move through the complete range of motion at the wrist joint. Warms up the wrist flexors, extensors, and radioulnar joint. Always perform before barbell work, gymnastics, and racquet sports.'
WHERE id = '3855a501-0355-4ef9-b924-ac3cc7a37ba6' AND form_notes IS NULL; -- Wrist Circles

UPDATE exercises SET form_notes =
  'Open your hand fully, then make a hook fist (bend only the first two joints), then a straight fist (all knuckles bent), then a full fist. Return to open. Each tendon glide position isolates different flexor tendons. Perform 10 repetitions of the full sequence. Critical for post-hand surgery rehab and preventing tendon adhesions.'
WHERE id = 'ff1e84ad-9f6c-45b4-8abe-6165ea95190a' AND form_notes IS NULL; -- Tendon Glide

UPDATE exercises SET form_notes =
  'Sit on a chair and place the ball of one foot on a rounded surface or roll it on a tennis ball. Apply moderate downward pressure and roll from heel to toe along the plantar fascia. Hold on tender spots for 30 seconds. Repeat 2–3 minutes per foot. Best performed first thing in the morning before weight bearing.'
WHERE id = 'dce0b1fe-11a4-4281-8e6c-951e058c27a1' AND form_notes IS NULL; -- Plantar Fascia Stretch

UPDATE exercises SET form_notes =
  'Stand on a step with the heel hanging off the edge. Drop the heel below the step level to stretch the Achilles tendon and calf complex. Hold 20–30 seconds. Keep the knee slightly bent to target the soleus. Alternatively perform a standing calf stretch with the toes elevated.'
WHERE id = '24a9ba79-26de-4908-9cb9-44a698faca46' AND form_notes IS NULL; -- Achilles Tendon Stretch

UPDATE exercises SET form_notes =
  'Sit and gently curl your toes downward — feel the stretch on the top of the toes (toe extensors). Hold 10–15 seconds. Then extend your toes back to stretch the toe flexors. Repeat 10 times. Improves mobility of the MTP joints. Useful for those with plantar fasciitis or turf toe.'
WHERE id = '91408e7e-fb4a-4e56-a3b0-5d81bb3c48d8' AND form_notes IS NULL; -- Toe Flexor Stretch

UPDATE exercises SET form_notes =
  'Sit or stand. Actively splay all toes as wide apart as possible and hold for 3–5 seconds. Release. Repeat 10 times. Improves toe abductor strength and mobility. Reverses toe compression from shoes. Important for foot health, balance, and running economy.'
WHERE id = 'ce8e07a5-b7ff-4e5d-9c4c-228cc2f67051' AND form_notes IS NULL; -- Toe Spread Stretch

UPDATE exercises SET form_notes =
  'Place your hands against a wall. Step one foot back, keeping the heel on the floor. Lean the body forward at the ankle — feel the stretch in the anterior ankle and shin. Hold 20–30 seconds per side. Improves ankle dorsiflexion range, which is critical for deep squatting and running mechanics.'
WHERE id = '193001a3-eebe-4761-9861-0fc3b316aee7' AND form_notes IS NULL; -- Ankle Dorsiflexion Stretch

UPDATE exercises SET form_notes =
  'Sit on a chair. Cross one ankle over the opposite knee. Apply gentle downward pressure on the crossed ankle to stretch the calf and achilles of that leg. Hold 20–30 seconds. Flex the foot up and down gently to mobilise the ankle joint. Switch sides.'
WHERE id = '23bbc036-3eb2-496a-9a7a-18fa3517393f' AND form_notes IS NULL; -- Seated Calf & Ankle Stretch

-- Stretch: back category

UPDATE exercises SET form_notes =
  'Sit or stand. Place one hand over the opposite shoulder. Tilt your head gently away from that shoulder until you feel a stretch along the neck and upper trapezius above the hand. Hold 20–30 seconds. Helps relieve levator scapulae tension from prolonged sitting and screen use.'
WHERE id = '4c63c00f-12ca-4d06-8660-08c65a51c7d6' AND form_notes IS NULL; -- Levator Scapulae Stretch

UPDATE exercises SET form_notes =
  'Stand in a doorway with one forearm on the door frame. Step forward through the doorway until you feel a stretch across the chest and anterior shoulder. Vary the height of the arm to target upper, mid, and lower pec fibres. Hold 20–30 seconds per side.'
WHERE id = '64a364d9-efcf-4f13-adc7-28d129afb28c' AND form_notes IS NULL; -- Doorway Chest Stretch

UPDATE exercises SET form_notes =
  'Clasp your hands behind your back. Gently lift the arms and squeeze the shoulder blades together. Hold 20–30 seconds. Alternatively use a strap or towel. Opens the anterior chest and reverses the forward shoulder posture developed from prolonged sitting and pressing work.'
WHERE id = '3600076a-d91b-4653-aec8-9dbe1a4c38a4' AND form_notes IS NULL; -- Chest Opener Stretch

UPDATE exercises SET form_notes =
  'Find a door frame or pole. Place one hand on it with the arm extended. Step or lean away from the attachment point to stretch the lateral lat. Hold 20–30 seconds. To deepen, sit your hips back and down. Targets the lat insertion near the armpit. Great for those with shoulder impingement.'
WHERE id = '178dd043-84e0-4f32-84a4-6203c0d6c414' AND form_notes IS NULL; -- Lat Doorway Stretch

UPDATE exercises SET form_notes =
  'Lie face down with hands under your shoulders. Press gently through the arms to lift the chest while keeping hips on the floor. Hold 2–3 seconds. Return. Not a full lock-out — think of it as lumbar extension from a prone position. Excellent for disc rehab (McKenzie protocol) when directional preference is extension.'
WHERE id = '2fec7a78-a8f1-421a-92c1-02a682ea2e71' AND form_notes IS NULL; -- Prone Cobra

UPDATE exercises SET form_notes =
  'Lie on your back with arms extended to the sides in a T-shape. Bend both knees and let them fall to one side while your gaze goes the opposite direction. Hold 20–30 seconds — feel a stretch through the thoracic spine and obliques. Return to centre and switch sides. Keep shoulders flat on the floor.'
WHERE id = 'dad51a7c-f1ec-4e11-867f-493c67fe45fe' AND form_notes IS NULL; -- Supine Twist

UPDATE exercises SET form_notes =
  'Lie face down with arms alongside the body. Lift the arms, head, and chest gently off the floor by engaging the upper back muscles — not by pushing through the arms. Hold 2–5 seconds. Lower. Strengthens the thoracic extensors and posterior chain. Excellent for posture and lower back rehab.'
WHERE id = '6cf2b6b8-622c-4231-8d5a-442776194098' AND form_notes IS NULL; -- Thoracic Spine Rotation (note: Prone Cobra is different from thoracic rotation)

-- Fix above — Thoracic Spine Rotation should have rotation notes:
UPDATE exercises SET form_notes =
  'Start on hands and knees. Place one hand behind your head. Rotate the thoracic spine, bringing that elbow down toward the opposite wrist, then open and reach toward the ceiling. Follow the moving elbow with your gaze. Repeat 8–10 times per side. Targets mid-thoracic rotation mobility.'
WHERE id = '6cf2b6b8-622c-4231-8d5a-442776194098'; -- Thoracic Spine Rotation (override incorrect note above)

UPDATE exercises SET form_notes =
  'Start on hands and knees. Thread one arm under the body, reaching as far to the opposite side as possible — shoulder and ear drop to the floor. The other arm stays extended for support. Hold 20–30 seconds. Targets thoracic rotation and posterior shoulder mobility.'
WHERE id = '941e9820-69b0-42e3-86ee-ea96c79513ff' AND form_notes IS NULL; -- Thread the Needle

UPDATE exercises SET form_notes =
  'Apply moderate pressure with a foam roller or lacrosse ball under the rhomboid region (between spine and shoulder blade). Make slow passes or hold on tender areas for 20–30 seconds. Softens rhomboid tightness and fascial restrictions. Pair with scapular mobility work.'
WHERE id = 'c66be6d6-9aea-49b8-b4ba-c4e11ae4f86d' AND form_notes IS NULL; -- Rhomboids-SMR

UPDATE exercises SET form_notes =
  'Kneel on the floor with toes tucked. Sit hips back toward heels (or as far as comfortable). Reach arms forward on the floor as far as possible. Hold 30–60 seconds. Breathe into the lower back and lat area. An excellent decompression stretch for the lumbar spine, lats, and thoracic extensors.'
WHERE id = 'd8078b91-d499-439e-b418-fd7eab7efa1d' AND form_notes IS NULL; -- Pec Minor Stretch

-- Fix: Pec Minor Stretch should target the pec minor
UPDATE exercises SET form_notes =
  'Find a corner or door frame. Raise the arm to 90° and press the forearm against the frame. Step forward with the same-side foot and rotate away until you feel a stretch beneath the clavicle and upper chest (pectoralis minor). Hold 20–30 seconds per side. Relieves forward shoulder posture.'
WHERE id = 'd8078b91-d499-439e-b418-fd7eab7efa1d'; -- Pec Minor Stretch (override)

-- ─── help_url fixes (UUID-based) ─────────────────────────────────

UPDATE exercises SET help_url = 'https://youtu.be/G8l_8chR5BE' WHERE id = '0a51bc2e-6b1e-4931-a080-2c5fb572aa31' AND help_url IS NULL; -- Bent Over Barbell Row
UPDATE exercises SET help_url = 'https://youtu.be/zC3nLlEvin4' WHERE id = '02e7f245-0725-4261-97f4-0179712feccb' AND help_url IS NULL; -- Alternate Incline Dumbbell Curl
UPDATE exercises SET help_url = 'https://youtu.be/kiuVA0gs3EI' WHERE id = 'dcc2bc2c-8436-4029-be41-f16d955ace31' AND help_url IS NULL; -- triceps rope extensions
UPDATE exercises SET help_url = 'https://youtu.be/nEQQle9-0NA' WHERE id = '466b9aa8-8659-4964-9a53-43404ada9965' AND help_url IS NULL; -- squat dumbbell
UPDATE exercises SET help_url = 'https://youtu.be/pSHjTRCQxIw' WHERE id = '85dfe48f-985c-4d70-a2d3-d4afb5f7a95f' AND help_url IS NULL; -- wood chopper
UPDATE exercises SET help_url = 'https://youtu.be/UCXxvVItLoM' WHERE id = '38d791b3-ce58-42e0-a1fb-445e0f5bd0f3' AND help_url IS NULL; -- isolated seated row
UPDATE exercises SET help_url = 'https://youtu.be/WDV2_aGSHkE' WHERE id = 'dd429076-07dc-48c4-8661-2971840c4090' AND help_url IS NULL; -- Hamstring curl
UPDATE exercises SET help_url = 'https://youtu.be/YyvSfVjQeL0' WHERE id = '71df72e3-8ced-4795-a005-b7a7671b04d8' AND help_url IS NULL; -- leg extension
UPDATE exercises SET help_url = 'https://youtu.be/YnFbF8MJ5aU' WHERE id = '73392c4a-fd48-440b-94dd-22e66616b11f' AND help_url IS NULL; -- knee raises
UPDATE exercises SET help_url = 'https://youtu.be/lueEJGjTuPQ' WHERE id = 'a95c5e14-e5dc-4d9d-9670-646dd14d8c00' AND help_url IS NULL; -- pullover
UPDATE exercises SET help_url = 'https://youtu.be/lueEJGjTuPQ' WHERE id = 'e54ceba1-10c3-45a1-871f-e432d8fd1467' AND help_url IS NULL; -- cable pullover
UPDATE exercises SET help_url = 'https://youtu.be/lueEJGjTuPQ' WHERE id = 'd8f7ec36-03ff-411d-a9b4-ed64773a3845' AND help_url IS NULL; -- Cable Pullover
UPDATE exercises SET help_url = 'https://youtu.be/3VcKaXpzqRo' WHERE id = '742ee1d0-6919-4fa3-9abe-a610b1e38ce8' AND help_url IS NULL; -- Rear Delt Dly
UPDATE exercises SET help_url = 'https://youtu.be/e4FmGI2YRPU' WHERE id = '565ee894-de36-4714-b32b-e3de67484552' AND help_url IS NULL; -- Incline bench row narrow
UPDATE exercises SET help_url = 'https://youtu.be/8RT0o_KoFuQ' WHERE id = '8d669b2a-4e11-42c8-9603-1eb66fbaca6a' AND help_url IS NULL; -- Smith Incline Press
UPDATE exercises SET help_url = 'https://youtu.be/BYKScL2sgCs' WHERE id = '0c96823a-ec35-42f0-86be-baa13b2fb2fc' AND help_url IS NULL; -- Smith Flat Bench Press
UPDATE exercises SET help_url = 'https://youtu.be/BYKScL2sgCs' WHERE id = '32737aab-5a3d-454a-8cd4-5900559d8cd7' AND help_url IS NULL; -- Smith Machine Decline Press
UPDATE exercises SET help_url = 'https://youtu.be/BYKScL2sgCs' WHERE id = '2acc0a31-fc0a-4c2b-ba5d-8a7d7f0213f3' AND help_url IS NULL; -- decline press
UPDATE exercises SET help_url = 'https://youtu.be/BYKScL2sgCs' WHERE id = '2be4ff68-fb19-42cc-afbf-beee30488728' AND help_url IS NULL; -- flat bench
UPDATE exercises SET help_url = 'https://youtu.be/BYKScL2sgCs' WHERE id = '607f9637-4ba5-48cc-8034-736b22b5d04e' AND help_url IS NULL; -- flat bench press
UPDATE exercises SET help_url = 'https://youtu.be/9efgcAjQe7E' WHERE id = '45d918fa-d696-48ae-9554-89761ec98837' AND help_url IS NULL; -- decline DB press
UPDATE exercises SET help_url = 'https://youtu.be/1cbySJm5yCU' WHERE id = 'ca50548c-d937-4474-991b-cf8afa17ebba' AND help_url IS NULL; -- Barbell Ab Rollout
UPDATE exercises SET help_url = 'https://youtu.be/eIq5CB9JfKE' WHERE id = '96d2129b-2b8b-4284-b565-146fef29e5a3' AND help_url IS NULL; -- high row
UPDATE exercises SET help_url = 'https://youtu.be/yinTtBxWCrE' WHERE id = '29a3c98a-7878-454c-95ff-5e8f0af75eca' AND help_url IS NULL; -- Standing Single-Arm Press
UPDATE exercises SET help_url = 'https://youtu.be/FNbdgXSe7kk' WHERE id = '31b86a08-c898-4703-9da4-aa980254d32c' AND help_url IS NULL; -- Dumbbell Squat and Press
UPDATE exercises SET help_url = 'https://youtu.be/UCXxvVItLoM' WHERE id = '363cc770-2a65-40f8-a2d2-b652e96564bb' AND help_url IS NULL; -- seated high row
UPDATE exercises SET help_url = 'https://youtu.be/pSHjTRCQxIw' WHERE id = '25395c37-9145-4a61-89de-271ae067a7e5' AND help_url IS NULL; -- Standing Cable Wood Chop
