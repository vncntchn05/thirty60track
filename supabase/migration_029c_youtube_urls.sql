-- ================================================================
-- Migration 029c: Verified YouTube help_url links
-- Generated 2026-04-19T17:15:07.263Z
-- Source CSV: Supabase Snippet Link Client Row to Auth User (3).csv
-- [KEEP] = existing URL verified correct
-- [NEW]  = replaced or newly added via YouTube Data API v3 search
-- ================================================================

-- [KEEP] Hand Walks | "Hand Walks Exercise - Inchworms" (EverFlex Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/8YnINUa7OqE' WHERE id = '9580f0d6-6df5-463f-8f54-f03a37ecd227';

-- [KEEP] Figure Four Stretch | "Figure 4 stretching" (Canadian Chiropractic Guideline Initiative (CCGI))
UPDATE exercises SET help_url = 'https://youtu.be/Xb5gHdYtHnk' WHERE id = 'a4b1f027-1420-498c-824c-ce9b39cf6148';

-- [KEEP] Seated Glute Stretch | "Seated Glute Stretch to Relieve Deep Butt and Hip Tightness" (Michelle Kenway)
UPDATE exercises SET help_url = 'https://youtu.be/e3DZzHcwk3o' WHERE id = '750c8572-09c3-4754-91f1-0201d5bd3f26';

-- [KEEP] Sled Push | "How To Do The Sled Push The RIGHT Way! (AVOID MISTAKES!)" (Mind Pump TV)
UPDATE exercises SET help_url = 'https://youtu.be/9XRRXaUpnLk' WHERE id = 'c4eec08e-8fb9-4d52-965b-2b9ce21ded0a';

-- [KEEP] Side Lunge | "How to Do Side Lunges for Lean Legs | Health" (Health)
UPDATE exercises SET help_url = 'https://youtu.be/rvqLVxYqEvo' WHERE id = '3cf9bfff-d021-43fe-adc7-627e1f5b3795';

-- [KEEP] Burpee DB Press | "Dumbbell Burpee to Press #dumbbellworkout #dumbbell #dumbbellexercise" (Jump Start)
UPDATE exercises SET help_url = 'https://youtu.be/5FM1DQr2tq4' WHERE id = '2da0485e-39b8-4bc6-98b5-e6965aa1d947';

-- [KEEP] Side Iso Hops | "Side to Side Pogo Hops" (SHRP Training)
UPDATE exercises SET help_url = 'https://youtu.be/1nalEXWG8jo' WHERE id = 'ab73d889-e546-4d6a-b571-10b81f12d63d';

-- [KEEP] Mid Row | "How to Use the Mid Row Machine (Correct Form) #correctform" (Hitesh Malhotraa Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/yrRHFZ3MDxA' WHERE id = '21d5a91e-7e45-4245-8df4-58365c7a4664';

-- [KEEP] Depth Jumps | "How To Depth Jumps" (Third Space London)
UPDATE exercises SET help_url = 'https://youtu.be/DxzbXy0lC6Y' WHERE id = '13bcc775-1601-46ab-86a1-ea97f93afdd0';

-- [KEEP] squat row | "How to: TRX Squat #trxworkout #fitnesstutorial #workouttips" (DeSouthFit)
UPDATE exercises SET help_url = 'https://youtu.be/q-Cqh92uI18' WHERE id = 'c5b0c5ce-4dc2-4f28-ba12-fcf87bb13540';

-- [KEEP] Cable Torso Rotations | "How to do the cable oblique twist📈 #gymtips #gymworkout #exercisetips #howtogetabs #obliqueworkout" (Troy Sutton)
UPDATE exercises SET help_url = 'https://youtu.be/yglSetVOFeA' WHERE id = '7414faf7-5b3d-4516-b547-402aef80f6cb';

-- [KEEP] Cable/Band Lateral Raise | "Cable Lateral Raise Setup in 10 Seconds !✅" (Aakash Wadhwani)
UPDATE exercises SET help_url = 'https://youtu.be/lMJUXEvcMkQ' WHERE id = 'f13a998b-eb1a-4455-9105-33250861b7a1';

-- [KEEP] Butt Kicks (s) | "Butt Kicks Running Drill For Beginners" (Chari Hawkins)
UPDATE exercises SET help_url = 'https://youtu.be/s-iQOKtNW3A' WHERE id = '1864aeec-79c9-4c11-84c2-1042e3878e09';

-- [KEEP] BW Back Extensions | "Back extension causing low back pain? Here is how to fix" (TylerPath)
UPDATE exercises SET help_url = 'https://youtu.be/upxW1WlptUE' WHERE id = '9357fd37-c9af-4342-b0d8-5bcab3f6a576';

-- [KEEP] Center Decline | "Decline Chest Press Tutorial" (Mustang Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/Bu3iLcCqBAI' WHERE id = 'eb1d1628-615c-42d2-b565-922f635fa96f';

-- [KEEP] Chin-up Negatives | "Negative Chin-up Technique - Beginner Tutorial to Practice for Pull-ups - by BarStarzzBTX.com" (Passion.io)
UPDATE exercises SET help_url = 'https://youtu.be/mjNHoibfrMo' WHERE id = 'd28bad1f-9317-4fe5-8af9-c30d4f5a25ac';

-- [KEEP] Cobra Stretch | "Cobra Stretch" (FitnessBlender)
UPDATE exercises SET help_url = 'https://youtu.be/JDcdhTuycOI' WHERE id = '6cbdef15-f16c-43b0-b382-439659baf9dc';

-- [KEEP] Crab Walk | "How to Do Crabwalk Exercises | Rothman Orthopaedics" (Rothman Orthopaedics)
UPDATE exercises SET help_url = 'https://youtu.be/XAHZRIoNsHE' WHERE id = '12629028-b516-4911-ba6c-6bd9dd9f3b1a';

-- [KEEP] Decline Russian Twists | "STOP Doing Russian Twists Like This! (SAVE A FRIEND)" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/-BzNffL_6YE' WHERE id = 'cf95ab21-d763-4b59-a32c-2bae48a03a1c';

-- [KEEP] Cross-Body Shoulder Stretch | "Shoulder Crossbody Stretch" (React Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/aIq0fLi8iak' WHERE id = '3c6389cc-09bb-40f7-b72a-ac12c4d60b9b';

-- [KEEP] pull up assists | "here's how to properly use the assisted pull-up machine with @gerardiperformance" (Fitness Reels)
UPDATE exercises SET help_url = 'https://youtu.be/owMowIRkyvQ' WHERE id = '904ff81f-9e75-4455-87c1-bfb604607164';

-- [KEEP] Pilates Squat + Squat | "Squat | Pilates Exercises for Cancer Patients" (Roswell Park Comprehensive Cancer Center)
UPDATE exercises SET help_url = 'https://youtu.be/xrJzRE0Cv0c' WHERE id = '654f644b-38ae-42cb-8c02-01d00aa73ed9';

-- [KEEP] Diamond + Wide Pushups | "✅ How to Do the Perfect Diamond Push-Up #shorts" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/PPTj-MW2tcs' WHERE id = '77f163e9-432b-46d0-b862-11a98e9e9f4a';

-- [KEEP] Flutter Kicks | "How To Do Flutter Kicks (The Right Way)" (Benson Specialized Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/tPmybsDX8ZY' WHERE id = 'c83f6c93-4404-4b34-8956-23d07f7d0f20';

-- [KEEP] Prayer Stretch | "Prayer Stretch" (Coury & Buehler Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/yIby7iIVL4k' WHERE id = '92c01251-6aaf-4332-9624-163ea241a28a';

-- [KEEP] Foot Hop | "TruFit UNIT - One Foot Hop" (GetTruFit)
UPDATE exercises SET help_url = 'https://youtu.be/swM4-OPn_6M' WHERE id = 'd124b685-a77e-44c1-ae80-b39e94bf60d0';

-- [KEEP] Glute Bridge (Pulsing) | "How to Perform the Perfect Glute Bridge" (Airrosti Rehab Centers)
UPDATE exercises SET help_url = 'https://youtu.be/OUgsJ8-Vi0E' WHERE id = '8d897c23-bfc5-45f3-ab5b-4d3792224a63';

-- [KEEP] Alternate Hammer Curl | "Hammer Curls: Know The Difference ⚠️ #armsworkout" (Hazzytrainer)
UPDATE exercises SET help_url = 'https://youtu.be/8H5oWMNWWeQ' WHERE id = '0cf918e5-18dd-448c-962c-5acba7da0151';

-- [KEEP] Landmine | "Stability Meets Range Of Motion With These Landmine Exercises #SHORT" (Marcus Filly)
UPDATE exercises SET help_url = 'https://youtu.be/0efz8srgH7c' WHERE id = '8ce1f9f7-cc52-4d9d-b530-f64766ffc3e8';

-- [KEEP] Landmine Rotation | "Landmine Rotation" (O.B. Training & Sports Performance)
UPDATE exercises SET help_url = 'https://youtu.be/MswsBPLGhE8' WHERE id = 'dabea74e-389c-4fa8-bcd4-a7f9cf2c652b';

-- [KEEP] Bicep Curls | "STOP Doing This On Bicep Curls!" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/VCw_uIxW8WE' WHERE id = '943d0c35-70bf-4fb3-993e-69782f63aee7';

-- [KEEP] Single-Leg Reach (Bulg Squat) | "Bulgarian Split Squat - Easiest Setup" (Alex Thieme)
UPDATE exercises SET help_url = 'https://youtu.be/Q20qIs79tJc' WHERE id = 'da6ae97d-5308-4bc8-9c72-6bf21f6a9e02';

-- [KEEP] Reverse Prayer Stretch | "Reverse Prayer Stretch" (ReShape Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/chPRkQUcsw0' WHERE id = '259ef0ba-2328-4135-b4e9-2fda23c4e289';

-- [KEEP] Glute Bridge Hold | "How to Perform the Perfect Glute Bridge" (Airrosti Rehab Centers)
UPDATE exercises SET help_url = 'https://youtu.be/OUgsJ8-Vi0E' WHERE id = 'c7c8c551-9b6a-422c-999f-5e44afa14afe';

-- [KEEP] High Knees (s) | "Avoid Mistake high knees exercise" (QIM FITNESS)
UPDATE exercises SET help_url = 'https://youtu.be/0X0Q8wKLEfo' WHERE id = '2106002e-fdc9-4285-a701-91fb8b6fa35f';

-- [KEEP] Hip Circles | "Pro Tip: Hip Circles" (Mobility Doc)
UPDATE exercises SET help_url = 'https://youtu.be/x-5h_QUOem8' WHERE id = '18643250-2fc2-4d8a-9d5c-8d5175c18a67';

-- [KEEP] Ice Skater Steps | "How to Ice Skate - Ten Tips for Absolute Beginners" (How To Inline Skate)
UPDATE exercises SET help_url = 'https://youtu.be/-vKYvvJ_-Hg' WHERE id = '248244d3-4ba6-4f58-9772-1b5c0d15472e';

-- [KEEP] In-Out Jumping Jacks | "HOW TO: JUMPING JACKS #jumpingjacks #cardio #exercise" (Courtneyofitness)
UPDATE exercises SET help_url = 'https://youtu.be/7Pxr4xOrhNk' WHERE id = 'be3a9444-ec1d-4e35-9ba3-f0dfa03d040d';

-- [KEEP] Inchworm Push-Up | "How to Do Inchworm Push Ups Correctly | Exercise of The Day #30" (Brian Syuki )
UPDATE exercises SET help_url = 'https://youtu.be/LCO4GQBEroA' WHERE id = 'c8fca4fc-caa2-4753-9639-4ee7c8d6b945';

-- [KEEP] Incline Push-up | "How To Do An Incline Push Up" (Train With Adby - Personal Training Gym)
UPDATE exercises SET help_url = 'https://youtu.be/cfns5VDVVvk' WHERE id = '1b051178-b5a1-4122-8235-cad6594e81fe';

-- [KEEP] Finger Extension Stretch | "Best 4 Exercises for Finger Extension (Get Your Finger STRAIGHT)" (Virtual Hand Care)
UPDATE exercises SET help_url = 'https://youtu.be/FfFK4e8sviY' WHERE id = '23e811f4-b56b-43e5-852e-64d53d770515';

-- [KEEP] Standing Wide Row | "Cable Row Grip Widths & Muscles Worked!" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/vqPY3fDessY' WHERE id = 'edb9bf16-8024-4b84-9902-c793b62e5efc';

-- [KEEP] Decline situp | "How to improve your sit-ups (decline tips)" (Quinlan Smith)
UPDATE exercises SET help_url = 'https://youtu.be/KZ7EWSAkpdM' WHERE id = '1de702f5-6e9f-46e0-874a-a84cc38e35ab';

-- [KEEP] Seated Cable Row High Elbows | "How to do a seated row" (Nuffield Health)
UPDATE exercises SET help_url = 'https://youtu.be/DHA7QGDa2qg' WHERE id = '3a95c330-2b4a-445b-b718-e3cddb1318f4';

-- [KEEP] Single-Arm Lat Pulldown | "Exercise Tutorial: Single-Arm Lat Pull-Down" (Ben Yanes)
UPDATE exercises SET help_url = 'https://youtu.be/M9xUoJYtXtc' WHERE id = '810800fa-4abe-4f2f-be36-78561695695a';

-- [KEEP] teapot situp | "Teapots Core Exercise" (Michelle Pottratz)
UPDATE exercises SET help_url = 'https://youtu.be/0Ss71jGBuAs' WHERE id = '5981cea0-33c0-4371-ab64-98231f667235';

-- [KEEP] DB Renegade Row | "Renegade Row: Core & Back Builder" (BuiltLean®)
UPDATE exercises SET help_url = 'https://youtu.be/wTqlJ0aoJlM' WHERE id = '8996206f-c166-4c1a-b6b2-7c5228fc6a1f';

-- [KEEP] Knee to Elbows | "How To: Alternating Knee To Elbow Crunches" (Forty Steps)
UPDATE exercises SET help_url = 'https://youtu.be/v_tM1pppjSU' WHERE id = '31152657-723a-4b30-8262-38d842dcaa2d';

-- [KEEP] Alt side lunge Plus Dumbbell Rows | "Dumbbell- lateral lunge switching DB side to side" (Recreate Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/KyygUQrhcwI' WHERE id = 'bdb7a488-5369-4dbb-ac9c-f2057d6f3def';

-- [KEEP] Alternating Pullover | "The Best Way To Do Pullovers For Growth" (FitnessFAQs)
UPDATE exercises SET help_url = 'https://youtu.be/gbDH1OvCe-M' WHERE id = '3d97b250-6c50-48b7-a272-e717fe098224';

-- [KEEP] Seated Resistance Band Rows | "How To Do A Resistance Band Row" (Get Healthy U - with Chris Freytag)
UPDATE exercises SET help_url = 'https://youtu.be/LSkyinhmA8k' WHERE id = 'f7c2edef-9181-4535-bf0f-ba3259048f6a';

-- [KEEP] Standing Narrow Row | "How To Do Bent Over Rows (With Dumbbells) #shorts" (Heather Robertson)
UPDATE exercises SET help_url = 'https://youtu.be/vN8xskk-7G8' WHERE id = '4e7a5a46-149f-4ad6-849f-80fc15d80622';

-- [KEEP] standing row narrow | "The PERFECT Barbell Row (5 Steps)" (Jeremy Ethier Shorts)
UPDATE exercises SET help_url = 'https://youtu.be/Nqh7q3zDCoQ' WHERE id = '6e3153e3-97f9-4407-8b23-141f5b8515c8';

-- [KEEP] Ankle Circles | "Ankle Circles" (MyMichiganHealth)
UPDATE exercises SET help_url = 'https://youtu.be/uV0I5adTRXw' WHERE id = 'ea65b8dd-aaa9-4926-bd24-ab92a25104a6';

-- [KEEP] Knee/Leg Raises | "How To: Hanging Knee / Leg Raise | BUILD A “SCIENCED BASED” 6-PACK!" (ScottHermanFitness)
UPDATE exercises SET help_url = 'https://youtu.be/X-ACS9vpRyU' WHERE id = '69a4bf0e-0e20-4b65-b3cc-9882a3309062';

-- [KEEP] Lateral Bounds | "Lateral Bound" (Nick Brattain)
UPDATE exercises SET help_url = 'https://youtu.be/Hc9_FQgIeeg' WHERE id = '4bc16b71-dffb-4876-ad09-44b6011b9cbb';

-- [KEEP] Leg Press + Leg Machines | "How To Leg Press With Perfect Technique" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/nDh_BlnLCGc' WHERE id = '96cbdbec-8e99-4147-aa3a-846681eb2954';

-- [KEEP] Alternating Kettlebell Row | "How to Perform the Kettlebell Row | Important Full Body Exercise" (Greg Brookes)
UPDATE exercises SET help_url = 'https://youtu.be/IyQAMOV0WAc' WHERE id = '9ff32d08-fab2-4657-a276-094f335e0b7d';

-- [KEEP] Farmer's Walk | "How To Do Farmer’s Walk Exercise @CoachAlexKopp" (Gymreapers)
UPDATE exercises SET help_url = 'https://youtu.be/4d-4gKn_lKk' WHERE id = '18be71da-bf4e-459d-9a6c-d58432d5f1ab';

-- [KEEP] Goblet Lateral Lunge | "Goblet Lateral Lunge" (Wilmington Strength)
UPDATE exercises SET help_url = 'https://youtu.be/8OgO3XjyLMo' WHERE id = '67c1a3ca-078a-4c75-8b65-9d53463579e6';

-- [KEEP] Ball Squat Toss | "Medicine Ball Squat Toss" (802 CrossFit)
UPDATE exercises SET help_url = 'https://youtu.be/jIBkXDJDTgI' WHERE id = '6ca47d6e-e9fa-4595-9892-281633b47a5e';

-- [KEEP] Lateral Lunge | "How to Do Side Lunges for Lean Legs | Health" (Health)
UPDATE exercises SET help_url = 'https://youtu.be/rvqLVxYqEvo' WHERE id = '21203646-8186-4017-916a-258936ec8d13';

-- [KEEP] Lunge with Twist | "Lunge with Twist" (Daily Workout Builder)
UPDATE exercises SET help_url = 'https://youtu.be/peb887Bc0-Q' WHERE id = 'ac37e8b1-2813-4760-8da8-17d07f1e3333';

-- [KEEP] Rhomboids-SMR | "Rhomboids SMR  Exercise Videos & Guides  Bodybuilding com" (how to lose weight with the keto diet)
UPDATE exercises SET help_url = 'https://youtu.be/gyHsdmSo5qY' WHERE id = 'c66be6d6-9aea-49b8-b4ba-c4e11ae4f86d';

-- [KEEP] Floor Press + Mod Push-up | "How to Learn Full PLANCHE Push Up?" (Andry Strong)
UPDATE exercises SET help_url = 'https://youtu.be/lMSenJbj2DM' WHERE id = '99f25f33-e9a2-42ad-a230-7fab43488a11';

-- [KEEP] Cable Crunch | "How To: Cable Crunch | Form Tutorial" (Kade Howell)
UPDATE exercises SET help_url = 'https://youtu.be/dkGwcfo9zto' WHERE id = '45de9606-18c3-4500-9a28-cdf440454d51';

-- [KEEP] Cable Squat Row | "Squat to Cable Row" (University of Denver Sports Performance)
UPDATE exercises SET help_url = 'https://youtu.be/tlb6fMI3XXg' WHERE id = 'fd61b1ba-c236-4e99-8e02-cf48b6517ba4';

-- [KEEP] Pec Minor Stretch | "How To Release Pec Minor" (Bulletproof Shoulders with Jason)
UPDATE exercises SET help_url = 'https://youtu.be/HmB8M3CEBCM' WHERE id = 'd8078b91-d499-439e-b418-fd7eab7efa1d';

-- [KEEP] Box Jump | "How to Do Beginner Box Jump Exercises" (National Academy of Sports Medicine (NASM))
UPDATE exercises SET help_url = 'https://youtu.be/kNIInK_Le8I' WHERE id = '57854382-962e-41d6-9c02-09fe7de709fa';

-- [KEEP] Dynamic Side Lunges | "Side Lunge" (Explore Movement )
UPDATE exercises SET help_url = 'https://youtu.be/TnOkq6KfHsM' WHERE id = '1eda2e14-ca78-4a6b-8f55-a9560dd40bd4';

-- [KEEP] Lying Quad Stretch | "How To Side Hip and Quad Stretch | Nuffield Health" (Nuffield Health)
UPDATE exercises SET help_url = 'https://youtu.be/_xU-wIiMxpI' WHERE id = '8b74c192-8310-44a4-b418-34246625b8f2';

-- [KEEP] Seated Hamstring Stretch | "Hamstring Stretch Seated" (Hope Physical Therapy and Aquatics)
UPDATE exercises SET help_url = 'https://youtu.be/aJvfeuu71gw' WHERE id = 'a6dde5d3-f633-4ee9-8dde-45b9e6944fe4';

-- [KEEP] Seated Forward Fold | "Transform your seated forward fold with 1 hack (Tip to improve Hamstring Flexibility). #yogatips" (YogaCandi)
UPDATE exercises SET help_url = 'https://youtu.be/1E-84p0itDs' WHERE id = '86826a31-7033-400b-818f-ab9e1282fa4a';

-- [KEEP] World's Greatest Stretch | "World’s Greatest Stretch | Full Body Mobility Exercise | Easy Workout | Body Stretch | Cure Fit" (wearecult)
UPDATE exercises SET help_url = 'https://youtu.be/OvObOV0WrKw' WHERE id = '7d381adb-2d3f-44e6-b08a-07f28cd5e23d';

-- [KEEP] 90/90 Hip Stretch | "How to do a 90/90 Hip Stretch properly - CORRECT FORM IS ESSENTIAL" (Jack Hanrahan Fitness )
UPDATE exercises SET help_url = 'https://youtu.be/VYvMMw8z3rE' WHERE id = 'febdf791-c9bc-476b-b72c-a5dc834eafdc';

-- [KEEP] Chest Pass (Med Ball) | "Standing Medicine Ball Chest Pass" (Jordan Weber Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/IeOeonCFarM' WHERE id = '546e0d13-6653-4d60-a113-a094fc6e1c97';

-- [KEEP] Doorway Chest Stretch | "Doorway Chest Stretch - Pectoralis Major and Minor exercise" (Rehab Hero)
UPDATE exercises SET help_url = 'https://youtu.be/O8rJw_TmC1Y' WHERE id = '64a364d9-efcf-4f13-adc7-28d129afb28c';

-- [KEEP] Supine Twist | "Supine Spinal Twist" (KE Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/ElKoMMaTPCM' WHERE id = 'dad51a7c-f1ec-4e11-867f-493c67fe45fe';

-- [KEEP] Box Step-ups | "Step up form for QUADS vs GLUTES 🔥 #shorts" (LISAFIITT)
UPDATE exercises SET help_url = 'https://youtu.be/8q9LVgN2RD4' WHERE id = '2a6c163b-5e09-4f99-8d26-805e3dfabe8e';

-- [KEEP] Day 1 Push | "Best Push Workout For 2025 (Chest, Shoulders & Triceps)" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/bvwg4D9UWGI' WHERE id = '1804af5b-0324-4a07-88d1-5d2710aaa75d';

-- [KEEP] Burpees | "How To Do Burpees Correctly by Cult Fit | Burpees For Beginners| Burpees Workout | Cult Fit|Cure Fit" (wearecult)
UPDATE exercises SET help_url = 'https://youtu.be/xQdyIrSSFnE' WHERE id = '5af004e8-94b3-4cbb-9b0e-df6ca4b28963';

-- [KEEP] Crunch | "Best abs exercises: Abdominal Crunch - Upper Abs - How to do crunch exercise" (P4P WORKOUTS )
UPDATE exercises SET help_url = 'https://youtu.be/_M2Etme-tfE' WHERE id = 'bb8a0810-ec61-4c99-a113-d7bb8798a6a0';

-- [KEEP] Wrist Flexor Stretch | "WRIST FLEXOR STRETCH" (Muscle & Motion)
UPDATE exercises SET help_url = 'https://youtu.be/63LEj3oP6lA' WHERE id = 'b3bfa485-1df8-4bb9-a439-43e35e80c610';

-- [KEEP] Pistol Squat | "Perform Your First Pistol Squat Using These Progressions" ([P]rehab)
UPDATE exercises SET help_url = 'https://youtu.be/bH3mRwnAN88' WHERE id = 'f298ee0b-3d2a-4dac-afe2-486cd6bc6887';

-- [KEEP] reverse lunges | "How To Perform The Reverse Lunge" (Dr. Carl Baird)
UPDATE exercises SET help_url = 'https://youtu.be/Ry-wqegeKlE' WHERE id = 'f774f5fc-300e-43ab-b364-6f060162ba5d';

-- [KEEP] Wrist Extensor Stretch | "Wrist Extensors Stretch" (Empower Movement Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/T2pO53x4cNs' WHERE id = '6844a583-4c6e-491c-99ad-c602803fbfd0';

-- [KEEP] Ankle Dorsiflexion Stretch | "Ankle Mobility Hack #shorts" (MovementbyDavid)
UPDATE exercises SET help_url = 'https://youtu.be/m6J-9oQ9lHQ' WHERE id = '193001a3-eebe-4761-9861-0fc3b316aee7';

-- [KEEP] Shoulder Sleeper Stretch | "Sleeper Stretch | Nuffield Health" (Nuffield Health)
UPDATE exercises SET help_url = 'https://youtu.be/a_Z9WhGyKkE' WHERE id = '4cebc36a-6b49-4779-af1b-d14e6cac33fd';

-- [KEEP] Neck Side Stretch | "3 Best Neck Stretches For FAST Pain Relief! [INSTANT!]" (Tone and Tighten)
UPDATE exercises SET help_url = 'https://youtu.be/6Tr3GLfySYo' WHERE id = 'a4b1239d-26ca-4110-8833-a302e2a20f91';

-- [KEEP] Neck Flexion Stretch | "3 Best Neck Stretches For FAST Pain Relief! [INSTANT!]" (Tone and Tighten)
UPDATE exercises SET help_url = 'https://youtu.be/6Tr3GLfySYo' WHERE id = '28f95059-92b4-4c06-be15-3a662cdfe816';

-- [KEEP] Posterior Shoulder Stretch | "Stretch - Posterior shoulder stretch" (Canadian Chiropractic Guideline Initiative (CCGI))
UPDATE exercises SET help_url = 'https://youtu.be/9XE8pkcBwMs' WHERE id = '61aa2277-6cc3-4331-adea-4e3c3b1204a2';

-- [KEEP] Bicep Wall Stretch | "Bicep stretch that works on everyone #exercise#shoulderpain #shoulderworkout #calisthenics #pain#fix" (Restore Muscle Therapy & Canberra SoftTissue Thera)
UPDATE exercises SET help_url = 'https://youtu.be/j0rdJpN4B8Y' WHERE id = '075ed000-6fba-4e71-bd25-47eec853294c';

-- [KEEP] Forearm Flexor Stretch | "WRIST FLEXOR STRETCH" (Muscle & Motion)
UPDATE exercises SET help_url = 'https://youtu.be/63LEj3oP6lA' WHERE id = '34afc986-8a2c-4e73-a47f-66cddf004f20';

-- [KEEP] Bench Sprint | "How To Do A BENCH SPRINT | Exercise Demonstration Video and Guide" (Live Lean TV Daily Exercises)
UPDATE exercises SET help_url = 'https://youtu.be/fC4GiRdITqE' WHERE id = 'ad5739d0-0cf0-4850-8d38-10888a207ec2';

-- [KEEP] Piriformis Stretch | "Figure 4 (Piriformis) Stretch for Sciatica Pain" (Vive Health)
UPDATE exercises SET help_url = 'https://youtu.be/E6sqUHFt6Ng' WHERE id = '78ea4d3c-a29e-49d2-9a38-e39188022c4f';

-- [KEEP] Thumb Stretch | "7 Thumb Joint (CMC) Stretches & Exercises" (AskDoctorJo)
UPDATE exercises SET help_url = 'https://youtu.be/wK4II92qHDs' WHERE id = '2401c894-2638-4f25-a37d-b8fcf466e74c';

-- [KEEP] Seated Chest Press | "The PERFECT Machine Chest Press" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/Qu7-ceCvq7w' WHERE id = 'be037b2d-956d-4c7b-9aca-67e3126cbe29';

-- [KEEP] Weighted Sit-up | "How to Do a Weighted Sit-Up" (LIVESTRONG)
UPDATE exercises SET help_url = 'https://youtu.be/kZvSaq192cg' WHERE id = '55a30e65-f179-4c14-a937-cae697ae2ec3';

-- [KEEP] Wall Sit | "How to do a wall sit" (YOGABODY)
UPDATE exercises SET help_url = 'https://youtu.be/mDdLC-yKudY' WHERE id = '7ca23901-a8a3-4374-980a-810c09707f2d';

-- [KEEP] Wrist Circles | "How To Do KNEELING WRIST CIRCLES | Exercise Demonstration Video and Guide" (Live Lean TV Daily Exercises)
UPDATE exercises SET help_url = 'https://youtu.be/20Y-W5fHPEM' WHERE id = '3855a501-0355-4ef9-b924-ac3cc7a37ba6';

-- [KEEP] Tendon Glide | "Tendon Glide Exercises | Ability Rehabilitation" (Ability Rehabilitation)
UPDATE exercises SET help_url = 'https://youtu.be/favZefGkiHk' WHERE id = 'ff1e84ad-9f6c-45b4-8abe-6165ea95190a';

-- [KEEP] Toe Spread Stretch | "Stretch Your Toes…Wellness Will Grow!  Dr. Mandell" (motivationaldoc)
UPDATE exercises SET help_url = 'https://youtu.be/xr0O6x7h5fU' WHERE id = 'ce8e07a5-b7ff-4e5d-9c4c-228cc2f67051';

-- [KEEP] Seated Calf & Ankle Stretch | "Gastroc and Soleus Calf Stretching" ([P]rehab)
UPDATE exercises SET help_url = 'https://youtu.be/dEJgPRgsnnY' WHERE id = '23bbc036-3eb2-496a-9a7a-18fa3517393f';

-- [KEEP] Levator Scapulae Stretch | "Levator Scapula Stretch - Ask Doctor Jo" (AskDoctorJo)
UPDATE exercises SET help_url = 'https://youtu.be/GSoXPJRnR6E' WHERE id = '4c63c00f-12ca-4d06-8660-08c65a51c7d6';

-- [KEEP] Progressive Muscle Relaxation | "Reduce Stress through Progressive Muscle Relaxation (3 of 3)" (Johns Hopkins Rheumatology)
UPDATE exercises SET help_url = 'https://youtu.be/ClqPtWzozXs' WHERE id = '13a39bb1-ef8a-4b85-8930-13d98a2ec9ca';

-- [KEEP] Jump Squats | "HOW TO JUMP SQUAT #shorts" (Justina Ercole)
UPDATE exercises SET help_url = 'https://youtu.be/h5TmdMMtIT4' WHERE id = '4e62211d-c7e3-46ec-89f1-bed8b48972fe';

-- [KEEP] Jumping Jacks (s) | "How to do Jumping Jacks exercise - Best Cardio Exercises video tutorial" (P4P WORKOUTS )
UPDATE exercises SET help_url = 'https://youtu.be/XR0xeuK5zBU' WHERE id = '68c4185e-06bb-4c36-b162-bfb91d93b987';

-- [KEEP] Seated Arm Circles | "SEATED ARM CIRCLES | Exercise Guide | Safe Exercise for Osteoporosis" (Bonestrong Labs)
UPDATE exercises SET help_url = 'https://youtu.be/5R2aFtejVlE' WHERE id = 'f49246b1-c18a-4464-9060-50e163b08176';

-- [KEEP] Intrinsic Foot Strengthening | "Build Strong Feet: Exercises To Strengthen Your Foot & Ankle" (E3 Rehab)
UPDATE exercises SET help_url = 'https://youtu.be/S5xKokqeOb4' WHERE id = '43a8ef72-e170-4ec1-a7d3-64fc99851ac8';

-- [KEEP] Wall Sits (Weighted) | "How to do a wall sit" (YOGABODY)
UPDATE exercises SET help_url = 'https://youtu.be/mDdLC-yKudY' WHERE id = 'b724551f-b5e5-4826-b35d-1bfc5511f431';

-- [KEEP] Wall Balls | "Wall Balls: The Do’s & Don’t’s" (CrossFit OYL)
UPDATE exercises SET help_url = 'https://youtu.be/WGM7FjbDJUA' WHERE id = '3f46f284-24ef-49e9-92ff-f54d717955f1';

-- [KEEP] Front Squats With Two Kettlebells | "The BEST exercise to fix functionality and athleticism—Kettlebell 67—Double Front Squat" (Mark Wildman)
UPDATE exercises SET help_url = 'https://youtu.be/dX5yXJa5Dm0' WHERE id = '271097db-9be9-4f37-8155-905e648d1ab1';

-- [KEEP] Chest Opener Stretch | "Standing Chest Opener" (St. Peter's Health)
UPDATE exercises SET help_url = 'https://youtu.be/crnw1IKWNZY' WHERE id = '3600076a-d91b-4653-aec8-9dbe1a4c38a4';

-- [KEEP] Lat Doorway Stretch | "Doorway Lat Stretch" (Catalyst Physical Therapy & Wellness)
UPDATE exercises SET help_url = 'https://youtu.be/5HLQAVOvxNE' WHERE id = '178dd043-84e0-4f32-84a4-6203c0d6c414';

-- [KEEP] Prone Cobra | "Prone Cobra" (the Bodysmith)
UPDATE exercises SET help_url = 'https://youtu.be/hcTILl3cVkQ' WHERE id = '2fec7a78-a8f1-421a-92c1-02a682ea2e71';

-- [KEEP] Hip Flexor Stretch | "How to PROPERLY Perform the Kneeling Hip Flexor Stretch With Good Form (For Tight Hip Flexors)" (Gerardi Performance)
UPDATE exercises SET help_url = 'https://youtu.be/ktgtEWGhFd8' WHERE id = '919fce78-c74c-44cb-ad1f-d18d4fb14959';

-- [KEEP] Couch Stretch | "Couch stretch | The MSK Physio" (The Musculoskeletal Clinic)
UPDATE exercises SET help_url = 'https://youtu.be/B3rOeBLqlF4' WHERE id = 'd7cefd33-1222-4277-9414-0b3db7b1d1e8';

-- [KEEP] decline situp | "How to Properly do Decline Ab Crunches" (TylerPath)
UPDATE exercises SET help_url = 'https://youtu.be/xfNAzPwNRqw' WHERE id = 'ecb029d5-ea2f-425a-8782-f42df8abc9fb';

-- [KEEP] IT Band Stretch | "BEST Stretches for IT Band (Iliotibial band) Pain" (VIGEO)
UPDATE exercises SET help_url = 'https://youtu.be/aOQOV6LG9nw' WHERE id = 'b8700034-51a3-4f2a-999f-cb6354d9cc24';

-- [KEEP] Standing Quad Stretch | "Standing Quadricep Stretch" (Baptist Health)
UPDATE exercises SET help_url = 'https://youtu.be/zi5__zBRzYc' WHERE id = 'c2fc7398-6a0d-458f-ad1c-814ee3e79e5f';

-- [KEEP] Standing Hamstring Stretch | "Hamstring Stretch: Post-Race Standing Stretches" (Runner's World)
UPDATE exercises SET help_url = 'https://youtu.be/inLULJztZh0' WHERE id = '3813831a-8a99-4af3-bcf4-3f5982f9f058';

-- [KEEP] Thoracic Spine Rotation | "All-4s Thoracic Spine Rotations" (Daily Workout Builder)
UPDATE exercises SET help_url = 'https://youtu.be/l3Ze_9iXL-M' WHERE id = '6cf2b6b8-622c-4231-8d5a-442776194098';

-- [KEEP] Thread the Needle | "Threading the needle - a thoracic spine stretch" (Six Physio)
UPDATE exercises SET help_url = 'https://youtu.be/MfUx9FCOb1E' WHERE id = '941e9820-69b0-42e3-86ee-ea96c79513ff';

-- [KEEP] Butterfly Stretch | "Butterfly Stretch - Adductor (Groin) Stretch" (Elevate Health UK)
UPDATE exercises SET help_url = 'https://youtu.be/5vbljPADsAo' WHERE id = '0285b0e9-4cea-4aa4-ac1c-f296e799b152';

-- [KEEP] Sleeper Stretch | "Sleeper Stretch for Posterior Shoulder Mobility" (The Barbell Physio)
UPDATE exercises SET help_url = 'https://youtu.be/clqjaMIRWfM' WHERE id = 'e228a3dc-b2ce-4b82-bd59-f654a68e9d6b';

-- [KEEP] Standing Calf Stretch | "Standing Calf Stretch Technique #shorts" (Doctor O'Donovan)
UPDATE exercises SET help_url = 'https://youtu.be/7SO6QzfBRaE' WHERE id = 'c12a4afd-ef45-4255-b087-cc232e0b2179';

-- [KEEP] 3/4 Sit-Up | "How Properly Perform Sit Ups With Different Hand Positions (Hardest to Easiest)" (Gerardi Performance)
UPDATE exercises SET help_url = 'https://youtu.be/GSjm29FESiQ' WHERE id = 'b96ac656-28d0-4f95-99b3-4fd8c9dd935e';

-- [KEEP] Arm Circles & Shoulder Mobility | "The easy way to Shoulder Mobility #shorts" (MovementbyDavid)
UPDATE exercises SET help_url = 'https://youtu.be/E31XgctzPDQ' WHERE id = '04d15626-cea2-4eaa-b9fe-9c09a1b0132a';

-- [KEEP] incline Press | "How To: Dumbbell Incline Press | 3 GOLDEN RULES (MADE BETTER!)" (ScottHermanFitness)
UPDATE exercises SET help_url = 'https://youtu.be/hChjZQhX1Ls' WHERE id = 'eb6d7742-21cd-4f99-858d-bf32bd561786';

-- [KEEP] Achilles Tendon Stretch | "Achilles Tendon Stretches - Ask Doctor Jo" (AskDoctorJo)
UPDATE exercises SET help_url = 'https://youtu.be/vU_FVahd4HI' WHERE id = '24a9ba79-26de-4908-9cb9-44a698faca46';

-- [KEEP] Plantar Fascia Stretch | "3 Stretches To Melt Plantar Fasciitis" (Movement Project PT)
UPDATE exercises SET help_url = 'https://youtu.be/LX1bHBOmjXA' WHERE id = 'dce0b1fe-11a4-4281-8e6c-951e058c27a1';

-- [KEEP] Diaphragmatic Breathing | "How to do Diaphragmatic Breathing Exercises for Beginners | PHYSIOTHERAPY" (Michelle Kenway)
UPDATE exercises SET help_url = 'https://youtu.be/9jpchJcKivk' WHERE id = '92aa8624-b7f4-4d04-9100-a8f3dad21764';

-- [KEEP] Pursed-Lip Breathing | "Pursed Lip Breathing" (American Lung Association)
UPDATE exercises SET help_url = 'https://youtu.be/7kpJ0QlRss4' WHERE id = 'b7568ee2-2827-4c6b-925c-80ef80d110d6';

-- [KEEP] Child's Pose Decompression | "Child Pose" (Baptist Health)
UPDATE exercises SET help_url = 'https://youtu.be/kH12QrSGedM' WHERE id = '2b40e477-b31c-4335-ab11-d5dd4700afc1';

-- [KEEP] Seated Sciatic Nerve Glide | "Seated Sciatic Nerve Glide" (The Active Life)
UPDATE exercises SET help_url = 'https://youtu.be/7QSHr6-Gbr0' WHERE id = 'c567cae0-fd9a-4a9c-b0a5-e5de8e34094c';

-- [KEEP] Hip Flexor Stretch Half-Kneeling | "How to PROPERLY Perform the Kneeling Hip Flexor Stretch With Good Form (For Tight Hip Flexors)" (Gerardi Performance)
UPDATE exercises SET help_url = 'https://youtu.be/ktgtEWGhFd8' WHERE id = '197f4354-5e8c-4ddf-b675-eba24d388e0d';

-- [KEEP] Pendulum Swings | "Pendulum Exercise for Shoulder Mobility without Straining" (My Physio My Health)
UPDATE exercises SET help_url = 'https://youtu.be/5qzbtlX_A4k' WHERE id = '41495cbd-1a8b-47bb-b2ba-7987dcc25495';

-- [KEEP] Crossover Arm Stretch | "Cross Arm Stretch" (Baptist Health)
UPDATE exercises SET help_url = 'https://youtu.be/-1K0m5ywRcY' WHERE id = 'f9310ae6-817b-424e-811c-5b22316a7719';

-- [KEEP] Knee Extension Stretch | "Knee Extension Improvement (Knee Straightening) - Ask Doctor Jo" (AskDoctorJo)
UPDATE exercises SET help_url = 'https://youtu.be/vhEaOeDotqE' WHERE id = 'a4726fd3-05a2-42d0-8a99-cd793a17c89c';

-- [KEEP] Dumbbell Floor Press | "How To: Dumbbell Floor Press" (ScottHermanFitness)
UPDATE exercises SET help_url = 'https://youtu.be/uUGDRwge4F8' WHERE id = '99bdfb0d-d0ab-4070-a433-434d84eaff1b';

-- [KEEP] Child's Pose with Side Reach | "Child’s Pose with Side Stretches Tutorial | Open Your Hips and Improve Side Mobility" (Man Flow Yoga)
UPDATE exercises SET help_url = 'https://youtu.be/CXV7dseQdBg' WHERE id = '1f38d576-56aa-4645-8f37-6ad4276304dd';

-- [KEEP] Standing Dumbbell Rows | "STOP F*cking Up Dumbbell Rows (PROPER FORM!)" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/gfUg6qWohTk' WHERE id = '003f0941-5e83-4f80-9fc1-09e24a40ade0';

-- [KEEP] Hip Flexor & Chest Stretch | "Stretch The Hip Flexors Correctly" (Dr. Kristie Ennis)
UPDATE exercises SET help_url = 'https://youtu.be/ZQXGUfGmgKc' WHERE id = '6f020cb2-f3ed-4062-96f1-7883da1861a7';

-- [KEEP] Toe Flexor Stretch | "Toe Extensor Stretch with Dr Ray McClanahan" (Correct Toes®)
UPDATE exercises SET help_url = 'https://youtu.be/h2kaEOd3GcI' WHERE id = '91408e7e-fb4a-4e56-a3b0-5d81bb3c48d8';

-- [KEEP] Seated Forward Fold Stretch | "Transform your seated forward fold with 1 hack (Tip to improve Hamstring Flexibility). #yogatips" (YogaCandi)
UPDATE exercises SET help_url = 'https://youtu.be/1E-84p0itDs' WHERE id = 'eb6b8419-9055-4fbe-8a66-fd81f3314f0d';

-- [KEEP] Child's Pose | "Child Pose" (Baptist Health)
UPDATE exercises SET help_url = 'https://youtu.be/kH12QrSGedM' WHERE id = '63665a56-f1c1-4a2c-85b0-91c00dc43800';

-- [KEEP] Seated Row Band or Cable | "How to do a seated row" (Nuffield Health)
UPDATE exercises SET help_url = 'https://youtu.be/DHA7QGDa2qg' WHERE id = 'a52ef055-d2d7-4ecf-a076-10a464372164';

-- [KEEP] Dumbbell Curl to Overhead Press | "Dumbbell Bicep Curl To Shoulder Press" (Volition: Lifestyle Performance Training)
UPDATE exercises SET help_url = 'https://youtu.be/wNzXgyODt7g' WHERE id = '976333b8-306f-43fb-94ae-3462ed1698a7';

-- [KEEP] Bicep Curls Light | "STOP Doing This On Bicep Curls!" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/VCw_uIxW8WE' WHERE id = '11543e89-df13-446e-bd61-6c3e7e68803d';

-- [KEEP] Incline Treadmill Walk | "My #1 fat loss tip | incline walk #fatloss" (Carabella Riazzo)
UPDATE exercises SET help_url = 'https://youtu.be/JGzA6FPzZS8' WHERE id = 'b7f93e07-2b24-485d-abd9-2b1198cc5010';

-- [KEEP] Interval Walking | "The Japanese Interval Walking Method" (McLifestyle Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/vbUq7BQn6Qs' WHERE id = 'c8596e98-3fe2-4fe1-a73b-5e3ade96db09';

-- [KEEP] Bent-Over Row | ""How To" Barbell Row" (Alan Thrall (Untamed Strength))
UPDATE exercises SET help_url = 'https://youtu.be/G8l_8chR5BE' WHERE id = 'f3d015a7-71f1-49d7-9651-1cb5a29344d1';

-- [KEEP] L-Sit Hold | "Best Exercises To Increase L-SIT HOLD" (FitnessFAQs)
UPDATE exercises SET help_url = 'https://youtu.be/cu0fHp8HCDo' WHERE id = '4b3d2924-2a8b-4375-9d97-d646445d6083';

-- [KEEP] Marble Pickup | "Marble pick up:  Huntington Physical Therapy, 25703" (HPT Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/4_OFxSHtzUo' WHERE id = '187c459f-0b00-4f8b-bde4-f3c1e055e191';

-- [KEEP] Marching in Place High Knees | "Marching in place" (Body Complete Services)
UPDATE exercises SET help_url = 'https://youtu.be/16oJspYFz7s' WHERE id = '2b23d472-2b88-4db6-9d98-dead2573c045';

-- [KEEP] DB Step-ups | "How To: Weighted Step Ups" (Forty Steps)
UPDATE exercises SET help_url = 'https://youtu.be/PzDbmqL6qo8' WHERE id = '1ee110eb-9d11-442a-bacb-c06c4412dd13';

-- [KEEP] KB Deadlift | "How To Do a Kettlebell Deadlift | The Right Way | Well+Good" (Well+Good)
UPDATE exercises SET help_url = 'https://youtu.be/hinonqqzatk' WHERE id = '3e1a074f-5da1-49f8-9f44-3178d9747a04';

-- [KEEP] Modified Pullups | "✅ 5 pull-up tips 💪🏻 #pullups #backworkout #calisthenics" (Tristan Nee)
UPDATE exercises SET help_url = 'https://youtu.be/ym1V5H35IpA' WHERE id = 'c2772c87-8261-4d10-ae3c-ccf5e65f7ccd';

-- [KEEP] Cat-Cow | "Cat - Cow Stretch" (Pelvic Floor & Core Fix With Dr. Dawn)
UPDATE exercises SET help_url = 'https://youtu.be/LIVJZZyZ2qM' WHERE id = '2cf86bf5-422b-4803-b964-148253a27efc';

-- [KEEP] Overhead Tricep Stretch | "Tricep Stretch" (React Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/_IOHtPSYGbk' WHERE id = '226b3940-4553-4dcf-896b-7bf737d86c38';

-- [KEEP] Seated Torso Rotation Controlled | "How to Do Seated Torso Twists: Use Your Head & Body!" (Advantage Ref Cam Rugby)
UPDATE exercises SET help_url = 'https://youtu.be/RYbFJgSYcWw' WHERE id = 'c21e455b-5d68-44c9-81d8-7f61be87cb7f';

-- [KEEP] 90/90 Hip Switches | "How to 90-90 Hip Mobility Exercise" (RehabFix)
UPDATE exercises SET help_url = 'https://youtu.be/FM7-7-a0FLg' WHERE id = '25eac4dd-2c82-4d31-b241-632e63e5f929';

-- [KEEP] Pec Minor Release | "How To Release Pec Minor" (Bulletproof Shoulders with Jason)
UPDATE exercises SET help_url = 'https://youtu.be/HmB8M3CEBCM' WHERE id = '783acc3b-dc2f-4498-a31e-995e367ef176';

-- [KEEP] Dips/Band Flyes | "Fix your dips 👉🏼 SAVE YOUR SHOULDERS!" (Davis Diley)
UPDATE exercises SET help_url = 'https://youtu.be/ci5tcFgIntI' WHERE id = 'a2ccc581-cdd3-46fa-9d7b-71aee49f2aba';

-- [KEEP] Jump Rope | "JUMP ROPE LIKE A PRO IN 2 MINUTES l LEARN HOW TO SKIP" (Dayan Kole)
UPDATE exercises SET help_url = 'https://youtu.be/vEJ7XbbAMAg' WHERE id = '2d62e96f-48b0-442a-9e47-cc402cf59e94';

-- [KEEP] Lunge Ball Throw | "Lunge Position Lateral Throw- Med Ball" (FSP Admin)
UPDATE exercises SET help_url = 'https://youtu.be/1kjgyWhNLEM' WHERE id = 'b962ea3d-5055-40f6-a951-7d1b59731133';

-- [KEEP] Air Squat | "BHIP How to: Air Squat" (UCLA)
UPDATE exercises SET help_url = 'https://youtu.be/zhGVm7IBPuY' WHERE id = '6766b3a5-293c-438e-bbe4-e2e946b4a16d';

-- [KEEP] Bear Crawl | "Bear Crawl CHEATCODE" (Zac Cupples)
UPDATE exercises SET help_url = 'https://youtu.be/LCVMqEmgglo' WHERE id = 'd8ce097b-5caf-49ae-88d6-2e80bdadafe3';

-- [KEEP] Box Dips (Assist) | "STOP Doing Tricep Dips Like This! (SAVE A FRIEND)" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/9llvBAV4RHI' WHERE id = '85d962a1-5274-4089-a627-624e783a81c2';

-- [KEEP] Modified Bird-Dog | "How to Do a Proper Bird Dog" (AARP Answers)
UPDATE exercises SET help_url = 'https://youtu.be/_1j_HWknGLg' WHERE id = '99d4cdcd-d31d-4d1e-a3f2-08cb208f7ac8';

-- [KEEP] Modified Dead Bug | "Common Deadbug Mistake! #coreworkout #absexercise" (Claire DeFitt)
UPDATE exercises SET help_url = 'https://youtu.be/-8xqJ2xXs2A' WHERE id = 'db8ec8b6-80d9-4cac-be98-d19e17c2fa3a';

-- [KEEP] Figure-4 Glute Stretch | "Glute Figure 4 Stretch - Ask Doctor Jo" (AskDoctorJo)
UPDATE exercises SET help_url = 'https://youtu.be/2VE_NLcNMvQ' WHERE id = '751dff92-2ad4-4a84-a285-32e80a7cccad';

-- [KEEP] Wrist & Ankle Circles | "Daily Foot & Ankle Mobility Exercises!!" (Physical Therapy Session)
UPDATE exercises SET help_url = 'https://youtu.be/jktxPe9c9g0' WHERE id = '4be0496d-cade-44db-a167-5483c5eb1ff6';

-- [KEEP] Tai Chi Lunges | "Taichi Side Lunge For Hip Flexibility" (EmilyTangerine)
UPDATE exercises SET help_url = 'https://youtu.be/xfITZ0ZAwyE' WHERE id = '0057a976-ec3f-4f88-b599-1c87acd8bd3c';

-- [KEEP] Gentle Full-Body Stretching | "8 Minute Stretching Routine For People Who AREN’T Flexible!" (Tone and Tighten)
UPDATE exercises SET help_url = 'https://youtu.be/FI51zRzgIe4' WHERE id = '725c0c07-8be9-413c-b3b7-69cabce31f2b';

-- [KEEP] Deep Breathing Exercises | "3 breathing exercises for better health with James Nestor | BBC Maestro" (BBC Maestro)
UPDATE exercises SET help_url = 'https://youtu.be/8qOMTqedPrk' WHERE id = 'de49c5e3-7964-4e20-882f-e74b52d1654e';

-- [KEEP] Relaxation & Body Scan | "Body Scan Mindfulness Meditation - A Short Guided Body Scan Meditation" (Dr. Adam Rosen- Knee Replacement & Orthopedic Info)
UPDATE exercises SET help_url = 'https://youtu.be/5mOZMxVKmiY' WHERE id = 'f076acea-158a-462d-a0dc-7f306999d199';

-- [KEEP] Modified Push ups | "How To Properly Do A Modified Push-Up On Knees - Strength Exercises - Wellen" (Wellen)
UPDATE exercises SET help_url = 'https://youtu.be/__71lgdtiB8' WHERE id = 'cc4b4c2c-3665-492e-9e29-9b0eba009039';

-- [KEEP] Plank (Weighted) | "✅ The PERFECT Plank" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/xe2MXatLTUw' WHERE id = 'fcfe07eb-fbee-4a85-b77e-080442aadfd9';

-- [KEEP] Squat Press (DB/Bar) | "📌HOW TO DO A GOBLET SQUAT" (SquatCouple)
UPDATE exercises SET help_url = 'https://youtu.be/lRYBbchqxtI' WHERE id = '45234887-165e-4b75-a3ab-fe0bebb4fe3b';

-- [KEEP] Modified Child's Pose | "How to do: CHILD'S POSE (BALASANA) #yoga #yogapose #yogatutorials #yogatutorial #yogaforbeginners" (Karina Fit)
UPDATE exercises SET help_url = 'https://youtu.be/YAmAET3Uomk' WHERE id = '3deb5d82-d16e-4676-a8a3-912fb2654691';

-- [KEEP] Relaxation Breathwork | "4-7-8 Calm Breathing Exercise | 10 Minutes of Deep Relaxation | Anxiety Relief | Pranayama Exercise" (Hands-On Meditation)
UPDATE exercises SET help_url = 'https://youtu.be/LiUnFJ8P4gM' WHERE id = '8a06c63e-e89b-4156-bf41-d2a4698a693d';

-- [KEEP] Deep Breathing Cool-Down | "Breathing Exercises with Guided Meditation | 5 Minutes | TAKE A DEEP BREATH" (Mike Maher | TAKE A DEEP BREATH)
UPDATE exercises SET help_url = 'https://youtu.be/DbDoBzGY3vo' WHERE id = 'd42e85af-6852-48f0-9402-ce88e08d9c1b';

-- [KEEP] Pull up/Lat Pulldown | "✅ The PERFECT Lat Pulldown (DO THIS!)" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/bNmvKpJSWKM' WHERE id = '4b23f3c1-70ea-4b2c-97b0-3c0780b40986';

-- [KEEP] Static Squat Cable Torso Rotations | "Static Squat Torso Twist" (Melissa Rouse)
UPDATE exercises SET help_url = 'https://youtu.be/AK9OLVhQmyo' WHERE id = 'd748883b-1239-4840-ab83-076098763b96';

-- [KEEP] Seated Rows Neutral Grip | "How To: Seated Cable Row Neutral Grip" (Functional AF)
UPDATE exercises SET help_url = 'https://youtu.be/qqZHnqzvbXs' WHERE id = '21a6d24a-eac7-49e1-90cb-704f937dc11d';

-- [KEEP] Isometric External Rotation | "Isometric Shoulder External Rotation (ER)" (Hope Physical Therapy and Aquatics)
UPDATE exercises SET help_url = 'https://youtu.be/kWtMKNnjyd0' WHERE id = 'f297f640-4644-4bbc-a025-252c12a63673';

-- [KEEP] Isometric Internal Rotation | "Isometric Shoulder Internal Rotation (IR)" (Hope Physical Therapy and Aquatics)
UPDATE exercises SET help_url = 'https://youtu.be/ewhkUx4SAQE' WHERE id = '21f282b7-49ad-4e47-877c-6f5aec22e4df';

-- [KEEP] Standing External Rotation | "Standing External Rotation with Resistance Band" (MGHOrthopaedics)
UPDATE exercises SET help_url = 'https://youtu.be/y8WKcz0vqzg' WHERE id = '87e61105-757e-4781-8634-a2d15ec98cee';

-- [KEEP] Standing Internal Rotation | "Improve your Hip Internal Rotation Mobility #hipmobility #hipmobilityexercises #hipstretches #hips" (Dr. Caleb Burgess, DPT)
UPDATE exercises SET help_url = 'https://youtu.be/o1Bd3-QpRwM' WHERE id = '92c6dbea-4d34-44ac-b7ca-43d78132835e';

-- [KEEP] Standing Row | "Standing Row Exercise Demo" (Redefined Health)
UPDATE exercises SET help_url = 'https://youtu.be/a7hcEMgr198' WHERE id = '9d7a712c-0dfd-4ba1-83dc-e02cf7a32606';

-- [KEEP] Rowing Machine | "The Official 2025 Rowing Form Checklist (PERFECT STROKE!)" (Training Tall)
UPDATE exercises SET help_url = 'https://youtu.be/ZN0J6qKCIrI' WHERE id = 'b657b066-9b98-42e1-911d-4e0f3ad558b9';

-- [KEEP] Stationary Bike | "Stationary Bike Workout for Beginners | 20 Minute" (Kaleigh Cohen Cycling)
UPDATE exercises SET help_url = 'https://youtu.be/rEqRmKAQ5xM' WHERE id = '12da7df1-d526-4ed1-8a4d-e54545ec3802';

-- [KEEP] Stationary Cycling | "Stationary Bike Workout for Beginners | 20 Minute" (Kaleigh Cohen Cycling)
UPDATE exercises SET help_url = 'https://youtu.be/rEqRmKAQ5xM' WHERE id = 'a2fba615-62ff-43c8-9572-53905c8c0cfb';

-- [KEEP] Machine Chest Press | "The PERFECT Machine Chest Press" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/Qu7-ceCvq7w' WHERE id = '5924cb23-02bd-4c82-a9de-925468d1394c';

-- [KEEP] Machine Shoulder Press | "✅ The PERFECT Machine Shoulder Press!" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/6v4nrRVySj0' WHERE id = 'f43eec8b-2a4d-4243-8a95-9dded95051f0';

-- [KEEP] Elliptical Trainer | "You're Using the Elliptical WRONG | Physical Therapist Explains" (Rehab and Revive)
UPDATE exercises SET help_url = 'https://youtu.be/EesEvYohy5o' WHERE id = '7a266c9b-00bb-4d6a-acca-5ed3af216e6a';

-- [KEEP] Seated Knee Extensions | "3 Seated knee Extension" (Chanil Jung Chriopractic )
UPDATE exercises SET help_url = 'https://youtu.be/9Du-oWjs_lE' WHERE id = 'a4f29912-ec61-4625-9944-20116620ee30';

-- [KEEP] Ankle Alphabet | "The "alphabet exercise" for foot and ankle strength" (Harvard Health Publishing)
UPDATE exercises SET help_url = 'https://youtu.be/vHMJ0zgrsFU' WHERE id = '9f389ebc-9221-4c4e-ba18-184ea4f34842';

-- [KEEP] Ankle Pumps | "Ankle Pumps" (NHS University Hospitals Plymouth Physiotherapy)
UPDATE exercises SET help_url = 'https://youtu.be/hh_fsJOpFjQ' WHERE id = '42ee8c86-4e9a-42ed-b097-af3e27615e23';

-- [KEEP] Ankle Stability Balance | "Do this 1-minute foot and ankle workout for better balance and walking #shorts" (Bob & Brad)
UPDATE exercises SET help_url = 'https://youtu.be/EzgFIzh6tH8' WHERE id = 'ce1c9952-f5fc-4d34-a4d5-e82527ec7317';

-- [KEEP] Bent-Over Horizontal Abduction | "Horizontal abduction with a band" (Next Level Physical Therapy & Wellness)
UPDATE exercises SET help_url = 'https://youtu.be/Su9Sf3DMFHQ' WHERE id = '088c0871-30ec-422f-8b95-db89dfb1770e';

-- [KEEP] Bird-Dog Modified | "Modified Bird Dog Exercise" (Bariatric Fitness Rx)
UPDATE exercises SET help_url = 'https://youtu.be/8mYei1qwT1c' WHERE id = '59e0c64b-8acc-453b-b408-0180a61995e2';

-- [KEEP] Bodyweight Quarter Squat | "How To Bodyweight Squat With Perfect Form & Technique. #bodyweightworkout #squats #squats #squatting" (Chris Gates Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/n_xLyzPEX7A' WHERE id = 'c9a315af-c567-4ab4-91df-66d8d8e7b55a';

-- [KEEP] Cat-Cow Stretch | "Cat - Cow Stretch" (Pelvic Floor & Core Fix With Dr. Dawn)
UPDATE exercises SET help_url = 'https://youtu.be/LIVJZZyZ2qM' WHERE id = '756acda7-d6f4-4316-9108-89178279d60e';

-- [KEEP] Chair Squats | "Squats with a Chair - Ask Doctor Jo" (AskDoctorJo)
UPDATE exercises SET help_url = 'https://youtu.be/GIz1C3yfE1s' WHERE id = 'f12d3113-4e9c-418d-9b82-ce549b925c88';

-- [KEEP] Chin Tucks | "You're Doing Chin Tucks WRONG | Physical Therapist Teaches The Correct Way" (Rehab and Revive)
UPDATE exercises SET help_url = 'https://youtu.be/KqR1EoEmq9c' WHERE id = '62bf731b-ca92-4b00-93c3-a73bf218e550';

-- [KEEP] Cool-Down Walk | "Cool Down Walk | Walk At Home" (Walk at Home)
UPDATE exercises SET help_url = 'https://youtu.be/u6u4BKwUVF8' WHERE id = '328d35b1-0b00-4316-a062-d2856a423b8d';

-- [KEEP] Cool-Down Walking | "Cool Down Walk | Walk At Home" (Walk at Home)
UPDATE exercises SET help_url = 'https://youtu.be/u6u4BKwUVF8' WHERE id = '284735ea-88c6-4b2a-a32f-f77f1379bc7a';

-- [KEEP] Dead Bug Arms Overhead | "Dead Bug Exercise For Core Stability  | Pursuit Physical Therapy" (Pursuit Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/o4GKiEoYClI' WHERE id = 'f7595e20-23bb-473e-8969-7492ca052ed3';

-- [KEEP] Dead Hang | "How Hanging Transforms Your Body" (FitnessFAQs)
UPDATE exercises SET help_url = 'https://youtu.be/ShkBXOGK7A8' WHERE id = '8450e75a-de90-4d0e-99b7-c083dc75522e';

-- [KEEP] Double-Leg Quarter Squats | "Double Leg Quarter Squats ACL Exercise MOON Knee Research Group" (MOON Knee ACL Research Group)
UPDATE exercises SET help_url = 'https://youtu.be/SIi3-rgQyBw' WHERE id = '31dc0a8c-382e-452b-9128-191a36ad336f';

-- [KEEP] Downward Dog | "How to do Downward Dog Correctly ✅" (Charlie Follows)
UPDATE exercises SET help_url = 'https://youtu.be/UsTTTYbBdQg' WHERE id = 'd01fa142-2c1a-4a4c-8004-0a1a9e089c26';

-- [KEEP] Finger Curls | "How To Perform Finger Curls Tutorial" (Buff Dudes Workouts)
UPDATE exercises SET help_url = 'https://youtu.be/gnDRXH2J5Yc' WHERE id = '1a06cc79-7202-48b1-87db-9928bdaeb6b8';

-- [KEEP] Foot Doming | "Barefoot Running Exercise: Foot Doming" ([P]rehab)
UPDATE exercises SET help_url = 'https://youtu.be/rS5ucOyfgSg' WHERE id = '938b251b-b944-41b9-a8bf-760f5f3e6f3a';

-- [KEEP] Forearm Pronation & Supination | "Supination/Pronation" (Hope Physical Therapy and Aquatics)
UPDATE exercises SET help_url = 'https://youtu.be/Mq2AO9n5k4o' WHERE id = 'c2fd96fb-4ac1-4b51-944c-b31f16987a53';

-- [KEEP] Full-Can Scaption Thumb-Up | "Shoulder Scaption Exercise - Dumbbell" (Echo Sports Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/TPXDhl9kTuI' WHERE id = 'bac6dfc7-31da-4b87-bd78-dccf4605ca66';

-- [KEEP] Gentle Walking | "Walk at home with a GENTLE WALKING WORKOUT | Low Impact & Safe for Seniors & Beginners" (Improved Health)
UPDATE exercises SET help_url = 'https://youtu.be/gtjEhdhJ7Bc' WHERE id = '68690de4-ca7a-4999-bc9b-6eb8acb356ba';

-- [KEEP] Glute Bridge with Band | "Glute Bridge w Band NEW" (ChiroUp)
UPDATE exercises SET help_url = 'https://youtu.be/p7cFEtMC68g' WHERE id = 'da83e083-d9b0-47fd-b73e-6d9d431668b5';

-- [KEEP] Grip Squeezes | "Hand Gripper Follow Along Workout - Strong & Vascular Forearms In 3mins." (The Supple Strength)
UPDATE exercises SET help_url = 'https://youtu.be/14BjGShRiMs' WHERE id = 'c2e5c1d8-5e4e-4778-98c9-cb7a4e6434b3';

-- [KEEP] Hamstring Sets | "Hamstring Sets - Ask Doctor Jo" (AskDoctorJo)
UPDATE exercises SET help_url = 'https://youtu.be/NJv1hKZJsMY' WHERE id = '93f919d9-ad98-4162-a87c-70940eda92da';

-- [KEEP] Heel Slides | "Core Exercise: Heel Slide" (Children's Hospital Colorado)
UPDATE exercises SET help_url = 'https://youtu.be/6-anByqnKp8' WHERE id = '44401a1d-8987-4edd-a978-a4e1da8a3a17';

-- [KEEP] Hip Abduction Standing | "Standing Hip Abduction - Ask Doctor Jo" (AskDoctorJo)
UPDATE exercises SET help_url = 'https://youtu.be/qBqKuEQl9sI' WHERE id = 'c1df4198-d935-4a32-80ce-c8e7dd72396e';

-- [KEEP] Incline Push-ups | "How To Do An Incline Push Up" (Train With Adby - Personal Training Gym)
UPDATE exercises SET help_url = 'https://youtu.be/cfns5VDVVvk' WHERE id = '5c9cf1e5-a2f1-4df4-a881-601837337b3d';

-- [KEEP] Mountain Climber Burpee | "How to make progress with your mountain climbers 🔥 #shorts" (LisaFiitt Workouts)
UPDATE exercises SET help_url = 'https://youtu.be/7W4JEfEKuC4' WHERE id = 'd194f608-0c2d-45f3-9d0f-77ae7bd4a203';

-- [KEEP] Static Quad Sets | "Static Quadriceps" (Aubin Grove, Kwinana & Harrisdale Physiotherapy)
UPDATE exercises SET help_url = 'https://youtu.be/nVuUHbBpGlw' WHERE id = '9d8e54d4-3063-4458-a4a7-c0e321e4c6f5';

-- [KEEP] Mountain Climbers | "How to Do Mountain Climbers - Fitness Fridays #shorts" (Duke Health)
UPDATE exercises SET help_url = 'https://youtu.be/hZb6jTbCLeE' WHERE id = 'b77edf78-45f3-4c2a-b5e4-42dc178afc64';

-- [KEEP] Mountain Climbers + Air Squats | "How to make progress with your mountain climbers 🔥 #shorts" (LisaFiitt Workouts)
UPDATE exercises SET help_url = 'https://youtu.be/7W4JEfEKuC4' WHERE id = 'e5736e07-aa10-443e-a6d7-bd7e9278c099';

-- [NEW] Plank In and Outs | "✅ The PERFECT Plank" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/xe2MXatLTUw' WHERE id = '85cecc8a-96c3-4237-8e1a-93b20ddf2306';

-- [NEW] Plank Jacks | "How To Master the Plank Jack Exercise" (Mobility Doc)
UPDATE exercises SET help_url = 'https://youtu.be/2DnV_uCmILQ' WHERE id = 'c1c9bf20-187d-43be-842d-a6dc81269fde';

-- [NEW] Plank Modified | "NEVER Do Planks Like This (3 Fixes You Must Make)" (Jeremy Ethier)
UPDATE exercises SET help_url = 'https://youtu.be/v25dawSzRTM' WHERE id = '5319cd44-2cf7-4a77-8436-c9d4e7201369';

-- [NEW] Plank Shoulder Taps | "How To Properly Do a Plank with Shoulder Taps - Strength Exercises - Wellen" (Wellen)
UPDATE exercises SET help_url = 'https://youtu.be/gKA5LBy7WAI' WHERE id = 'e6de318a-043f-4b47-b3ec-621b61b80985';

-- [NEW] Plank Taps | "How to Do Plank Shoulder Taps #shorts" (Well+Good)
UPDATE exercises SET help_url = 'https://youtu.be/eyeuugrpLYA' WHERE id = 'ffa4dd68-fece-452b-867c-73ab1c0f2420';

-- [NEW] Plank with Knee Taps | "How to Do a Plank with Knee Taps | Abs Workout" (Howcast)
UPDATE exercises SET help_url = 'https://youtu.be/g57zkyRjYH4' WHERE id = '583e8079-eba2-426e-a59d-14a420c2eef5';

-- [NEW] Plank with Knee-to-Elbow | "Plank on Knees and Elbows Exercise" (Spine Science Front Desk)
UPDATE exercises SET help_url = 'https://youtu.be/Y-ff-nkaRxU' WHERE id = '4e7d7975-401f-4b0a-9ee7-982cd5866bfb';

-- [NEW] Plank with Row | "Plank Row - Dumbbells" (BEFORM Performance Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/GfptgUS4QRA' WHERE id = '7f161afa-b02d-4fe1-9628-57ba6c27f793';

-- [NEW] Plank-to-Pushup | "Plank to pushup - upper body/core exercise" (Pat Carr)
UPDATE exercises SET help_url = 'https://youtu.be/9PMGJqQnrGc' WHERE id = '40860b89-1565-4fb0-84d1-d25fedf5083e';

-- [NEW] Prone Horizontal Abduction | "Greensboro Orthopaedics: Prone Horizontal Abduction with Michele Erickson, PT, DPT, MS, OCS" (EmergeOrtho | Triad Region)
UPDATE exercises SET help_url = 'https://youtu.be/AwBGMBEIw3Y' WHERE id = '98fdf3e7-4bed-4a6b-a2d2-61ea6ab24a83';

-- [NEW] Prone Y Raise | "Bulletproof Your Shoulders With This Exercise! 🔥" (SaturnoMovement)
UPDATE exercises SET help_url = 'https://youtu.be/cYLucJwoiFI' WHERE id = '9172a006-ca78-4641-a6c6-83013aad5899';

-- [NEW] Prone Y-T-W Raises | "Prone Y T W" (The Active Life)
UPDATE exercises SET help_url = 'https://youtu.be/QdGTI4Lshg4' WHERE id = '3adc179a-2f3a-4b67-8cee-2e0d36619349';

-- [NEW] Steady-State Walking | "🔥30 Min STEADY STATE WALKING for WEIGHT LOSS🔥NO JUMPING🔥Exercise to the Beat🔥🎶" (BurpeeGirl)
UPDATE exercises SET help_url = 'https://youtu.be/xUhRWqAFbwc' WHERE id = 'f019a8e4-d230-408d-8e97-98267cd7e95a';

-- [NEW] Step-ups 4-inch box | "Step up form for QUADS vs GLUTES 🔥 #shorts" (LISAFIITT)
UPDATE exercises SET help_url = 'https://youtu.be/8q9LVgN2RD4' WHERE id = '11f77604-504f-4915-b9f0-ce9e3dd70bf5';

-- [NEW] Reverse Lunges | "How To Perform The Reverse Lunge" (Dr. Carl Baird)
UPDATE exercises SET help_url = 'https://youtu.be/Ry-wqegeKlE' WHERE id = '4106887d-13db-4718-9869-d65d91a59352';

-- [NEW] Push-up (Weighted) | "The Only Push Up Guide You Will Ever Need" (Stozfit)
UPDATE exercises SET help_url = 'https://youtu.be/pKZ-lkKKMws' WHERE id = 'a1a657b5-56c0-4893-8adb-85beefda7df9';

-- [NEW] Quad Sets | "Quad Sets" (Baptist Health)
UPDATE exercises SET help_url = 'https://youtu.be/IF5eDfb8afM' WHERE id = '3dcf793e-69a4-4ea6-add3-2c673647e05d';

-- [NEW] Reverse Crunch | "How to Do Reverse Crunches Right | Deep Core Exercise ✅ #postpartum #workout #crunches #homeworkout" (Anastasia Vlassov)
UPDATE exercises SET help_url = 'https://youtu.be/I-qRngqd2wY' WHERE id = '3597e96d-5c01-4e83-9e44-97f96f7df448';

-- [NEW] Glute Bridges | "The Right Way to Do a Glute Bridge" (AARP Answers)
UPDATE exercises SET help_url = 'https://youtu.be/R6n608M3czU' WHERE id = '53146476-0b60-4c4a-a4cd-b7bc5f0d9662';

-- [NEW] Bird-Dog | "Bird Dog Exercise 🏋️‍♀️" (Spine Center & Orthopaedics Atlanta)
UPDATE exercises SET help_url = 'https://youtu.be/Yap7kqAFHYo' WHERE id = 'a9facd2c-08cc-41ae-ae28-4896ee35d7dd';

-- [NEW] Reverse Wrist Curls | "Do THESE to Build BIGGER Forearms!" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/sKXqNO2KQp8' WHERE id = 'ee5702fb-6f97-4ef0-be76-4c599ac77012';

-- [NEW] Rope Ladder Broad Jumps | "Beginner to Advanced Plyometrics for Runners" (Matthew Choi)
UPDATE exercises SET help_url = 'https://youtu.be/iCuglFclkUM' WHERE id = '2ae30a39-96dc-4784-aed7-4a790b2585be';

-- [NEW] Russian Twists | "Russian Twist for Beginners #beginnerworkout #obliqueworkout #coreworkouts #russiantwist" (Claire DeFitt)
UPDATE exercises SET help_url = 'https://youtu.be/C3RauLi8FNw' WHERE id = 'f1f645b2-6f47-4be7-ac21-e47da17a6d4c';

-- [NEW] Scapular Pull-up | "Drastically Improve Your Pull-Ups" (FitnessFAQs)
UPDATE exercises SET help_url = 'https://youtu.be/WqCXcFrA1Iw' WHERE id = '09d71782-eda9-429b-ab6f-8f5079d7a75b';

-- [NEW] Scapular Push-ups | "Scap Push ups" (The Active Life)
UPDATE exercises SET help_url = 'https://youtu.be/NKekqeudgWs' WHERE id = '0489f8f0-fadc-4f5f-b429-33025dc5c590';

-- [NEW] Scapular Setting | "Standing Scapular Setting" (MGHOrthopaedics)
UPDATE exercises SET help_url = 'https://youtu.be/3X57B3y39EY' WHERE id = '0a6aee87-de52-4acf-9330-91a572218a78';

-- [NEW] Scapular Squeezes | "Shoulder exercise - scapular squeeze" (www.sportsinjuryclinic.net)
UPDATE exercises SET help_url = 'https://youtu.be/QN1oZVMMRjE' WHERE id = 'acd81997-2123-41d2-9017-c2b9bc8f5cb0';

-- [NEW] Seated Medicine Ball Twists | "How to Do Seated Medicine Ball Twists" (Eat This, Not That!)
UPDATE exercises SET help_url = 'https://youtu.be/VDvlA5opvuk' WHERE id = '37eb424a-02a1-4b1c-babe-1bb1311438ed';

-- [NEW] Shadow Boxing | "Quick Shadow Boxing Tutorial by Olympian" (Tony Jeffries)
UPDATE exercises SET help_url = 'https://youtu.be/J4j3AOVWuHE' WHERE id = '38a8d92d-4f3e-4ffd-92fe-6349e5eceb27';

-- [NEW] Short Foot Exercise | "How to Short Foot" (Dan Ginader)
UPDATE exercises SET help_url = 'https://youtu.be/D9qjQWqVIlI' WHERE id = '369a8104-5ee6-43a1-a3e4-7c0f6aa5c387';

-- [NEW] Shuttle Runs (yd) | "3 Tips to blaze the 5-10-5 Shuttle Run 🔥💨" (Pick 6 Athletics)
UPDATE exercises SET help_url = 'https://youtu.be/yZeJX_zTwys' WHERE id = 'fe1dfc4c-2fe5-427a-9f22-08a9e12d251a';

-- [NEW] Side Plank Dips | "Side Plank with Hip Dips: 3 ways to make it work for you 🤍" (Tasha Franken)
UPDATE exercises SET help_url = 'https://youtu.be/Pnd6UMYjwWE' WHERE id = '75f526c1-c4a9-4fbc-a5b0-bfa09a336ac7';

-- [NEW] Side Plank Weak Side | "Fix your side plank FAST #fitnesstips" (Zac Cupples)
UPDATE exercises SET help_url = 'https://youtu.be/wP7xBF-LZxs' WHERE id = 'b5962ed2-7b90-46fa-a8be-48d45472faf2';

-- [NEW] Side Plank with Hip Dip | "Side Plank with Hip Dips: 3 ways to make it work for you 🤍" (Tasha Franken)
UPDATE exercises SET help_url = 'https://youtu.be/Pnd6UMYjwWE' WHERE id = '8714a5d7-d974-4a27-a7a3-b95a74ee56be';

-- [NEW] Step-ups Low Step | "Step Up Exercise | Osteoarthritis Physiotherapy" (Cornerstone Physiotherapy)
UPDATE exercises SET help_url = 'https://youtu.be/wfhXnLILqdk' WHERE id = 'dd3a14b4-fefb-43d1-9c91-348a01be34ee';

-- [NEW] Step-ups Slow and Controlled | "Step Up Exercise | Osteoarthritis Physiotherapy" (Cornerstone Physiotherapy)
UPDATE exercises SET help_url = 'https://youtu.be/wfhXnLILqdk' WHERE id = '69ae53b7-b8ae-4bc8-a6ee-aaf1607a1976';

-- [NEW] Wrist Curls | "Do THESE to Build BIGGER Forearms!" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/sKXqNO2KQp8' WHERE id = '7ce900b5-5445-40a7-9095-25865e3a99be';

-- [NEW] Wrist Extensions | "Dumbbell Wrist Extension Curl" (Kraken Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/xENVg7RX_O8' WHERE id = '8076053c-60b5-4b92-9bf8-c8db99bbef33';

-- [NEW] Side Planks | "How To Do A Side Plank | The Right Way | Well+Good" (Well+Good)
UPDATE exercises SET help_url = 'https://youtu.be/XeN4pEZZJNI' WHERE id = '529499ad-6e6e-4ff6-a584-43fa9d0ec611';

-- [NEW] Side-Lying Hip Abduction | "Side Lying Hip Abduction" (Baptist Health)
UPDATE exercises SET help_url = 'https://youtu.be/g9FtnmsIYgI' WHERE id = '706dc6a8-fade-4244-945d-6349c0ec0b89';

-- [NEW] Side-Lying Leg Lifts | "Pelvic health education Side lying leg lift" (Sheffield Teaching Hospitals NHS Foundation Trust)
UPDATE exercises SET help_url = 'https://youtu.be/pNismoYr1Fg' WHERE id = '0e123587-9e8a-49a8-b028-24633bc97efb';

-- [NEW] Side-to-Side Step Touches | "Side Step Exercise" (Whzan Digital Health)
UPDATE exercises SET help_url = 'https://youtu.be/C0kFihNtCtA' WHERE id = 'fefbbfae-a768-4c46-b762-393b11b8d532';

-- [NEW] Single Leg Decline | "Single Leg Decline Squat" (American Family Physician)
UPDATE exercises SET help_url = 'https://youtu.be/JBvdaCsU3_4' WHERE id = '418eb9b8-086d-4b22-92ee-3b4928e2faf7';

-- [NEW] Single Leg Heel Raise | "How to do Single Leg Heel Raise - Strength Exercise - Wellen" (Wellen)
UPDATE exercises SET help_url = 'https://youtu.be/kZSJlG6ntWg' WHERE id = '475bd195-f663-4800-943f-7ea92ce80346';

-- [NEW] Single-Leg Balance | "Single Leg Balance Exercise" (Coury & Buehler Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/7SF7AYh2_Yw' WHERE id = '7d936185-2990-4de3-8ebc-b1058379c669';

-- [NEW] Single-Leg Balance Eyes Closed | "Bulletproof Fitness: Single Leg Stance (Eyes Closed)" (KIME Performance Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/T2WwK2JT2d0' WHERE id = 'b86cd0e2-2138-49c6-b8e7-c37595748556';

-- [NEW] Single-Leg Balance Eyes Open | "Bulletproof Fitness: Single Leg Stance (Eyes Closed)" (KIME Performance Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/T2WwK2JT2d0' WHERE id = '6778486c-45d6-4a52-9e18-2660e442cec3';

-- [NEW] Single-Leg Balance Wall Support | "Single Leg Balance Exercise" (Coury & Buehler Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/7SF7AYh2_Yw' WHERE id = 'f4cf7722-e52a-4a5f-873a-881d2cc4f9ab';

-- [NEW] Single-Leg Bridge | "Strengthening Exercise for ACL: Single Leg Bridge" (MedStar Health)
UPDATE exercises SET help_url = 'https://youtu.be/AVAXhy6pl7o' WHERE id = '17d74828-4bea-4f19-9083-0b774b6b4011';

-- [NEW] Single-Leg Heel Raises | "How to do Single Leg Heel Raise - Strength Exercise - Wellen" (Wellen)
UPDATE exercises SET help_url = 'https://youtu.be/kZSJlG6ntWg' WHERE id = '1e219531-ff5c-4f40-a06b-e23ce8a62eb8';

-- [NEW] Single-Leg Hops | "Single Leg Hop/Absorb" (Austin Longevity Clinic)
UPDATE exercises SET help_url = 'https://youtu.be/nekKEq-6FiY' WHERE id = '79f83991-5d2b-431c-9385-56df5141bd35';

-- [NEW] Single-Leg RDL Bodyweight | "This Bodyweight Exercise CANNOT Be Ignored" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/Iq1LP6dnf1U' WHERE id = '9907be9f-e091-4974-ac42-f614ec45dd14';

-- [NEW] Single-Leg Step-Up | "Step up form for QUADS vs GLUTES 🔥 #shorts" (LISAFIITT)
UPDATE exercises SET help_url = 'https://youtu.be/8q9LVgN2RD4' WHERE id = 'c94364c0-3438-44bd-9ab3-8a8312b66e93';

-- [NEW] Sit-to-Stand Chair | "Chair Sit to Stand or Chair Squat" (Precision Human Performance)
UPDATE exercises SET help_url = 'https://youtu.be/cUz_TSy7_fw' WHERE id = '9cbea061-72b4-4b01-bedf-7cd272ac83bc';

-- [NEW] Sit-to-Stand Controlled | "Sit to Stand" (Baptist Health)
UPDATE exercises SET help_url = 'https://youtu.be/ITv-_BkcrD0' WHERE id = '5c7b94e7-270c-418a-b353-e93b97d4ec1d';

-- [NEW] Skater Jumps | "Skater Jumps" (Athletic Institute)
UPDATE exercises SET help_url = 'https://youtu.be/qM5jviFhw9U' WHERE id = '86b55fbe-0338-4668-928e-a936cf008270';

-- [NEW] Slow Lateral Weight Shifts | "Lateral Weight Shift" (SPECTRUM Performance)
UPDATE exercises SET help_url = 'https://youtu.be/sbONN-LVLsg' WHERE id = '02804692-55fd-4d62-8440-6f59453afb10';

-- [NEW] Speed Skaters | "Speed Skaters Exercise (Skater Hops): Proper Form" (BuiltLean®)
UPDATE exercises SET help_url = 'https://youtu.be/9_jLW6VkU8A' WHERE id = '8be6b32c-9190-40e9-bb55-b38745111384';

-- [NEW] Spiderman Push-ups | "Spider Push Up: Proper Form" (BuiltLean®)
UPDATE exercises SET help_url = 'https://youtu.be/qG2oWGqXSdw' WHERE id = '9bd9cd53-72a5-40c2-921b-4399e6c95fda';

-- [NEW] Squat Thrusts | "Squat Thrusts Exercise — (HOW TO DO A SQUAT THRUST)" (Fit Father Project - Fitness For Busy Fathers)
UPDATE exercises SET help_url = 'https://youtu.be/F1kVWDpH6co' WHERE id = '35d0d9ac-ddbd-478e-b977-e4a04d5db2f6';

-- [NEW] Squat to Box | "How to Box Squat PROPERLY!" (Misfit Athletics)
UPDATE exercises SET help_url = 'https://youtu.be/nBc_2Jyp3tM' WHERE id = 'b6d43425-5081-4c28-9f59-b8b856c5ca83';

-- [NEW] Standing Side Leg Lifts | "Hip Strengthening Exercise: Standing Side Leg Lift" (Penn State Health)
UPDATE exercises SET help_url = 'https://youtu.be/l_U2uoePtS4' WHERE id = '9a74a00d-5917-4735-a16c-143e50a0e916';

-- [NEW] Step-ups/Weighted | "How To: Weighted Step Ups" (Forty Steps)
UPDATE exercises SET help_url = 'https://youtu.be/PzDbmqL6qo8' WHERE id = 'e6e1e12b-85fc-4b93-a8d0-f4b074a9af3d';

-- [NEW] Straight Leg Raises | "Straight Leg Raises" (Baptist Health)
UPDATE exercises SET help_url = 'https://youtu.be/U4L_6JEv9Jg' WHERE id = '92967ee3-b77a-4e8a-bd33-c0a0c27c1a53';

-- [NEW] T-Pushups | "PUSH UPS FOR BEGINNERS #shorts" (MadFit)
UPDATE exercises SET help_url = 'https://youtu.be/HHRDXEG1YCU' WHERE id = '78a71cf1-dcf8-46c8-a312-185a17defedf';

-- [NEW] Tandem Stance | "Tandem Stance - Ask Doctor Jo" (AskDoctorJo)
UPDATE exercises SET help_url = 'https://youtu.be/ra7tzlPxnsQ' WHERE id = 'e93de60f-6a29-45a9-9190-2ea992b180af';

-- [NEW] Tandem Walk | "Tandem walk" (ALTA Physical Therapy & Pilates)
UPDATE exercises SET help_url = 'https://youtu.be/deJzbPpJtLI' WHERE id = '5da6a637-8b14-4f08-a146-06d2d6c49dbe';

-- [NEW] Tempo Push-ups | "Tempo Push-Ups: Instructional Video" (Good Life Health and Wellness )
UPDATE exercises SET help_url = 'https://youtu.be/0cKBHNJZWlQ' WHERE id = 'c20bf8f0-c03e-4fc9-b86c-aee93292ac64';

-- [NEW] Toe Raises | "Toe Raises - Ask Doctor Jo" (AskDoctorJo)
UPDATE exercises SET help_url = 'https://youtu.be/enJ6yYJerVw' WHERE id = 'a4121562-b1db-4743-815d-fbbca22f21fb';

-- [NEW] Toe Taps | "Pilates Toe Taps, Single" (FitnessBlender)
UPDATE exercises SET help_url = 'https://youtu.be/A5H4t2ZMos8' WHERE id = 'a76ddae3-6024-4cda-8726-85f6babdbaa6';

-- [NEW] Towel Curls | "Towel Curls" (Baptist Health)
UPDATE exercises SET help_url = 'https://youtu.be/RVbYKwWwauU' WHERE id = '1591a55a-e7ea-4466-a883-5bf5ea44396c';

-- [NEW] Towel Grip Row | "TOWEL ROW FOR MAXIMUM GAINS" (Peter Edwards`)
UPDATE exercises SET help_url = 'https://youtu.be/FVxT8QuAU-0' WHERE id = 'b8d5cc32-1f67-4346-bcfa-c7702fff89d1';

-- [NEW] Towel Toe Scrunches | "Toe Towel Crunch" (Hope Physical Therapy and Aquatics)
UPDATE exercises SET help_url = 'https://youtu.be/RoEmHev3KZ8' WHERE id = 'e471ec62-b3b2-42ee-98d3-cfa37cfe6d44';

-- [NEW] Treadmill Run | "20-Minute Treadmill Workout for Weight Loss - [Quick &amp; Effective HIIT🔥]" (AbundantYou with Dr Kevin)
UPDATE exercises SET help_url = 'https://youtu.be/eGZ_3MbXAnM' WHERE id = '1b5ba032-c8e9-4b79-b430-7f62d65ac976';

-- [NEW] Treadmill Walking | "Beginner Treadmill Walking Workout - Interval Incline | 20 Minutes" (Sunny Health & Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/vdsaHSr1H_E' WHERE id = '4a02dd14-58fe-468a-8c4e-16c23bb4761c';

-- [NEW] V-Ups | "Exercise Tutorial - V-Up" (XHIT Daily)
UPDATE exercises SET help_url = 'https://youtu.be/iP2fjvG0g3w' WHERE id = '70f5b749-7517-4270-8ecf-70b04596b80e';

-- [NEW] V-Ups/Knee Raises | "V-Up Exercise #abs #workouttips #vup #lowerabs" (Claire DeFitt)
UPDATE exercises SET help_url = 'https://youtu.be/BNIPC_HaXWQ' WHERE id = 'e98e284a-04ce-4e5e-8da6-23e27b6d1642';

-- [NEW] Walking | "Walking Exercise with the SUPER Coaches! | Walk at Home" (Walk at Home)
UPDATE exercises SET help_url = 'https://youtu.be/AdqrTg_hpEQ' WHERE id = '2da180dc-5062-4bc2-b901-e5c3896e6b66';

-- [NEW] Wall Dead Bug | "Wall Deadbugs" (Daily Workout Builder)
UPDATE exercises SET help_url = 'https://youtu.be/_ikKLR2FyYM' WHERE id = 'd2c02b0b-4447-4e05-8834-c08db3bd06c7';

-- [NEW] Wall Push-ups | "6: Push-ups against a wall" (Sunnybrook Hospital)
UPDATE exercises SET help_url = 'https://youtu.be/5NPvv40gd3Q' WHERE id = 'c7adffb4-c0a0-4ea7-96e7-fefa828f42ee';

-- [NEW] Wall Sits Partial Depth | "How to do a wall sit" (YOGABODY)
UPDATE exercises SET help_url = 'https://youtu.be/mDdLC-yKudY' WHERE id = '59171879-4320-4a26-8184-9cb27c13bc5f';

-- [NEW] Wall Slides | "Wall Slides" (Daily Workout Builder)
UPDATE exercises SET help_url = 'https://youtu.be/i_0zLUcE-zk' WHERE id = 'da697fcc-3659-48b9-b41d-e3c234cf466a';

-- [NEW] Warm-Up Walking | "3 best walking warm up exercises to walk easier ✅" (Alyssa Kuhn, Arthritis Adventure)
UPDATE exercises SET help_url = 'https://youtu.be/WBhmNTykYiE' WHERE id = '96fc1ad2-b7c1-424c-9f34-905c1a894e12';

-- [NEW] Weighted Step-ups | "How To: Weighted Step Ups" (Forty Steps)
UPDATE exercises SET help_url = 'https://youtu.be/PzDbmqL6qo8' WHERE id = '2c3d09a5-65a2-41ff-9b39-3c8c0f4c7df1';

-- [NEW] Resistance Band Ankle Inversion | "Ankle Inversion with Theraband" (Hope Physical Therapy and Aquatics)
UPDATE exercises SET help_url = 'https://youtu.be/3pmV9xXMQJI' WHERE id = 'afe10a07-4325-4da9-9278-4dc5d6e7db83';

-- [NEW] Resistance Band Ankle Eversion | "Ankle resistance band exercises to deal with ankle pain" (Athletico)
UPDATE exercises SET help_url = 'https://youtu.be/QPZDLanJwEk' WHERE id = '64bbdc84-4413-4d3f-a04c-f5f77e7bd005';

-- [NEW] Resistance Band Rows | "How To Do A Resistance Band Row" (Get Healthy U - with Chris Freytag)
UPDATE exercises SET help_url = 'https://youtu.be/LSkyinhmA8k' WHERE id = 'fa1b7043-8b44-4327-a9f1-8b160c22c80c';

-- [NEW] Resistance Band Bicep Curls | "Resistance Band Bicep Curls" (PERSIST NUTRITION)
UPDATE exercises SET help_url = 'https://youtu.be/OUrlYlNqipY' WHERE id = '338c0ef4-05df-46e4-8e34-48e137ef0932';

-- [NEW] Resistance Band Chest Press | "Resistance Band Standing Chest Press" (LGN Lyfestile)
UPDATE exercises SET help_url = 'https://youtu.be/T0UJ0W-_yIE' WHERE id = 'f99f050b-565f-4e87-9874-cefb1317e7e8';

-- [NEW] Resistance Band Shoulder Press | "Resistance Band Overhead Press" (LGN Lyfestile)
UPDATE exercises SET help_url = 'https://youtu.be/1-VfJqjYquQ' WHERE id = 'ea4e37ae-e080-4cc5-9d8b-c748ab8c76ca';

-- [NEW] Resistance Band Pull-aparts | "How To Do Banded Pull-Aparts" (Tangelo - Seattle Chiropractor + Rehab)
UPDATE exercises SET help_url = 'https://youtu.be/stwYTTPXubo' WHERE id = '104f9c50-e87e-4566-94ff-193ef09e952e';

-- [NEW] Resistance Band Lat Pulldown | "Lat Pull Down with a resistance band" (Dawn Brooks)
UPDATE exercises SET help_url = 'https://youtu.be/K59OGC4aeQ4' WHERE id = '168df5ae-09e6-41c9-8ff9-a26a9a717fd3';

-- [NEW] Straight Leg Raises with Resistance | "Straight Leg Raises" (Baptist Health)
UPDATE exercises SET help_url = 'https://youtu.be/U4L_6JEv9Jg' WHERE id = '4638f270-8246-4ef4-83ec-d104b9980c74';

-- [NEW] Terminal Knee Extension Band | "TKE- what is it and why do we like them so much?!" (Made Possible Personal Training)
UPDATE exercises SET help_url = 'https://youtu.be/yE7sFjtnmZE' WHERE id = '9fbb7082-720a-4e98-ae4d-b1cddf2efe88';

-- [NEW] Hamstring Curls Band or Prone | "Standing Mini-band Hamstring Curls" (Daily Workout Builder)
UPDATE exercises SET help_url = 'https://youtu.be/erpy11GrhsE' WHERE id = '7e7dfcf4-c9f0-48f8-8f62-9b5d6812de68';

-- [NEW] Resistance Band Chest Fly | "Do Cable Flyes LIKE THIS for a BIGGER CHEST" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/tGXIQR89-JE' WHERE id = 'a995d5c8-a588-49b0-a02a-6accb1c13685';

-- [NEW] Resistance Band Knee Extension | "TKE- what is it and why do we like them so much?!" (Made Possible Personal Training)
UPDATE exercises SET help_url = 'https://youtu.be/yE7sFjtnmZE' WHERE id = 'eca8ee41-5e33-4446-8129-1d4810dfe5ca';

-- [NEW] Resistance Band Work | "10 resistance band exercises you can do at home" (British Heart Foundation)
UPDATE exercises SET help_url = 'https://youtu.be/fgKHFLe654U' WHERE id = 'b1e39a0d-75b7-4506-9953-9eb481ae39b9';

-- [NEW] Med Ball Overhead Hold | "DO THIS, NOT THAT! Med Ball Slams" (Elevate Sports Performance & Healthcare)
UPDATE exercises SET help_url = 'https://youtu.be/99DLQtHP7jE' WHERE id = '0f5d063a-a312-4514-8130-a6ed3905a4f5';
