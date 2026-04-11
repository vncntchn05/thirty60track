-- ============================================================
-- Development seed data — run AFTER schema.sql
-- Creates a shared exercise library. Trainer/client data is
-- created via the app UI or Supabase Auth dashboard.
-- ============================================================

INSERT INTO exercises (name, muscle_group, category) VALUES
  -- Chest
  ('Bench Press',            'Chest',     'strength'),
  ('Incline Bench Press',    'Chest',     'strength'),
  ('Push-Up',                'Chest',     'strength'),
  ('Cable Fly',              'Chest',     'strength'),
  -- Back
  ('Deadlift',               'Back',      'strength'),
  ('Pull-Up',                'Back',      'strength'),
  ('Barbell Row',            'Back',      'strength'),
  ('Lat Pulldown',           'Back',      'strength'),
  ('Seated Cable Row',       'Back',      'strength'),
  -- Shoulders
  ('Overhead Press',         'Shoulders', 'strength'),
  ('Lateral Raise',          'Shoulders', 'strength'),
  ('Face Pull',              'Shoulders', 'strength'),
  -- Arms
  ('Barbell Curl',           'Arms',      'strength'),
  ('Tricep Pushdown',        'Arms',      'strength'),
  ('Hammer Curl',            'Arms',      'strength'),
  ('Skull Crusher',          'Arms',      'strength'),
  -- Legs
  ('Squat',                  'Legs',      'strength'),
  ('Romanian Deadlift',      'Legs',      'strength'),
  ('Leg Press',              'Legs',      'strength'),
  ('Leg Curl',               'Legs',      'strength'),
  ('Leg Extension',          'Legs',      'strength'),
  ('Calf Raise',             'Legs',      'strength'),
  ('Lunges',                 'Legs',      'strength'),
  -- Core
  ('Plank',                  'Core',      'strength'),
  ('Crunch',                 'Core',      'strength'),
  ('Cable Crunch',           'Core',      'strength'),
  -- Cardio
  ('Treadmill Run',          'Legs',      'cardio'),
  ('Rowing Machine',         'Back',      'cardio'),
  ('Cycling',                'Legs',      'cardio'),
  ('Jump Rope',              'Full Body', 'cardio')
ON CONFLICT (name) DO NOTHING;

-- ─── Extended Exercise Library ────────────────────────────────
INSERT INTO exercises (name, muscle_group, category) VALUES
  -- Glutes
  ('Glute Bridge',                        'Glutes',    'strength'),
  ('Glute Bridge Hold',                   'Glutes',    'strength'),
  ('Glute Bridge (Pulsing)',              'Glutes',    'strength'),
  ('Single-Leg Bridge',                   'Glutes',    'strength'),
  -- Legs
  ('Air Squat',                           'Legs',      'strength'),
  ('Box Squat',                           'Legs',      'strength'),
  ('Reverse Lunge',                       'Legs',      'strength'),
  ('Single-Leg Reach (Bulg Squat)',       'Legs',      'strength'),
  ('Step-ups/Weighted',                   'Legs',      'strength'),
  ('Squat Press (DB/Bar)',                'Legs',      'strength'),
  ('Lateral Lunge',                       'Legs',      'strength'),
  ('Wall Sit',                            'Legs',      'strength'),
  ('Single-Leg Step-Up',                  'Legs',      'strength'),
  ('Box Jump',                            'Legs',      'cardio'),
  ('Jump Squats',                         'Legs',      'cardio'),
  ('Box Step-ups',                        'Legs',      'strength'),
  ('Walking Lunges',                      'Legs',      'strength'),
  ('DB Split Squat',                      'Legs',      'strength'),
  ('Leg Press + Leg Machines',            'Legs',      'strength'),
  ('Hamstring Curl',                      'Legs',      'strength'),
  ('DB Step-ups',                         'Legs',      'strength'),
  ('Wall Sits (Weighted)',                'Legs',      'strength'),
  ('Goblet Lateral Lunge',               'Legs',      'strength'),
  ('Lunge with Twist',                    'Legs',      'strength'),
  ('Skater Jumps',                        'Legs',      'cardio'),
  ('Single-Leg Hops',                     'Legs',      'cardio'),
  ('Lateral Bounds',                      'Legs',      'cardio'),
  ('DB Goblet Squat',                     'Legs',      'strength'),
  ('RDL',                                 'Legs',      'strength'),
  ('RDL (Dumbbells)',                     'Legs',      'strength'),
  ('KB Deadlift',                         'Legs',      'strength'),
  ('Pilates Squat + Squat',              'Legs',      'strength'),
  -- Chest
  ('Incline Push-up',                     'Chest',     'strength'),
  ('Floor Press + Mod Push-up',           'Chest',     'strength'),
  ('Tempo Push-ups',                      'Chest',     'strength'),
  ('T-Pushups',                           'Chest',     'strength'),
  ('Spiderman Push-ups',                  'Chest',     'strength'),
  ('Diamond + Wide Pushups',             'Chest',     'strength'),
  ('DB Bench Press',                      'Chest',     'strength'),
  ('DB Incline Press',                    'Chest',     'strength'),
  ('Chest Pass (Med Ball)',               'Chest',     'strength'),
  ('Push-up (Weighted)',                  'Chest',     'strength'),
  ('Dips',                                'Chest',     'strength'),
  ('Dips/Band Flyes',                    'Chest',     'strength'),
  -- Back
  ('Pull up/Lat Pulldown',               'Back',      'strength'),
  ('Mid Row',                             'Back',      'strength'),
  ('Cable Pullover',                      'Back',      'strength'),
  ('Scapular Pull-up',                   'Back',      'strength'),
  ('Scapular Push-ups',                  'Back',      'strength'),
  ('BW Back Extensions',                 'Back',      'strength'),
  ('Chin-up Negatives',                  'Back',      'strength'),
  ('DB Renegade Row',                     'Back',      'strength'),
  ('Cable Squat Row',                     'Back',      'strength'),
  -- Shoulders
  ('Cable Face Pulls',                    'Shoulders', 'strength'),
  ('DB Overhead Press',                   'Shoulders', 'strength'),
  ('Cable/Band Lateral Raise',           'Shoulders', 'strength'),
  ('Pike Push-ups',                       'Shoulders', 'strength'),
  -- Arms
  ('Towel Curls',                         'Arms',      'strength'),
  ('Bicep Curls',                         'Arms',      'strength'),
  ('Box Dips (Assist)',                   'Arms',      'strength'),
  -- Core
  ('Plank (Variations)',                  'Core',      'strength'),
  ('Plank Taps',                          'Core',      'strength'),
  ('Plank-to-Pushup',                    'Core',      'strength'),
  ('Side Planks',                         'Core',      'strength'),
  ('Side Plank Dips',                    'Core',      'strength'),
  ('Plank with Knee-to-Elbow',           'Core',      'strength'),
  ('Plank (Weighted)',                    'Core',      'strength'),
  ('Plank with Row',                      'Core',      'strength'),
  ('Plank Shoulder Taps',                'Core',      'strength'),
  ('Plank In and Outs',                  'Core',      'strength'),
  ('Plank Jacks',                         'Core',      'cardio'),
  ('Bicycle Crunches',                    'Core',      'strength'),
  ('Russian Twists',                      'Core',      'strength'),
  ('Decline Russian Twists',             'Core',      'strength'),
  ('V-Ups',                               'Core',      'strength'),
  ('V-Ups/Knee Raises',                  'Core',      'strength'),
  ('Flutter Kicks',                       'Core',      'strength'),
  ('Reverse Crunch',                      'Core',      'strength'),
  ('Weighted Sit-up',                     'Core',      'strength'),
  ('Deadbug (Weighted)',                  'Core',      'strength'),
  ('Deadbugs',                            'Core',      'strength'),
  ('Pallof Press',                        'Core',      'strength'),
  ('Cable Torso Rotations',              'Core',      'strength'),
  ('Static Squat Cable Torso Rotations', 'Core',      'strength'),
  ('Cable Woodchops',                     'Core',      'strength'),
  ('Hanging Leg Raises',                 'Core',      'strength'),
  ('Landmine Rotation',                   'Core',      'strength'),
  ('Windshields/Alternate Knee Raises',  'Core',      'strength'),
  ('Medicine Ball Rotational Toss',      'Core',      'strength'),
  ('Center Decline',                      'Core',      'strength'),
  ('Teapots',                             'Core',      'strength'),
  ('Single Leg Decline',                 'Core',      'strength'),
  ('Knee/Leg Raises',                    'Core',      'strength'),
  ('Knee to Elbows',                      'Core',      'strength'),
  ('Toe Taps',                            'Core',      'strength'),
  -- Full Body / Compound
  ('Landmine',                            'Full Body', 'strength'),
  ('Bear Crawl',                          'Full Body', 'strength'),
  ('Inchworm Push-Up',                   'Full Body', 'strength'),
  ('Ball Squat Toss',                     'Full Body', 'strength'),
  ('Med Ball Slams',                      'Full Body', 'strength'),
  ('Med Ball Overhead Hold',             'Full Body', 'strength'),
  ('Wall Balls',                          'Full Body', 'strength'),
  ('Burpee DB Press',                     'Full Body', 'strength'),
  ('Suitcase Carry (L/R)',               'Core',      'strength'),
  ('Farmer''s Walk',                      'Full Body', 'strength'),
  ('Squat Thrusts',                       'Full Body', 'cardio'),
  -- Cardio
  ('Mountain Climbers + Air Squats',     'Full Body', 'cardio'),
  ('Mountain Climbers',                   'Full Body', 'cardio'),
  ('Mountain Climber Burpee',            'Full Body', 'cardio'),
  ('In-Out Jumping Jacks',               'Full Body', 'cardio'),
  ('High Knees (s)',                      'Legs',      'cardio'),
  ('Butt Kicks (s)',                      'Legs',      'cardio'),
  ('Rope Ladder Broad Jumps',            'Legs',      'cardio'),
  ('Jumping Jacks (s)',                   'Full Body', 'cardio'),
  ('Shuttle Runs (yd)',                   'Legs',      'cardio'),
  ('Speed Skaters',                       'Legs',      'cardio'),
  ('Burpees',                             'Full Body', 'cardio'),
  ('Ice Skater Steps',                    'Legs',      'cardio'),
  -- Flexibility / Mobility
  ('Cobra Stretch',                       'Back',      'flexibility'),
  ('Hip Circles',                         'Hips',      'flexibility'),

  -- ── Stretches ──────────────────────────────────────────────────────
  -- Back
  ('Child''s Pose',                        'Back',       'stretch'),
  ('Cat-Cow Stretch',                      'Back',       'stretch'),
  ('Thoracic Spine Rotation',              'Back',       'stretch'),
  ('Thread the Needle',                    'Back',       'stretch'),
  ('Prone Cobra',                          'Back',       'stretch'),
  ('Supine Twist',                         'Back',       'stretch'),
  ('Lat Doorway Stretch',                  'Back',       'stretch'),
  ('Levator Scapulae Stretch',             'Back',       'stretch'),
  ('Downward Dog',                         'Back',       'stretch'),
  -- Chest
  ('Doorway Chest Stretch',                'Chest',      'stretch'),
  ('Chest Opener Stretch',                 'Chest',      'stretch'),
  ('Pec Minor Stretch',                    'Chest',      'stretch'),
  -- Shoulders
  ('Cross-Body Shoulder Stretch',          'Shoulders',  'stretch'),
  ('Shoulder Sleeper Stretch',             'Shoulders',  'stretch'),
  ('Neck Side Stretch',                    'Shoulders',  'stretch'),
  ('Neck Flexion Stretch',                 'Shoulders',  'stretch'),
  ('Posterior Shoulder Stretch',           'Shoulders',  'stretch'),
  -- Arms
  ('Overhead Tricep Stretch',              'Arms',       'stretch'),
  ('Bicep Wall Stretch',                   'Arms',       'stretch'),
  ('Forearm Flexor Stretch',               'Arms',       'stretch'),
  -- Hips
  ('Hip Flexor Stretch',                   'Hips',       'stretch'),
  ('90/90 Hip Stretch',                    'Hips',       'stretch'),
  ('Butterfly Stretch',                    'Hips',       'stretch'),
  ('Pigeon Pose',                          'Hips',       'stretch'),
  ('Figure Four Stretch',                  'Hips',       'stretch'),
  -- Glutes
  ('Piriformis Stretch',                   'Glutes',     'stretch'),
  ('Seated Glute Stretch',                 'Glutes',     'stretch'),
  -- Legs
  ('Standing Quad Stretch',                'Legs',       'stretch'),
  ('Lying Quad Stretch',                   'Legs',       'stretch'),
  ('Standing Hamstring Stretch',           'Legs',       'stretch'),
  ('Seated Hamstring Stretch',             'Legs',       'stretch'),
  ('Seated Forward Fold',                  'Legs',       'stretch'),
  ('IT Band Stretch',                      'Legs',       'stretch'),
  ('Couch Stretch',                        'Legs',       'stretch'),
  ('Standing Calf Stretch',                'Legs',       'stretch'),
  ('World''s Greatest Stretch',            'Full Body',  'stretch'),

  -- ── Hand & Wrist Stretches ─────────────────────────────────────────
  ('Wrist Flexor Stretch',                 'Hands',      'stretch'),
  ('Wrist Extensor Stretch',               'Hands',      'stretch'),
  ('Prayer Stretch',                       'Hands',      'stretch'),
  ('Reverse Prayer Stretch',               'Hands',      'stretch'),
  ('Finger Extension Stretch',             'Hands',      'stretch'),
  ('Thumb Stretch',                        'Hands',      'stretch'),
  ('Wrist Circles',                        'Hands',      'stretch'),
  ('Tendon Glide',                         'Hands',      'stretch'),

  -- ── Hand & Wrist Strength ──────────────────────────────────────────
  ('Wrist Curls',                          'Hands',      'strength'),
  ('Wrist Extensions',                     'Hands',      'strength'),
  ('Reverse Wrist Curls',                  'Hands',      'strength'),
  ('Grip Squeezes',                        'Hands',      'strength'),
  ('Pinch Grip Hold',                      'Hands',      'strength'),
  ('Dead Hang',                            'Hands',      'strength'),
  ('Finger Curls',                         'Hands',      'strength'),
  ('Towel Grip Row',                       'Hands',      'strength'),
  ('Forearm Pronation & Supination',       'Hands',      'strength'),
  ('Rice Bucket Training',                 'Hands',      'strength'),

  -- ── Foot & Ankle Stretches ─────────────────────────────────────────
  ('Plantar Fascia Stretch',               'Feet',       'stretch'),
  ('Achilles Tendon Stretch',              'Feet',       'stretch'),
  ('Toe Flexor Stretch',                   'Feet',       'stretch'),
  ('Ankle Circles',                        'Feet',       'stretch'),
  ('Toe Spread Stretch',                   'Feet',       'stretch'),
  ('Ankle Dorsiflexion Stretch',           'Feet',       'stretch'),
  ('Seated Calf & Ankle Stretch',          'Feet',       'stretch'),

  -- ── Foot & Ankle Strength / Mobility ──────────────────────────────
  ('Ankle Alphabet',                       'Feet',       'strength'),
  ('Towel Toe Scrunches',                  'Feet',       'strength'),
  ('Marble Pickup',                        'Feet',       'strength'),
  ('Short Foot Exercise',                  'Feet',       'strength'),
  ('Toe Raises',                           'Feet',       'strength'),
  ('Single Leg Heel Raise',                'Feet',       'strength'),
  ('Foot Doming',                          'Feet',       'strength'),
  ('Ankle Stability Balance',              'Feet',       'strength'),
  ('Resistance Band Ankle Inversion',      'Feet',       'strength'),
  ('Resistance Band Ankle Eversion',       'Feet',       'strength'),
  ('Intrinsic Foot Strengthening',         'Feet',       'strength')
ON CONFLICT (name) DO NOTHING;

-- ─── Exercises missing from templates (mirrors Migration 025) ──────
-- Template name fixes first
UPDATE workout_templates SET exercise_names =
  array_replace(exercise_names, 'Pursed-Lip Breathing throughout', 'Pursed-Lip Breathing')
  WHERE 'Pursed-Lip Breathing throughout' = ANY(exercise_names);
UPDATE workout_templates SET exercise_names =
  array_replace(exercise_names, 'Interval Walking incline', 'Interval Walking')
  WHERE 'Interval Walking incline' = ANY(exercise_names);
UPDATE workout_templates SET exercise_names =
  array_replace(exercise_names, 'Side Plank Weak Side 2:1 ratio 3×30 sec', 'Side Plank Weak Side 3×30 sec')
  WHERE 'Side Plank Weak Side 2:1 ratio 3×30 sec' = ANY(exercise_names);

INSERT INTO exercises (name, muscle_group, category) VALUES
  ('Back Squat',                       'Legs',      'strength'),
  ('Bent-Over Row',                    'Back',      'strength'),
  ('Goblet Squat',                     'Legs',      'strength'),
  ('Incline Dumbbell Press',           'Chest',     'strength'),
  ('Dead Bug',                         'Core',      'strength'),
  ('Front Squat',                      'Legs',      'strength'),
  ('Cable Row',                        'Back',      'strength'),
  ('Barbell Squat',                    'Legs',      'strength'),
  ('Bulgarian Split Squat',            'Legs',      'strength'),
  ('Hip Thrust',                       'Glutes',    'strength'),
  ('Dumbbell Shoulder Press',          'Shoulders', 'strength'),
  ('Chest-Supported Row',              'Back',      'strength'),
  ('Overhead Tricep Extension',        'Arms',      'strength'),
  ('Cable Lateral Raise',              'Shoulders', 'strength'),
  ('Tricep Rope Pushdown',             'Arms',      'strength'),
  ('Ab Wheel Rollout',                 'Core',      'strength'),
  ('Hanging Leg Raise',                'Core',      'strength'),
  ('Hanging Knee Raise',               'Core',      'strength'),
  ('Side Plank',                       'Core',      'strength'),
  ('Side Plank with Hip Dip',          'Core',      'strength'),
  ('Copenhagen Plank',                 'Core',      'strength'),
  ('Dragon Flag',                      'Core',      'strength'),
  ('Weighted Cable Crunch',            'Core',      'strength'),
  ('Toes to Bar',                      'Core',      'strength'),
  ('L-Sit Hold',                       'Core',      'strength'),
  ('Bird Dog',                         'Core',      'strength'),
  ('Bird-Dog',                         'Core',      'strength'),
  ('Dumbbell Chest Press',             'Chest',     'strength'),
  ('Farmers Carry',                    'Full Body', 'strength'),
  ('Forearm Plank',                    'Core',      'strength'),
  ('Incline Treadmill Walk',           'Full Body', 'cardio'),
  ('Wall Push-ups',                    'Chest',     'strength'),
  ('Battle Ropes',                     'Full Body', 'cardio'),
  ('Step-ups',                         'Legs',      'strength'),
  ('Medicine Ball Slams',              'Full Body', 'cardio'),
  ('Stationary Bike',                  'Full Body', 'cardio'),
  ('Seated Leg Curls',                 'Legs',      'strength'),
  ('Machine Chest Press',              'Chest',     'strength'),
  ('Standing Calf Raises',             'Legs',      'strength'),
  ('Cat-Cow',                          'Back',      'flexibility'),
  ('Shadow Boxing',                    'Full Body', 'cardio'),
  ('Bodyweight Squats',                'Legs',      'strength'),
  ('Resistance Band Rows',             'Back',      'strength'),
  ('Wall Slides',                      'Shoulders', 'strength'),
  ('Diaphragmatic Breathing',          'Full Body', 'flexibility'),
  ('Warm-Up Walking',                  'Full Body', 'cardio'),
  ('Machine Shoulder Press',           'Shoulders', 'strength'),
  ('Walking',                          'Full Body', 'cardio'),
  ('Resistance Band Bicep Curls',      'Arms',      'strength'),
  ('Resistance Band Chest Press',      'Chest',     'strength'),
  ('Resistance Band Shoulder Press',   'Shoulders', 'strength'),
  ('Stationary Cycling',               'Full Body', 'cardio'),
  ('Steady-State Walking',             'Full Body', 'cardio'),
  ('Treadmill Walking',                'Full Body', 'cardio'),
  ('Seated Leg Extensions',            'Legs',      'strength'),
  ('Pursed-Lip Breathing',             'Full Body', 'flexibility'),
  ('Cool-Down Walk',                   'Full Body', 'cardio'),
  ('Cool-Down Walking',                'Full Body', 'cardio'),
  ('Interval Cycling',                 'Full Body', 'cardio'),
  ('Interval Walking',                 'Full Body', 'cardio'),
  ('Seated Chest Press',               'Chest',     'strength'),
  ('McGill Curl-Up',                   'Core',      'strength'),
  ('Child''s Pose Decompression',      'Back',      'flexibility'),
  ('Seated Sciatic Nerve Glide',       'Legs',      'flexibility'),
  ('90/90 Hip Switches',               'Hips',      'flexibility'),
  ('Clamshells',                       'Glutes',    'strength'),
  ('Single-Leg RDL Bodyweight',        'Legs',      'strength'),
  ('Hip Flexor Stretch Half-Kneeling', 'Hips',      'flexibility'),
  ('Wall Dead Bug',                    'Core',      'strength'),
  ('Figure-4 Glute Stretch',           'Glutes',    'flexibility'),
  ('Leg Extensions Machine',           'Legs',      'strength'),
  ('Seated Rows Neutral Grip',         'Back',      'strength'),
  ('Hamstring Curls Machine',          'Legs',      'strength'),
  ('Scapular Squeezes',                'Back',      'strength'),
  ('Wall Sits Partial Depth',          'Legs',      'strength'),
  ('Seated Chest Fly Machine',         'Chest',     'strength'),
  ('Wrist & Ankle Circles',            'Full Body', 'flexibility'),
  ('Sit-to-Stand Chair',               'Legs',      'strength'),
  ('Resistance Band Pull-aparts',      'Shoulders', 'strength'),
  ('Step-ups 4-inch box',              'Legs',      'strength'),
  ('Standing Side Leg Lifts',          'Glutes',    'strength'),
  ('Face Pulls',                       'Shoulders', 'strength'),
  ('Static Quad Sets',                 'Legs',      'strength'),
  ('Dumbbell Floor Press',             'Chest',     'strength'),
  ('Standing Dumbbell Rows',           'Back',      'strength'),
  ('Weighted Step-ups',                'Legs',      'strength'),
  ('Dumbbell Curl to Overhead Press',  'Arms',      'strength'),
  ('Dumbbell Overhead Press',          'Shoulders', 'strength'),
  ('Standing Heel Raises',             'Legs',      'strength'),
  ('Single-Leg Balance',               'Legs',      'strength'),
  ('Tandem Walk',                      'Full Body', 'strength'),
  ('Resistance Band Lat Pulldown',     'Back',      'strength'),
  ('Medicine Ball Chest Pass Light',   'Chest',     'strength'),
  ('Side-to-Side Step Touches',        'Full Body', 'cardio'),
  ('Modified Bird-Dog',                'Core',      'strength'),
  ('Tai Chi Lunges',                   'Legs',      'flexibility'),
  ('Pendulum Swings',                  'Shoulders', 'flexibility'),
  ('Crossover Arm Stretch',            'Shoulders', 'flexibility'),
  ('Sleeper Stretch',                  'Shoulders', 'flexibility'),
  ('Scapular Setting',                 'Back',      'strength'),
  ('Isometric External Rotation',      'Shoulders', 'strength'),
  ('Isometric Internal Rotation',      'Shoulders', 'strength'),
  ('Prone Horizontal Abduction',       'Shoulders', 'strength'),
  ('Full-Can Scaption Thumb-Up',       'Shoulders', 'strength'),
  ('Standing External Rotation',       'Shoulders', 'strength'),
  ('Standing Internal Rotation',       'Shoulders', 'strength'),
  ('Standing Row',                     'Back',      'strength'),
  ('Prone Y Raise',                    'Back',      'strength'),
  ('Bent-Over Horizontal Abduction',   'Shoulders', 'strength'),
  ('Ankle Pumps',                      'Feet',      'strength'),
  ('Heel Slides',                      'Legs',      'flexibility'),
  ('Quad Sets',                        'Legs',      'strength'),
  ('Straight Leg Raises',              'Legs',      'strength'),
  ('Hamstring Sets',                   'Legs',      'strength'),
  ('Double-Leg Quarter Squats',        'Legs',      'strength'),
  ('Knee Extension Stretch',           'Legs',      'flexibility'),
  ('Side-Lying Hip Abduction',         'Glutes',    'strength'),
  ('Straight Leg Raises with Resistance', 'Legs',  'strength'),
  ('Terminal Knee Extension Band',     'Legs',      'strength'),
  ('Single-Leg Heel Raises',           'Legs',      'strength'),
  ('Hamstring Curls Band or Prone',    'Legs',      'strength'),
  ('Chin Tucks',                       'Back',      'strength'),
  ('Prone Y-T-W Raises',               'Back',      'strength'),
  ('Seated Cable Row High Elbows',     'Back',      'strength'),
  ('Dead Bug Arms Overhead',           'Core',      'strength'),
  ('Farmers Carry Tall Spine',         'Full Body', 'strength'),
  ('Single-Arm Dumbbell Row',          'Back',      'strength'),
  ('Pec Minor Release',                'Chest',     'flexibility'),
  ('Glute Bridge with Band',           'Glutes',    'strength'),
  ('Plank with Knee Taps',             'Core',      'strength'),
  ('Goblet Squat Neutral Pelvis',      'Legs',      'strength'),
  ('Side Plank Weak Side',             'Core',      'strength'),
  ('Bird-Dog Leg Extension Focus',     'Core',      'strength'),
  ('Single-Arm Lat Pulldown',          'Back',      'strength'),
  ('Standing Single-Arm Press',        'Shoulders', 'strength'),
  ('Seated Torso Rotation Controlled', 'Core',      'strength'),
  ('Child''s Pose with Side Reach',    'Back',      'flexibility'),
  ('Chair Squats',                     'Legs',      'strength'),
  ('Seated Resistance Band Rows',      'Back',      'strength'),
  ('Single-Leg Balance Wall Support',  'Legs',      'strength'),
  ('Modified Dead Bug',                'Core',      'strength'),
  ('Tandem Stance',                    'Full Body', 'strength'),
  ('Step-ups Low Step',                'Legs',      'strength'),
  ('Hip Abduction Standing',           'Glutes',    'strength'),
  ('Pelvic Tilts',                     'Core',      'strength'),
  ('Incline Push-ups',                 'Chest',     'strength'),
  ('Glute Bridges',                    'Glutes',    'strength'),
  ('Reverse Lunges',                   'Legs',      'strength'),
  ('Seated Row Band or Cable',         'Back',      'strength'),
  ('Squat to Box',                     'Legs',      'strength'),
  ('Hip Flexor & Chest Stretch',       'Full Body', 'flexibility'),
  ('Seated Row',                       'Back',      'strength'),
  ('Hamstring Curls',                  'Legs',      'strength'),
  ('Resistance Band Chest Fly',        'Chest',     'strength'),
  ('Side-Lying Leg Lifts',             'Glutes',    'strength'),
  ('Arm Circles & Shoulder Mobility',  'Shoulders', 'flexibility'),
  ('Sit-to-Stand Controlled',          'Legs',      'strength'),
  ('Resistance Band Knee Extension',   'Legs',      'strength'),
  ('Bodyweight Quarter Squat',         'Legs',      'strength'),
  ('Plank Modified',                   'Core',      'strength'),
  ('Bicep Curls Light',                'Arms',      'strength'),
  ('Single-Leg Balance Eyes Open',     'Legs',      'strength'),
  ('Single-Leg Balance Eyes Closed',   'Legs',      'strength'),
  ('Wobble Board Balance',             'Full Body', 'strength'),
  ('Seated Gym Ball Balance',          'Core',      'strength'),
  ('Slow Lateral Weight Shifts',       'Full Body', 'strength'),
  ('Gentle Walking',                   'Full Body', 'cardio'),
  ('Marching in Place High Knees',     'Full Body', 'cardio'),
  ('Seated Medicine Ball Twists',      'Core',      'strength'),
  ('Opposite Arm Leg Reach Seated',    'Core',      'strength'),
  ('Step-ups Slow and Controlled',     'Legs',      'strength'),
  ('Bird-Dog Modified',                'Core',      'strength'),
  ('Modified Child''s Pose',           'Back',      'flexibility'),
  ('Relaxation Breathwork',            'Full Body', 'flexibility'),
  ('Elliptical Trainer',               'Full Body', 'cardio'),
  ('Deep Breathing Cool-Down',         'Full Body', 'flexibility'),
  ('Gentle Stationary Cycling',        'Full Body', 'cardio'),
  ('Seated Forward Fold Stretch',      'Legs',      'flexibility'),
  ('Progressive Muscle Relaxation',    'Full Body', 'flexibility'),
  ('Lying Stretches',                  'Full Body', 'flexibility'),
  ('Seated Arm Circles',               'Shoulders', 'flexibility'),
  ('Seated Knee Extensions',           'Legs',      'strength'),
  ('Rest Periods Between Every Set',   'Full Body', 'flexibility'),
  ('Gentle Full-Body Stretching',      'Full Body', 'flexibility'),
  ('Deep Breathing Exercises',         'Full Body', 'flexibility'),
  ('Resistance Band Work',             'Full Body', 'strength'),
  ('Relaxation & Body Scan',           'Full Body', 'flexibility'),
  ('Glute Bridge',                     'Glutes',    'strength'),
  ('Seated Cable Row',                 'Back',      'strength')
ON CONFLICT (name) DO NOTHING;

-- ─── Workout Templates ────────────────────────────────────────────
-- Run AFTER Migration 020 (subgroup column) has been applied.
-- Templates use a two-level hierarchy: split → subgroup.
-- Unique constraint is (name, split).
INSERT INTO workout_templates (name, split, subgroup, exercise_names) VALUES

  -- ── Full Body / Standard (guide-based 3-day sessions) ─────────
  ('Full Body 1', 'Full Body', 'Standard', ARRAY[
    'Back Squat', 'Bench Press', 'Bent-Over Row', 'Overhead Press', 'Plank'
  ]),
  ('Full Body 2', 'Full Body', 'Standard', ARRAY[
    'Goblet Squat', 'Romanian Deadlift', 'Incline Dumbbell Press', 'Lat Pulldown', 'Dead Bug'
  ]),
  ('Full Body 3', 'Full Body', 'Standard', ARRAY[
    'Deadlift', 'Front Squat', 'Push-Up', 'Cable Row', 'Pallof Press'
  ]),

  -- ── Full Body / Phase 1 ───────────────────────────────────────
  ('Push Emphasis',   'Full Body', 'Phase 1', ARRAY['Air Squat', 'Glute Bridge', 'Incline Push-up', 'Floor Press + Mod Push-up', 'Dips', 'Plank (Variations)', 'Mountain Climbers + Air Squats', 'Cobra Stretch', 'Bear Crawl', 'Glute Bridge Hold']),
  ('Pull Emphasis',   'Full Body', 'Phase 1', ARRAY['Reverse Lunge', 'Single-Leg Reach (Bulg Squat)', 'Pull up/Lat Pulldown', 'Mid Row', 'RDL', 'Cable Pullover', 'Towel Curls', 'Hammer Curl', 'Bear Crawl', 'Glute Bridge (Pulsing)']),
  ('Stability',       'Full Body', 'Phase 1', ARRAY['Box Squat', 'Step-ups/Weighted', 'Landmine', 'Squat Press (DB/Bar)', 'Cable Squat Row', 'Cable Torso Rotations', 'Scapular Push-ups', 'Scapular Pull-up', 'Plank Taps', 'BW Back Extensions']),
  ('Lateral & Total', 'Full Body', 'Phase 1', ARRAY['Lateral Lunge', 'Wall Sit', 'Plank-to-Pushup', 'Box Jump', 'Side Planks', 'Ball Squat Toss', 'Single-Leg Step-Up', 'Hip Circles', 'Mountain Climbers', 'In-Out Jumping Jacks']),

  -- ── Full Body / Phase 2 ───────────────────────────────────────
  ('Push Emphasis',      'Full Body', 'Phase 2', ARRAY['Skater Jumps', 'Jump Squats', 'Tempo Push-ups', 'Chest Pass (Med Ball)', 'Plank Jacks', 'Flutter Kicks', 'T-Pushups', 'High Knees (s)', 'Box Jump', 'Deadbug (Weighted)']),
  ('Pull Emphasis',      'Full Body', 'Phase 2', ARRAY['Box Step-ups', 'Walking Lunges', 'Chin-up Negatives', 'Med Ball Slams', 'Mountain Climbers', 'Bicycle Crunches', 'Cable Face Pulls', 'Butt Kicks (s)', 'Single-Leg Hops', 'Plank (Weighted)']),
  ('Shoulder Emphasis',  'Full Body', 'Phase 2', ARRAY['Rope Ladder Broad Jumps', 'Lateral Bounds', 'Med Ball Overhead Hold', 'Wall Balls', 'Russian Twists', 'Static Squat Cable Torso Rotations', 'Pike Push-ups', 'Jumping Jacks (s)', 'Pilates Squat + Squat', 'Side Plank Dips']),
  ('Agility & Total',    'Full Body', 'Phase 2', ARRAY['Shuttle Runs (yd)', 'Speed Skaters', 'V-Ups/Knee Raises', 'Burpees', 'Spiderman Push-ups', 'Plank with Knee-to-Elbow', 'Mountain Climber Burpee', 'Ice Skater Steps', 'Squat Thrusts', 'Deadlift']),

  -- ── Full Body / Phase 3 ───────────────────────────────────────
  ('Chest & Push',    'Full Body', 'Phase 3', ARRAY['DB Goblet Squat', 'RDL (Dumbbells)', 'DB Bench Press', 'DB Incline Press', 'Deadbug (Weighted)', 'Pallof Press', 'Dips/Band Flyes', 'Inchworm Push-Up', 'Calf Raise', 'Weighted Sit-up']),
  ('Back & Pull',     'Full Body', 'Phase 3', ARRAY['DB Split Squat', 'Leg Press + Leg Machines', 'Lat Pulldown', 'Seated Cable Row', 'Cable Woodchops', 'Plank with Row', 'Cable Face Pulls', 'Bicep Curls', 'Single-Leg Bridge', 'Reverse Crunch']),
  ('Shoulders & Arms','Full Body', 'Phase 3', ARRAY['KB Deadlift', 'Hamstring Curl', 'DB Overhead Press', 'Cable/Band Lateral Raise', 'Hanging Leg Raises', 'Landmine Rotation', 'Burpee DB Press', 'Diamond + Wide Pushups', 'Wall Sits (Weighted)', 'Windshields/Alternate Knee Raises']),
  ('Total Body',      'Full Body', 'Phase 3', ARRAY['DB Step-ups', 'Goblet Lateral Lunge', 'DB Renegade Row', 'Push-up (Weighted)', 'Medicine Ball Rotational Toss', 'Suitcase Carry (L/R)', 'Hammer Curl', 'Box Dips (Assist)', 'Lunge with Twist', 'Farmer''s Walk']),

  -- ── Upper / Lower / Upper ─────────────────────────────────────
  ('Upper 1', 'Upper / Lower', 'Upper', ARRAY['Bench Press', 'Barbell Row', 'Overhead Press', 'Lat Pulldown', 'Barbell Curl', 'Tricep Pushdown']),
  ('Upper 2', 'Upper / Lower', 'Upper', ARRAY['Incline Dumbbell Press', 'Cable Row', 'Dumbbell Shoulder Press', 'Chest-Supported Row', 'Hammer Curl', 'Overhead Tricep Extension']),

  -- ── Upper / Lower / Lower ─────────────────────────────────────
  ('Lower 1', 'Upper / Lower', 'Lower', ARRAY['Barbell Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise']),
  ('Lower 2', 'Upper / Lower', 'Lower', ARRAY['Deadlift', 'Bulgarian Split Squat', 'Leg Press', 'Leg Curl', 'Hip Thrust']),

  -- ── Push / Pull / Legs / Push ─────────────────────────────────
  ('Push 1', 'Push / Pull / Legs', 'Push', ARRAY['Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Cable Lateral Raise', 'Tricep Pushdown', 'Overhead Tricep Extension']),
  ('Push 2', 'Push / Pull / Legs', 'Push', ARRAY['Overhead Press', 'Incline Dumbbell Press', 'Dips', 'Cable Fly', 'Cable Lateral Raise', 'Tricep Rope Pushdown']),

  -- ── Push / Pull / Legs / Pull ─────────────────────────────────
  ('Pull 1', 'Push / Pull / Legs', 'Pull', ARRAY['Barbell Row', 'Lat Pulldown', 'Cable Row', 'Face Pull', 'Barbell Curl', 'Hammer Curl']),
  ('Pull 2', 'Push / Pull / Legs', 'Pull', ARRAY['Deadlift', 'Lat Pulldown', 'Chest-Supported Row', 'Face Pull', 'Hammer Curl', 'Cable Row']),

  -- ── Push / Pull / Legs / Legs ─────────────────────────────────
  ('Legs 1', 'Push / Pull / Legs', 'Legs', ARRAY['Barbell Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise', 'Plank', 'Hanging Leg Raise']),
  ('Legs 2', 'Push / Pull / Legs', 'Legs', ARRAY['Front Squat', 'Romanian Deadlift', 'Bulgarian Split Squat', 'Leg Curl', 'Hip Thrust', 'Calf Raise', 'Ab Wheel Rollout']),

  -- ── Abs & Core / Core Fundamentals ───────────────────────────
  ('Core: Beginner',      'Abs & Core', 'Core Fundamentals', ARRAY['Plank', 'Dead Bug', 'Bird Dog', 'Pallof Press', 'Glute Bridge', 'Side Plank']),
  ('Core: Intermediate',  'Abs & Core', 'Core Fundamentals', ARRAY['Ab Wheel Rollout', 'Hanging Knee Raise', 'Cable Crunch', 'Side Plank with Hip Dip', 'Copenhagen Plank', 'Pallof Press']),
  ('Core: Advanced',      'Abs & Core', 'Core Fundamentals', ARRAY['Hanging Leg Raise', 'Ab Wheel Rollout', 'Dragon Flag', 'Weighted Cable Crunch', 'Toes to Bar', 'L-Sit Hold']),

  -- ── Abs & Core / Ab Circuits ─────────────────────────────────
  ('Abs: Variation A', 'Abs & Core', 'Ab Circuits', ARRAY['Center Decline', 'Teapots', 'Single Leg Decline', 'Knee/Leg Raises', 'Plank', 'Plank Shoulder Taps', 'Deadbugs', 'Plank In and Outs', 'Decline Russian Twists', 'Knee to Elbows', 'Toe Taps', 'V-Ups']),
  ('Abs: Variation B', 'Abs & Core', 'Ab Circuits', ARRAY['V-Ups', 'Toe Taps', 'Knee to Elbows', 'Decline Russian Twists', 'Plank In and Outs', 'Deadbugs', 'Plank Shoulder Taps', 'Plank', 'Knee/Leg Raises', 'Single Leg Decline', 'Teapots', 'Center Decline']),
  ('Abs: Variation C', 'Abs & Core', 'Ab Circuits', ARRAY['Plank', 'Deadbugs', 'V-Ups', 'Center Decline', 'Teapots', 'Single Leg Decline', 'Knee/Leg Raises', 'Plank Shoulder Taps', 'Plank In and Outs', 'Decline Russian Twists', 'Knee to Elbows', 'Toe Taps']),
  ('Abs: Variation D', 'Abs & Core', 'Ab Circuits', ARRAY['Decline Russian Twists', 'Knee to Elbows', 'Toe Taps', 'V-Ups', 'Center Decline', 'Teapots', 'Single Leg Decline', 'Knee/Leg Raises', 'Plank', 'Plank Shoulder Taps', 'Deadbugs', 'Plank In and Outs'])

ON CONFLICT (name, split, subgroup) DO NOTHING;

-- ─── Migration: backfill missing muscle_group values ──────────────
-- Run this in the Supabase SQL editor to fix existing rows.
UPDATE exercises SET muscle_group = 'Legs'      WHERE name IN ('Treadmill Run', 'Cycling', 'High Knees (s)', 'Butt Kicks (s)', 'Rope Ladder Broad Jumps', 'Shuttle Runs (yd)', 'Speed Skaters', 'Ice Skater Steps') AND muscle_group IS NULL;
UPDATE exercises SET muscle_group = 'Back'      WHERE name IN ('Rowing Machine', 'Cobra Stretch') AND muscle_group IS NULL;
UPDATE exercises SET muscle_group = 'Core'      WHERE name IN ('Suitcase Carry (L/R)') AND muscle_group IS NULL;
UPDATE exercises SET muscle_group = 'Hips'      WHERE name IN ('Hip Circles') AND muscle_group IS NULL;
UPDATE exercises SET muscle_group = 'Full Body' WHERE muscle_group IS NULL;

-- ─── Migration 009: exercise tutorial links ────────────────────────
-- Verified YouTube tutorial links for core exercises.
UPDATE exercises SET help_url = 'https://youtu.be/vcBig73ojpE' WHERE name = 'Bench Press';
UPDATE exercises SET help_url = 'https://youtu.be/3PRwtVpyslo' WHERE name = 'Squat';
UPDATE exercises SET help_url = 'https://youtu.be/VL5Ab0T07e4' WHERE name = 'Deadlift';
UPDATE exercises SET help_url = 'https://youtu.be/CAwf7n6Luuc' WHERE name = 'Lat Pulldown';
