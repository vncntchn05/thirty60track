-- ================================================================
-- Migration 029c: Verified YouTube help_url links
-- Generated 2026-04-16T14:37:34.095Z
-- Source CSV: Supabase Snippet Link Client Row to Auth User (3).csv
-- [KEEP] = existing URL verified correct
-- [NEW]  = replaced or newly added via YouTube Data API v3 search
-- ================================================================

-- [KEEP] Bench Press | "How To Bench Press With Perfect Technique (5 Steps)" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/hWbUlkb5Ms4' WHERE id = '2fa2d1d3-4ea2-420a-a514-fd0800e0d90f';

-- [KEEP] Deadlift | "How To Deadlift: 5 Step Deadlift | 2022" (Alan Thrall (Untamed Strength))
UPDATE exercises SET help_url = 'https://youtu.be/MBbyAqvTNkU' WHERE id = '300ee56b-df67-4e5e-aff8-51ce6416e171';

-- [KEEP] Barbell Row | "How To Build a Thick Back With Perfect Rowing Technique (Pendlay Row/ Helms Row)" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/axoeDmW0oAY' WHERE id = 'fff3711b-38a4-487e-93d0-7c52efdbe890';

-- [KEEP] Incline Bench Press | "Incline Bench Press #benchpress #chestday #bodybuilding #pushday #chestexercises" (Jeff Nippard Clips)
UPDATE exercises SET help_url = 'https://youtu.be/3bBng_VzwMA' WHERE id = 'ef3cb3d8-f697-463a-b77e-a4692e2c9c01';

-- [KEEP] Box Squat | "How To Squat - Any Style" (Alan Thrall (Untamed Strength))
UPDATE exercises SET help_url = 'https://youtu.be/UFs6E3Ti1jg' WHERE id = 'b6e39f07-c69d-4a85-8d00-114466ab6e12';

-- [KEEP] decline DB press | "Decline Dumbbell Bench Press  - Chest Exercise - Bodybuilding.com" (Bodybuilding.com)
UPDATE exercises SET help_url = 'https://youtu.be/Pf1nDoqx_1A' WHERE id = '45d918fa-d696-48ae-9554-89761ec98837';

-- [KEEP] flat bench | "Best Dumbbell Bench Press Tutorial Ever Made" (Davis Diley)
UPDATE exercises SET help_url = 'https://youtu.be/1V3vpcaxRYQ' WHERE id = '2be4ff68-fb19-42cc-afbf-beee30488728';

-- [KEEP] flat bench press | "How To Bench Press With Perfect Technique (5 Steps)" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/hWbUlkb5Ms4' WHERE id = '607f9637-4ba5-48cc-8034-736b22b5d04e';

-- [KEEP] Single-Arm Dumbbell Row | "How to Single Arm Dumbbell Row" (TylerPath)
UPDATE exercises SET help_url = 'https://youtu.be/qN54-QNO1eQ' WHERE id = '00d89f12-af2c-43b1-841c-3d28a88dc554';

-- [KEEP] Barbell Curl | "The Perfect Barbell Bicep Curl (DO THIS!)" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/54x2WF1_Suc' WHERE id = '0f4d1d9b-8cbb-47e3-8193-dd6b72d38707';

-- [KEEP] squat row | "How to: TRX Squat #trxworkout #fitnesstutorial #workouttips" (DeSouthFit)
UPDATE exercises SET help_url = 'https://youtu.be/q-Cqh92uI18' WHERE id = 'c5b0c5ce-4dc2-4f28-ba12-fcf87bb13540';

-- [KEEP] Cross-Body Shoulder Stretch | "Shoulder Crossbody Stretch" (React Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/aIq0fLi8iak' WHERE id = '3c6389cc-09bb-40f7-b72a-ac12c4d60b9b';

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

-- [KEEP] Figure Four Stretch | "Figure 4 stretching" (Canadian Chiropractic Guideline Initiative (CCGI))
UPDATE exercises SET help_url = 'https://youtu.be/Xb5gHdYtHnk' WHERE id = 'a4b1f027-1420-498c-824c-ce9b39cf6148';

-- [KEEP] Seated Glute Stretch | "Seated Glute Stretch to Relieve Deep Butt and Hip Tightness" (Michelle Kenway)
UPDATE exercises SET help_url = 'https://youtu.be/e3DZzHcwk3o' WHERE id = '750c8572-09c3-4754-91f1-0201d5bd3f26';

-- [KEEP] Lying Quad Stretch | "How To Side Hip and Quad Stretch | Nuffield Health" (Nuffield Health)
UPDATE exercises SET help_url = 'https://youtu.be/_xU-wIiMxpI' WHERE id = '8b74c192-8310-44a4-b418-34246625b8f2';

-- [KEEP] Seated Hamstring Stretch | "Hamstring Stretch Seated" (Hope Physical Therapy and Aquatics)
UPDATE exercises SET help_url = 'https://youtu.be/aJvfeuu71gw' WHERE id = 'a6dde5d3-f633-4ee9-8dde-45b9e6944fe4';

-- [KEEP] Seated Forward Fold | "Transform your seated forward fold with 1 hack (Tip to improve Hamstring Flexibility). #yogatips" (YogaCandi)
UPDATE exercises SET help_url = 'https://youtu.be/1E-84p0itDs' WHERE id = '86826a31-7033-400b-818f-ab9e1282fa4a';

-- [KEEP] Prayer Stretch | "Prayer Stretch" (Coury & Buehler Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/yIby7iIVL4k' WHERE id = '92c01251-6aaf-4332-9624-163ea241a28a';

-- [KEEP] Single-Leg Reach (Bulg Squat) | "Bulgarian Split Squat - Easiest Setup" (Alex Thieme)
UPDATE exercises SET help_url = 'https://youtu.be/Q20qIs79tJc' WHERE id = 'da6ae97d-5308-4bc8-9c72-6bf21f6a9e02';

-- [KEEP] Reverse Prayer Stretch | "Reverse Prayer Stretch" (ReShape Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/chPRkQUcsw0' WHERE id = '259ef0ba-2328-4135-b4e9-2fda23c4e289';

-- [KEEP] Finger Extension Stretch | "Best 4 Exercises for Finger Extension (Get Your Finger STRAIGHT)" (Virtual Hand Care)
UPDATE exercises SET help_url = 'https://youtu.be/FfFK4e8sviY' WHERE id = '23e811f4-b56b-43e5-852e-64d53d770515';

-- [KEEP] Thumb Stretch | "7 Thumb Joint (CMC) Stretches & Exercises" (AskDoctorJo)
UPDATE exercises SET help_url = 'https://youtu.be/wK4II92qHDs' WHERE id = '2401c894-2638-4f25-a37d-b8fcf466e74c';

-- [KEEP] Side Lunge | "How to Do Side Lunges for Lean Legs | Health" (Health)
UPDATE exercises SET help_url = 'https://youtu.be/rvqLVxYqEvo' WHERE id = '3cf9bfff-d021-43fe-adc7-627e1f5b3795';

-- [KEEP] Side Iso Hops | "Side to Side Pogo Hops" (SHRP Training)
UPDATE exercises SET help_url = 'https://youtu.be/1nalEXWG8jo' WHERE id = 'ab73d889-e546-4d6a-b571-10b81f12d63d';

-- [KEEP] Pistol Squat | "Perform Your First Pistol Squat Using These Progressions" ([P]rehab)
UPDATE exercises SET help_url = 'https://youtu.be/bH3mRwnAN88' WHERE id = 'f298ee0b-3d2a-4dac-afe2-486cd6bc6887';

-- [KEEP] reverse lunges | "How To Perform The Reverse Lunge" (Dr. Carl Baird)
UPDATE exercises SET help_url = 'https://youtu.be/Ry-wqegeKlE' WHERE id = 'f774f5fc-300e-43ab-b364-6f060162ba5d';

-- [KEEP] Mid Row | "How to Use the Mid Row Machine (Correct Form) #correctform" (Hitesh Malhotraa Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/yrRHFZ3MDxA' WHERE id = '21d5a91e-7e45-4245-8df4-58365c7a4664';

-- [KEEP] RDL | "RDL Tutorial: 3 Simple Steps" (Davis Diley)
UPDATE exercises SET help_url = 'https://youtu.be/5rIqP63yWFg' WHERE id = 'af7adb56-80a5-471f-9609-9263f6a1e0d7';

-- [KEEP] Sled Push | "How To Do The Sled Push The RIGHT Way! (AVOID MISTAKES!)" (Mind Pump TV)
UPDATE exercises SET help_url = 'https://youtu.be/9XRRXaUpnLk' WHERE id = 'c4eec08e-8fb9-4d52-965b-2b9ce21ded0a';

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

-- [KEEP] Romanian Deadlift | "HOW TO DO ROMANIAN DEADLIFTS (RDLs): Build Beefy Hamstrings With Perfect Technique" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/_oyxCn2iSjU' WHERE id = '425f37e1-c2eb-4995-9cb9-f74793a0f397';

-- [KEEP] Hip Thrust | "Proper Hip Thrust Form" (Bret Contreras Glute Guy)
UPDATE exercises SET help_url = 'https://youtu.be/LM8XHLYJoYs' WHERE id = '3db09c4d-0239-4be4-80a5-cd7fe9e8cc2c';

-- [KEEP] Push-Up | "STOP Doing Pushups Like This! (SAVE A FRIEND)" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/At8PRTDDhrU' WHERE id = '41e6d3c5-8866-4cf9-bf8d-2052b11d9ff5';

-- [KEEP] Pallof Press | "Standing Band Anti-rotation With Pallof Press Exercise" (Spine Science Front Desk)
UPDATE exercises SET help_url = 'https://youtu.be/8vflPTMBQ_g' WHERE id = 'db4a6e75-2b25-4eab-9b3c-6a6c36e14898';

-- [KEEP] Hanging Leg Raises | "How to Properly Perform Hanging Leg Raises With Good Form For Shredded Abs (Exercise Demonstration)" (Gerardi Performance)
UPDATE exercises SET help_url = 'https://youtu.be/2n4UqRIJyk4' WHERE id = '143eff06-5ce2-4a69-9191-2686cc9b90b7';

-- [KEEP] Bicycle Crunches | "How to do Bicycle Crunches Properly" (TylerPath)
UPDATE exercises SET help_url = 'https://youtu.be/NWzlS1Lp1e8' WHERE id = 'e42fbdc9-2ae5-4813-9df9-1947777346f4';

-- [KEEP] Overhead Press | ""How To" OVERHEAD PRESS" (Alan Thrall (Untamed Strength))
UPDATE exercises SET help_url = 'https://youtu.be/wol7Hko8RhY' WHERE id = '428141b0-63cf-4467-9514-fb6cbd01ea88';

-- [KEEP] Glute Bridge | "How to Perform the Perfect Glute Bridge" (Airrosti Rehab Centers)
UPDATE exercises SET help_url = 'https://youtu.be/OUgsJ8-Vi0E' WHERE id = '08e94c1d-f306-4734-9610-387b5626b503';

-- [KEEP] Leg Press | "How To Leg Press With Perfect Technique" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/nDh_BlnLCGc' WHERE id = '412295da-9c4c-4be5-9912-ec06c1a2ad5c';

-- [KEEP] Cable Fly | "Do Cable Flyes LIKE THIS for a BIGGER CHEST" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/tGXIQR89-JE' WHERE id = 'b3cf51a0-28e6-4669-8764-384cd46702fc';

-- [KEEP] DB Bench Press | "Best Dumbbell Bench Press Tutorial Ever Made" (Davis Diley)
UPDATE exercises SET help_url = 'https://youtu.be/1V3vpcaxRYQ' WHERE id = 'bcd106ef-4d81-4360-8d5d-096f8d712a25';

-- [KEEP] Barbell Ab Rollout | "Barbell Rollout" (The Active Life)
UPDATE exercises SET help_url = 'https://youtu.be/3C1TRMJveXo' WHERE id = 'ca50548c-d937-4474-991b-cf8afa17ebba';

-- [KEEP] Standing Single-Arm Press | "How to PROPERLY Single Arm Shoulder Press For Muscle Gain" (Colossus Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/4INnuqPeyIQ' WHERE id = '29a3c98a-7878-454c-95ff-5e8f0af75eca';

-- [KEEP] Dumbbell Squat and Press | "Dumbbell Squat Thruster" (Daily Workout Builder)
UPDATE exercises SET help_url = 'https://youtu.be/xGCASSd_31E' WHERE id = '31b86a08-c898-4703-9da4-aa980254d32c';

-- [KEEP] seated high row | "How to do a seated row" (Nuffield Health)
UPDATE exercises SET help_url = 'https://youtu.be/DHA7QGDa2qg' WHERE id = '363cc770-2a65-40f8-a2d2-b652e96564bb';

-- [KEEP] World's Greatest Stretch | "World’s Greatest Stretch | Full Body Mobility Exercise | Easy Workout | Body Stretch | Cure Fit" (wearecult)
UPDATE exercises SET help_url = 'https://youtu.be/OvObOV0WrKw' WHERE id = '7d381adb-2d3f-44e6-b08a-07f28cd5e23d';

-- [KEEP] 90/90 Hip Stretch | "How to do a 90/90 Hip Stretch properly - CORRECT FORM IS ESSENTIAL" (Jack Hanrahan Fitness )
UPDATE exercises SET help_url = 'https://youtu.be/VYvMMw8z3rE' WHERE id = 'febdf791-c9bc-476b-b72c-a5dc834eafdc';

-- [KEEP] Doorway Chest Stretch | "Doorway Chest Stretch - Pectoralis Major and Minor exercise" (Rehab Hero)
UPDATE exercises SET help_url = 'https://youtu.be/O8rJw_TmC1Y' WHERE id = '64a364d9-efcf-4f13-adc7-28d129afb28c';

-- [KEEP] Supine Twist | "Supine Spinal Twist" (KE Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/ElKoMMaTPCM' WHERE id = 'dad51a7c-f1ec-4e11-867f-493c67fe45fe';

-- [KEEP] DB Incline Press | "Incline DB Bench 🔥 BEST Guide Ever Made" (Davis Diley)
UPDATE exercises SET help_url = 'https://youtu.be/ou6s32mJgjU' WHERE id = '3153bf6c-a798-47b4-87eb-92b2fb654c99';

-- [KEEP] Cable Woodchops | "HOW TO: Cable Wood Chop" (Goodlife Health Clubs)
UPDATE exercises SET help_url = 'https://youtu.be/ZDt4MCvjMAA' WHERE id = 'b1254d46-2f3a-4be9-a649-cfbc86c40e71';

-- [KEEP] Hip Flexor Stretch | "How to PROPERLY Perform the Kneeling Hip Flexor Stretch With Good Form (For Tight Hip Flexors)" (Gerardi Performance)
UPDATE exercises SET help_url = 'https://youtu.be/ktgtEWGhFd8' WHERE id = '919fce78-c74c-44cb-ad1f-d18d4fb14959';

-- [KEEP] Couch Stretch | "Couch stretch | The MSK Physio" (The Musculoskeletal Clinic)
UPDATE exercises SET help_url = 'https://youtu.be/B3rOeBLqlF4' WHERE id = 'd7cefd33-1222-4277-9414-0b3db7b1d1e8';

-- [KEEP] Piriformis Stretch | "Figure 4 (Piriformis) Stretch for Sciatica Pain" (Vive Health)
UPDATE exercises SET help_url = 'https://youtu.be/E6sqUHFt6Ng' WHERE id = '78ea4d3c-a29e-49d2-9a38-e39188022c4f';

-- [KEEP] IT Band Stretch | "BEST Stretches for IT Band (Iliotibial band) Pain" (VIGEO)
UPDATE exercises SET help_url = 'https://youtu.be/aOQOV6LG9nw' WHERE id = 'b8700034-51a3-4f2a-999f-cb6354d9cc24';

-- [KEEP] Thread the Needle | "Threading the needle - a thoracic spine stretch" (Six Physio)
UPDATE exercises SET help_url = 'https://youtu.be/MfUx9FCOb1E' WHERE id = '941e9820-69b0-42e3-86ee-ea96c79513ff';

-- [KEEP] Thoracic Spine Rotation | "All-4s Thoracic Spine Rotations" (Daily Workout Builder)
UPDATE exercises SET help_url = 'https://youtu.be/l3Ze_9iXL-M' WHERE id = '6cf2b6b8-622c-4231-8d5a-442776194098';

-- [KEEP] Butterfly Stretch | "Butterfly Stretch - Adductor (Groin) Stretch" (Elevate Health UK)
UPDATE exercises SET help_url = 'https://youtu.be/5vbljPADsAo' WHERE id = '0285b0e9-4cea-4aa4-ac1c-f296e799b152';

-- [KEEP] Sleeper Stretch | "Sleeper Stretch for Posterior Shoulder Mobility" (The Barbell Physio)
UPDATE exercises SET help_url = 'https://youtu.be/clqjaMIRWfM' WHERE id = 'e228a3dc-b2ce-4b82-bd59-f654a68e9d6b';

-- [KEEP] Standing Quad Stretch | "Standing Quadricep Stretch" (Baptist Health)
UPDATE exercises SET help_url = 'https://youtu.be/zi5__zBRzYc' WHERE id = 'c2fc7398-6a0d-458f-ad1c-814ee3e79e5f';

-- [KEEP] Standing Hamstring Stretch | "Hamstring Stretch: Post-Race Standing Stretches" (Runner's World)
UPDATE exercises SET help_url = 'https://youtu.be/inLULJztZh0' WHERE id = '3813831a-8a99-4af3-bcf4-3f5982f9f058';

-- [KEEP] Standing Calf Stretch | "Standing Calf Stretch Technique #shorts" (Doctor O'Donovan)
UPDATE exercises SET help_url = 'https://youtu.be/7SO6QzfBRaE' WHERE id = 'c12a4afd-ef45-4255-b087-cc232e0b2179';

-- [KEEP] Achilles Tendon Stretch | "Achilles Tendon Stretches - Ask Doctor Jo" (AskDoctorJo)
UPDATE exercises SET help_url = 'https://youtu.be/vU_FVahd4HI' WHERE id = '24a9ba79-26de-4908-9cb9-44a698faca46';

-- [KEEP] Plantar Fascia Stretch | "3 Stretches To Melt Plantar Fasciitis" (Movement Project PT)
UPDATE exercises SET help_url = 'https://youtu.be/LX1bHBOmjXA' WHERE id = 'dce0b1fe-11a4-4281-8e6c-951e058c27a1';

-- [KEEP] pull up assists | "here's how to properly use the assisted pull-up machine with @gerardiperformance" (Fitness Reels)
UPDATE exercises SET help_url = 'https://youtu.be/owMowIRkyvQ' WHERE id = '904ff81f-9e75-4455-87c1-bfb604607164';

-- [KEEP] Bent Over Barbell Row | "What’s the best Row variation? #backday #backworkout #rows #bentoverrows #workout" (Jeff Nippard Clips)
UPDATE exercises SET help_url = 'https://youtu.be/v1gatxQJ_Eo' WHERE id = '0a51bc2e-6b1e-4931-a080-2c5fb572aa31';

-- [KEEP] Alternate Incline Dumbbell Curl | "How to do the Incline Dumbbell Curl Correctly" (TylerPath)
UPDATE exercises SET help_url = 'https://youtu.be/XhIsIcjIbCw' WHERE id = '02e7f245-0725-4261-97f4-0179712feccb';

-- [KEEP] triceps rope extensions | "How to properly do the tricep rope pushdown" (iyaji adoga)
UPDATE exercises SET help_url = 'https://youtu.be/NvZKjiZ8NYc' WHERE id = 'dcc2bc2c-8436-4029-be41-f16d955ace31';

-- [KEEP] squat dumbbell | "📌HOW TO DO A GOBLET SQUAT" (SquatCouple)
UPDATE exercises SET help_url = 'https://youtu.be/lRYBbchqxtI' WHERE id = '466b9aa8-8659-4964-9a53-43404ada9965';

-- [KEEP] wood chopper | "HOW TO: Cable Wood Chop" (Goodlife Health Clubs)
UPDATE exercises SET help_url = 'https://youtu.be/ZDt4MCvjMAA' WHERE id = '85dfe48f-985c-4d70-a2d3-d4afb5f7a95f';

-- [KEEP] Hamstring curl | "Build Your Legs | Lying Hamstring Curl Tutorial | Beginner's Guide to Gym Machines" (Tim Bullici)
UPDATE exercises SET help_url = 'https://youtu.be/i6m3Vp9H40Y' WHERE id = 'dd429076-07dc-48c4-8661-2971840c4090';

-- [KEEP] leg extension | "How to do Leg Extensions!" (Jeremy Sry)
UPDATE exercises SET help_url = 'https://youtu.be/w72YiHz15CA' WHERE id = '71df72e3-8ced-4795-a005-b7a7671b04d8';

-- [KEEP] Bulgarian Split Squat | "Stop F*cking Up Bulgarian Split Squats (PROPER FORM!)" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/hiLF_pF3EJM' WHERE id = '439217d5-a4f5-4bc5-bf30-8f55d4abe58e';

-- [KEEP] Lateral Raise | "Jeff Nippard's Method For Perfect Lateral Raises" (Jesse James West)
UPDATE exercises SET help_url = 'https://youtu.be/NZsldrqqca8' WHERE id = '15024e35-53be-4f6c-8641-ef99ef0d5783';

-- [KEEP] Lat Pulldown | "Stop Messing Up Your Lat Pulldowns" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/hnSqbBk15tw' WHERE id = '07f6c3d0-1757-4f0c-8e81-d3629fb35b9b';

-- [KEEP] Wrist Flexor Stretch | "WRIST FLEXOR STRETCH" (Muscle & Motion)
UPDATE exercises SET help_url = 'https://youtu.be/63LEj3oP6lA' WHERE id = 'b3bfa485-1df8-4bb9-a439-43e35e80c610';

-- [KEEP] Wrist Extensor Stretch | "Wrist Extensors Stretch" (Empower Movement Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/T2pO53x4cNs' WHERE id = '6844a583-4c6e-491c-99ad-c602803fbfd0';

-- [KEEP] pullover | "Pullovers Will Transform Your Body (Muscle, Strength, Mobility)" (FitnessFAQs)
UPDATE exercises SET help_url = 'https://youtu.be/Lw0k_Gv0sIM' WHERE id = 'a95c5e14-e5dc-4d9d-9670-646dd14d8c00';

-- [KEEP] Face Pull | "STOP F*cking Up Face Pulls (PROPER FORM!)" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/ljgqer1ZpXg' WHERE id = 'bbf96dcd-7134-4afb-bd56-5ccd28737a24';

-- [KEEP] Pull-Up | "Do More Unbroken Pull-Ups (INSTANTLY)" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/74XocPGr1SU' WHERE id = 'b1193543-d504-4626-835c-87c47b331a06';

-- [KEEP] Ankle Dorsiflexion Stretch | "Ankle Mobility Hack #shorts" (MovementbyDavid)
UPDATE exercises SET help_url = 'https://youtu.be/m6J-9oQ9lHQ' WHERE id = '193001a3-eebe-4761-9861-0fc3b316aee7';

-- [KEEP] high row | "Why you’re doing the machine high row wrong" (TylerPath)
UPDATE exercises SET help_url = 'https://youtu.be/_Jqhs5V1aJg' WHERE id = '96d2129b-2b8b-4284-b565-146fef29e5a3';

-- [KEEP] isolated seated row | "How to do a seated row" (Nuffield Health)
UPDATE exercises SET help_url = 'https://youtu.be/DHA7QGDa2qg' WHERE id = '38d791b3-ce58-42e0-a1fb-445e0f5bd0f3';

-- [KEEP] Rear Delt Dly | "The PERFECT Dumbbell Rear Delt Fly (DO THIS!)" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/LsT-bR_zxLo' WHERE id = '742ee1d0-6919-4fa3-9abe-a610b1e38ce8';

-- [KEEP] Calf Raise | "You're Doing Calf Raises WRONG | The Correct Way Taught By Physical Therapist" (Rehab and Revive)
UPDATE exercises SET help_url = 'https://youtu.be/CtyIVeJH6lI' WHERE id = 'e89a3b3a-1f94-45b6-b8ac-a04051d6e3fe';

-- [KEEP] Walking Lunges | "Walking Lunges Exercise Tutorial | Build Legendary Legs & Cardio" (Buff Dudes Workouts)
UPDATE exercises SET help_url = 'https://youtu.be/Pbmj6xPo-Hw' WHERE id = '045eb133-8e12-4aea-9e56-a6615a477d0f';

-- [KEEP] Seated Cable Row | "Seated Cable Row – Full Video Tutorial & Exercise Guide" (Fit Father Project - Fitness For Busy Fathers)
UPDATE exercises SET help_url = 'https://youtu.be/CsROhQ1onAg' WHERE id = '7b547802-dc7f-406d-829e-c3c81cd4d6c1';

-- [KEEP] cable pullover | "How to do the CABLE LAT PULLOVER! | 2 Minute Tutorial" (Max Euceda)
UPDATE exercises SET help_url = 'https://youtu.be/32auHIqgEoM' WHERE id = 'e54ceba1-10c3-45a1-871f-e432d8fd1467';

-- [KEEP] Cable Pullover | "How to do the CABLE LAT PULLOVER! | 2 Minute Tutorial" (Max Euceda)
UPDATE exercises SET help_url = 'https://youtu.be/32auHIqgEoM' WHERE id = 'd8f7ec36-03ff-411d-a9b4-ed64773a3845';

-- [KEEP] knee raises | "Wake Up & Burn Fat: 100 High Knees, 100 Knee Raises, 100 Squats = Flat Stomach" (Fitness and Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/j9rj0LvQ0so' WHERE id = '73392c4a-fd48-440b-94dd-22e66616b11f';

-- [KEEP] Incline bench row narrow | "Setting Up for Chest Supported Dumbbell Rows in 10 Seconds ✅" (Aakash Wadhwani)
UPDATE exercises SET help_url = 'https://youtu.be/czoQ_ncuqqI' WHERE id = '565ee894-de36-4714-b32b-e3de67484552';

-- [KEEP] Smith Incline Press | "Easiest Way to Set Up Incline Smith Machine Bench Press (in Less than 1 Minute)" (TylerPath)
UPDATE exercises SET help_url = 'https://youtu.be/ohRa_YRmVCk' WHERE id = '8d669b2a-4e11-42c8-9603-1eb66fbaca6a';

-- [KEEP] Smith Flat Bench Press | "Correct way to perform Smith Machine Bench Press #benchpress #smithmachinebenchpress" (Train with Dave )
UPDATE exercises SET help_url = 'https://youtu.be/E4G-M8Vvzps' WHERE id = '0c96823a-ec35-42f0-86be-baa13b2fb2fc';

-- [KEEP] Bird Dog | "Bird Dog Exercise | Improve Your Core and Balance" (Muscle & Motion)
UPDATE exercises SET help_url = 'https://youtu.be/QABW99qPiNM' WHERE id = 'e84b7379-b5b8-4604-804a-825da7b60dd9';

-- [KEEP] Ab Wheel Rollout | "Never Do Ab Wheel Rollouts Like This!" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/A3uK5TPzHq8' WHERE id = '7ce9ba51-6c6f-42c2-8f1b-2b278877eaff';

-- [KEEP] Smith Machine Decline Press | "How to perform a Decline Bench Press in the Smith Machine for Bigger Lower Chest Gains" (Ryan Sapstead Coaching)
UPDATE exercises SET help_url = 'https://youtu.be/ZZZLtgOKqfk' WHERE id = '32737aab-5a3d-454a-8cd4-5900559d8cd7';

-- [KEEP] Hammer Curl | "Dumbbell Hammer Curls Tutorial | CORRECT TECHNIQUE (!)" (One Minute Tutorial)
UPDATE exercises SET help_url = 'https://youtu.be/OPqe0kCxmR8' WHERE id = '8aed8c66-0166-490d-9a1b-a18c0b50e68b';

-- [KEEP] Landmine | "Stability Meets Range Of Motion With These Landmine Exercises #SHORT" (Marcus Filly)
UPDATE exercises SET help_url = 'https://youtu.be/0efz8srgH7c' WHERE id = '8ce1f9f7-cc52-4d9d-b530-f64766ffc3e8';

-- [KEEP] Landmine Rotation | "Landmine Rotation" (O.B. Training & Sports Performance)
UPDATE exercises SET help_url = 'https://youtu.be/MswsBPLGhE8' WHERE id = 'dabea74e-389c-4fa8-bcd4-a7f9cf2c652b';

-- [KEEP] Pilates Squat + Squat | "Squat | Pilates Exercises for Cancer Patients" (Roswell Park Comprehensive Cancer Center)
UPDATE exercises SET help_url = 'https://youtu.be/xrJzRE0Cv0c' WHERE id = '654f644b-38ae-42cb-8c02-01d00aa73ed9';

-- [KEEP] Dead Bug | "Dead Bug - Abdominal / Core Exercise Guide" (Bodybuilding.com)
UPDATE exercises SET help_url = 'https://youtu.be/4XLEnwUr1d8' WHERE id = 'a57eabc8-dfa9-42e1-94c8-cedbd98626ab';

-- [KEEP] Alternate Hammer Curl | "Hammer Curls: Know The Difference ⚠️ #armsworkout" (Hazzytrainer)
UPDATE exercises SET help_url = 'https://youtu.be/8H5oWMNWWeQ' WHERE id = '0cf918e5-18dd-448c-962c-5acba7da0151';

-- [KEEP] Bicep Curls | "STOP Doing This On Bicep Curls!" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/VCw_uIxW8WE' WHERE id = '943d0c35-70bf-4fb3-993e-69782f63aee7';

-- [KEEP] Burpee DB Press | "Dumbbell Burpee to Press #dumbbellworkout #dumbbell #dumbbellexercise" (Jump Start)
UPDATE exercises SET help_url = 'https://youtu.be/5FM1DQr2tq4' WHERE id = '2da0485e-39b8-4bc6-98b5-e6965aa1d947';

-- [KEEP] DB Overhead Press | "Dumbbell Overhead Press - How To" (Bobby Maximus)
UPDATE exercises SET help_url = 'https://youtu.be/Did01dFR3Lk' WHERE id = 'e4f70e4e-b998-4289-b2ba-8fd80d1d386e';

-- [KEEP] Standing Cable Wood Chop | "HOW TO: Cable Wood Chop" (Goodlife Health Clubs)
UPDATE exercises SET help_url = 'https://youtu.be/ZDt4MCvjMAA' WHERE id = '25395c37-9145-4a61-89de-271ae067a7e5';

-- [KEEP] Skull Crusher | "THIS is a Proper Skullcrusher" (Renaissance Periodization)
UPDATE exercises SET help_url = 'https://youtu.be/OQ4TWXkZjTc' WHERE id = '232e88d9-30ff-4b5c-9c86-f99974b4ac68';

-- [KEEP] decline press | "❌ Decline Bench Press Mistake (AVOID THIS!)" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/a-UFQE4oxWY' WHERE id = '2acc0a31-fc0a-4c2b-ba5d-8a7d7f0213f3';

-- [KEEP] Child's Pose | "Child Pose" (Baptist Health)
UPDATE exercises SET help_url = 'https://youtu.be/kH12QrSGedM' WHERE id = '63665a56-f1c1-4a2c-85b0-91c00dc43800';

-- [KEEP] DB Renegade Row | "Renegade Row: Core & Back Builder" (BuiltLean®)
UPDATE exercises SET help_url = 'https://youtu.be/wTqlJ0aoJlM' WHERE id = '8996206f-c166-4c1a-b6b2-7c5228fc6a1f';

-- [KEEP] Squat | "Do You Have A Perfect Squat? (Find Out)" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/PPmvh7gBTi0' WHERE id = '6289d8f3-8940-4650-be61-28b8a73f15cf';

-- [KEEP] Incline Dumbbell Press | "Incline DB Bench 🔥 BEST Guide Ever Made" (Davis Diley)
UPDATE exercises SET help_url = 'https://youtu.be/ou6s32mJgjU' WHERE id = '07e7ed9b-2170-4366-b90c-50b2b6d2f340';

-- [KEEP] Bent-Over Row | ""How To" Barbell Row" (Alan Thrall (Untamed Strength))
UPDATE exercises SET help_url = 'https://youtu.be/G8l_8chR5BE' WHERE id = 'f3d015a7-71f1-49d7-9651-1cb5a29344d1';

-- [KEEP] DB Split Squat | "Dumbbell split squat technique! 🦿 Follow for more fitness tips ✅" (Alex Lueth)
UPDATE exercises SET help_url = 'https://youtu.be/sw4MzpC8l58' WHERE id = 'fb082ab1-e28e-4c32-bd10-c9bb21d23503';

-- [KEEP] Dips | "How To Do Dips For A Bigger Chest and Shoulders (Fix Mistakes!)" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/yN6Q1UI_xkE' WHERE id = 'd405ed82-6a39-4013-ac8c-7a4ada1a4f5d';

-- [KEEP] Goblet Squat | "📌HOW TO DO A GOBLET SQUAT" (SquatCouple)
UPDATE exercises SET help_url = 'https://youtu.be/lRYBbchqxtI' WHERE id = '1802b862-b24a-4f3d-8ca5-2fd76554929a';

-- [KEEP] Plank | "Core Exercise: Plank" (Children's Hospital Colorado)
UPDATE exercises SET help_url = 'https://youtu.be/pvIjsG5Svck' WHERE id = 'a82a6ef2-d324-43ea-aa8d-02d847269117';

-- [KEEP] DB Step-ups | "How To: Weighted Step Ups" (Forty Steps)
UPDATE exercises SET help_url = 'https://youtu.be/PzDbmqL6qo8' WHERE id = '1ee110eb-9d11-442a-bacb-c06c4412dd13';

-- [KEEP] Overhead Tricep Stretch | "Tricep Stretch" (React Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/_IOHtPSYGbk' WHERE id = '226b3940-4553-4dcf-896b-7bf737d86c38';

-- [KEEP] teapot situp | "Teapots Core Exercise" (Michelle Pottratz)
UPDATE exercises SET help_url = 'https://youtu.be/0Ss71jGBuAs' WHERE id = '5981cea0-33c0-4371-ab64-98231f667235';

-- [KEEP] Decline situp | "How to improve your sit-ups (decline tips)" (Quinlan Smith)
UPDATE exercises SET help_url = 'https://youtu.be/KZ7EWSAkpdM' WHERE id = '1de702f5-6e9f-46e0-874a-a84cc38e35ab';

-- [KEEP] Standing Wide Row | "Cable Row Grip Widths & Muscles Worked!" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/vqPY3fDessY' WHERE id = 'edb9bf16-8024-4b84-9902-c793b62e5efc';

-- [KEEP] Standing Narrow Row | "How To Do Bent Over Rows (With Dumbbells) #shorts" (Heather Robertson)
UPDATE exercises SET help_url = 'https://youtu.be/vN8xskk-7G8' WHERE id = '4e7a5a46-149f-4ad6-849f-80fc15d80622';

-- [KEEP] Ankle Circles | "Ankle Circles" (MyMichiganHealth)
UPDATE exercises SET help_url = 'https://youtu.be/uV0I5adTRXw' WHERE id = 'ea65b8dd-aaa9-4926-bd24-ab92a25104a6';

-- [KEEP] Alternating Pullover | "The Best Way To Do Pullovers For Growth" (FitnessFAQs)
UPDATE exercises SET help_url = 'https://youtu.be/gbDH1OvCe-M' WHERE id = '3d97b250-6c50-48b7-a272-e717fe098224';

-- [KEEP] Forearm Plank | "How to do a forearm plank | proper plank form #shorts #short #plank" (Active Annie)
UPDATE exercises SET help_url = 'https://youtu.be/UQ78pw0WNZI' WHERE id = '2196cfb8-1303-4c49-b4af-2ab4c22dc9d2';

-- [KEEP] standing row narrow | "The PERFECT Barbell Row (5 Steps)" (Jeremy Ethier Shorts)
UPDATE exercises SET help_url = 'https://youtu.be/Nqh7q3zDCoQ' WHERE id = '6e3153e3-97f9-4407-8b23-141f5b8515c8';

-- [KEEP] Cable Lateral Raise | "Stop Messing Up Lateral Raises (Easy Fix)" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/f_OGBg2KxgY' WHERE id = '6b049a6a-af28-4904-82c9-bec0646b0cdc';

-- [KEEP] Alt side lunge Plus Dumbbell Rows | "Dumbbell- lateral lunge switching DB side to side" (Recreate Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/KyygUQrhcwI' WHERE id = 'bdb7a488-5369-4dbb-ac9c-f2057d6f3def';

-- [KEEP] Cable Row | "Cable Row Form Tips (DO THIS!)" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/qD1WZ5pSuvk' WHERE id = '6db3aa53-12f5-4a74-a7cd-96124061f812';

-- [KEEP] Progressive Muscle Relaxation | "Reduce Stress through Progressive Muscle Relaxation (3 of 3)" (Johns Hopkins Rheumatology)
UPDATE exercises SET help_url = 'https://youtu.be/ClqPtWzozXs' WHERE id = '13a39bb1-ef8a-4b85-8930-13d98a2ec9ca';

-- [KEEP] Seated Arm Circles | "SEATED ARM CIRCLES | Exercise Guide | Safe Exercise for Osteoporosis" (Bonestrong Labs)
UPDATE exercises SET help_url = 'https://youtu.be/5R2aFtejVlE' WHERE id = 'f49246b1-c18a-4464-9060-50e163b08176';

-- [KEEP] Intrinsic Foot Strengthening | "Build Strong Feet: Exercises To Strengthen Your Foot & Ankle" (E3 Rehab)
UPDATE exercises SET help_url = 'https://youtu.be/S5xKokqeOb4' WHERE id = '43a8ef72-e170-4ec1-a7d3-64fc99851ac8';

-- [KEEP] Chest Opener Stretch | "Standing Chest Opener" (St. Peter's Health)
UPDATE exercises SET help_url = 'https://youtu.be/crnw1IKWNZY' WHERE id = '3600076a-d91b-4653-aec8-9dbe1a4c38a4';

-- [KEEP] Lat Doorway Stretch | "Doorway Lat Stretch" (Catalyst Physical Therapy & Wellness)
UPDATE exercises SET help_url = 'https://youtu.be/5HLQAVOvxNE' WHERE id = '178dd043-84e0-4f32-84a4-6203c0d6c414';

-- [KEEP] Prone Cobra | "Prone Cobra" (the Bodysmith)
UPDATE exercises SET help_url = 'https://youtu.be/hcTILl3cVkQ' WHERE id = '2fec7a78-a8f1-421a-92c1-02a682ea2e71';

-- [KEEP] Rhomboids-SMR | "Rhomboids SMR  Exercise Videos & Guides  Bodybuilding com" (how to lose weight with the keto diet)
UPDATE exercises SET help_url = 'https://youtu.be/gyHsdmSo5qY' WHERE id = 'c66be6d6-9aea-49b8-b4ba-c4e11ae4f86d';

-- [KEEP] Pec Minor Stretch | "How To Release Pec Minor" (Bulletproof Shoulders with Jason)
UPDATE exercises SET help_url = 'https://youtu.be/HmB8M3CEBCM' WHERE id = 'd8078b91-d499-439e-b418-fd7eab7efa1d';

-- [KEEP] Floor Press + Mod Push-up | "How to Learn Full PLANCHE Push Up?" (Andry Strong)
UPDATE exercises SET help_url = 'https://youtu.be/lMSenJbj2DM' WHERE id = '99f25f33-e9a2-42ad-a230-7fab43488a11';

-- [KEEP] Cable Crunch | "How To: Cable Crunch | Form Tutorial" (Kade Howell)
UPDATE exercises SET help_url = 'https://youtu.be/dkGwcfo9zto' WHERE id = '45de9606-18c3-4500-9a28-cdf440454d51';

-- [KEEP] Cable Squat Row | "Squat to Cable Row" (University of Denver Sports Performance)
UPDATE exercises SET help_url = 'https://youtu.be/tlb6fMI3XXg' WHERE id = 'fd61b1ba-c236-4e99-8e02-cf48b6517ba4';

-- [KEEP] Cable Torso Rotations | "How to do the cable oblique twist📈 #gymtips #gymworkout #exercisetips #howtogetabs #obliqueworkout" (Troy Sutton)
UPDATE exercises SET help_url = 'https://youtu.be/yglSetVOFeA' WHERE id = '7414faf7-5b3d-4516-b547-402aef80f6cb';

-- [KEEP] Cable/Band Lateral Raise | "Cable Lateral Raise Setup in 10 Seconds !✅" (Aakash Wadhwani)
UPDATE exercises SET help_url = 'https://youtu.be/lMJUXEvcMkQ' WHERE id = 'f13a998b-eb1a-4455-9105-33250861b7a1';

-- [KEEP] Seated Row | "Seated Cable Row – Full Video Tutorial & Exercise Guide" (Fit Father Project - Fitness For Busy Fathers)
UPDATE exercises SET help_url = 'https://youtu.be/CsROhQ1onAg' WHERE id = 'f1a139a6-c8bf-4973-a6a5-760e6a766fc7';

-- [KEEP] Cable Face Pulls | "4 Facepull Mistakes You Need to FIX!" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/IeOqdw9WI90' WHERE id = 'f6f05350-3435-48ba-af10-d377d0c08941';

-- [KEEP] Leg Press + Leg Machines | "How To Leg Press With Perfect Technique" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/nDh_BlnLCGc' WHERE id = '96cbdbec-8e99-4147-aa3a-846681eb2954';

-- [KEEP] Alternating Kettlebell Row | "How to Perform the Kettlebell Row | Important Full Body Exercise" (Greg Brookes)
UPDATE exercises SET help_url = 'https://youtu.be/IyQAMOV0WAc' WHERE id = '9ff32d08-fab2-4657-a276-094f335e0b7d';

-- [KEEP] Farmer's Walk | "How To Do Farmer’s Walk Exercise @CoachAlexKopp" (Gymreapers)
UPDATE exercises SET help_url = 'https://youtu.be/4d-4gKn_lKk' WHERE id = '18be71da-bf4e-459d-9a6c-d58432d5f1ab';

-- [KEEP] Goblet Lateral Lunge | "Goblet Lateral Lunge" (Wilmington Strength)
UPDATE exercises SET help_url = 'https://youtu.be/8OgO3XjyLMo' WHERE id = '67c1a3ca-078a-4c75-8b65-9d53463579e6';

-- [KEEP] KB Deadlift | "How To Do a Kettlebell Deadlift | The Right Way | Well+Good" (Well+Good)
UPDATE exercises SET help_url = 'https://youtu.be/hinonqqzatk' WHERE id = '3e1a074f-5da1-49f8-9f44-3178d9747a04';

-- [KEEP] Ball Squat Toss | "Medicine Ball Squat Toss" (802 CrossFit)
UPDATE exercises SET help_url = 'https://youtu.be/jIBkXDJDTgI' WHERE id = '6ca47d6e-e9fa-4595-9892-281633b47a5e';

-- [KEEP] Chest Pass (Med Ball) | "Standing Medicine Ball Chest Pass" (Jordan Weber Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/IeOeonCFarM' WHERE id = '546e0d13-6653-4d60-a113-a094fc6e1c97';

-- [KEEP] Day 1 Push | "Best Push Workout For 2025 (Chest, Shoulders & Triceps)" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/bvwg4D9UWGI' WHERE id = '1804af5b-0324-4a07-88d1-5d2710aaa75d';

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

-- [NEW] Step Mill | "Planet Fitness Stairmaster (STAIR CLIMBER TUTORIAL!)" (KevTheTrainer)
UPDATE exercises SET help_url = 'https://youtu.be/Zn1O9LcKW9E' WHERE id = 'ed4488e7-1a31-40c1-83d3-60a3f90b530a';

-- [NEW] Pushup | "PUSH UPS FOR BEGINNERS #shorts" (MadFit)
UPDATE exercises SET help_url = 'https://youtu.be/HHRDXEG1YCU' WHERE id = '38d4d123-5560-4c33-a9d5-28e3b64ea3e6';

-- [NEW] Pushups | "PUSH UPS FOR BEGINNERS #shorts" (MadFit)
UPDATE exercises SET help_url = 'https://youtu.be/HHRDXEG1YCU' WHERE id = '4e352135-601e-454b-a834-df1ef6decbce';

-- [NEW] standing rows | "Bent-Over Row | How To Perform It Correctly And Safely | Men&#39;s Health UK" (Men's Health UK)
UPDATE exercises SET help_url = 'https://youtu.be/UL8ZcK64KxA' WHERE id = 'e0f4535c-3225-4923-a401-21f3548237a2';

-- [NEW] Toe Flexor Stretch | "Healthier feet are just 4 exercises away!" (The Barefoot Sprinter)
UPDATE exercises SET help_url = 'https://youtu.be/Ed0BjBEh5sE' WHERE id = '91408e7e-fb4a-4e56-a3b0-5d81bb3c48d8';

-- [NEW] Deadbug (Weighted) | "Dead Bug Exercise For Core Stability  | Pursuit Physical Therapy" (Pursuit Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/o4GKiEoYClI' WHERE id = 'b664e58f-b1b8-400f-b3b0-4be5f9d7339a';

-- [NEW] RDL (Dumbbells) | "Dumbbell Romanian (RDL) Deadlift |TECHNIQUE for Beginners" (Mike | J2FIT Strength & Conditioning)
UPDATE exercises SET help_url = 'https://youtu.be/hQgFixeXdZo' WHERE id = '582b987a-2e58-488a-963b-0695161e7fc4';

-- [NEW] isolate leg single leg decline situp | "The ONLY 2 Exercises for Chiseled Abs" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/A2s4QLmND2E' WHERE id = '237564e8-643a-47a8-9f55-417295de2b19';

-- [NEW] Lying Stretches | "Day 18 | FREE Abs &amp; Fat Burn Challenge | FULL BODY RECOVERY STRETCH ✨ Muscle Pain Prevention" (Lilly Sabri)
UPDATE exercises SET help_url = 'https://youtu.be/AUsbthQ9W-I' WHERE id = '33588261-5e0b-4d2a-846b-d37e1914229d';

-- [NEW] Hand Walks | "Hand Walks Exercise - Inchworms" (EverFlex Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/8YnINUa7OqE' WHERE id = '9580f0d6-6df5-463f-8f54-f03a37ecd227';

-- [NEW] Vertical Pogos | "Pogo Jumps" (Ashby Smith)
UPDATE exercises SET help_url = 'https://youtu.be/L_khHgMz9uU' WHERE id = 'fef090a1-328f-4853-8bdb-1705ac83649d';

-- [NEW] Modified Pullups | "✅ 5 pull-up tips 💪🏻 #pullups #backworkout #calisthenics" (Tristan Nee)
UPDATE exercises SET help_url = 'https://youtu.be/ym1V5H35IpA' WHERE id = 'c2772c87-8261-4d10-ae3c-ccf5e65f7ccd';

-- [NEW] Single Leg Pogos | "Pogo Jumps" (Ashby Smith)
UPDATE exercises SET help_url = 'https://youtu.be/L_khHgMz9uU' WHERE id = '3f1e6431-f623-4924-a936-12ba2382035d';

-- [NEW] Dynamic Side Lunges | "Side Lunge" (Explore Movement )
UPDATE exercises SET help_url = 'https://youtu.be/TnOkq6KfHsM' WHERE id = '1eda2e14-ca78-4a6b-8f55-a9560dd40bd4';

-- [NEW] Bilateral Hops | "Pogo Jumps" (Ashby Smith)
UPDATE exercises SET help_url = 'https://youtu.be/L_khHgMz9uU' WHERE id = '186bca06-39e2-4fa7-a339-7001dfdcc046';

-- [NEW] Depth Jumps | "How To Depth Jumps" (Third Space London)
UPDATE exercises SET help_url = 'https://youtu.be/DxzbXy0lC6Y' WHERE id = '13bcc775-1601-46ab-86a1-ea97f93afdd0';

-- [NEW] Box Jump | "How to Do Beginner Box Jump Exercises" (National Academy of Sports Medicine (NASM))
UPDATE exercises SET help_url = 'https://youtu.be/kNIInK_Le8I' WHERE id = '57854382-962e-41d6-9c02-09fe7de709fa';

-- [NEW] Box Step-ups | "Step up form for QUADS vs GLUTES 🔥 #shorts" (LISAFIITT)
UPDATE exercises SET help_url = 'https://youtu.be/8q9LVgN2RD4' WHERE id = '2a6c163b-5e09-4f99-8d26-805e3dfabe8e';

-- [NEW] Burpees | "How To Do Burpees Correctly by Cult Fit | Burpees For Beginners| Burpees Workout | Cult Fit|Cure Fit" (wearecult)
UPDATE exercises SET help_url = 'https://youtu.be/xQdyIrSSFnE' WHERE id = '5af004e8-94b3-4cbb-9b0e-df6ca4b28963';

-- [NEW] Butt Kicks (s) | "Butt Kicks Running Drill For Beginners" (Chari Hawkins)
UPDATE exercises SET help_url = 'https://youtu.be/s-iQOKtNW3A' WHERE id = '1864aeec-79c9-4c11-84c2-1042e3878e09';

-- [NEW] BW Back Extensions | "Back extension causing low back pain? Here is how to fix" (TylerPath)
UPDATE exercises SET help_url = 'https://youtu.be/upxW1WlptUE' WHERE id = '9357fd37-c9af-4342-b0d8-5bcab3f6a576';

-- [NEW] Bench Sprint | "How To Do A BENCH SPRINT | Exercise Demonstration Video and Guide" (Live Lean TV Daily Exercises)
UPDATE exercises SET help_url = 'https://youtu.be/fC4GiRdITqE' WHERE id = 'ad5739d0-0cf0-4850-8d38-10888a207ec2';

-- [NEW] Center Decline | "Decline Chest Press Tutorial" (Mustang Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/Bu3iLcCqBAI' WHERE id = 'eb1d1628-615c-42d2-b565-922f635fa96f';

-- [NEW] Chin-up Negatives | "Negative Chin-up Technique - Beginner Tutorial to Practice for Pull-ups - by BarStarzzBTX.com" (Passion.io)
UPDATE exercises SET help_url = 'https://youtu.be/mjNHoibfrMo' WHERE id = 'd28bad1f-9317-4fe5-8af9-c30d4f5a25ac';

-- [NEW] Cobra Stretch | "Cobra Stretch" (FitnessBlender)
UPDATE exercises SET help_url = 'https://youtu.be/JDcdhTuycOI' WHERE id = '6cbdef15-f16c-43b0-b382-439659baf9dc';

-- [NEW] Crab Walk | "How to Do Crabwalk Exercises | Rothman Orthopaedics" (Rothman Orthopaedics)
UPDATE exercises SET help_url = 'https://youtu.be/XAHZRIoNsHE' WHERE id = '12629028-b516-4911-ba6c-6bd9dd9f3b1a';

-- [NEW] Crunch | "Best abs exercises: Abdominal Crunch - Upper Abs - How to do crunch exercise" (P4P WORKOUTS )
UPDATE exercises SET help_url = 'https://youtu.be/_M2Etme-tfE' WHERE id = 'bb8a0810-ec61-4c99-a113-d7bb8798a6a0';

-- [NEW] Cycling | "Stationary Bike Workout for Beginners | 20 Minute" (Kaleigh Cohen Cycling)
UPDATE exercises SET help_url = 'https://youtu.be/rEqRmKAQ5xM' WHERE id = '7bc2f8b9-d78d-4b23-b155-37cc23187b10';

-- [NEW] decline situp | "How to Properly do Decline Ab Crunches" (TylerPath)
UPDATE exercises SET help_url = 'https://youtu.be/xfNAzPwNRqw' WHERE id = 'ecb029d5-ea2f-425a-8782-f42df8abc9fb';

-- [NEW] Decline Russian Twists | "STOP Doing Russian Twists Like This! (SAVE A FRIEND)" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/-BzNffL_6YE' WHERE id = 'cf95ab21-d763-4b59-a32c-2bae48a03a1c';

-- [NEW] Diamond + Wide Pushups | "✅ How to Do the Perfect Diamond Push-Up #shorts" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/PPTj-MW2tcs' WHERE id = '77f163e9-432b-46d0-b862-11a98e9e9f4a';

-- [NEW] Forward Leap | "Plyometric Training Workout" (Marcus Rios)
UPDATE exercises SET help_url = 'https://youtu.be/I_cwsX_95nw' WHERE id = 'fa1381de-be3e-44f5-a7bb-d7b12abdf552';

-- [NEW] Flutter Kicks | "How To Do Flutter Kicks (The Right Way)" (Benson Specialized Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/tPmybsDX8ZY' WHERE id = 'c83f6c93-4404-4b34-8956-23d07f7d0f20';

-- [NEW] Foot Hop | "TruFit UNIT - One Foot Hop" (GetTruFit)
UPDATE exercises SET help_url = 'https://youtu.be/swM4-OPn_6M' WHERE id = 'd124b685-a77e-44c1-ae80-b39e94bf60d0';

-- [NEW] Face Pulls | "STOP Doing Face Pulls Like This! (I&#39;M BEGGING YOU)" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/8686PLZB_1Q' WHERE id = '1a80be7b-ae64-4277-bf0d-1351715219df';

-- [NEW] DB Goblet Squat | "📌HOW TO DO A GOBLET SQUAT" (SquatCouple)
UPDATE exercises SET help_url = 'https://youtu.be/lRYBbchqxtI' WHERE id = '065a0722-2eb1-4a19-81f0-7d9f0cf918a4';

-- [NEW] Glute Bridge (Pulsing) | "How to Perform the Perfect Glute Bridge" (Airrosti Rehab Centers)
UPDATE exercises SET help_url = 'https://youtu.be/OUgsJ8-Vi0E' WHERE id = '8d897c23-bfc5-45f3-ab5b-4d3792224a63';

-- [NEW] Glute Bridge Hold | "How to Perform the Perfect Glute Bridge" (Airrosti Rehab Centers)
UPDATE exercises SET help_url = 'https://youtu.be/OUgsJ8-Vi0E' WHERE id = 'c7c8c551-9b6a-422c-999f-5e44afa14afe';

-- [NEW] High Knees (s) | "Avoid Mistake high knees exercise" (QIM FITNESS)
UPDATE exercises SET help_url = 'https://youtu.be/0X0Q8wKLEfo' WHERE id = '2106002e-fdc9-4285-a701-91fb8b6fa35f';

-- [NEW] Hip Circles | "Pro Tip: Hip Circles" (Mobility Doc)
UPDATE exercises SET help_url = 'https://youtu.be/x-5h_QUOem8' WHERE id = '18643250-2fc2-4d8a-9d5c-8d5175c18a67';

-- [NEW] Ice Skater Steps | "How to Ice Skate - Ten Tips for Absolute Beginners" (How To Inline Skate)
UPDATE exercises SET help_url = 'https://youtu.be/-vKYvvJ_-Hg' WHERE id = '248244d3-4ba6-4f58-9772-1b5c0d15472e';

-- [NEW] In-Out Jumping Jacks | "HOW TO: JUMPING JACKS #jumpingjacks #cardio #exercise" (Courtneyofitness)
UPDATE exercises SET help_url = 'https://youtu.be/7Pxr4xOrhNk' WHERE id = 'be3a9444-ec1d-4e35-9ba3-f0dfa03d040d';

-- [NEW] Inchworm Push-Up | "How to Do Inchworm Push Ups Correctly | Exercise of The Day #30" (Brian Syuki )
UPDATE exercises SET help_url = 'https://youtu.be/LCO4GQBEroA' WHERE id = 'c8fca4fc-caa2-4753-9639-4ee7c8d6b945';

-- [NEW] Incline Push-up | "How To Do An Incline Push Up" (Train With Adby - Personal Training Gym)
UPDATE exercises SET help_url = 'https://youtu.be/cfns5VDVVvk' WHERE id = '1b051178-b5a1-4122-8235-cad6594e81fe';

-- [NEW] Jump Squats | "HOW TO JUMP SQUAT #shorts" (Justina Ercole)
UPDATE exercises SET help_url = 'https://youtu.be/h5TmdMMtIT4' WHERE id = '4e62211d-c7e3-46ec-89f1-bed8b48972fe';

-- [NEW] Jumping Jacks (s) | "How to do Jumping Jacks exercise - Best Cardio Exercises video tutorial" (P4P WORKOUTS )
UPDATE exercises SET help_url = 'https://youtu.be/XR0xeuK5zBU' WHERE id = '68c4185e-06bb-4c36-b162-bfb91d93b987';

-- [NEW] Knee to Elbows | "How To: Alternating Knee To Elbow Crunches" (Forty Steps)
UPDATE exercises SET help_url = 'https://youtu.be/v_tM1pppjSU' WHERE id = '31152657-723a-4b30-8262-38d842dcaa2d';

-- [NEW] Knee/Leg Raises | "How To: Hanging Knee / Leg Raise | BUILD A “SCIENCED BASED” 6-PACK!" (ScottHermanFitness)
UPDATE exercises SET help_url = 'https://youtu.be/X-ACS9vpRyU' WHERE id = '69a4bf0e-0e20-4b65-b3cc-9882a3309062';

-- [NEW] Lateral Bounds | "Lateral Bound" (Nick Brattain)
UPDATE exercises SET help_url = 'https://youtu.be/Hc9_FQgIeeg' WHERE id = '4bc16b71-dffb-4876-ad09-44b6011b9cbb';

-- [NEW] Lateral Lunge | "How to Do Side Lunges for Lean Legs | Health" (Health)
UPDATE exercises SET help_url = 'https://youtu.be/rvqLVxYqEvo' WHERE id = '21203646-8186-4017-916a-258936ec8d13';

-- [NEW] Lunge with Twist | "Lunge with Twist" (Daily Workout Builder)
UPDATE exercises SET help_url = 'https://youtu.be/peb887Bc0-Q' WHERE id = 'ac37e8b1-2813-4760-8da8-17d07f1e3333';

-- [NEW] Teapots | "Teapot Stretch" (Eldon Thieu)
UPDATE exercises SET help_url = 'https://youtu.be/xQOJPUSjLOQ' WHERE id = 'd4dd009c-4867-47b5-b062-5d508479e8b6';

-- [NEW] Weighted Sit-up | "How to Do a Weighted Sit-Up" (LIVESTRONG)
UPDATE exercises SET help_url = 'https://youtu.be/kZvSaq192cg' WHERE id = '55a30e65-f179-4c14-a937-cae697ae2ec3';

-- [NEW] Wall Sit | "How to do a wall sit" (YOGABODY)
UPDATE exercises SET help_url = 'https://youtu.be/mDdLC-yKudY' WHERE id = '7ca23901-a8a3-4374-980a-810c09707f2d';

-- [NEW] Wall Sits (Weighted) | "How to do a wall sit" (YOGABODY)
UPDATE exercises SET help_url = 'https://youtu.be/mDdLC-yKudY' WHERE id = 'b724551f-b5e5-4826-b35d-1bfc5511f431';

-- [NEW] Windshields/Alternate Knee Raises | "Leg Raise Windshield Wipers" (Ray Shepler)
UPDATE exercises SET help_url = 'https://youtu.be/fpPp73LZQ8I' WHERE id = '7f5b3349-43e1-4bb3-8154-eca99c102e76';

-- [NEW] Wall Balls | "Wall Balls: The Do’s &amp; Don’t’s" (CrossFit OYL)
UPDATE exercises SET help_url = 'https://youtu.be/WGM7FjbDJUA' WHERE id = '3f46f284-24ef-49e9-92ff-f54d717955f1';

-- [NEW] Front Squats With Two Kettlebells | "The BEST exercise to fix functionality and athleticism—Kettlebell 67—Double Front Squat" (Mark Wildman)
UPDATE exercises SET help_url = 'https://youtu.be/dX5yXJa5Dm0' WHERE id = '271097db-9be9-4f37-8155-905e648d1ab1';

-- [NEW] 3/4 Sit-Up | "How Properly Perform Sit Ups With Different Hand Positions (Hardest to Easiest)" (Gerardi Performance)
UPDATE exercises SET help_url = 'https://youtu.be/GSjm29FESiQ' WHERE id = 'b96ac656-28d0-4f95-99b3-4fd8c9dd935e';

-- [NEW] Tricep Pushdown | "STOP DOING These Tricep Pushdown Mistakes!" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/Rc7-euA8FDI' WHERE id = '3871fefc-ef4d-410f-b484-dab95a5c5108';

-- [NEW] Tricep Rope Pushdown | "How to properly do the tricep rope pushdown" (iyaji adoga)
UPDATE exercises SET help_url = 'https://youtu.be/NvZKjiZ8NYc' WHERE id = '92dc70b7-777b-4c34-828d-84f00accac3b';

-- [NEW] Lunges | "Proper Lunge Technique" (Fundamentals Physiotherapy & Wellness Clinic)
UPDATE exercises SET help_url = 'https://youtu.be/1cS-6KsJW9g' WHERE id = 'f80f59e5-c30d-4f0c-a897-eb02435e9592';

-- [NEW] Reverse Lunge | "Front vs reverse lunge ✅" (Oliver Sjostrom)
UPDATE exercises SET help_url = 'https://youtu.be/38xlLGfguz4' WHERE id = '8fa8bcdd-773d-4c03-83ed-4a347cd86050';

-- [NEW] Reverse Lunges | "How To Perform The Reverse Lunge" (Dr. Carl Baird)
UPDATE exercises SET help_url = 'https://youtu.be/Ry-wqegeKlE' WHERE id = '4106887d-13db-4718-9869-d65d91a59352';

-- [NEW] Front Squat | "How to FRONT SQUAT / Step-by-Step (2023)" (TOROKHTIY)
UPDATE exercises SET help_url = 'https://youtu.be/nmUof3vszxM' WHERE id = '3e7af235-d6f1-47ed-bac3-6f9a9d5f8782';

-- [NEW] Glute Bridges | "The Right Way to Do a Glute Bridge" (AARP Answers)
UPDATE exercises SET help_url = 'https://youtu.be/R6n608M3czU' WHERE id = '53146476-0b60-4c4a-a4cd-b7bc5f0d9662';

-- [NEW] Deadbugs | "Dead Bug Exercise For Core Stability  | Pursuit Physical Therapy" (Pursuit Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/o4GKiEoYClI' WHERE id = '7484fdbf-c56e-4a23-b291-efb688ed9136';

-- [NEW] Bird-Dog | "Bird Dog Exercise | Improve Your Core and Balance" (Muscle & Motion)
UPDATE exercises SET help_url = 'https://youtu.be/QABW99qPiNM' WHERE id = 'a9facd2c-08cc-41ae-ae28-4896ee35d7dd';

-- [NEW] Scapular Pull-up | "Drastically Improve Your Pull-Ups" (FitnessFAQs)
UPDATE exercises SET help_url = 'https://youtu.be/WqCXcFrA1Iw' WHERE id = '09d71782-eda9-429b-ab6f-8f5079d7a75b';

-- [NEW] McGill Curl-Up | "The McGill Curl-Up" (Prime Health Co.)
UPDATE exercises SET help_url = 'https://youtu.be/I_drRVYlHbc' WHERE id = '15fd283b-afc3-4caf-b7e4-6046af6103ea';

-- [NEW] Copenhagen Plank | "Copenhagen Planks for Strength and Reducing Risk of Groin Injury (Science-Based)" (E3 Rehab)
UPDATE exercises SET help_url = 'https://youtu.be/5Hs7AfiMXgs' WHERE id = 'd3932e67-43df-472f-93ee-88902983f536';

-- [NEW] Hanging Leg Raise | "Hanging Leg Raise | HOW-TO" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/Pr1ieGZ5atk' WHERE id = '072ad7ff-a198-4dcd-afe6-7215c8935cf1';

-- [NEW] Hamstring Curl | "Leg Curl Form Tips (DO THIS!)" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/_lgE0gPvbik' WHERE id = '6d0fcc06-23dc-4dd1-bf76-60cfb8726416';

-- [NEW] Hamstring Curls | "Hamstring Curls Standing - Ask Doctor Jo" (AskDoctorJo)
UPDATE exercises SET help_url = 'https://youtu.be/oWu8RxtWdGE' WHERE id = '5de22c36-b88a-421b-88af-3d029aec581d';

-- [NEW] Cat-Cow | "Cat - Cow Stretch" (Pelvic Floor & Core Fix With Dr. Dawn)
UPDATE exercises SET help_url = 'https://youtu.be/LIVJZZyZ2qM' WHERE id = '2cf86bf5-422b-4803-b964-148253a27efc';

-- [NEW] Diaphragmatic Breathing | "How to do Diaphragmatic Breathing Exercises for Beginners | PHYSIOTHERAPY" (Michelle Kenway)
UPDATE exercises SET help_url = 'https://youtu.be/9jpchJcKivk' WHERE id = '92aa8624-b7f4-4d04-9100-a8f3dad21764';

-- [NEW] Pursed-Lip Breathing | "Pursed Lip Breathing" (American Lung Association)
UPDATE exercises SET help_url = 'https://youtu.be/7kpJ0QlRss4' WHERE id = 'b7568ee2-2827-4c6b-925c-80ef80d110d6';

-- [NEW] Child's Pose Decompression | "Child Pose" (Baptist Health)
UPDATE exercises SET help_url = 'https://youtu.be/kH12QrSGedM' WHERE id = '2b40e477-b31c-4335-ab11-d5dd4700afc1';

-- [NEW] Seated Sciatic Nerve Glide | "Seated Sciatic Nerve Glide" (The Active Life)
UPDATE exercises SET help_url = 'https://youtu.be/7QSHr6-Gbr0' WHERE id = 'c567cae0-fd9a-4a9c-b0a5-e5de8e34094c';

-- [NEW] 90/90 Hip Switches | "How to 90-90 Hip Mobility Exercise" (RehabFix)
UPDATE exercises SET help_url = 'https://youtu.be/FM7-7-a0FLg' WHERE id = '25eac4dd-2c82-4d31-b241-632e63e5f929';

-- [NEW] Hip Flexor Stretch Half-Kneeling | "How to PROPERLY Perform the Kneeling Hip Flexor Stretch With Good Form (For Tight Hip Flexors)" (Gerardi Performance)
UPDATE exercises SET help_url = 'https://youtu.be/ktgtEWGhFd8' WHERE id = '197f4354-5e8c-4ddf-b675-eba24d388e0d';

-- [NEW] Figure-4 Glute Stretch | "Glute Figure 4 Stretch - Ask Doctor Jo" (AskDoctorJo)
UPDATE exercises SET help_url = 'https://youtu.be/2VE_NLcNMvQ' WHERE id = '751dff92-2ad4-4a84-a285-32e80a7cccad';

-- [NEW] Wrist & Ankle Circles | "Daily Foot &amp; Ankle Mobility Exercises!!" (Physical Therapy Session)
UPDATE exercises SET help_url = 'https://youtu.be/jktxPe9c9g0' WHERE id = '4be0496d-cade-44db-a167-5483c5eb1ff6';

-- [NEW] Tai Chi Lunges | "Taichi Side Lunge For Hip Flexibility" (EmilyTangerine)
UPDATE exercises SET help_url = 'https://youtu.be/xfITZ0ZAwyE' WHERE id = '0057a976-ec3f-4f88-b599-1c87acd8bd3c';

-- [NEW] Pendulum Swings | "Pendulum Exercise for Shoulder Mobility without Straining" (My Physio My Health)
UPDATE exercises SET help_url = 'https://youtu.be/5qzbtlX_A4k' WHERE id = '41495cbd-1a8b-47bb-b2ba-7987dcc25495';

-- [NEW] Crossover Arm Stretch | "Cross Arm Stretch" (Baptist Health)
UPDATE exercises SET help_url = 'https://youtu.be/-1K0m5ywRcY' WHERE id = 'f9310ae6-817b-424e-811c-5b22316a7719';

-- [NEW] Seated Chest Press | "The PERFECT Machine Chest Press" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/Qu7-ceCvq7w' WHERE id = 'be037b2d-956d-4c7b-9aca-67e3126cbe29';

-- [NEW] Leg Curl | "Leg Curl Form Tips (DO THIS!)" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/_lgE0gPvbik' WHERE id = '544f52ca-98f1-48d9-9a8d-fa7f12e05735';

-- [NEW] Leg Extension | "How to do a Leg Extension (Alternate Exercise): Health e-University" (Health e-University)
UPDATE exercises SET help_url = 'https://youtu.be/TeWSOxCRU1c' WHERE id = 'c895caaf-b8d5-4aed-807c-4cc2b1e226e1';

-- [NEW] Leg Extensions Machine | "How to do Leg Extensions!" (Jeremy Sry)
UPDATE exercises SET help_url = 'https://youtu.be/w72YiHz15CA' WHERE id = '89fab674-8ecc-4d5e-b0f2-ebc3330abc1d';

-- [NEW] Standing Calf Raises | "Get NOTICEABLY BIGGER Calves With This Technique" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/baEXLy09Ncc' WHERE id = 'dd27644e-b90a-481b-95f6-c7f56e42a2eb';

-- [NEW] Overhead Tricep Extension | "How to do Cable Overhead Extension Properly" (TylerPath)
UPDATE exercises SET help_url = 'https://youtu.be/b5le--KkyH0' WHERE id = '910a5603-6f71-464a-950c-912ceda653c0';

-- [NEW] Step-ups | "Step Up Exercise | Osteoarthritis Physiotherapy" (Cornerstone Physiotherapy)
UPDATE exercises SET help_url = 'https://youtu.be/wfhXnLILqdk' WHERE id = '7d4b2bcc-9c13-4629-af37-700b4310efbc';

-- [NEW] Dumbbell Shoulder Press | "The PERFECT Dumbbell Shoulder Press (DO THIS!)" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/k6tzKisR3NY' WHERE id = 'e3ca1b1a-677b-4689-ad43-6b4fdb052969';

-- [NEW] Knee Extension Stretch | "Knee Extension Improvement (Knee Straightening) - Ask Doctor Jo" (AskDoctorJo)
UPDATE exercises SET help_url = 'https://youtu.be/vhEaOeDotqE' WHERE id = 'a4726fd3-05a2-42d0-8a99-cd793a17c89c';

-- [NEW] Pec Minor Release | "How To Release Pec Minor" (Bulletproof Shoulders with Jason)
UPDATE exercises SET help_url = 'https://youtu.be/HmB8M3CEBCM' WHERE id = '783acc3b-dc2f-4498-a31e-995e367ef176';

-- [NEW] Seated Torso Rotation Controlled | "How to Do Seated Torso Twists: Use Your Head &amp; Body!" (Advantage Ref Cam Rugby)
UPDATE exercises SET help_url = 'https://youtu.be/RYbFJgSYcWw' WHERE id = 'c21e455b-5d68-44c9-81d8-7f61be87cb7f';

-- [NEW] Child's Pose with Side Reach | "Child’s Pose with Side Stretches Tutorial | Open Your Hips and Improve Side Mobility" (Man Flow Yoga)
UPDATE exercises SET help_url = 'https://youtu.be/CXV7dseQdBg' WHERE id = '1f38d576-56aa-4645-8f37-6ad4276304dd';

-- [NEW] Hip Flexor & Chest Stretch | "Stretch The Hip Flexors Correctly" (Dr. Kristie Ennis)
UPDATE exercises SET help_url = 'https://youtu.be/ZQXGUfGmgKc' WHERE id = '6f020cb2-f3ed-4062-96f1-7883da1861a7';
