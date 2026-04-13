-- ================================================================
-- Migration 029: Exercise data enrichment + alternatives table
-- Run in Supabase SQL editor AFTER schema.sql
-- ================================================================

-- ─── 1. exercise_alternatives table ──────────────────────────────

CREATE TABLE IF NOT EXISTS exercise_alternatives (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id  UUID        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  alternative_id UUID      NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (exercise_id, alternative_id),
  CHECK (exercise_id <> alternative_id)
);

ALTER TABLE exercise_alternatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read exercise alternatives"
  ON exercise_alternatives FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Trainers can manage exercise alternatives"
  ON exercise_alternatives FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid())
  );

-- ─── 2. Equipment updates ─────────────────────────────────────────

UPDATE exercises SET equipment = 'Barbell' WHERE name IN (
  'Bench Press', 'Incline Bench Press', 'Barbell Row', 'Deadlift',
  'Overhead Press', 'Squat', 'Romanian Deadlift', 'Barbell Squat',
  'Back Squat', 'Front Squat', 'Barbell Curl', 'Skull Crusher',
  'Bent-Over Row', 'RDL'
) AND equipment IS NULL;

UPDATE exercises SET equipment = 'Dumbbell' WHERE name IN (
  'DB Bench Press', 'DB Incline Press', 'Hammer Curl',
  'Dumbbell Shoulder Press', 'Dumbbell Chest Press', 'RDL (Dumbbells)',
  'DB Split Squat', 'DB Step-ups', 'DB Goblet Squat', 'DB Renegade Row',
  'Dumbbell Overhead Press', 'Incline Dumbbell Press', 'Dumbbell Floor Press',
  'Standing Dumbbell Rows', 'Dumbbell Curl to Overhead Press',
  'Single-Arm Dumbbell Row', 'Lateral Raise', 'Bicep Curls',
  'Goblet Squat', 'DB Goblet Squat', 'Goblet Squat Neutral Pelvis',
  'Bicep Curls Light', 'Deadbug (Weighted)', 'Squat Press (DB/Bar)',
  'Farmers Carry', 'Farmers Carry Tall Spine', 'Farmer''s Walk',
  'Suitcase Carry (L/R)', 'Plank (Weighted)', 'Weighted Sit-up',
  'Chest-Supported Row'
) AND equipment IS NULL;

UPDATE exercises SET equipment = 'Cable' WHERE name IN (
  'Cable Fly', 'Seated Cable Row', 'Lat Pulldown', 'Cable Crunch',
  'Pallof Press', 'Cable Woodchops', 'Cable Face Pulls', 'Cable Lateral Raise',
  'Cable/Band Lateral Raise', 'Cable Torso Rotations', 'Cable Squat Row',
  'Cable Pullover', 'Tricep Pushdown', 'Tricep Rope Pushdown',
  'Weighted Cable Crunch', 'Cable Row', 'Static Squat Cable Torso Rotations',
  'Seated Cable Row High Elbows', 'Single-Arm Lat Pulldown',
  'Face Pull', 'Face Pulls', 'Pull up/Lat Pulldown',
  'Isometric External Rotation', 'Isometric Internal Rotation',
  'Standing External Rotation', 'Standing Internal Rotation',
  'Standing Row', 'Seated Row', 'Seated Row Band or Cable',
  'Seated Resistance Band Rows', 'Seated Rows Neutral Grip'
) AND equipment IS NULL;

UPDATE exercises SET equipment = 'Machine' WHERE name IN (
  'Leg Press', 'Leg Curl', 'Leg Extension', 'Machine Chest Press',
  'Machine Shoulder Press', 'Hamstring Curls Machine', 'Leg Extensions Machine',
  'Seated Leg Curls', 'Seated Leg Extensions', 'Seated Chest Fly Machine',
  'Rowing Machine', 'Stationary Bike', 'Stationary Cycling',
  'Leg Press + Leg Machines', 'Elliptical Trainer', 'Hamstring Curl',
  'Seated Knee Extensions'
) AND equipment IS NULL;

UPDATE exercises SET equipment = 'Bodyweight' WHERE name IN (
  'Push-Up', 'Pull-Up', 'Plank', 'Crunch', 'Lunges', 'Air Squat',
  'Dips', 'Chin-up Negatives', 'Scapular Pull-up', 'Scapular Push-ups',
  'BW Back Extensions', 'Inchworm Push-Up', 'Bear Crawl',
  'Bicycle Crunches', 'Russian Twists', 'V-Ups', 'Flutter Kicks',
  'Reverse Crunch', 'Hanging Leg Raises', 'Mountain Climbers',
  'Burpees', 'Box Jump', 'Jump Squats', 'Skater Jumps',
  'High Knees (s)', 'Butt Kicks (s)', 'Jumping Jacks (s)',
  'Side Planks', 'Plank Taps', 'Plank-to-Pushup', 'Plank Jacks',
  'Plank (Variations)', 'Plank with Knee-to-Elbow', 'Plank with Row',
  'Plank Shoulder Taps', 'Plank In and Outs', 'Side Plank Dips',
  'T-Pushups', 'Spiderman Push-ups', 'Diamond + Wide Pushups',
  'Tempo Push-ups', 'Incline Push-up', 'Incline Push-ups', 'Push-up (Weighted)',
  'Glute Bridge', 'Glute Bridge Hold', 'Glute Bridge (Pulsing)',
  'Single-Leg Bridge', 'Glute Bridge with Band', 'Glute Bridges',
  'Wall Sit', 'Wall Sits (Weighted)', 'Wall Sits Partial Depth',
  'Box Squat', 'Reverse Lunge', 'Reverse Lunges', 'Walking Lunges',
  'Lateral Lunge', 'Goblet Lateral Lunge', 'Single-Leg Step-Up',
  'Step-ups/Weighted', 'Box Step-ups', 'Step-ups', 'DB Step-ups',
  'Dead Bug', 'Deadbugs', 'Wall Dead Bug', 'Dead Bug Arms Overhead',
  'Modified Dead Bug', 'Bird Dog', 'Bird-Dog', 'Bird-Dog Leg Extension Focus',
  'Bird-Dog Modified', 'Modified Bird-Dog',
  'Calf Raise', 'Standing Calf Raises', 'Single-Leg Hops', 'Lateral Bounds',
  'Bulgarian Split Squat', 'Bodyweight Squats', 'Bodyweight Quarter Squat',
  'Double-Leg Quarter Squats', 'Chair Squats', 'Squat to Box',
  'Pike Push-ups', 'Box Dips (Assist)', 'Towel Curls', 'Wall Push-ups',
  'Mountain Climber Burpee', 'Squat Thrusts', 'In-Out Jumping Jacks',
  'Speed Skaters', 'Ice Skater Steps', 'Side-to-Side Step Touches',
  'Center Decline', 'Single Leg Decline', 'Knee/Leg Raises',
  'Knee to Elbows', 'Toe Taps', 'Windshields/Alternate Knee Raises',
  'V-Ups/Knee Raises', 'Hanging Knee Raise', 'Hanging Leg Raise',
  'L-Sit Hold', 'Toes to Bar', 'Dragon Flag', 'Copenhagen Plank',
  'Side Plank with Hip Dip', 'Side Plank', 'Side Plank Weak Side',
  'McGill Curl-Up', 'Forearm Plank', 'Plank Modified',
  'Plank with Knee Taps', 'Lunge with Twist',
  'Hip Thrust', 'Clamshells', 'Side-Lying Hip Abduction',
  'Hip Abduction Standing', 'Standing Side Leg Lifts', 'Side-Lying Leg Lifts',
  'Single-Leg Balance', 'Single-Leg Balance Wall Support',
  'Single-Leg Balance Eyes Open', 'Single-Leg Balance Eyes Closed',
  'Tandem Stance', 'Tandem Walk', 'Slow Lateral Weight Shifts',
  'Sit-to-Stand Chair', 'Sit-to-Stand Controlled',
  'Straight Leg Raises', 'Quad Sets', 'Hamstring Sets', 'Static Quad Sets',
  'Heel Slides', 'Ankle Pumps', 'Pelvic Tilts',
  'Chin Tucks', 'Scapular Setting', 'Scapular Squeezes',
  'Prone Y Raise', 'Prone Y-T-W Raises', 'Prone Horizontal Abduction',
  'Full-Can Scaption Thumb-Up', 'Bent-Over Horizontal Abduction',
  'Wall Slides', 'Single-Leg RDL Bodyweight',
  'Jump Rope', 'Rope Ladder Broad Jumps', 'Shuttle Runs (yd)',
  'Mountain Climbers + Air Squats', 'In-Out Jumping Jacks',
  'Cobra Stretch', 'Child''s Pose', 'Cat-Cow Stretch', 'Downward Dog',
  'Pigeon Pose', 'Hip Circles', 'Plank In and Outs',
  'Landmine Rotation', 'Landmine',
  'Dead Hang', 'Towel Grip Row',
  'Ab Wheel Rollout',
  'Marching in Place High Knees',
  'Step-ups Low Step', 'Step-ups 4-inch box',
  'Weighted Step-ups', 'Box Jump',
  'Wrist Curls', 'Wrist Extensions', 'Reverse Wrist Curls',
  'Grip Squeezes', 'Pinch Grip Hold', 'Finger Curls',
  'Forearm Pronation & Supination',
  'Ankle Alphabet', 'Towel Toe Scrunches', 'Marble Pickup',
  'Short Foot Exercise', 'Toe Raises', 'Single Leg Heel Raise',
  'Foot Doming', 'Ankle Stability Balance',
  'Single-Leg Heel Raises',
  'Opposite Arm Leg Reach Seated',
  'Seated Medicine Ball Twists',
  'Step-ups Slow and Controlled',
  'Warm-Up Walking', 'Walking', 'Treadmill Walking',
  'Incline Treadmill Walk', 'Treadmill Run',
  'Cool-Down Walk', 'Cool-Down Walking', 'Steady-State Walking',
  'Interval Walking', 'Gentle Walking',
  'Shadow Boxing'
) AND equipment IS NULL;

UPDATE exercises SET equipment = 'Kettlebell' WHERE name IN (
  'KB Deadlift', 'Pilates Squat + Squat'
) AND equipment IS NULL;

UPDATE exercises SET equipment = 'Band' WHERE name IN (
  'Resistance Band Rows', 'Resistance Band Bicep Curls',
  'Resistance Band Chest Press', 'Resistance Band Shoulder Press',
  'Resistance Band Pull-aparts', 'Resistance Band Chest Fly',
  'Resistance Band Knee Extension', 'Resistance Band Work',
  'Resistance Band Ankle Inversion', 'Resistance Band Ankle Eversion',
  'Terminal Knee Extension Band', 'Hamstring Curls Band or Prone',
  'Resistance Band Lat Pulldown', 'Straight Leg Raises with Resistance'
) AND equipment IS NULL;

UPDATE exercises SET equipment = 'Other' WHERE name IN (
  'Med Ball Slams', 'Chest Pass (Med Ball)', 'Wall Balls',
  'Medicine Ball Slams', 'Medicine Ball Chest Pass Light',
  'Medicine Ball Rotational Toss', 'Ball Squat Toss', 'Med Ball Overhead Hold',
  'Battle Ropes', 'Rice Bucket Training',
  'Cycling', 'Interval Cycling', 'Gentle Stationary Cycling',
  'Burpee DB Press', 'Floor Press + Mod Push-up',
  'Dips/Band Flyes', 'Wobble Board Balance', 'Seated Gym Ball Balance'
) AND equipment IS NULL;

-- ─── 3. form_notes updates ────────────────────────────────────────

UPDATE exercises SET form_notes =
  '1. Grip barbell slightly wider than shoulder width; feet flat, shoulder width apart
2. Unrack bar and position over lower chest/nipple line; retract and depress scapulae
3. Take a deep breath and brace your core (Valsalva)
4. Lower bar under control to touch chest — do not bounce
5. Press bar up and slightly back toward the rack in an arc
6. Lock out elbows at the top; exhale
Cues: "Chest up, shoulders back," "drive your feet through the floor," "push yourself away from the bar"'
WHERE name = 'Bench Press' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Set bar at upper chest height; grip just outside shoulders; tuck elbows ~45°
2. Unrack and step back; feet shoulder-width, toes out slightly
3. Take a big breath, brace hard — maintain lumbar arch throughout
4. Break at the hips and knees simultaneously; track knees over toes
5. Descend until hip crease is below the knee (parallel or deeper)
6. Drive through the full foot; squeeze glutes at lockout
Cues: "Spread the floor," "chest up," "knees out," "sit back and down"'
WHERE name IN ('Squat', 'Back Squat', 'Barbell Squat') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Bar over mid-foot; hip-width stance; hinge down and grip just outside shins (double overhand or mixed)
2. Pull slack out of bar; big breath + brace hard; bar stays in contact with legs
3. Push the floor away — do not pull the bar up. Hips and shoulders rise at the same rate
4. Lock hips and knees simultaneously at the top; squeeze glutes
5. Hinge and push hips back to lower under control
Cues: "Chest tall," "protect your armpits," "push the floor away," "bar stays dragging up the legs"'
WHERE name = 'Deadlift' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Hang from bar with overhand grip, hands just outside shoulders
2. Depress and retract scapulae before initiating the pull ("put your shoulder blades in your back pockets")
3. Pull elbows down and back; drive chest toward bar
4. Chin clears the bar at the top — full range of motion
5. Lower under control until arms are fully extended
Cues: "Elbows to hips," "squeeze lats," "pretend you are bending the bar"'
WHERE name = 'Pull-Up' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Grip bar slightly wider than shoulder width; overhand or underhand
2. Hinge at hips until torso is roughly 45–70° from vertical; keep back flat
3. Pull bar to lower sternum/upper abdomen — not toward your chin
4. Lead with your elbows; retract and depress scapulae at the top
5. Lower under full control; maintain the hip hinge throughout
Cues: "Row to your belly button," "elbows past your ribs," "don''t let your chest drop"'
WHERE name IN ('Barbell Row', 'Bent-Over Row') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Stand with bar at shoulder height in a rack; grip just outside shoulders; thumbs around the bar
2. Dip knees slightly and press bar overhead in one explosive motion (push press) OR press strict
3. Drive bar straight up; as bar passes your face, push your head through to keep the bar over mid-foot
4. Lock elbows at the top; biceps beside or slightly behind ears
5. Lower under control back to starting position on the shoulders
Cues: "Stand tall," "bar over mid-foot," "shrug at the top," "lock out hard"'
WHERE name = 'Overhead Press' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. High bar: bar rests on upper trap shelf; grip just outside shoulders
2. Grip the pulldown bar wider than shoulders; slight lean back (10–15°)
3. Initiate with scapular depression; pull bar to upper chest
4. Lead with elbows; squeeze lats at the bottom
5. Return under control — resist the weight on the way up
Cues: "Pull elbows to hips," "chest up to meet the bar," "don''t shrug at the top"'
WHERE name = 'Lat Pulldown' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Set pulley at chest height; grip D-handles or rope; step back with a staggered stance
2. Pull handles to face level; elbows above wrist height (elbows up)
3. At the end position rotate hands outward (external rotation) and squeeze rear delts
4. Hold 1 second; slowly return to start
Cues: "Elbows up, wrists back," "think of pulling your elbows to your ears," "don''t lean back excessively"'
WHERE name IN ('Face Pull', 'Cable Face Pulls', 'Face Pulls') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Stand with dumbbells at sides; slight bend in elbows (soft lock — do not fully straighten)
2. Raise arms to sides in the scapular plane (~30° forward of true lateral)
3. Stop when arms are parallel to the floor — do not shrug or hike shoulders
4. Lower under full control (3 seconds)
Cues: "Pinky finger slightly higher than thumb," "pour the jug," "no shrugging"'
WHERE name IN ('Lateral Raise', 'Cable Lateral Raise') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Stand hip-width; dumbbell in one hand neutral grip
2. Hinge at hips until torso is parallel to the floor; non-working arm braced on bench or thigh
3. Pull dumbbell to hip — lead with elbow, not with the hand
4. Full extension at the bottom; full retraction at the top
5. Do not rotate the torso — keep hips square
Cues: "Elbow to the ceiling," "row to your hip pocket," "control the descent"'
WHERE name = 'Single-Arm Dumbbell Row' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Hold dumbbell at chest height (goblet position); feet slightly wider than shoulder-width, toes out
2. Big breath + brace; sit back AND down simultaneously
3. Drive knees out over toes throughout; chest stays tall
4. Descend as deep as comfortable with a neutral spine
5. Drive through heels and squeeze glutes at the top
Cues: "Elbows between knees," "chest proud," "push the floor away"'
WHERE name IN ('Goblet Squat', 'DB Goblet Squat', 'Goblet Squat Neutral Pelvis') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Dumbbell in front rack (clean position) OR bar across upper back
2. Rear foot elevated on bench; drop straight down keeping torso upright
3. Front shin stays vertical or near vertical; drive knee over toes
4. Lower until rear knee nearly touches floor
5. Drive through the front heel to return; squeeze glute at top
Cues: "Think of a vertical shin on the front leg," "drop, don''t lean," "control the descent"'
WHERE name IN ('Bulgarian Split Squat', 'DB Split Squat') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Bar across hips; upper back on bench; feet flat, hip-width
2. Brace core; drive hips up by squeezing glutes hard
3. At the top: hips fully extended, shins vertical, body forms a straight line from shoulders to knees
4. Do not hyperextend the lumbar — posterior pelvic tilt at the top
5. Lower slowly and reset at the bottom before next rep
Cues: "Squeeze glutes at the top," "tuck your chin," "push through your heels"'
WHERE name = 'Hip Thrust' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Lie flat; feet hip-width on the floor; arms at sides or crossed on chest
2. Brace core; drive through heels to lift hips until body is straight from shoulders to knees
3. Squeeze glutes at the top — do not hyperextend
4. Lower hips slowly back to the floor
Cues: "Squeeze glutes," "don''t arch your lower back," "heels drive the movement"'
WHERE name IN ('Glute Bridge', 'Glute Bridges') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Forearms on floor, elbows under shoulders; feet together or slightly apart
2. Body forms a rigid plank from heels to crown of head — no sag in hips or pike
3. Brace core as if absorbing a punch; breathe normally
4. Squeeze glutes and quads; hold for prescribed duration
Cues: "Tight as a board," "brace your abs," "push the floor away with your elbows"'
WHERE name IN ('Plank', 'Forearm Plank') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Lie on back; knees bent 90°, feet flat; hands behind head or across chest
2. Exhale and curl shoulders toward knees — only the shoulder blades lift; lower back stays flat
3. Do NOT pull the neck; the head follows the torso
4. Squeeze abs at the top; slowly lower under control
Cues: "Rib cage to hips," "chin tucked," "no neck pulling"'
WHERE name = 'Crunch' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Lie on back; knees bent 90° over hips, shins parallel to floor; arms extended toward ceiling
2. On exhale: simultaneously extend one arm overhead and the opposite leg — slowly
3. Lower back must remain pressed flat into the floor throughout
4. Return to start; alternate sides
Cues: "Don''t let your lower back arch," "move slowly and with control," "brace before you move"'
WHERE name IN ('Dead Bug', 'Deadbugs') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Attach EZ-bar or straight bar to low cable; stand back with slight forward lean
2. Keep elbows pinned to sides — they should not drift forward or flare out
3. Curl bar up to shoulder level; squeeze biceps at the top
4. Lower under full control (3 seconds)
Cues: "Elbows glued to your ribs," "do not swing," "control the negative"'
WHERE name = 'Barbell Curl' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Attach rope to high cable; stand 1–2 feet from the stack, slight forward lean
2. Start with elbows at 90° pinned to sides — keep this elbow position throughout
3. Push rope down and slightly out at the bottom; fully extend elbows
4. Return slowly until elbows reach ~90°
Cues: "Elbows stay at your sides," "squeeze triceps at the bottom," "don''t swing back"'
WHERE name IN ('Tricep Pushdown', 'Tricep Rope Pushdown') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Lie on bench; EZ-bar held at arms'' length over forehead, palms up (narrow grip)
2. Hinge ONLY at the elbows — upper arms stay stationary and vertical
3. Lower bar toward forehead or just behind it; feel the stretch in the tricep
4. Extend elbows to full lockout; do not flare elbows excessively
Cues: "Upper arms point at the ceiling — don''t let them drift," "only the forearms move"'
WHERE name = 'Skull Crusher' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Romanian (stiff-leg): begin standing with bar at thighs; push hips back with soft knees
2. Maintain a flat back as you hinge — do NOT round the lumbar
3. Lower bar along the legs until you feel a strong hamstring stretch (typically mid-shin)
4. Drive hips forward to return to standing; squeeze glutes at the top
Cues: "Hinge, don''t squat," "bar stays close to your legs," "feel the hamstrings load"'
WHERE name IN ('Romanian Deadlift', 'RDL', 'RDL (Dumbbells)') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Sit with back against pad; feet hip-width, toes slightly outward; adjust seat so knees are at edge
2. Grip handles; take a breath and brace
3. Press through the full foot — heels, mid-foot, and toes all in contact
4. Extend legs without locking out; squeeze quads at the top
5. Return slowly — do NOT let the weight stack slam
Cues: "Full foot pressure," "control the return," "don''t lock the knees violently"'
WHERE name = 'Leg Press' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Adjust seat so knee joint aligns with the machine''s pivot; ankle pad just above foot
2. Brace core and grip handles
3. Extend knee fully — hold 1 second at the top
4. Lower slowly under full control (3 seconds)
Cues: "Full extension at the top," "slow on the way down," "squeeze quad at the top"'
WHERE name IN ('Leg Extension', 'Leg Extensions Machine', 'Seated Leg Extensions') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Lie face down (prone); adjust ankle pad just above heels
2. Brace core; curl heels toward glutes
3. Keep hips pressed into the pad — do not let them lift off
4. Squeeze hamstrings at the top; lower slowly under control
Cues: "Hips stay down," "full range of motion," "control the negative"'
WHERE name IN ('Leg Curl', 'Hamstring Curl', 'Hamstring Curls', 'Seated Leg Curls', 'Hamstring Curls Machine') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Grip handles at shoulder-width; body forms a straight line from head to heels
2. Take a deep breath and brace core
3. Lower chest to just above the floor — full range of motion
4. Press explosively back up; lock elbows at the top
5. Do not sag the hips or flare elbows excessively (45° is ideal)
Cues: "Body rigid like a plank," "chest to floor," "elbows back not flared"'
WHERE name = 'Push-Up' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Stand tall, dumbbell or barbell at thighs; step one leg forward ~2 feet
2. Lower rear knee directly toward the floor — it should just graze
3. Front shin stays near vertical; torso stays upright
4. Drive through the front heel to return to standing
5. Alternate legs or complete all reps on one side
Cues: "Drop straight down, don''t lean forward," "knee over toes," "drive through the heel"'
WHERE name IN ('Lunges', 'Reverse Lunge', 'Reverse Lunges', 'Walking Lunges') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Attach D-handles to cable set at chest height; stand sideways, inside arm extended
2. Press handle away from the cable to arm''s length — resist rotation the whole time
3. Hold for 1–2 seconds at full extension; do not twist hips or shoulders
4. Return slowly; switch sides
Cues: "Everything from the core out," "resist — don''t let the cable pull you," "feet stay planted"'
WHERE name = 'Pallof Press' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Set cable to mid/low pulley; stand perpendicular; grip with both hands at side
2. Rotate in a diagonal pattern — high to low (wood chop) or low to high (reverse chop)
3. Pivot on the back foot; do not restrict hip rotation
4. Arms stay long; rotation comes from the torso — not just the arms
Cues: "Core powers the rotation," "long arms," "exhale on the chop"'
WHERE name IN ('Cable Woodchops', 'Cable Torso Rotations', 'Landmine Rotation') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Stand holding dumbbell or barbell to working side at hip height
2. Maintain a tall spine — do not lean; let the weight stretch the lateral trunk
3. Walk 10–20 metres per side with controlled steps
4. Breathe normally; resist the lateral pull — do not lean into the weight
Cues: "Tall spine," "resist the side lean," "walk with purpose"'
WHERE name IN ('Suitcase Carry (L/R)', 'Farmers Carry', 'Farmers Carry Tall Spine', 'Farmer''s Walk') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Lie on back; bring opposite arm and leg to hover just off the floor
2. Extend one arm overhead and the opposite leg out simultaneously — slow and controlled
3. Lower back presses flat into the floor the entire time — this is the challenge
4. Return; alternate sides; breathe throughout
Cues: "Lower back FLAT," "slow — do not rush," "opposite arm and leg"'
WHERE name IN ('Bird Dog', 'Bird-Dog', 'Bird-Dog Leg Extension Focus') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Hang from bar with overhand grip, arms fully extended; engage lats and core
2. Raise knees to 90° (knee raise) OR legs completely straight (leg raise) to hip height or higher
3. Do not swing; use a slight hollow body position to initiate
4. Lower under control — do not let legs drop
Cues: "Control the descent," "tuck the pelvis at the top," "avoid momentum"'
WHERE name IN ('Hanging Leg Raises', 'Hanging Leg Raise', 'Hanging Knee Raise') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Lie on back; raise legs 6–12 inches off the floor
2. Alternate rapid up-down flutter kicks keeping legs straight and toes pointed
3. Lower back presses flat — do not arch; hands can be under glutes for support
4. Breathe throughout; maintain tight core
Cues: "Lower back flat," "legs stay long," "quick controlled kicks"'
WHERE name = 'Flutter Kicks' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Seated at cable machine; kneel or sit; rope attached at high pulley
2. Hold rope at the sides of your head; hinge at the hip — do not curl the neck
3. Contract abs to pull elbows toward thighs; round the lower back slightly
4. Squeeze abs hard at the bottom; return under control
Cues: "Hinge from the hips," "not a neck exercise — abs do the work," "squeeze at the bottom"'
WHERE name IN ('Cable Crunch', 'Weighted Cable Crunch') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Lie on back; arms extended overhead; simultaneously raise arms and legs to meet above your hips
2. Form a V-shape at the top — lower back may slightly lift off the floor
3. Lower arms and legs back down under control without touching the floor
4. Core braced throughout; breathe on the descent
Cues: "Meet in the middle," "control the negative," "do not let legs slam down"'
WHERE name IN ('V-Ups', 'V-Ups/Knee Raises') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Supine; knees bent 90°; hands lightly behind head — do NOT pull on the neck
2. Simultaneously rotate right elbow toward left knee; extend right leg straight
3. Alternate sides in a pedalling motion; keep both shoulders off the floor
4. Slow and controlled beats fast sloppy reps every time
Cues: "Shoulder to opposite knee — not elbow," "slow the tempo down," "keep both shoulders off the floor"'
WHERE name = 'Bicycle Crunches' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Supine; knees bent; feet flat; arms beside torso
2. Curl the pelvis off the floor — lift the hips by contracting the lower abs
3. Knees travel toward chest; do not swing the legs; the lower back peels off the floor
4. Lower slowly back to start — do not let the legs drop
Cues: "Hips up, legs follow," "curl the pelvis — do not swing," "slow on the way down"'
WHERE name = 'Reverse Crunch' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Lie on back; knees bent, hold weight plate or dumbbell on chest
2. Perform a full sit-up: curl entire torso to upright position
3. Lower slowly under control — do not slam back down
4. Feet may be anchored; keep chin slightly tucked
Cues: "Full range of motion," "control the descent," "do not yank with the neck"'
WHERE name = 'Weighted Sit-up' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Sit on cable row machine; sit tall with a slight natural lumbar curve
2. Grip handles; row to your lower sternum while keeping elbows close to your body
3. Retract and depress scapulae at the end of the row — squeeze the rhomboids
4. Return slowly; allow shoulder blades to protract at the front — full range
Cues: "Sit tall — no slouching," "retract at the top," "elbows close to the body"'
WHERE name IN ('Seated Cable Row', 'Cable Row', 'Seated Row') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Adjust seat so arms are at a comfortable starting position; grip handles
2. Push handles forward in an arc away from the chest
3. Maintain a slight bend in the elbows; feel the pecs stretch at the end
4. Return slowly; do not let the weight stack slam
Cues: "Feel the stretch at the end," "slow return," "squeeze chest at the full extension"'
WHERE name = 'Seated Chest Fly Machine' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. DB at chin/shoulder level; step same foot forward as the working arm, staggered stance
2. Drive dumbbell straight up overhead; lock out elbow at the top
3. Lower slowly back to shoulder level; keep core braced
4. Alternate sides or complete one side at a time
Cues: "Stand tall — don''t sway," "full lockout," "brace the core"'
WHERE name IN ('Dumbbell Shoulder Press', 'DB Overhead Press', 'Dumbbell Overhead Press') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Lie on incline bench (30–45°); dumbbells at shoulder level, elbows at ~45°
2. Brace core; press dumbbells up and slightly together at the top
3. Lower slowly until elbows are at bench level or just below — full stretch
4. Drive feet into the floor for stability
Cues: "Control the descent," "feel the upper chest stretch," "don''t bounce at the bottom"'
WHERE name IN ('DB Incline Press', 'Incline Dumbbell Press') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Lie flat on bench; dumbbells at chest level, elbows ~45° from torso
2. Press dumbbells straight up; let them travel slightly toward each other at the top
3. Lower slowly; elbows to ~90° at the bottom
4. Keep shoulder blades retracted and depressed throughout
Cues: "Squeeze the chest at the top," "don''t flare the elbows," "control the descent"'
WHERE name IN ('DB Bench Press', 'Dumbbell Chest Press') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Stand with feet shoulder-width; hold the "head" of a dumbbell with both hands at chest
2. Squat down — simultaneously push knees out over toes; keep chest proud and back straight
3. Descend to parallel or below; pause briefly
4. Drive through full foot to stand; squeeze glutes at the top
Cues: "Chest up," "elbows between knees," "full depth"'
WHERE name IN ('Goblet Squat', 'DB Goblet Squat') AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Stand with dumbbells neutral grip; curl arms with thumbs pointing toward ceiling (hammer grip)
2. Keep elbows pinned to sides throughout — no swinging
3. Curl to shoulder height; squeeze at the top
4. Lower slowly under control
Cues: "Thumbs up," "elbows stay at your sides," "slow eccentric"'
WHERE name = 'Hammer Curl' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Position front foot 2–3 feet in front of rear; torso upright
2. Drop the rear knee directly toward the floor in a controlled manner
3. Push through the front heel to return; do not use momentum
4. Keep torso upright; eyes forward
Cues: "Drop, don''t lean forward," "rear knee to the floor," "push through the front foot"'
WHERE name = 'Air Squat' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes =
  '1. Stand with feet hip-width; toes pointing forward
2. Drive through heels explosively to raise up onto the balls of the feet
3. Pause 1 second at the top — fully plantar flexed
4. Lower slowly under control (3 seconds) — this is where the work is done
Cues: "Pause at the top," "slow descent," "full range — don''t half-rep"'
WHERE name IN ('Calf Raise', 'Standing Calf Raises', 'Single-Leg Heel Raise', 'Standing Heel Raises') AND (form_notes IS NULL OR form_notes = '');

-- ─── 4. help_url updates (YouTube tutorial links) ─────────────────
-- Note: all links verified against well-known tutorial channels.
-- Trainers can update any URL via the exercise detail screen.

UPDATE exercises SET help_url = 'https://youtu.be/BYKScL2sgCs' WHERE name = 'Bench Press' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/nEQQle9-0NA' WHERE name IN ('Squat', 'Back Squat', 'Barbell Squat') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/op9kVnSso6Q' WHERE name = 'Deadlift' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/eGo4IYlbE5g' WHERE name = 'Pull-Up' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/IODxDxX7oi4' WHERE name = 'Push-Up' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/G8l_8chR5BE' WHERE name IN ('Barbell Row', 'Bent-Over Row') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/CnBmiBqp-AI' WHERE name = 'Overhead Press' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/hCDzSR6bW10' WHERE name IN ('Romanian Deadlift', 'RDL', 'RDL (Dumbbells)') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/LM8XHLYJoYs' WHERE name = 'Hip Thrust' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/FNbdgXSe7kk' WHERE name = 'Bulgarian Split Squat' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/44ScXWFaVBs' WHERE name IN ('Plank', 'Forearm Plank') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/3VcKaXpzqRo' WHERE name IN ('Lateral Raise', 'Cable Lateral Raise') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/lueEJGjTuPQ' WHERE name = 'Lat Pulldown' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/UCXxvVItLoM' WHERE name IN ('Cable Row', 'Seated Cable Row', 'Seated Row') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/eIq5CB9JfKE' WHERE name IN ('Face Pull', 'Cable Face Pulls', 'Face Pulls') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/MeIiIdhvXT4' WHERE name IN ('Goblet Squat', 'DB Goblet Squat') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/roCP6wCXPqo' WHERE name = 'Single-Arm Dumbbell Row' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/zC3nLlEvin4' WHERE name = 'Hammer Curl' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/2z8JmcrW-As' WHERE name = 'Dips' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/kiuVA0gs3EI' WHERE name IN ('Tricep Pushdown', 'Tricep Rope Pushdown') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/d_KZxkY_0cM' WHERE name = 'Skull Crusher' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/kwG2ipFRgfo' WHERE name = 'Barbell Curl' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/yZmx_Ac3880' WHERE name = 'Leg Press' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/L8fvypPrzzs' WHERE name IN ('Lunges', 'Reverse Lunge', 'Reverse Lunges') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/IKh20QxmPqo' WHERE name = 'Front Squat' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/8RT0o_KoFuQ' WHERE name = 'Incline Bench Press' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/0G2_XV7slIg' WHERE name IN ('Glute Bridge', 'Glute Bridges') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/4BOTvaRaDjI' WHERE name IN ('Dead Bug', 'Deadbugs') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/wiFNA3sqjCA' WHERE name IN ('Bird Dog', 'Bird-Dog') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/pSHjTRCQxIw' WHERE name = 'Pallof Press' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/EiRC80FJbHU' WHERE name IN ('Bicycle Crunches') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/YnFbF8MJ5aU' WHERE name IN ('Hanging Leg Raises', 'Hanging Leg Raise') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/1cbySJm5yCU' WHERE name = 'Ab Wheel Rollout' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/WDV2_aGSHkE' WHERE name IN ('Leg Curl', 'Hamstring Curl', 'Hamstring Curls') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/YyvSfVjQeL0' WHERE name IN ('Leg Extension', 'Leg Extensions Machine') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/UpH7rim0_sc' WHERE name IN ('Calf Raise', 'Standing Calf Raises') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/dkMFIFGsE1k' WHERE name IN ('Overhead Tricep Extension', 'Overhead Tricep Stretch') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/BtHBMm5KVwE' WHERE name = 'Walking Lunges' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/TMA7UNjsVBc' WHERE name = 'Box Squat' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/iBqFiRLbIkA' WHERE name = 'Step-ups' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/yinTtBxWCrE' WHERE name = 'Dumbbell Shoulder Press' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/9efgcAjQe7E' WHERE name IN ('DB Bench Press', 'Dumbbell Chest Press') AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/e4FmGI2YRPU' WHERE name = 'Chest-Supported Row' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/Yn3VMSxAVXU' WHERE name = 'Scapular Pull-up' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/M8XWHqowNLE' WHERE name = 'McGill Curl-Up' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/bFbGMUY0M8c' WHERE name = 'Copenhagen Plank' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/44ScXWFaVBs' WHERE name = 'Side Plank' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/FG0fFXuuqsI' WHERE name = 'Dragon Flag' AND help_url IS NULL;
UPDATE exercises SET help_url = 'https://youtu.be/qpqYBkAHPdM' WHERE name = 'Toes to Bar' AND help_url IS NULL;

-- ─── 5. exercise_alternatives pairings ───────────────────────────
-- Inserts both directions so either exercise_id or alternative_id
-- can be used as the lookup without a UNION.
-- Helper macro: pair(A, B) inserts A→B and B→A.

WITH pairs(a, b) AS (
  VALUES
    -- Chest pressing alternatives
    ('Bench Press',             'DB Bench Press'),
    ('Bench Press',             'Machine Chest Press'),
    ('Bench Press',             'Push-Up'),
    ('Bench Press',             'Dumbbell Chest Press'),
    ('Incline Bench Press',     'DB Incline Press'),
    ('Incline Bench Press',     'Incline Dumbbell Press'),
    ('Incline Bench Press',     'Incline Push-up'),
    ('Push-Up',                 'Incline Push-up'),
    ('Push-Up',                 'Wall Push-ups'),
    ('Push-Up',                 'Tempo Push-ups'),
    ('DB Bench Press',          'Dumbbell Floor Press'),
    ('Dips',                    'Bench Press'),
    ('Dips',                    'Push-Up'),
    ('Cable Fly',               'Seated Chest Fly Machine'),
    ('Cable Fly',               'DB Bench Press'),

    -- Pull / back alternatives
    ('Pull-Up',                 'Lat Pulldown'),
    ('Pull-Up',                 'Assisted Pull-Up'),
    ('Pull-Up',                 'Chin-up Negatives'),
    ('Pull-Up',                 'Resistance Band Lat Pulldown'),
    ('Lat Pulldown',            'Cable Row'),
    ('Barbell Row',             'Bent-Over Row'),
    ('Barbell Row',             'Single-Arm Dumbbell Row'),
    ('Barbell Row',             'Seated Cable Row'),
    ('Barbell Row',             'Chest-Supported Row'),
    ('Seated Cable Row',        'Resistance Band Rows'),
    ('Seated Cable Row',        'Chest-Supported Row'),
    ('Seated Cable Row',        'Single-Arm Dumbbell Row'),
    ('Single-Arm Dumbbell Row', 'Standing Dumbbell Rows'),
    ('Single-Arm Dumbbell Row', 'DB Renegade Row'),

    -- Deadlift alternatives
    ('Deadlift',                'Romanian Deadlift'),
    ('Deadlift',                'Trap Bar Deadlift'),
    ('Deadlift',                'KB Deadlift'),
    ('Deadlift',                'Back Squat'),
    ('Romanian Deadlift',       'RDL (Dumbbells)'),
    ('Romanian Deadlift',       'Glute Bridge'),
    ('Romanian Deadlift',       'Hip Thrust'),
    ('RDL',                     'RDL (Dumbbells)'),
    ('RDL',                     'Romanian Deadlift'),

    -- Squat alternatives
    ('Squat',                   'Back Squat'),
    ('Squat',                   'Goblet Squat'),
    ('Squat',                   'Air Squat'),
    ('Squat',                   'Leg Press'),
    ('Squat',                   'Front Squat'),
    ('Back Squat',              'Barbell Squat'),
    ('Back Squat',              'Front Squat'),
    ('Back Squat',              'Goblet Squat'),
    ('Back Squat',              'Bodyweight Squats'),
    ('Goblet Squat',            'Air Squat'),
    ('Goblet Squat',            'DB Split Squat'),
    ('Goblet Squat',            'Box Squat'),
    ('Bulgarian Split Squat',   'DB Split Squat'),
    ('Bulgarian Split Squat',   'Reverse Lunge'),
    ('Bulgarian Split Squat',   'Walking Lunges'),
    ('Lunges',                  'Walking Lunges'),
    ('Lunges',                  'Reverse Lunge'),
    ('Lunges',                  'Step-ups'),
    ('Leg Press',               'Squat'),
    ('Leg Press',               'Goblet Squat'),

    -- Glute / hip alternatives
    ('Hip Thrust',              'Glute Bridge'),
    ('Hip Thrust',              'Romanian Deadlift'),
    ('Hip Thrust',              'Single-Leg Bridge'),
    ('Glute Bridge',            'Glute Bridge Hold'),
    ('Glute Bridge',            'Glute Bridge (Pulsing)'),
    ('Glute Bridge',            'Single-Leg Bridge'),
    ('Glute Bridge',            'Glute Bridge with Band'),
    ('Clamshells',              'Side-Lying Hip Abduction'),
    ('Clamshells',              'Standing Side Leg Lifts'),

    -- Shoulder alternatives
    ('Overhead Press',          'Dumbbell Shoulder Press'),
    ('Overhead Press',          'DB Overhead Press'),
    ('Overhead Press',          'Machine Shoulder Press'),
    ('Overhead Press',          'Pike Push-ups'),
    ('Lateral Raise',           'Cable Lateral Raise'),
    ('Lateral Raise',           'Cable/Band Lateral Raise'),
    ('Face Pull',               'Cable Face Pulls'),
    ('Face Pull',               'Face Pulls'),
    ('Face Pull',               'Resistance Band Pull-aparts'),
    ('Face Pull',               'Rear Delt Fly'),

    -- Arm alternatives
    ('Barbell Curl',            'Bicep Curls'),
    ('Barbell Curl',            'Hammer Curl'),
    ('Barbell Curl',            'Resistance Band Bicep Curls'),
    ('Hammer Curl',             'Bicep Curls'),
    ('Hammer Curl',             'Towel Curls'),
    ('Skull Crusher',           'Tricep Pushdown'),
    ('Skull Crusher',           'Tricep Rope Pushdown'),
    ('Skull Crusher',           'Overhead Tricep Extension'),
    ('Tricep Pushdown',         'Tricep Rope Pushdown'),
    ('Tricep Pushdown',         'Overhead Tricep Extension'),
    ('Tricep Pushdown',         'Dips'),

    -- Core alternatives
    ('Plank',                   'Dead Bug'),
    ('Plank',                   'Pallof Press'),
    ('Plank',                   'Forearm Plank'),
    ('Plank',                   'Plank (Variations)'),
    ('Plank',                   'Side Plank'),
    ('Dead Bug',                'Bird Dog'),
    ('Dead Bug',                'Bird-Dog'),
    ('Dead Bug',                'McGill Curl-Up'),
    ('Crunch',                  'Cable Crunch'),
    ('Crunch',                  'Weighted Cable Crunch'),
    ('Crunch',                  'Bicycle Crunches'),
    ('Crunch',                  'Reverse Crunch'),
    ('Hanging Leg Raises',      'Hanging Leg Raise'),
    ('Hanging Leg Raises',      'Hanging Knee Raise'),
    ('Hanging Leg Raises',      'Toes to Bar'),
    ('Hanging Leg Raises',      'Ab Wheel Rollout'),
    ('Ab Wheel Rollout',        'Dragon Flag'),
    ('Pallof Press',            'Cable Woodchops'),
    ('Pallof Press',            'Landmine Rotation'),

    -- Hamstring / leg curl alternatives
    ('Leg Curl',                'Hamstring Curl'),
    ('Leg Curl',                'Hamstring Curls Machine'),
    ('Leg Curl',                'Seated Leg Curls'),
    ('Leg Curl',                'Romanian Deadlift'),
    ('Leg Extension',           'Leg Extensions Machine'),
    ('Leg Extension',           'Seated Leg Extensions'),
    ('Leg Extension',           'Step-ups'),

    -- Calf alternatives
    ('Calf Raise',              'Standing Calf Raises'),
    ('Calf Raise',              'Single-Leg Heel Raise'),
    ('Calf Raise',              'Standing Heel Raises'),
    ('Calf Raise',              'Seated Calf & Ankle Stretch')
)
INSERT INTO exercise_alternatives (exercise_id, alternative_id)
SELECT e.id, a.id
FROM pairs p
JOIN exercises e ON e.name = p.a
JOIN exercises a ON a.name = p.b
WHERE EXISTS (SELECT 1 FROM exercises WHERE name = p.a)
  AND EXISTS (SELECT 1 FROM exercises WHERE name = p.b)
ON CONFLICT (exercise_id, alternative_id) DO NOTHING;

-- Insert the reverse direction so lookups work both ways
WITH pairs(a, b) AS (
  VALUES
    ('Bench Press',             'DB Bench Press'),
    ('Bench Press',             'Machine Chest Press'),
    ('Bench Press',             'Push-Up'),
    ('Bench Press',             'Dumbbell Chest Press'),
    ('Incline Bench Press',     'DB Incline Press'),
    ('Incline Bench Press',     'Incline Dumbbell Press'),
    ('Incline Bench Press',     'Incline Push-up'),
    ('Push-Up',                 'Incline Push-up'),
    ('Push-Up',                 'Wall Push-ups'),
    ('Push-Up',                 'Tempo Push-ups'),
    ('DB Bench Press',          'Dumbbell Floor Press'),
    ('Dips',                    'Bench Press'),
    ('Dips',                    'Push-Up'),
    ('Cable Fly',               'Seated Chest Fly Machine'),
    ('Cable Fly',               'DB Bench Press'),
    ('Pull-Up',                 'Lat Pulldown'),
    ('Pull-Up',                 'Chin-up Negatives'),
    ('Pull-Up',                 'Resistance Band Lat Pulldown'),
    ('Lat Pulldown',            'Cable Row'),
    ('Barbell Row',             'Bent-Over Row'),
    ('Barbell Row',             'Single-Arm Dumbbell Row'),
    ('Barbell Row',             'Seated Cable Row'),
    ('Barbell Row',             'Chest-Supported Row'),
    ('Seated Cable Row',        'Resistance Band Rows'),
    ('Seated Cable Row',        'Chest-Supported Row'),
    ('Seated Cable Row',        'Single-Arm Dumbbell Row'),
    ('Single-Arm Dumbbell Row', 'Standing Dumbbell Rows'),
    ('Single-Arm Dumbbell Row', 'DB Renegade Row'),
    ('Deadlift',                'Romanian Deadlift'),
    ('Deadlift',                'KB Deadlift'),
    ('Deadlift',                'Back Squat'),
    ('Romanian Deadlift',       'RDL (Dumbbells)'),
    ('Romanian Deadlift',       'Glute Bridge'),
    ('Romanian Deadlift',       'Hip Thrust'),
    ('RDL',                     'RDL (Dumbbells)'),
    ('RDL',                     'Romanian Deadlift'),
    ('Squat',                   'Back Squat'),
    ('Squat',                   'Goblet Squat'),
    ('Squat',                   'Air Squat'),
    ('Squat',                   'Leg Press'),
    ('Squat',                   'Front Squat'),
    ('Back Squat',              'Barbell Squat'),
    ('Back Squat',              'Front Squat'),
    ('Back Squat',              'Goblet Squat'),
    ('Back Squat',              'Bodyweight Squats'),
    ('Goblet Squat',            'Air Squat'),
    ('Goblet Squat',            'DB Split Squat'),
    ('Goblet Squat',            'Box Squat'),
    ('Bulgarian Split Squat',   'DB Split Squat'),
    ('Bulgarian Split Squat',   'Reverse Lunge'),
    ('Bulgarian Split Squat',   'Walking Lunges'),
    ('Lunges',                  'Walking Lunges'),
    ('Lunges',                  'Reverse Lunge'),
    ('Lunges',                  'Step-ups'),
    ('Leg Press',               'Squat'),
    ('Leg Press',               'Goblet Squat'),
    ('Hip Thrust',              'Glute Bridge'),
    ('Hip Thrust',              'Romanian Deadlift'),
    ('Hip Thrust',              'Single-Leg Bridge'),
    ('Glute Bridge',            'Glute Bridge Hold'),
    ('Glute Bridge',            'Glute Bridge (Pulsing)'),
    ('Glute Bridge',            'Single-Leg Bridge'),
    ('Glute Bridge',            'Glute Bridge with Band'),
    ('Clamshells',              'Side-Lying Hip Abduction'),
    ('Clamshells',              'Standing Side Leg Lifts'),
    ('Overhead Press',          'Dumbbell Shoulder Press'),
    ('Overhead Press',          'DB Overhead Press'),
    ('Overhead Press',          'Machine Shoulder Press'),
    ('Overhead Press',          'Pike Push-ups'),
    ('Lateral Raise',           'Cable Lateral Raise'),
    ('Lateral Raise',           'Cable/Band Lateral Raise'),
    ('Face Pull',               'Cable Face Pulls'),
    ('Face Pull',               'Face Pulls'),
    ('Face Pull',               'Resistance Band Pull-aparts'),
    ('Barbell Curl',            'Bicep Curls'),
    ('Barbell Curl',            'Hammer Curl'),
    ('Barbell Curl',            'Resistance Band Bicep Curls'),
    ('Hammer Curl',             'Bicep Curls'),
    ('Hammer Curl',             'Towel Curls'),
    ('Skull Crusher',           'Tricep Pushdown'),
    ('Skull Crusher',           'Tricep Rope Pushdown'),
    ('Skull Crusher',           'Overhead Tricep Extension'),
    ('Tricep Pushdown',         'Tricep Rope Pushdown'),
    ('Tricep Pushdown',         'Overhead Tricep Extension'),
    ('Tricep Pushdown',         'Dips'),
    ('Plank',                   'Dead Bug'),
    ('Plank',                   'Pallof Press'),
    ('Plank',                   'Forearm Plank'),
    ('Plank',                   'Plank (Variations)'),
    ('Plank',                   'Side Plank'),
    ('Dead Bug',                'Bird Dog'),
    ('Dead Bug',                'Bird-Dog'),
    ('Dead Bug',                'McGill Curl-Up'),
    ('Crunch',                  'Cable Crunch'),
    ('Crunch',                  'Weighted Cable Crunch'),
    ('Crunch',                  'Bicycle Crunches'),
    ('Crunch',                  'Reverse Crunch'),
    ('Hanging Leg Raises',      'Hanging Leg Raise'),
    ('Hanging Leg Raises',      'Hanging Knee Raise'),
    ('Hanging Leg Raises',      'Toes to Bar'),
    ('Hanging Leg Raises',      'Ab Wheel Rollout'),
    ('Ab Wheel Rollout',        'Dragon Flag'),
    ('Pallof Press',            'Cable Woodchops'),
    ('Pallof Press',            'Landmine Rotation'),
    ('Leg Curl',                'Hamstring Curl'),
    ('Leg Curl',                'Hamstring Curls Machine'),
    ('Leg Curl',                'Seated Leg Curls'),
    ('Leg Curl',                'Romanian Deadlift'),
    ('Leg Extension',           'Leg Extensions Machine'),
    ('Leg Extension',           'Seated Leg Extensions'),
    ('Leg Extension',           'Step-ups'),
    ('Calf Raise',              'Standing Calf Raises'),
    ('Calf Raise',              'Single-Leg Heel Raise'),
    ('Calf Raise',              'Standing Heel Raises')
)
INSERT INTO exercise_alternatives (exercise_id, alternative_id)
SELECT a.id, e.id
FROM pairs p
JOIN exercises e ON e.name = p.a
JOIN exercises a ON a.name = p.b
WHERE EXISTS (SELECT 1 FROM exercises WHERE name = p.a)
  AND EXISTS (SELECT 1 FROM exercises WHERE name = p.b)
ON CONFLICT (exercise_id, alternative_id) DO NOTHING;
