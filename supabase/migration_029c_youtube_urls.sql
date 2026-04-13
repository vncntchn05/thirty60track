-- ================================================================
-- Migration 029c: Verified YouTube help_url links
-- Generated 2026-04-13T20:31:45.031Z
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

-- [KEEP] Doorway Chest Stretch | "Doorway Chest Stretch - Pectoralis Major and Minor exercise" (Rehab Hero)
UPDATE exercises SET help_url = 'https://youtu.be/O8rJw_TmC1Y' WHERE id = '64a364d9-efcf-4f13-adc7-28d129afb28c';

-- [KEEP] Supine Twist | "Supine Spinal Twist" (KE Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/ElKoMMaTPCM' WHERE id = 'dad51a7c-f1ec-4e11-867f-493c67fe45fe';

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

-- [KEEP] pullover | "Pullovers Will Transform Your Body (Muscle, Strength, Mobility)" (FitnessFAQs)
UPDATE exercises SET help_url = 'https://youtu.be/Lw0k_Gv0sIM' WHERE id = 'a95c5e14-e5dc-4d9d-9670-646dd14d8c00';

-- [KEEP] cable pullover | "How to do the CABLE LAT PULLOVER! | 2 Minute Tutorial" (Max Euceda)
UPDATE exercises SET help_url = 'https://youtu.be/32auHIqgEoM' WHERE id = 'e54ceba1-10c3-45a1-871f-e432d8fd1467';

-- [KEEP] Cable Pullover | "How to do the CABLE LAT PULLOVER! | 2 Minute Tutorial" (Max Euceda)
UPDATE exercises SET help_url = 'https://youtu.be/32auHIqgEoM' WHERE id = 'd8f7ec36-03ff-411d-a9b4-ed64773a3845';

-- [KEEP] Incline bench row narrow | "Setting Up for Chest Supported Dumbbell Rows in 10 Seconds ✅" (Aakash Wadhwani)
UPDATE exercises SET help_url = 'https://youtu.be/czoQ_ncuqqI' WHERE id = '565ee894-de36-4714-b32b-e3de67484552';

-- [KEEP] Smith Incline Press | "Easiest Way to Set Up Incline Smith Machine Bench Press (in Less than 1 Minute)" (TylerPath)
UPDATE exercises SET help_url = 'https://youtu.be/ohRa_YRmVCk' WHERE id = '8d669b2a-4e11-42c8-9603-1eb66fbaca6a';

-- [KEEP] Smith Flat Bench Press | "Correct way to perform Smith Machine Bench Press #benchpress #smithmachinebenchpress" (Train with Dave )
UPDATE exercises SET help_url = 'https://youtu.be/E4G-M8Vvzps' WHERE id = '0c96823a-ec35-42f0-86be-baa13b2fb2fc';

-- [KEEP] Smith Machine Decline Press | "How to perform a Decline Bench Press in the Smith Machine for Bigger Lower Chest Gains" (Ryan Sapstead Coaching)
UPDATE exercises SET help_url = 'https://youtu.be/ZZZLtgOKqfk' WHERE id = '32737aab-5a3d-454a-8cd4-5900559d8cd7';

-- [KEEP] Hammer Curl | "Dumbbell Hammer Curls Tutorial | CORRECT TECHNIQUE (!)" (One Minute Tutorial)
UPDATE exercises SET help_url = 'https://youtu.be/OPqe0kCxmR8' WHERE id = '8aed8c66-0166-490d-9a1b-a18c0b50e68b';

-- [KEEP] Dead Bug | "Dead Bug - Abdominal / Core Exercise Guide" (Bodybuilding.com)
UPDATE exercises SET help_url = 'https://youtu.be/4XLEnwUr1d8' WHERE id = 'a57eabc8-dfa9-42e1-94c8-cedbd98626ab';

-- [KEEP] Standing Cable Wood Chop | "HOW TO: Cable Wood Chop" (Goodlife Health Clubs)
UPDATE exercises SET help_url = 'https://youtu.be/ZDt4MCvjMAA' WHERE id = '25395c37-9145-4a61-89de-271ae067a7e5';

-- [KEEP] decline press | "❌ Decline Bench Press Mistake (AVOID THIS!)" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/a-UFQE4oxWY' WHERE id = '2acc0a31-fc0a-4c2b-ba5d-8a7d7f0213f3';

-- [KEEP] flat bench | "Best Dumbbell Bench Press Tutorial Ever Made" (Davis Diley)
UPDATE exercises SET help_url = 'https://youtu.be/1V3vpcaxRYQ' WHERE id = '2be4ff68-fb19-42cc-afbf-beee30488728';

-- [KEEP] flat bench press | "How To Bench Press With Perfect Technique (5 Steps)" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/hWbUlkb5Ms4' WHERE id = '607f9637-4ba5-48cc-8034-736b22b5d04e';

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

-- [KEEP] Romanian Deadlift | "HOW TO DO ROMANIAN DEADLIFTS (RDLs): Build Beefy Hamstrings With Perfect Technique" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/_oyxCn2iSjU' WHERE id = '425f37e1-c2eb-4995-9cb9-f74793a0f397';

-- [KEEP] Hip Thrust | "Proper Hip Thrust Form" (Bret Contreras Glute Guy)
UPDATE exercises SET help_url = 'https://youtu.be/LM8XHLYJoYs' WHERE id = '3db09c4d-0239-4be4-80a5-cd7fe9e8cc2c';

-- [KEEP] Child's Pose | "Child Pose" (Baptist Health)
UPDATE exercises SET help_url = 'https://youtu.be/kH12QrSGedM' WHERE id = '63665a56-f1c1-4a2c-85b0-91c00dc43800';

-- [KEEP] Bulgarian Split Squat | "Stop F*cking Up Bulgarian Split Squats (PROPER FORM!)" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/hiLF_pF3EJM' WHERE id = '439217d5-a4f5-4bc5-bf30-8f55d4abe58e';

-- [KEEP] Lateral Raise | "Jeff Nippard's Method For Perfect Lateral Raises" (Jesse James West)
UPDATE exercises SET help_url = 'https://youtu.be/NZsldrqqca8' WHERE id = '15024e35-53be-4f6c-8641-ef99ef0d5783';

-- [KEEP] Lat Pulldown | "Stop Messing Up Your Lat Pulldowns" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/hnSqbBk15tw' WHERE id = '07f6c3d0-1757-4f0c-8e81-d3629fb35b9b';

-- [KEEP] Face Pull | "STOP F*cking Up Face Pulls (PROPER FORM!)" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/ljgqer1ZpXg' WHERE id = 'bbf96dcd-7134-4afb-bd56-5ccd28737a24';

-- [KEEP] Pull-Up | "Do More Unbroken Pull-Ups (INSTANTLY)" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/74XocPGr1SU' WHERE id = 'b1193543-d504-4626-835c-87c47b331a06';

-- [KEEP] Push-Up | "STOP Doing Pushups Like This! (SAVE A FRIEND)" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/At8PRTDDhrU' WHERE id = '41e6d3c5-8866-4cf9-bf8d-2052b11d9ff5';

-- [KEEP] Pallof Press | "Standing Band Anti-rotation With Pallof Press Exercise" (Spine Science Front Desk)
UPDATE exercises SET help_url = 'https://youtu.be/8vflPTMBQ_g' WHERE id = 'db4a6e75-2b25-4eab-9b3c-6a6c36e14898';

-- [KEEP] Bird Dog | "Bird Dog Exercise | Improve Your Core and Balance" (Muscle & Motion)
UPDATE exercises SET help_url = 'https://youtu.be/QABW99qPiNM' WHERE id = 'e84b7379-b5b8-4604-804a-825da7b60dd9';

-- [KEEP] Hanging Leg Raises | "How to Properly Perform Hanging Leg Raises With Good Form For Shredded Abs (Exercise Demonstration)" (Gerardi Performance)
UPDATE exercises SET help_url = 'https://youtu.be/2n4UqRIJyk4' WHERE id = '143eff06-5ce2-4a69-9191-2686cc9b90b7';

-- [KEEP] Bicycle Crunches | "How to do Bicycle Crunches Properly" (TylerPath)
UPDATE exercises SET help_url = 'https://youtu.be/NWzlS1Lp1e8' WHERE id = 'e42fbdc9-2ae5-4813-9df9-1947777346f4';

-- [KEEP] Ab Wheel Rollout | "Never Do Ab Wheel Rollouts Like This!" (ATHLEAN-X™)
UPDATE exercises SET help_url = 'https://youtu.be/A3uK5TPzHq8' WHERE id = '7ce9ba51-6c6f-42c2-8f1b-2b278877eaff';

-- [KEEP] Skull Crusher | "THIS is a Proper Skullcrusher" (Renaissance Periodization)
UPDATE exercises SET help_url = 'https://youtu.be/OQ4TWXkZjTc' WHERE id = '232e88d9-30ff-4b5c-9c86-f99974b4ac68';

-- [KEEP] Dips | "How To Do Dips For A Bigger Chest and Shoulders (Fix Mistakes!)" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/yN6Q1UI_xkE' WHERE id = 'd405ed82-6a39-4013-ac8c-7a4ada1a4f5d';

-- [KEEP] Goblet Squat | "📌HOW TO DO A GOBLET SQUAT" (SquatCouple)
UPDATE exercises SET help_url = 'https://youtu.be/lRYBbchqxtI' WHERE id = '1802b862-b24a-4f3d-8ca5-2fd76554929a';

-- [KEEP] Single-Arm Dumbbell Row | "How to Single Arm Dumbbell Row" (TylerPath)
UPDATE exercises SET help_url = 'https://youtu.be/qN54-QNO1eQ' WHERE id = '00d89f12-af2c-43b1-841c-3d28a88dc554';

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

-- [KEEP] DB Incline Press | "Incline DB Bench 🔥 BEST Guide Ever Made" (Davis Diley)
UPDATE exercises SET help_url = 'https://youtu.be/ou6s32mJgjU' WHERE id = '3153bf6c-a798-47b4-87eb-92b2fb654c99';

-- [KEEP] Squat | "Do You Have A Perfect Squat? (Find Out)" (Jeff Nippard)
UPDATE exercises SET help_url = 'https://youtu.be/PPmvh7gBTi0' WHERE id = '6289d8f3-8940-4650-be61-28b8a73f15cf';

-- [KEEP] Incline Dumbbell Press | "Incline DB Bench 🔥 BEST Guide Ever Made" (Davis Diley)
UPDATE exercises SET help_url = 'https://youtu.be/ou6s32mJgjU' WHERE id = '07e7ed9b-2170-4366-b90c-50b2b6d2f340';

-- [KEEP] Cable Woodchops | "HOW TO: Cable Wood Chop" (Goodlife Health Clubs)
UPDATE exercises SET help_url = 'https://youtu.be/ZDt4MCvjMAA' WHERE id = 'b1254d46-2f3a-4be9-a649-cfbc86c40e71';

-- [KEEP] Hip Flexor Stretch | "How to PROPERLY Perform the Kneeling Hip Flexor Stretch With Good Form (For Tight Hip Flexors)" (Gerardi Performance)
UPDATE exercises SET help_url = 'https://youtu.be/ktgtEWGhFd8' WHERE id = '919fce78-c74c-44cb-ad1f-d18d4fb14959';

-- [KEEP] Bent-Over Row | ""How To" Barbell Row" (Alan Thrall (Untamed Strength))
UPDATE exercises SET help_url = 'https://youtu.be/G8l_8chR5BE' WHERE id = 'f3d015a7-71f1-49d7-9651-1cb5a29344d1';

-- [KEEP] Plank | "Core Exercise: Plank" (Children's Hospital Colorado)
UPDATE exercises SET help_url = 'https://youtu.be/pvIjsG5Svck' WHERE id = 'a82a6ef2-d324-43ea-aa8d-02d847269117';

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

-- [KEEP] Wrist Flexor Stretch | "WRIST FLEXOR STRETCH" (Muscle & Motion)
UPDATE exercises SET help_url = 'https://youtu.be/63LEj3oP6lA' WHERE id = 'b3bfa485-1df8-4bb9-a439-43e35e80c610';

-- [KEEP] Wrist Extensor Stretch | "Wrist Extensors Stretch" (Empower Movement Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/T2pO53x4cNs' WHERE id = '6844a583-4c6e-491c-99ad-c602803fbfd0';

-- [KEEP] Ankle Dorsiflexion Stretch | "Ankle Mobility Hack #shorts" (MovementbyDavid)
UPDATE exercises SET help_url = 'https://youtu.be/m6J-9oQ9lHQ' WHERE id = '193001a3-eebe-4761-9861-0fc3b316aee7';

-- [NEW] Barbell Curl | "The Perfect Barbell Bicep Curl (DO THIS!)" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/54x2WF1_Suc' WHERE id = '0f4d1d9b-8cbb-47e3-8193-dd6b72d38707';

-- [NEW] high row | "Why you’re doing the machine high row wrong" (TylerPath)
UPDATE exercises SET help_url = 'https://youtu.be/_Jqhs5V1aJg' WHERE id = '96d2129b-2b8b-4284-b565-146fef29e5a3';

-- [NEW] isolated seated row | "How to do a seated row" (Nuffield Health)
UPDATE exercises SET help_url = 'https://youtu.be/DHA7QGDa2qg' WHERE id = '38d791b3-ce58-42e0-a1fb-445e0f5bd0f3';

-- [NEW] knee raises | "Wake Up &amp; Burn Fat: 100 High Knees, 100 Knee Raises, 100 Squats = Flat Stomach" (Fitness and Fitness)
UPDATE exercises SET help_url = 'https://youtu.be/j9rj0LvQ0so' WHERE id = '73392c4a-fd48-440b-94dd-22e66616b11f';

-- [NEW] Rear Delt Dly | "The PERFECT Dumbbell Rear Delt Fly (DO THIS!)" (Andrew Kwong (DeltaBolic))
UPDATE exercises SET help_url = 'https://youtu.be/LsT-bR_zxLo' WHERE id = '742ee1d0-6919-4fa3-9abe-a610b1e38ce8';

-- [NEW] Calf Raise | "You&#39;re Doing Calf Raises WRONG | The Correct Way Taught By Physical Therapist" (Rehab and Revive)
UPDATE exercises SET help_url = 'https://youtu.be/CtyIVeJH6lI' WHERE id = 'e89a3b3a-1f94-45b6-b8ac-a04051d6e3fe';

-- [NEW] Walking Lunges | "Proper Lunge Technique" (Fundamentals Physiotherapy & Wellness Clinic)
UPDATE exercises SET help_url = 'https://youtu.be/1cS-6KsJW9g' WHERE id = '045eb133-8e12-4aea-9e56-a6615a477d0f';

-- [NEW] Seated Cable Row | "Seated Cable Row – Full Video Tutorial &amp; Exercise Guide" (Fit Father Project - Fitness For Busy Fathers)
UPDATE exercises SET help_url = 'https://youtu.be/CsROhQ1onAg' WHERE id = '7b547802-dc7f-406d-829e-c3c81cd4d6c1';

-- [NEW] Overhead Tricep Stretch | "Tricep Stretch" (React Physical Therapy)
UPDATE exercises SET help_url = 'https://youtu.be/_IOHtPSYGbk' WHERE id = '226b3940-4553-4dcf-896b-7bf737d86c38';

-- [NEW] Landmine | "Stability Meets Range Of Motion With These Landmine Exercises #SHORT" (Marcus Filly)
UPDATE exercises SET help_url = 'https://youtu.be/0efz8srgH7c' WHERE id = '8ce1f9f7-cc52-4d9d-b530-f64766ffc3e8';

-- [NEW] Step Mill | "The ONLY CORRECT way to use the stair master" (TylerPath)
UPDATE exercises SET help_url = 'https://youtu.be/6mYp_BNYD5Y' WHERE id = 'ed4488e7-1a31-40c1-83d3-60a3f90b530a';

-- [NEW] Landmine Rotation | "Landmine Rotation" (O.B. Training & Sports Performance)
UPDATE exercises SET help_url = 'https://youtu.be/MswsBPLGhE8' WHERE id = 'dabea74e-389c-4fa8-bcd4-a7f9cf2c652b';

-- [NEW] Pilates Squat + Squat | "Squat | Pilates Exercises for Cancer Patients" (Roswell Park Comprehensive Cancer Center)
UPDATE exercises SET help_url = 'https://youtu.be/xrJzRE0Cv0c' WHERE id = '654f644b-38ae-42cb-8c02-01d00aa73ed9';
