-- ============================================================
-- Migration 016: backfill form_notes from free-exercise-db
-- Generated 2026-03-26
-- Instructions sourced from yuhonas/free-exercise-db exercises.json
-- Run in Supabase SQL editor after schema.sql migrations.
-- ============================================================

UPDATE exercises SET form_notes = '1. Stand with your feet shoulder width apart. You can place your hands behind your head. This will be your starting position.
2. Begin the movement by flexing your knees and hips, sitting back with your hips.
3. Continue down to full depth if you are able,and quickly reverse the motion until you return to the starting position. As you squat, keep your head and chest up and push your knees out.'
  WHERE name = 'Air Squat' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie face down on a hyperextension bench, tucking your ankles securely under the footpads.
2. Adjust the upper pad if possible so your upper thighs lie flat across the wide pad, leaving enough room for you to bend at the waist without any restriction.
3. With your body straight, cross your arms in front of you (my preference) or behind your head. This will be your starting position. Tip: You can also hold a weight plate for extra resistance in front of you under your crossed arms.
4. Start bending forward slowly at the waist as far as you can while keeping your back flat. Inhale as you perform this movement. Keep moving forward until you feel a nice stretch on the hamstrings and you can no longer keep going without a rounding of the back. Tip: Never round the back as you perform this exercise. Also, some people can go farther than others. The key thing is that you go as far as your body allows you to without rounding the back.
5. Slowly raise your torso back to the initial position as you inhale. Tip: Avoid the temptation to arch your back past a straight line. Also, do not swing the torso at any time in order to protect the back from injury.
6. Repeat for the recommended amount of repetitions.'
  WHERE name = 'BW Back Extensions' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. You will need a partner for this exercise. Lacking one, this movement can be performed against a wall.
2. Begin facing your partner holding the medicine ball at your torso with both hands.
3. Pull the ball to your chest, and reverse the motion by extending through the elbows. For sports applications, you can take a step as you throw.
4. Your partner should catch the ball, and throw it back to you.
5. Receive the throw with both hands at chest height.'
  WHERE name = 'Ball Squat Toss' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand up with your torso upright while holding a barbell at a shoulder-width grip. The palm of your hands should be facing forward and the elbows should be close to the torso. This will be your starting position.
2. While holding the upper arms stationary, curl the weights forward while contracting the biceps as you breathe out. Tip: Only the forearms should move.
3. Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second and squeeze the biceps hard.
4. Slowly begin to bring the bar back to starting position as your breathe in.
5. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Barbell Curl' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Holding a barbell with a pronated grip (palms facing down), bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. The barbell should hang directly in front of you as your arms hang perpendicular to the floor and your torso. This is your starting position.
2. Now, while keeping the torso stationary, breathe out and lift the barbell to you. Keep the elbows close to the body and only use the forearms to hold the weight. At the top contracted position, squeeze the back muscles and hold for a brief pause.
3. Then inhale and slowly lower the barbell back to the starting position.
4. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Barbell Row' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Wearing either a harness or a loose weight belt, attach the chain to the back so that you will be facing away from the sled. Bend down so that your hands are on the ground. Your back should be flat and knees bent. This is your starting position.
2. Begin by driving with legs, alternating left and right. Use your hands to maintain balance and to help pull. Try to keep your back flat as you move over a given distance.'
  WHERE name = 'Bear Crawl' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie back on a flat bench. Using a medium width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position.
2. From the starting position, breathe in and begin coming down slowly until the bar touches your middle chest.
3. After a brief pause, push the bar back to the starting position as you breathe out. Focus on pushing the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position at the top of the motion, hold for a second and then start coming down slowly again. Tip: Ideally, lowering the weight should take about twice as long as raising it.
4. Repeat the movement for the prescribed amount of repetitions.
5. When you are done, place the bar back in the rack.'
  WHERE name = 'Bench Press' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand up straight with a dumbbell in each hand at arm''s length. Keep your elbows close to your torso and rotate the palms of your hands until they are facing forward. This will be your starting position.
2. Now, keeping the upper arms stationary, exhale and curl the weights while contracting your biceps. Continue to raise the weights until your biceps are fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a brief pause as you squeeze your biceps.
3. Then, inhale and slowly begin to lower the dumbbells back to the starting position.
4. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Bicep Curls' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie flat on your back and bend your knees about 60 degrees.
2. Keep your feet flat on the floor and place your hands loosely behind your head. This will be your starting position.
3. Now curl up and bring your right elbow and shoulder across your body while bring your left knee in toward your left shoulder at the same time. Reach with your elbow and try to touch your knee. Exhale as you perform this movement. Tip: Try to bring your shoulder up towards your knee rather than just your elbow and remember that the key is to contract the abs as you perform the movement; not just to move the elbow.
4. Now go back down to the starting position as you inhale and repeat with the left elbow and the right knee.
5. Continue alternating in this manner until all prescribed repetitions are done.'
  WHERE name = 'Bicycle Crunches' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. For this exercise you will need to place a bench behind your back. With the bench perpendicular to your body, and while looking away from it, hold on to the bench on its edge with the hands fully extended, separated at shoulder width. The legs will be extended forward, bent at the waist and perpendicular to your torso. This will be your starting position.
2. Slowly lower your body as you inhale by bending at the elbows until you lower yourself far enough to where there is an angle slightly smaller than 90 degrees between the upper arm and the forearm. Tip: Keep the elbows as close as possible throughout the movement. Forearms should always be pointing down.
3. Using your triceps to bring your torso up again, lift yourself back to the starting position.
4. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Box Dips (Assist)' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Begin with a box of an appropriate height 1-2 feet in front of you. Stand with your feet should width apart. This will be your starting position.
2. Perform a short squat in preparation for jumping, swinging your arms behind you.
3. Rebound out of this position, extending through the hips, knees, and ankles to jump as high as possible. Swing your arms forward and up.
4. Land on the box with the knees bent, absorbing the impact through the legs. You can jump from the box back to the ground, or preferably step down one leg at a time.'
  WHERE name = 'Box Jump' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. The box squat allows you to squat to desired depth and develop explosive strength in the squat movement. Begin in a power rack with a box at the appropriate height behind you. Typically, you would aim for a box height that brings you to a parallel squat, but you can train higher or lower if desired.
2. Begin by stepping under the bar and placing it across the back of the shoulders. Squeeze your shoulder blades together and rotate your elbows forward, attempting to bend the bar across your shoulders. Remove the bar from the rack, creating a tight arch in your lower back, and step back into position. Place your feet wider for more emphasis on the back, glutes, adductors, and hamstrings, or closer together for more quad development. Keep your head facing forward.
3. With your back, shoulders, and core tight, push your knees and butt out and you begin your descent. Sit back with your hips until you are seated on the box. Ideally, your shins should be perpendicular to the ground. Pause when you reach the box, and relax the hip flexors. Never bounce off of a box.
4. Keeping the weight on your heels and pushing your feet and knees out, drive upward off of the box as you lead the movement with your head. Continue upward, maintaining tightness head to toe.'
  WHERE name = 'Box Squat' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand up straight while holding a dumbbell on each hand (palms facing the side of your legs).
2. Place the right foot on the elevated platform. Step on the platform by extending the hip and the knee of your right leg. Use the heel mainly to lift the rest of your body up and place the foot of the left leg on the platform as well. Breathe out as you execute the force required to come up.
3. Step down with the left leg by flexing the hip and knee of the right leg as you inhale. Return to the original standing position by placing the right foot of to next to the left foot on the initial position.
4. Repeat with the right leg for the recommended amount of repetitions and then perform with the left leg.'
  WHERE name = 'Box Step-ups' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie on the floor face down and place your hands about 36 inches apart while holding your torso up at arms length.
2. Next, lower yourself downward until your chest almost touches the floor as you inhale.
3. Now breathe out and press your upper body back up to the starting position while squeezing your chest.
4. After a brief pause at the top contracted position, you can begin to lower yourself downward again for as many repetitions as needed.'
  WHERE name = 'Burpee DB Press' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Begin in a pushup position, with your weight supported by your hands and toes. Flexing the knee and hip, bring one leg until the knee is approximately under the hip. This will be your starting position.
2. Explosively reverse the positions of your legs, extending the bent leg until the leg is straight and supported by the toe, and bringing the other foot up with the hip and knee flexed. Repeat in an alternating fashion for 20-30 seconds.'
  WHERE name = 'Burpees' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Begin standing with your knees slightly bent.
2. Quickly squat a short distance, flexing the hips and knees, and immediately extend to jump for maximum vertical height.
3. As you go up, tuck your heels by flexing the knees, attempting to touch the buttocks.
4. Finish the motion by landing with the knees only partially bent, using your legs to absorb the impact.'
  WHERE name = 'Butt Kicks (s)' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Kneel below a high pulley that contains a rope attachment.
2. Grasp cable rope attachment and lower the rope until your hands are placed next to your face.
3. Flex your hips slightly and allow the weight to hyperextend the lower back. This will be your starting position.
4. With the hips stationary, flex the waist as you contract the abs so that the elbows travel towards the middle of the thighs. Exhale as you perform this portion of the movement and hold the contraction for a second.
5. Slowly return to the starting position as you inhale. Tip: Make sure that you keep constant tension on the abs throughout the movement. Also, do not choose a weight so heavy that the lower back handles the brunt of the work.
6. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Cable Crunch' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Facing a high pulley with a rope or dual handles attached, pull the weight directly towards your face, separating your hands as you do so. Keep your upper arms parallel to the ground.'
  WHERE name = 'Cable Face Pulls' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Position a flat bench between two low pulleys so that when you are laying on it, your chest will be lined up with the cable pulleys.
2. Lay flat on the bench and keep your feet on the ground.
3. Have someone hand you the handles on each hand. You will grab each single handle attachment with a palms up grip.
4. Extend your arms by your side with a slight bend on your elbows. Tip: You will keep this bend constant through the whole movement. Your arms should be parallel to the floor. This is your starting position.
5. Now start lifting the arms in a semi-circle motion directly in front of you by pulling the cables together until both hands meet at the top of the movement. Squeeze your chest as you perform this motion and breathe out during this movement. Also, hold the contraction for a second at the top. Tip: When performed correctly, at the top position of this movement, your arms should be perpendicular to your torso and the floor touching above your chest.
6. Slowly come back to the starting position.
7. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Cable Fly' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. To get yourself into the starting position, place the pulleys on a high position (above your head), select the resistance to be used and hold the pulleys in each hand.
2. Step forward in front of an imaginary straight line between both pulleys while pulling your arms together in front of you. Your torso should have a small forward bend from the waist. This will be your starting position.
3. With a slight bend on your elbows in order to prevent stress at the biceps tendon, extend your arms to the side (straight out at both sides) in a wide arc until you feel a stretch on your chest. Breathe in as you perform this portion of the movement. Tip: Keep in mind that throughout the movement, the arms and torso should remain stationary; the movement should only occur at the shoulder joint.
4. Return your arms back to the starting position as you breathe out. Make sure to use the same arc of motion used to lower the weights.
5. Hold for a second at the starting position and repeat the movement for the prescribed amount of repetitions.'
  WHERE name = 'Cable Pullover' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. For this exercise you will need access to a low pulley row machine with a V-bar. Note: The V-bar will enable you to have a neutral grip where the palms of your hands face each other. To get into the starting position, first sit down on the machine and place your feet on the front platform or crossbar provided making sure that your knees are slightly bent and not locked.
2. Lean over as you keep the natural alignment of your back and grab the V-bar handles.
3. With your arms extended pull back until your torso is at a 90-degree angle from your legs. Your back should be slightly arched and your chest should be sticking out. You should be feeling a nice stretch on your lats as you hold the bar in front of you. This is the starting position of the exercise.
4. Keeping the torso stationary, pull the handles back towards your torso while keeping the arms close to it until you touch the abdominals. Breathe out as you perform that movement. At that point you should be squeezing your back muscles hard. Hold that contraction for a second and slowly go back to the original position while breathing in.
5. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Cable Squat Row' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand upright holding an exercise ball with both hands. Extend your arms so the ball is straight out in front of you. This will be your starting position.
2. Rotate your torso to one side, keeping your eyes on the ball as you move. Now, rotate back to the opposite direction. Repeat for 10-20 repetitions.'
  WHERE name = 'Cable Torso Rotations' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Connect a standard handle to a tower, and move the cable to the highest pulley position.
2. With your side to the cable, grab the handle with one hand and step away from the tower. You should be approximately arm''s length away from the pulley, with the tension of the weight on the cable. Your outstretched arm should be aligned with the cable.
3. With your feet positioned shoulder width apart, reach upward with your other hand and grab the handle with both hands. Your arms should still be fully extended.
4. In one motion, pull the handle down and across your body to your front knee while rotating your torso.
5. Keep your back and arms straight and core tight while you pivot your back foot and bend your knees to get a full range of motion.
6. Maintain your stance and straight arms. Return to the neutral position in a slow and controlled manner.
7. Repeat to failure.
8. Then, reposition and repeat the same series of movements on the opposite side.'
  WHERE name = 'Cable Woodchops' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand in the middle of two low pulleys that are opposite to each other and place a flat bench right behind you (in perpendicular fashion to you; the narrow edge of the bench should be the one behind you). Select the weight to be used on each pulley.
2. Now sit at the edge of the flat bench behind you with your feet placed in front of your knees.
3. Bend forward while keeping your back flat and rest your torso on the thighs.
4. Have someone give you the single handles attached to the pulleys. Grasp the left pulley with the right hand and the right pulley with the left after you select your weight. The pulleys should run under your knees and your arms will be extended with palms facing each other and a slight bend at the elbows. This will be the starting position.
5. While keeping the arms stationary, raise the upper arms to the sides until they are parallel to the floor and at shoulder height. Exhale during the execution of this movement and hold the contraction for a second.
6. Slowly lower your arms to the starting position as you inhale.
7. Repeat for the recommended amount of repetitions. Tip: Maintain upper arms perpendicular to torso and a fixed elbow position (10 degree to 30 degree angle) throughout exercise.'
  WHERE name = 'Cable/Band Lateral Raise' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Sit on the machine and place your toes on the lower portion of the platform provided with the heels extending off. Choose the toe positioning of your choice (forward, in, or out) as per the beginning of this chapter.
2. Place your lower thighs under the lever pad, which will need to be adjusted according to the height of your thighs. Now place your hands on top of the lever pad in order to prevent it from slipping forward.
3. Lift the lever slightly by pushing your heels up and release the safety bar. This will be your starting position.
4. Slowly lower your heels by bending at the ankles until the calves are fully stretched. Inhale as you perform this movement.
5. Raise the heels by extending the ankles as high as possible as you contract the calves and breathe out. Hold the top contraction for a second.
6. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Calf Raise' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Secure your legs at the end of the decline bench and lie down.
2. Now place your hands lightly on either side of your head keeping your elbows in. Tip: Don''t lock your fingers behind your head.
3. While pushing the small of your back down in the bench to better isolate your abdominal muscles, begin to roll your shoulders off it.
4. Continue to push down as hard as you can with your lower back as you contract your abdominals and exhale. Your shoulders should come up off the bench only about four inches, and your lower back should remain on the bench. At the top of the movement, contract your abdominals hard and keep the contraction for a second. Tip: Focus on slow, controlled movement - don''t cheat yourself by using momentum.
5. After the one second contraction, begin to come down slowly again to the starting position as you inhale.
6. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Center Decline' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. You will need a partner for this exercise. Lacking one, this movement can be performed against a wall.
2. Begin facing your partner holding the medicine ball at your torso with both hands.
3. Pull the ball to your chest, and reverse the motion by extending through the elbows. For sports applications, you can take a step as you throw.
4. Your partner should catch the ball, and throw it back to you.
5. Receive the throw with both hands at chest height.'
  WHERE name = 'Chest Pass (Med Ball)' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Grab the pull-up bar with the palms facing your torso and a grip closer than the shoulder width.
2. As you have both arms extended in front of you holding the bar at the chosen grip width, keep your torso as straight as possible while creating a curvature on your lower back and sticking your chest out. This is your starting position. Tip: Keeping the torso as straight as possible maximizes biceps stimulation while minimizing back involvement.
3. As you breathe out, pull your torso up until your head is around the level of the pull-up bar. Concentrate on using the biceps muscles in order to perform the movement. Keep the elbows close to your body. Tip: The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar.
4. After a second of squeezing the biceps in the contracted position, slowly lower your torso back to the starting position; when your arms are fully extended. Breathe in as you perform this portion of the movement.
5. Repeat this motion for the prescribed amount of repetitions.'
  WHERE name = 'Chin-up Negatives' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Position yourself on the floor on your hands and knees.
2. Pull your belly in and round your spine, lower back, shoulders, and neck, letting your head drop.
3. Hold for 15 seconds.'
  WHERE name = 'Cobra Stretch' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie flat on your back with your feet flat on the ground, or resting on a bench with your knees bent at a 90 degree angle. If you are resting your feet on a bench, place them three to four inches apart and point your toes inward so they touch.
2. Now place your hands lightly on either side of your head keeping your elbows in. Tip: Don''t lock your fingers behind your head.
3. While pushing the small of your back down in the floor to better isolate your abdominal muscles, begin to roll your shoulders off the floor.
4. Continue to push down as hard as you can with your lower back as you contract your abdominals and exhale. Your shoulders should come up off the floor only about four inches, and your lower back should remain on the floor. At the top of the movement, contract your abdominals hard and keep the contraction for a second. Tip: Focus on slow, controlled movement - don''t cheat yourself by using momentum.
5. After the one second contraction, begin to come down slowly again to the starting position as you inhale.
6. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Crunch' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. To begin, seat yourself on the bike and adjust the seat to your height.'
  WHERE name = 'Cycling' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie down on a flat bench with a dumbbell in each hand resting on top of your thighs. The palms of your hands will be facing each other.
2. Then, using your thighs to help raise the dumbbells up, lift the dumbbells one at a time so that you can hold them in front of you at shoulder width.
3. Once at shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. The dumbbells should be just to the sides of your chest, with your upper arm and forearm creating a 90 degree angle. Be sure to maintain full control of the dumbbells at all times. This will be your starting position.
4. Then, as you breathe out, use your chest to push the dumbbells up. Lock your arms at the top of the lift and squeeze your chest, hold for a second and then begin coming down slowly. Tip: Ideally, lowering the weight should take about twice as long as raising it.
5. Repeat the movement for the prescribed amount of repetitions of your training program.'
  WHERE name = 'DB Bench Press' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand holding a light kettlebell by the horns close to your chest. This will be your starting position.
2. Squat down between your legs until your hamstrings are on your calves. Keep your chest and head up and your back straight.
3. At the bottom position, pause and use your elbows to push your knees out. Return to the starting position, and repeat for 10-20 repetitions.'
  WHERE name = 'DB Goblet Squat' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie back on an incline bench with a dumbbell in each hand atop your thighs. The palms of your hands will be facing each other.
2. Then, using your thighs to help push the dumbbells up, lift the dumbbells one at a time so that you can hold them at shoulder width.
3. Once you have the dumbbells raised to shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. This will be your starting position.
4. Be sure to keep full control of the dumbbells at all times. Then breathe out and push the dumbbells up with your chest.
5. Lock your arms at the top, hold for a second, and then start slowly lowering the weight. Tip Ideally, lowering the weights should take about twice as long as raising them.
6. Repeat the movement for the prescribed amount of repetitions.
7. When you are done, place the dumbbells back on your thighs and then on the floor. This is the safest manner to release the dumbbells.'
  WHERE name = 'DB Incline Press' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. While holding a dumbbell in each hand, sit on a military press bench or utility bench that has back support. Place the dumbbells upright on top of your thighs.
2. Now raise the dumbbells to shoulder height one at a time using your thighs to help propel them up into position.
3. Make sure to rotate your wrists so that the palms of your hands are facing forward. This is your starting position.
4. Now, exhale and push the dumbbells upward until they touch at the top.
5. Then, after a brief pause at the top contracted position, slowly lower the weights back down to the starting position while inhaling.
6. Repeat for the recommended amount of repetitions.'
  WHERE name = 'DB Overhead Press' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Place two kettlebells on the floor about shoulder width apart. Position yourself on your toes and your hands as though you were doing a pushup, with the body straight and extended. Use the handles of the kettlebells to support your upper body. You may need to position your feet wide for support.
2. Push one kettlebell into the floor and row the other kettlebell, retracting the shoulder blade of the working side as you flex the elbow, pulling it to your side.
3. Then lower the kettlebell to the floor and begin the kettlebell in the opposite hand. Repeat for several reps.'
  WHERE name = 'DB Renegade Row' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Position yourself into a staggered stance with the rear foot elevated and front foot forward.
2. Hold a dumbbell in each hand, letting them hang at the sides. This will be your starting position.
3. Begin by descending, flexing your knee and hip to lower your body down. Maintain good posture througout the movement. Keep the front knee in line with the foot as you perform the exercise.
4. At the bottom of the movement, drive through the heel to extend the knee and hip to return to the starting position.'
  WHERE name = 'DB Split Squat' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand up straight while holding a dumbbell on each hand (palms facing the side of your legs).
2. Place the right foot on the elevated platform. Step on the platform by extending the hip and the knee of your right leg. Use the heel mainly to lift the rest of your body up and place the foot of the left leg on the platform as well. Breathe out as you execute the force required to come up.
3. Step down with the left leg by flexing the hip and knee of the right leg as you inhale. Return to the original standing position by placing the right foot of to next to the left foot on the initial position.
4. Repeat with the right leg for the recommended amount of repetitions and then perform with the left leg.'
  WHERE name = 'DB Step-ups' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Begin lying on your back with your hands extended above you toward the ceiling.
2. Bring your feet, knees, and hips up to 90 degrees.
3. Exhale hard to bring your ribcage down and flatten your back onto the floor, rotating your pelvis up and squeezing your glutes. Hold this position throughout the movement. This will be your starting position.
4. Initiate the exercise by extending one leg, straightening the knee and hip to bring the leg just above the ground.
5. Maintain the position of your lumbar and pelvis as you perform the movement, as your back is going to want to arch.
6. Stay tight and return the working leg to the starting position.
7. Repeat on the opposite side, alternating until the set is complete.'
  WHERE name = 'Deadbug (Weighted)' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Begin lying on your back with your hands extended above you toward the ceiling.
2. Bring your feet, knees, and hips up to 90 degrees.
3. Exhale hard to bring your ribcage down and flatten your back onto the floor, rotating your pelvis up and squeezing your glutes. Hold this position throughout the movement. This will be your starting position.
4. Initiate the exercise by extending one leg, straightening the knee and hip to bring the leg just above the ground.
5. Maintain the position of your lumbar and pelvis as you perform the movement, as your back is going to want to arch.
6. Stay tight and return the working leg to the starting position.
7. Repeat on the opposite side, alternating until the set is complete.'
  WHERE name = 'Deadbugs' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand in front of a loaded barbell.
2. While keeping the back as straight as possible, bend your knees, bend forward and grasp the bar using a medium (shoulder width) overhand grip. This will be the starting position of the exercise. Tip: If it is difficult to hold on to the bar with this grip, alternate your grip or use wrist straps.
3. While holding the bar, start the lift by pushing with your legs while simultaneously getting your torso to the upright position as you breathe out. In the upright position, stick your chest out and contract the back by bringing the shoulder blades back. Think of how the soldiers in the military look when they are in standing in attention.
4. Go back to the starting position by bending at the knees while simultaneously leaning the torso forward at the waist while keeping the back straight. When the weights on the bar touch the floor you are back at the starting position and ready to perform another repetition.
5. Perform the amount of repetitions prescribed in the program.'
  WHERE name = 'Deadlift' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie down on the floor placing your feet either under something that will not move or by having a partner hold them. Your legs should be bent at the knees.
2. Elevate your upper body so that it creates an imaginary V-shape with your thighs. Your arms should be fully extended in front of you perpendicular to your torso and with the hands clasped. This is the starting position.
3. Twist your torso to the right side until your arms are parallel with the floor while breathing out.
4. Hold the contraction for a second and move back to the starting position while breathing out. Now move to the opposite side performing the same techniques you applied to the right side.
5. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Decline Russian Twists' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie on the floor face down and place your hands about 36 inches apart while holding your torso up at arms length.
2. Next, lower yourself downward until your chest almost touches the floor as you inhale.
3. Now breathe out and press your upper body back up to the starting position while squeezing your chest.
4. After a brief pause at the top contracted position, you can begin to lower yourself downward again for as many repetitions as needed.'
  WHERE name = 'Diamond + Wide Pushups' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. For this exercise you will need access to parallel bars. To get yourself into the starting position, hold your body at arms length (arms locked) above the bars.
2. While breathing in, lower yourself slowly with your torso leaning forward around 30 degrees or so and your elbows flared out slightly until you feel a slight stretch in the chest.
3. Once you feel the stretch, use your chest to bring your body back to the starting position as you breathe out. Tip: Remember to squeeze the chest at the top of the movement for a second.
4. Repeat the movement for the prescribed amount of repetitions.'
  WHERE name = 'Dips' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie down on a flat bench with a dumbbell on each hand resting on top of your thighs. The palms of your hand will be facing each other.
2. Then using your thighs to help raise the dumbbells, lift the dumbbells one at a time so you can hold them in front of you at shoulder width with the palms of your hands facing each other. Raise the dumbbells up like you''re pressing them, but stop and hold just before you lock out. This will be your starting position.
3. With a slight bend on your elbows in order to prevent stress at the biceps tendon, lower your arms out at both sides in a wide arc until you feel a stretch on your chest. Breathe in as you perform this portion of the movement. Tip: Keep in mind that throughout the movement, the arms should remain stationary; the movement should only occur at the shoulder joint.
4. Return your arms back to the starting position as you squeeze your chest muscles and breathe out. Tip: Make sure to use the same arc of motion used to lower the weights.
5. Hold for a second at the contracted position and repeat the movement for the prescribed amount of repetitions.'
  WHERE name = 'Dips/Band Flyes' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Facing a high pulley with a rope or dual handles attached, pull the weight directly towards your face, separating your hands as you do so. Keep your upper arms parallel to the ground.'
  WHERE name = 'Face Pull' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. There are various implements that can be used for the farmers walk. These can also be performed with heavy dumbbells or short bars if these implements aren''t available. Begin by standing between the implements.
2. After gripping the handles, lift them up by driving through your heels, keeping your back straight and your head up.
3. Walk taking short, quick steps, and don''t forget to breathe. Move for a given distance, typically 50-100 feet, as fast as possible.'
  WHERE name = 'Farmer''s Walk' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Adjust the j-hooks so they are at the appropriate height to rack the bar. Begin lying on the floor with your head near the end of a power rack. Keeping your shoulder blades pulled together; pull the bar off of the hooks.
2. Lower the bar towards the bottom of your chest or upper stomach, squeezing the bar and attempting to pull it apart as you do so. Ensure that you tuck your elbows throughout the movement. Lower the bar until your upper arm contacts the ground and pause, preventing any slamming or bouncing of the weight.
3. Press the bar back up as fast as you can, keeping the bar, your wrists, and elbows in line as you do so.'
  WHERE name = 'Floor Press + Mod Push-up' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. On a flat bench lie facedown with the hips on the edge of the bench, the legs straight with toes high off the floor and with the arms on top of the bench holding on to the front edge.
2. Squeeze your glutes and hamstrings and straighten the legs until they are level with the hips. This will be your starting position.
3. Start the movement by lifting the left leg higher than the right leg.
4. Then lower the left leg as you lift the right leg.
5. Continue alternating in this manner (as though you are doing a flutter kick in water) until you have done the recommended amount of repetitions for each leg. Make sure that you keep a controlled movement at all times. Tip: You will breathe normally as you perform this movement.'
  WHERE name = 'Flutter Kicks' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Begin seated on the ground with a loaded barbell over your legs. Using a fat bar or having a pad on the bar can greatly reduce the discomfort caused by this exercise. Roll the bar so that it is directly above your hips, and lay down flat on the floor.
2. Begin the movement by driving through with your heels, extending your hips vertically through the bar. Your weight should be supported by your upper back and the heels of your feet.
3. Extend as far as possible, then reverse the motion to return to the starting position.'
  WHERE name = 'Glute Bridge' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Begin seated on the ground with a loaded barbell over your legs. Using a fat bar or having a pad on the bar can greatly reduce the discomfort caused by this exercise. Roll the bar so that it is directly above your hips, and lay down flat on the floor.
2. Begin the movement by driving through with your heels, extending your hips vertically through the bar. Your weight should be supported by your upper back and the heels of your feet.
3. Extend as far as possible, then reverse the motion to return to the starting position.'
  WHERE name = 'Glute Bridge (Pulsing)' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Begin seated on the ground with a loaded barbell over your legs. Using a fat bar or having a pad on the bar can greatly reduce the discomfort caused by this exercise. Roll the bar so that it is directly above your hips, and lay down flat on the floor.
2. Begin the movement by driving through with your heels, extending your hips vertically through the bar. Your weight should be supported by your upper back and the heels of your feet.
3. Extend as far as possible, then reverse the motion to return to the starting position.'
  WHERE name = 'Glute Bridge Hold' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand holding a light kettlebell by the horns close to your chest. This will be your starting position.
2. Squat down between your legs until your hamstrings are on your calves. Keep your chest and head up and your back straight.
3. At the bottom position, pause and use your elbows to push your knees out. Return to the starting position, and repeat for 10-20 repetitions.'
  WHERE name = 'Goblet Lateral Lunge' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand up with your torso upright and a dumbbell on each hand being held at arms length. The elbows should be close to the torso.
2. The palms of the hands should be facing your torso. This will be your starting position.
3. Now, while holding your upper arm stationary, exhale and curl the weight forward while contracting the biceps. Continue to raise the weight until the biceps are fully contracted and the dumbbell is at shoulder level. Hold the contracted position for a brief moment as you squeeze the biceps. Tip: Focus on keeping the elbow stationary and only moving your forearm.
4. After the brief pause, inhale and slowly begin the lower the dumbbells back down to the starting position.
5. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Hammer Curl' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Adjust the machine lever to fit your height and lie face down on the leg curl machine with the pad of the lever on the back of your legs (just a few inches under the calves). Tip: Preferably use a leg curl machine that is angled as opposed to flat since an angled position is more favorable for hamstrings recruitment.
2. Keeping the torso flat on the bench, ensure your legs are fully stretched and grab the side handles of the machine. Position your toes straight (or you can also use any of the other two stances described on the foot positioning section). This will be your starting position.
3. As you exhale, curl your legs up as far as possible without lifting the upper legs from the pad. Once you hit the fully contracted position, hold it for a second.
4. As you inhale, bring the legs back to the initial position. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Hamstring Curl' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Hang from a chin-up bar with both arms extended at arms length in top of you using either a wide grip or a medium grip. The legs should be straight down with the pelvis rolled slightly backwards. This will be your starting position.
2. Raise your legs until the torso makes a 90-degree angle with the legs. Exhale as you perform this movement and hold the contraction for a second or so.
3. Go back slowly to the starting position as you breathe in.
4. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Hanging Leg Raises' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. To begin, step onto the treadmill and select the desired option from the menu. Most treadmills have a manual setting, or you can select a program to run. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. Elevation can be adjusted to change the intensity of the workout.
2. Treadmills offer convenience, cardiovascular benefits, and usually have less impact than running outside. A 150 lb person will burn over 450 calories running 8 miles per hour for 30 minutes. Maintain proper posture as you run, and only hold onto the handles when necessary, such as when dismounting or checking your heart rate.'
  WHERE name = 'High Knees (s)' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Position yourself on your hands and knees on the ground. Maintaining good posture, raise one bent knee off of the ground. This will be your starting position.
2. Keeping the knee in a bent position, rotate the femur in an arc, attempting to make a big circle with your knee.
3. Perform this slowly for a number of repetitions, and repeat on the other side.'
  WHERE name = 'Hip Circles' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Roller skating is a fun activity which can be effective in improving cardiorespiratory fitness and muscular endurance. It requires relatively good balance and coordination. It is necessary to learn the basics of skating including turning and stopping and to wear protective gear to avoid possible injury.
2. You can skate at a comfortable pace for 30 minutes straight. If you want a cardio challenge, do interval skating — speed skate two minutes of every five minutes, using the remaining three minutes to recover. A 150 lb person will typically burn about 175 calories in 30 minutes skating at a comfortable pace, similar to brisk walking.'
  WHERE name = 'Ice Skater Steps' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Hold an end of the rope in each hand. Position the rope behind you on the ground. Raise your arms up and turn the rope over your head bringing it down in front of you. When it reaches the ground, jump over it. Find a good turning pace that can be maintained. Different speeds and techniques can be used to introduce variation.
2. Rope jumping is exciting, challenges your coordination, and requires a lot of energy. A 150 lb person will burn about 350 calories jumping rope for 30 minutes, compared to over 450 calories running.'
  WHERE name = 'In-Out Jumping Jacks' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand with your feet close together. Keeping your legs straight, stretch down and put your hands on the floor directly in front of you. This will be your starting position.
2. Begin by walking your hands forward slowly, alternating your left and your right. As you do so, bend only at the hip, keeping your legs straight.
3. Keep going until your body is parallel to the ground in a pushup position.
4. Now, keep your hands in place and slowly take short steps with your feet, moving only a few inches at a time.
5. Continue walking until your feet are by hour hands, keeping your legs straight as you do so.'
  WHERE name = 'Inchworm Push-Up' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie back on an incline bench. Using a medium-width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position.
2. As you breathe in, come down slowly until you feel the bar on you upper chest.
3. After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms in the contracted position, squeeze your chest, hold for a second and then start coming down slowly again. Tip: it should take at least twice as long to go down than to come up.
4. Repeat the movement for the prescribed amount of repetitions.
5. When you are done, place the bar back in the rack.'
  WHERE name = 'Incline Bench Press' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand facing bench or sturdy elevated platform. Place hands on edge of bench or platform, slightly wider than shoulder width.
2. Position forefoot back from bench or platform with arms and body straight. Arms should be perpendicular to body. Keeping body straight, lower chest to edge of box or platform by bending arms.
3. Push body up until arms are extended. Repeat.'
  WHERE name = 'Incline Push-up' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Hold an end of the rope in each hand. Position the rope behind you on the ground. Raise your arms up and turn the rope over your head bringing it down in front of you. When it reaches the ground, jump over it. Find a good turning pace that can be maintained. Different speeds and techniques can be used to introduce variation.
2. Rope jumping is exciting, challenges your coordination, and requires a lot of energy. A 150 lb person will burn about 350 calories jumping rope for 30 minutes, compared to over 450 calories running.'
  WHERE name = 'Jump Rope' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Cross your arms over your chest.
2. With your head up and your back straight, position your feet at shoulder width.
3. Keeping your back straight and chest up, squat down as you inhale until your upper thighs are parallel, or lower, to the floor.
4. Now pressing mainly with the ball of your feet, jump straight up in the air as high as possible, using the thighs like springs. Exhale during this portion of the movement.
5. When you touch the floor again, immediately squat down and jump again.
6. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Jump Squats' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Hold an end of the rope in each hand. Position the rope behind you on the ground. Raise your arms up and turn the rope over your head bringing it down in front of you. When it reaches the ground, jump over it. Find a good turning pace that can be maintained. Different speeds and techniques can be used to introduce variation.
2. Rope jumping is exciting, challenges your coordination, and requires a lot of energy. A 150 lb person will burn about 350 calories jumping rope for 30 minutes, compared to over 450 calories running.'
  WHERE name = 'Jumping Jacks (s)' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Place kettlebell between your feet. To get in the starting position, push your butt back and look straight ahead.
2. Clean the kettlebell to your shoulder. Clean the kettlebell to your shoulders by extending through the legs and hips as you raise the kettlebell towards your shoulder. The wrist should rotate as you do so.
3. Lower the kettlebell, keeping the hamstrings loaded by keeping your back straight and your butt out.'
  WHERE name = 'KB Deadlift' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Hang from a chin-up bar with both arms extended at arms length in top of you using either a wide grip or a medium grip. The legs should be straight down with the pelvis rolled slightly backwards. This will be your starting position.
2. Raise your legs until the torso makes a 90-degree angle with the legs. Exhale as you perform this movement and hold the contraction for a second or so.
3. Go back slowly to the starting position as you breathe in.
4. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Knee to Elbows' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Hang from a chin-up bar with both arms extended at arms length in top of you using either a wide grip or a medium grip. The legs should be straight down with the pelvis rolled slightly backwards. This will be your starting position.
2. Raise your legs until the torso makes a 90-degree angle with the legs. Exhale as you perform this movement and hold the contraction for a second or so.
3. Go back slowly to the starting position as you breathe in.
4. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Knee/Leg Raises' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Position a bar into a landmine or securely anchor it in a corner. Load the bar to an appropriate weight.
2. Raise the bar from the floor, taking it to shoulder height with both hands with your arms extended in front of you. Adopt a wide stance. This will be your starting position.
3. Perform the movement by rotating the trunk and hips as you swing the weight all the way down to one side. Keep your arms extended throughout the exercise.
4. Reverse the motion to swing the weight all the way to the opposite side.
5. Continue alternating the movement until the set is complete.'
  WHERE name = 'Landmine' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Position a bar into a landmine or securely anchor it in a corner. Load the bar to an appropriate weight.
2. Raise the bar from the floor, taking it to shoulder height with both hands with your arms extended in front of you. Adopt a wide stance. This will be your starting position.
3. Perform the movement by rotating the trunk and hips as you swing the weight all the way down to one side. Keep your arms extended throughout the exercise.
4. Reverse the motion to swing the weight all the way to the opposite side.
5. Continue alternating the movement until the set is complete.'
  WHERE name = 'Landmine Rotation' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Sit down on a pull-down machine with a wide bar attached to the top pulley. Make sure that you adjust the knee pad of the machine to fit your height. These pads will prevent your body from being raised by the resistance attached to the bar.
2. Grab the bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width.
3. As you have both arms extended in front of you holding the bar at the chosen grip width, bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.
4. As you breathe out, bring the bar down until it touches your upper chest by drawing the shoulders and the upper arms down and back. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary and only the arms should move. The forearms should do no other work except for holding the bar; therefore do not try to pull down the bar using the forearms.
5. After a second at the contracted position squeezing your shoulder blades together, slowly raise the bar back to the starting position when your arms are fully extended and the lats are fully stretched. Inhale during this portion of the movement.
6. Repeat this motion for the prescribed amount of repetitions.'
  WHERE name = 'Lat Pulldown' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Assume a half squat position facing 90 degrees from your direction of travel. This will be your starting position.
2. Allow your lead leg to do a countermovement inward as you shift your weight to the outside leg.
3. Immediately push off and extend, attempting to bound to the side as far as possible.
4. Upon landing, immediately push off in the opposite direction, returning to your original start position.
5. Continue back and forth for several repetitions.'
  WHERE name = 'Lateral Bounds' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand with your torso upright holding two dumbbells in your hands by your sides. This will be your starting position.
2. Step forward with your right leg around 2 feet or so from the foot being left stationary behind and lower your upper body down, while keeping the torso upright and maintaining balance. Inhale as you go down. Note: As in the other exercises, do not allow your knee to go forward beyond your toes as you come down, as this will put undue stress on the knee joint. Make sure that you keep your front shin perpendicular to the ground.
3. Using mainly the heel of your foot, push up and go back to the starting position as you exhale.
4. Repeat the movement for the recommended amount of repetitions and then perform with the left leg.'
  WHERE name = 'Lateral Lunge' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Pick a couple of dumbbells and stand with a straight torso and the dumbbells by your side at arms length with the palms of the hand facing you. This will be your starting position.
2. While maintaining the torso in a stationary position (no swinging), lift the dumbbells to your side with a slight bend on the elbow and the hands slightly tilted forward as if pouring water in a glass. Continue to go up until you arms are parallel to the floor. Exhale as you execute this movement and pause for a second at the top.
3. Lower the dumbbells back down slowly to the starting position as you inhale.
4. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Lateral Raise' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Adjust the machine lever to fit your height and lie face down on the leg curl machine with the pad of the lever on the back of your legs (just a few inches under the calves). Tip: Preferably use a leg curl machine that is angled as opposed to flat since an angled position is more favorable for hamstrings recruitment.
2. Keeping the torso flat on the bench, ensure your legs are fully stretched and grab the side handles of the machine. Position your toes straight (or you can also use any of the other two stances described on the foot positioning section). This will be your starting position.
3. As you exhale, curl your legs up as far as possible without lifting the upper legs from the pad. Once you hit the fully contracted position, hold it for a second.
4. As you inhale, bring the legs back to the initial position. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Leg Curl' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. For this exercise you will need to use a leg extension machine. First choose your weight and sit on the machine with your legs under the pad (feet pointed forward) and the hands holding the side bars. This will be your starting position. Tip: You will need to adjust the pad so that it falls on top of your lower leg (just above your feet). Also, make sure that your legs form a 90-degree angle between the lower and upper leg. If the angle is less than 90-degrees then that means the knee is over the toes which in turn creates undue stress at the knee joint. If the machine is designed that way, either look for another machine or just make sure that when you start executing the exercise you stop going down once you hit the 90-degree angle.
2. Using your quadriceps, extend your legs to the maximum as you exhale. Ensure that the rest of the body remains stationary on the seat. Pause a second on the contracted position.
3. Slowly lower the weight back to the original position as you inhale, ensuring that you do not go past the 90-degree angle limit.
4. Repeat for the recommended amount of times.'
  WHERE name = 'Leg Extension' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Using a leg press machine, sit down on the machine and place your legs on the platform directly in front of you at a medium (shoulder width) foot stance. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances described in the foot positioning section).
2. Lower the safety bars holding the weighted platform in place and press the platform all the way up until your legs are fully extended in front of you. Tip: Make sure that you do not lock your knees. Your torso and the legs should make a perfect 90-degree angle. This will be your starting position.
3. As you inhale, slowly lower the platform until your upper and lower legs make a 90-degree angle.
4. Pushing mainly with the heels of your feet and using the quadriceps go back to the starting position as you exhale.
5. Repeat for the recommended amount of repetitions and ensure to lock the safety pins properly once you are done. You do not want that platform falling on you fully loaded.'
  WHERE name = 'Leg Press' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Using a leg press machine, sit down on the machine and place your legs on the platform directly in front of you at a medium (shoulder width) foot stance. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances described in the foot positioning section).
2. Lower the safety bars holding the weighted platform in place and press the platform all the way up until your legs are fully extended in front of you. Tip: Make sure that you do not lock your knees. Your torso and the legs should make a perfect 90-degree angle. This will be your starting position.
3. As you inhale, slowly lower the platform until your upper and lower legs make a 90-degree angle.
4. Pushing mainly with the heels of your feet and using the quadriceps go back to the starting position as you exhale.
5. Repeat for the recommended amount of repetitions and ensure to lock the safety pins properly once you are done. You do not want that platform falling on you fully loaded.'
  WHERE name = 'Leg Press + Leg Machines' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand with your torso upright holding two dumbbells in your hands by your sides. This will be your starting position.
2. Step forward with your right leg around 2 feet or so from the foot being left stationary behind and lower your upper body down, while keeping the torso upright and maintaining balance. Inhale as you go down. Note: As in the other exercises, do not allow your knee to go forward beyond your toes as you come down, as this will put undue stress on the knee joint. Make sure that you keep your front shin perpendicular to the ground.
3. Using mainly the heel of your foot, push up and go back to the starting position as you exhale.
4. Repeat the movement for the recommended amount of repetitions and then perform with the left leg.'
  WHERE name = 'Lunge with Twist' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand with your torso upright holding two dumbbells in your hands by your sides. This will be your starting position.
2. Step forward with your right leg around 2 feet or so from the foot being left stationary behind and lower your upper body down, while keeping the torso upright and maintaining balance. Inhale as you go down. Note: As in the other exercises, do not allow your knee to go forward beyond your toes as you come down, as this will put undue stress on the knee joint. Make sure that you keep your front shin perpendicular to the ground.
3. Using mainly the heel of your foot, push up and go back to the starting position as you exhale.
4. Repeat the movement for the recommended amount of repetitions and then perform with the left leg.'
  WHERE name = 'Lunges' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Assume a semisquat stance with a medicine ball in your hands. Your arms should hang so the ball is near your feet.
2. Begin by thrusting the hips forward as you extend through the legs, jumping up.
3. As you do, swing your arms up and over your head, keeping them extended, releasing the ball at the peak of your movement. The goal is to throw the ball the greatest distance behind you.'
  WHERE name = 'Med Ball Overhead Hold' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Hold a medine ball with both hands and stand with your feet at shoulder width. This will be your starting position.
2. Initiate the countermovement by raising the ball above your head and fully extending your body.
3. Reverse the motion, slamming the ball into the ground directly in front of you as hard as you can.
4. Receive the ball with both hands on the bounce and repeat the movement.'
  WHERE name = 'Med Ball Slams' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Assume a semisquat stance with a medicine ball in your hands. Your arms should hang so the ball is near your feet.
2. Begin by thrusting the hips forward as you extend through the legs, jumping up.
3. As you do, swing your arms up and over your head, keeping them extended, releasing the ball at the peak of your movement. The goal is to throw the ball the greatest distance behind you.'
  WHERE name = 'Medicine Ball Rotational Toss' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Begin by taking a medium to wide grip on a pull-up apparatus with your palms facing away from you. From a hanging position, tuck your knees to your chest, leaning back and getting your legs over your side of the pull-up apparatus. This will be your starting position.
2. Beginning with your arms straight, flex the elbows and retract the shoulder blades to raise your body up until your legs contact the pull-up apparatus.
3. After a brief pause, return to the starting position.'
  WHERE name = 'Mid Row' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Begin in a pushup position, with your weight supported by your hands and toes. Flexing the knee and hip, bring one leg until the knee is approximately under the hip. This will be your starting position.
2. Explosively reverse the positions of your legs, extending the bent leg until the leg is straight and supported by the toe, and bringing the other foot up with the hip and knee flexed. Repeat in an alternating fashion for 20-30 seconds.'
  WHERE name = 'Mountain Climber Burpee' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Begin in a pushup position, with your weight supported by your hands and toes. Flexing the knee and hip, bring one leg until the knee is approximately under the hip. This will be your starting position.
2. Explosively reverse the positions of your legs, extending the bent leg until the leg is straight and supported by the toe, and bringing the other foot up with the hip and knee flexed. Repeat in an alternating fashion for 20-30 seconds.'
  WHERE name = 'Mountain Climbers' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Begin in a pushup position, with your weight supported by your hands and toes. Flexing the knee and hip, bring one leg until the knee is approximately under the hip. This will be your starting position.
2. Explosively reverse the positions of your legs, extending the bent leg until the leg is straight and supported by the toe, and bringing the other foot up with the hip and knee flexed. Repeat in an alternating fashion for 20-30 seconds.'
  WHERE name = 'Mountain Climbers + Air Squats' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Sit on a bench with back support in a squat rack. Position a barbell at a height that is just above your head. Grab the barbell with a pronated grip (palms facing forward).
2. Once you pick up the barbell with the correct grip width, lift the bar up over your head by locking your arms. Hold at about shoulder level and slightly in front of your head. This is your starting position.
3. Lower the bar down to the shoulders slowly as you inhale.
4. Lift the bar back up to the starting position as you exhale.
5. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Overhead Press' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Connect a standard handle to a tower, and—if possible—position the cable to shoulder height. If not, a low pulley will suffice.
2. With your side to the cable, grab the handle with both hands and step away from the tower. You should be approximately arm''s length away from the pulley, with the tension of the weight on the cable.
3. With your feet positioned hip-width apart and knees slightly bent, hold the cable to the middle of your chest. This will be your starting position.
4. Press the cable away from your chest, fully extending both arms. You core should be tight and engaged.
5. Hold the repetition for several seconds before returning to the starting position.
6. At the conclusion of the set, repeat facing the other direction.'
  WHERE name = 'Pallof Press' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. With your back to the wall bend at the waist and place both hands on the floor at shoulder width.
2. Kick yourself up against the wall with your arms straight. Your body should be upside down with the arms and legs fully extended. Keep your whole body as straight as possible. Tip: If doing this for the first time, have a spotter help you. Also, make sure that you keep facing the wall with your head, rather than looking down.
3. Slowly lower yourself to the ground as you inhale until your head almost touches the floor. Tip: It is of utmost importance that you come down slow in order to avoid head injury.
4. Push yourself back up slowly as you exhale until your elbows are nearly locked.
5. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Pike Push-ups' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand with your feet shoulder width apart. You can place your hands behind your head. This will be your starting position.
2. Begin the movement by flexing your knees and hips, sitting back with your hips.
3. Continue down to full depth if you are able,and quickly reverse the motion until you return to the starting position. As you squat, keep your head and chest up and push your knees out.'
  WHERE name = 'Pilates Squat + Squat' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Get into a prone position on the floor, supporting your weight on your toes and your forearms. Your arms are bent and directly below the shoulder.
2. Keep your body straight at all times, and hold this position as long as possible. To increase difficulty, an arm or leg can be raised.'
  WHERE name = 'Plank' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Get into a prone position on the floor, supporting your weight on your toes and your forearms. Your arms are bent and directly below the shoulder.
2. Keep your body straight at all times, and hold this position as long as possible. To increase difficulty, an arm or leg can be raised.'
  WHERE name = 'Plank (Variations)' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Get into a prone position on the floor, supporting your weight on your toes and your forearms. Your arms are bent and directly below the shoulder.
2. Keep your body straight at all times, and hold this position as long as possible. To increase difficulty, an arm or leg can be raised.'
  WHERE name = 'Plank (Weighted)' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Get into a prone position on the floor, supporting your weight on your toes and your forearms. Your arms are bent and directly below the shoulder.
2. Keep your body straight at all times, and hold this position as long as possible. To increase difficulty, an arm or leg can be raised.'
  WHERE name = 'Plank In and Outs' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Get into a prone position on the floor, supporting your weight on your toes and your forearms. Your arms are bent and directly below the shoulder.
2. Keep your body straight at all times, and hold this position as long as possible. To increase difficulty, an arm or leg can be raised.'
  WHERE name = 'Plank Jacks' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Get into a prone position on the floor, supporting your weight on your toes and your forearms. Your arms are bent and directly below the shoulder.
2. Keep your body straight at all times, and hold this position as long as possible. To increase difficulty, an arm or leg can be raised.'
  WHERE name = 'Plank Shoulder Taps' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Get into a prone position on the floor, supporting your weight on your toes and your forearms. Your arms are bent and directly below the shoulder.
2. Keep your body straight at all times, and hold this position as long as possible. To increase difficulty, an arm or leg can be raised.'
  WHERE name = 'Plank Taps' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Get into a prone position on the floor, supporting your weight on your toes and your forearms. Your arms are bent and directly below the shoulder.
2. Keep your body straight at all times, and hold this position as long as possible. To increase difficulty, an arm or leg can be raised.'
  WHERE name = 'Plank with Knee-to-Elbow' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Get into a prone position on the floor, supporting your weight on your toes and your forearms. Your arms are bent and directly below the shoulder.
2. Keep your body straight at all times, and hold this position as long as possible. To increase difficulty, an arm or leg can be raised.'
  WHERE name = 'Plank with Row' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Get into a prone position on the floor, supporting your weight on your toes and your forearms. Your arms are bent and directly below the shoulder.
2. Keep your body straight at all times, and hold this position as long as possible. To increase difficulty, an arm or leg can be raised.'
  WHERE name = 'Plank-to-Pushup' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Grab the pull-up bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than your shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width.
2. As you have both arms extended in front of you holding the bar at the chosen grip width, bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.
3. Pull your torso up until the bar touches your upper chest by drawing the shoulders and the upper arms down and back. Exhale as you perform this portion of the movement. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar.
4. After a second on the contracted position, start to inhale and slowly lower your torso back to the starting position when your arms are fully extended and the lats are fully stretched.
5. Repeat this motion for the prescribed amount of repetitions.'
  WHERE name = 'Pull up/Lat Pulldown' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Grab the pull-up bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than your shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width.
2. As you have both arms extended in front of you holding the bar at the chosen grip width, bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.
3. Pull your torso up until the bar touches your upper chest by drawing the shoulders and the upper arms down and back. Exhale as you perform this portion of the movement. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar.
4. After a second on the contracted position, start to inhale and slowly lower your torso back to the starting position when your arms are fully extended and the lats are fully stretched.
5. Repeat this motion for the prescribed amount of repetitions.'
  WHERE name = 'Pull-Up' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie on the floor face down and place your hands about 36 inches apart while holding your torso up at arms length.
2. Next, lower yourself downward until your chest almost touches the floor as you inhale.
3. Now breathe out and press your upper body back up to the starting position while squeezing your chest.
4. After a brief pause at the top contracted position, you can begin to lower yourself downward again for as many repetitions as needed.'
  WHERE name = 'Push-Up' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie on the floor face down and place your hands about 36 inches apart while holding your torso up at arms length.
2. Next, lower yourself downward until your chest almost touches the floor as you inhale.
3. Now breathe out and press your upper body back up to the starting position while squeezing your chest.
4. After a brief pause at the top contracted position, you can begin to lower yourself downward again for as many repetitions as needed.'
  WHERE name = 'Push-up (Weighted)' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Put a barbell in front of you on the ground and grab it using a pronated (palms facing down) grip that a little wider than shoulder width. Tip: Depending on the weight used, you may need wrist wraps to perform the exercise and also a raised platform in order to allow for better range of motion.
2. Bend the knees slightly and keep the shins vertical, hips back and back straight. This will be your starting position.
3. Keeping your back and arms completely straight at all times, use your hips to lift the bar as you exhale. Tip: The movement should not be fast but steady and under control.
4. Once you are standing completely straight up, lower the bar by pushing the hips back, only slightly bending the knees, unlike when squatting. Tip: Take a deep breath at the start of the movement and keep your chest up. Hold your breath as you lower and exhale as you complete the movement.
5. Repeat for the recommended amount of repetitions.'
  WHERE name = 'RDL' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Grasp a couple of dumbbells holding them by your side at arm''s length.
2. Stand with your torso straight and your legs spaced using a shoulder width or narrower stance. The knees should be slightly bent. This is your starting position.
3. Keeping the knees stationary, lower the dumbbells to over the top of your feet by bending at the waist while keeping your back straight. Keep moving forward as if you were going to pick something from the floor until you feel a stretch on the hamstrings. Exhale as you perform this movement
4. Start bringing your torso up straight again by extending your hips and waist until you are back at the starting position. Inhale as you perform this movement.
5. Repeat for the recommended amount of repetitions.'
  WHERE name = 'RDL (Dumbbells)' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie down on the floor with your legs fully extended and arms to the side of your torso with the palms on the floor. Your arms should be stationary for the entire exercise.
2. Move your legs up so that your thighs are perpendicular to the floor and feet are together and parallel to the floor. This is the starting position.
3. While inhaling, move your legs towards the torso as you roll your pelvis backwards and you raise your hips off the floor. At the end of this movement your knees will be touching your chest.
4. Hold the contraction for a second and move your legs back to the starting position while exhaling.
5. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Reverse Crunch' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand with your torso upright holding two dumbbells in your hands by your sides. This will be your starting position.
2. Step backward with your right leg around two feet or so from the left foot and lower your upper body down, while keeping the torso upright and maintaining balance. Inhale as you go down. Tip: As in the other exercises, do not allow your knee to go forward beyond your toes as you come down, as this will put undue stress on the knee joint. Make sure that you keep your front shin perpendicular to the ground. Keep the torso upright during the lunge; flexible hip flexors are important. A long lunge emphasizes the Gluteus Maximus; a short lunge emphasizes Quadriceps.
3. Push up and go back to the starting position as you exhale. Tip: Use the ball of your feet to push in order to accentuate the quadriceps. To focus on the glutes, press with your heels.
4. Now repeat with the opposite leg.'
  WHERE name = 'Reverse Lunge' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Put a barbell in front of you on the ground and grab it using a pronated (palms facing down) grip that a little wider than shoulder width. Tip: Depending on the weight used, you may need wrist wraps to perform the exercise and also a raised platform in order to allow for better range of motion.
2. Bend the knees slightly and keep the shins vertical, hips back and back straight. This will be your starting position.
3. Keeping your back and arms completely straight at all times, use your hips to lift the bar as you exhale. Tip: The movement should not be fast but steady and under control.
4. Once you are standing completely straight up, lower the bar by pushing the hips back, only slightly bending the knees, unlike when squatting. Tip: Take a deep breath at the start of the movement and keep your chest up. Hold your breath as you lower and exhale as you complete the movement.
5. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Romanian Deadlift' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Assume a comfortable standing position, with a short box positioned next to you. This will be your starting position.
2. Quickly dip into a quarter squat to initiate the stretch reflex, and immediately reverse direction to jump up and to the side.
3. Bring your knees high enough to ensure your feet have good clearance over the box.
4. Land on the center of the box, using your legs to absorb the impact.
5. Carefully jump down to the other side of the box, and continue going back and forth for several repetitions.'
  WHERE name = 'Rope Ladder Broad Jumps' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. To begin, seat yourself on the rower. Make sure that your heels are resting comfortably against the base of the foot pedals and that the straps are secured. Select the program that you wish to use, if applicable. Sit up straight and bend forward at the hips.
2. There are three phases of movement when using a rower. The first phase is when you come forward on the rower. Your knees are bent and against your chest. Your upper body is leaning slightly forward while still maintaining good posture. Next, push against the foot pedals and extend your legs while bringing your hands to your upper abdominal area, squeezing your shoulders back as you do so. To avoid straining your back, use primarily your leg and hip muscles.
3. The recovery phase simply involves straightening your arms, bending the knees, and bringing your body forward again as you transition back into the first phase.'
  WHERE name = 'Rowing Machine' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie down on the floor placing your feet either under something that will not move or by having a partner hold them. Your legs should be bent at the knees.
2. Elevate your upper body so that it creates an imaginary V-shape with your thighs. Your arms should be fully extended in front of you perpendicular to your torso and with the hands clasped. This is the starting position.
3. Twist your torso to the right side until your arms are parallel with the floor while breathing out.
4. Hold the contraction for a second and move back to the starting position while breathing out. Now move to the opposite side performing the same techniques you applied to the right side.
5. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Russian Twists' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Take a pronated grip on a pull-up bar.
2. From a hanging position, raise yourself a few inches without using your arms. Do this by depressing your shoulder girdle in a reverse shrugging motion.
3. Pause at the completion of the movement, and then slowly return to the starting position before performing more repetitions.'
  WHERE name = 'Scapular Pull-up' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Take a pronated grip on a pull-up bar.
2. From a hanging position, raise yourself a few inches without using your arms. Do this by depressing your shoulder girdle in a reverse shrugging motion.
3. Pause at the completion of the movement, and then slowly return to the starting position before performing more repetitions.'
  WHERE name = 'Scapular Push-ups' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. For this exercise you will need access to a low pulley row machine with a V-bar. Note: The V-bar will enable you to have a neutral grip where the palms of your hands face each other. To get into the starting position, first sit down on the machine and place your feet on the front platform or crossbar provided making sure that your knees are slightly bent and not locked.
2. Lean over as you keep the natural alignment of your back and grab the V-bar handles.
3. With your arms extended pull back until your torso is at a 90-degree angle from your legs. Your back should be slightly arched and your chest should be sticking out. You should be feeling a nice stretch on your lats as you hold the bar in front of you. This is the starting position of the exercise.
4. Keeping the torso stationary, pull the handles back towards your torso while keeping the arms close to it until you touch the abdominals. Breathe out as you perform that movement. At that point you should be squeezing your back muscles hard. Hold that contraction for a second and slowly go back to the original position while breathing in.
5. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Seated Cable Row' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. To begin, step onto the treadmill and select the desired option from the menu. Most treadmills have a manual setting, or you can select a program to run. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. Elevation can be adjusted to change the intensity of the workout.
2. Treadmills offer convenience, cardiovascular benefits, and usually have less impact than running outside. A 150 lb person will burn over 450 calories running 8 miles per hour for 30 minutes. Maintain proper posture as you run, and only hold onto the handles when necessary, such as when dismounting or checking your heart rate.'
  WHERE name = 'Shuttle Runs (yd)' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Get into pushup position on the toes with your hands just outside of shoulder width.
2. Perform a pushup by allowing the elbows to flex. As you descend, keep your body straight.
3. Do one pushup and as you come up, shift your weight on the left side of the body, twist to the side while bringing the right arm up towards the ceiling in a side plank.
4. Lower the arm back to the floor for another pushup and then twist to the other side.
5. Repeat the series, alternating each side, for 10 or more reps.'
  WHERE name = 'Side Plank Dips' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Get into pushup position on the toes with your hands just outside of shoulder width.
2. Perform a pushup by allowing the elbows to flex. As you descend, keep your body straight.
3. Do one pushup and as you come up, shift your weight on the left side of the body, twist to the side while bringing the right arm up towards the ceiling in a side plank.
4. Lower the arm back to the floor for another pushup and then twist to the other side.
5. Repeat the series, alternating each side, for 10 or more reps.'
  WHERE name = 'Side Planks' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Secure your legs at the end of the decline bench and lie down.
2. Now place your hands lightly on either side of your head keeping your elbows in. Tip: Don''t lock your fingers behind your head.
3. While pushing the small of your back down in the bench to better isolate your abdominal muscles, begin to roll your shoulders off it.
4. Continue to push down as hard as you can with your lower back as you contract your abdominals and exhale. Your shoulders should come up off the bench only about four inches, and your lower back should remain on the bench. At the top of the movement, contract your abdominals hard and keep the contraction for a second. Tip: Focus on slow, controlled movement - don''t cheat yourself by using momentum.
5. After the one second contraction, begin to come down slowly again to the starting position as you inhale.
6. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Single Leg Decline' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lay on the floor with your feet flat and knees bent.
2. Raise one leg off of the ground, pulling the knee to your chest. This will be your starting position.
3. Execute the movement by driving through the heel, extending your hip upward and raising your glutes off of the ground.
4. Extend as far as possible, pause and then return to the starting position.'
  WHERE name = 'Single-Leg Bridge' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Arrange a line of cones in front of you. Assume a relaxed standing position, balanced on one leg. Raise the knee of your opposite leg. This will be your starting position.
2. Hop forward, jumping and landing with the same leg over the cone.
3. Use a countermovement jump to hop from cone to cone.
4. At the end, turn around and go back on the other leg.'
  WHERE name = 'Single-Leg Hops' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Being in a standing position. Jump into a split leg position, with one leg forward and one leg back, flexing the knees and lowering your hips slightly as you do so.
2. As you descend, immediately reverse direction, standing back up and jumping, reversing the position of your legs. Repeat 5-10 times on each leg.'
  WHERE name = 'Single-Leg Reach (Bulg Squat)' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand facing a box or bench of an appropriate height with your feet together. This will be your starting position.
2. Begin the movement by stepping up, putting your left foot on the top of the bench. Extend through the hip and knee of your front leg to stand up on the box. As you stand on the box with your left leg, flex your right knee and hip, bringing your knee as high as you can.
3. Reverse this motion to step down off the box, and then repeat the sequence on the opposite leg.'
  WHERE name = 'Single-Leg Step-Up' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Roller skating is a fun activity which can be effective in improving cardiorespiratory fitness and muscular endurance. It requires relatively good balance and coordination. It is necessary to learn the basics of skating including turning and stopping and to wear protective gear to avoid possible injury.
2. You can skate at a comfortable pace for 30 minutes straight. If you want a cardio challenge, do interval skating — speed skate two minutes of every five minutes, using the remaining three minutes to recover. A 150 lb person will typically burn about 175 calories in 30 minutes skating at a comfortable pace, similar to brisk walking.'
  WHERE name = 'Skater Jumps' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Using a close grip, lift the EZ bar and hold it with your elbows in as you lie on the bench. Your arms should be perpendicular to the floor. This will be your starting position.
2. Keeping the upper arms stationary, lower the bar by allowing the elbows to flex. Inhale as you perform this portion of the movement. Pause once the bar is directly above the forehead.
3. Lift the bar back to the starting position by extending the elbow and exhaling.
4. Repeat.'
  WHERE name = 'Skull Crusher' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Roller skating is a fun activity which can be effective in improving cardiorespiratory fitness and muscular endurance. It requires relatively good balance and coordination. It is necessary to learn the basics of skating including turning and stopping and to wear protective gear to avoid possible injury.
2. You can skate at a comfortable pace for 30 minutes straight. If you want a cardio challenge, do interval skating — speed skate two minutes of every five minutes, using the remaining three minutes to recover. A 150 lb person will typically burn about 175 calories in 30 minutes skating at a comfortable pace, similar to brisk walking.'
  WHERE name = 'Speed Skaters' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Begin in a prone position on the floor. Support your weight on your hands and toes, with your feet together and your body straight. Your arms should be bent to 90 degrees. This will be your starting position.
2. Initiate the movement by raising one foot off of the ground. Externally rotate the leg and bring the knee toward your elbow, as far forward as possible.
3. Return this leg to the starting position and repeat on the opposite side.'
  WHERE name = 'Spiderman Push-ups' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack just above shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.
2. Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.
3. Step away from the rack and position your legs using a shoulder-width medium stance with the toes slightly pointed out. Keep your head up at all times and maintain a straight back. This will be your starting position.
4. Begin to slowly lower the bar by bending the knees and sitting back with your hips as you maintain a straight posture with the head up. Continue down until your hamstrings are on your calves. Inhale as you perform this portion of the movement.
5. Begin to raise the bar as you exhale by pushing the floor with the heel or middle of your foot as you straighten the legs and extend the hips to go back to the starting position.
6. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Squat' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand up straight while holding a dumbbell on each hand (palms facing the side of your legs).
2. Position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. This will be your starting position. Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances discussed in the foot stances section.
3. Begin to slowly lower your torso by bending the knees as you maintain a straight posture with the head up. Continue down until your thighs are parallel to the floor. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.
4. Begin to raise your torso as you exhale by pushing the floor with the heel of your foot mainly as you straighten the legs again and go back to the starting position.
5. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Squat Press (DB/Bar)' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Standing with the weight racked on the front of the shoulders, begin with the dip. With your feet directly under your hips, flex the knees without moving the hips backward. Go down only slightly, and reverse direction as powerfully as possible. Drive through the heels create as much speed and force as possible, and be sure to move your head out of the way as the bar leaves the shoulders.
2. At this moment as the feet leave the floor, the feet must be placed into the receiving position as quickly as possible. In the brief moment the feet are not actively driving against the platform, the athlete''s effort to push the bar up will drive them down. The feet should move forcefully to just outside the hips, turned out as necessary. Receive the bar with your body in a full squat and the arms fully extended overhead.
3. Keeping the bar aligned over the front of the heels, your head and chest up, drive throught heels of the feet to move to a standing position. Carefully return the weight to floor.'
  WHERE name = 'Squat Thrusts' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand upright holding an exercise ball with both hands. Extend your arms so the ball is straight out in front of you. This will be your starting position.
2. Rotate your torso to one side, keeping your eyes on the ball as you move. Now, rotate back to the opposite direction. Repeat for 10-20 repetitions.'
  WHERE name = 'Static Squat Cable Torso Rotations' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand up straight while holding a dumbbell on each hand (palms facing the side of your legs).
2. Place the right foot on the elevated platform. Step on the platform by extending the hip and the knee of your right leg. Use the heel mainly to lift the rest of your body up and place the foot of the left leg on the platform as well. Breathe out as you execute the force required to come up.
3. Step down with the left leg by flexing the hip and knee of the right leg as you inhale. Return to the original standing position by placing the right foot of to next to the left foot on the initial position.
4. Repeat with the right leg for the recommended amount of repetitions and then perform with the left leg.'
  WHERE name = 'Step-ups/Weighted' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. There are various implements that can be used for the farmers walk. These can also be performed with heavy dumbbells or short bars if these implements aren''t available. Begin by standing between the implements.
2. After gripping the handles, lift them up by driving through your heels, keeping your back straight and your head up.
3. Walk taking short, quick steps, and don''t forget to breathe. Move for a given distance, typically 50-100 feet, as fast as possible.'
  WHERE name = 'Suitcase Carry (L/R)' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Get into pushup position on the toes with your hands just outside of shoulder width.
2. Perform a pushup by allowing the elbows to flex. As you descend, keep your body straight.
3. Do one pushup and as you come up, shift your weight on the left side of the body, twist to the side while bringing the right arm up towards the ceiling in a side plank.
4. Lower the arm back to the floor for another pushup and then twist to the other side.
5. Repeat the series, alternating each side, for 10 or more reps.'
  WHERE name = 'T-Pushups' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand up straight while holding a dumbbell on the left hand (palms facing the torso) as you have the right hand holding your waist. Your feet should be placed at shoulder width. This will be your starting position.
2. While keeping your back straight and your head up, bend only at the waist to the right as far as possible. Breathe in as you bend to the side. Then hold for a second and come back up to the starting position as you exhale. Tip: Keep the rest of the body stationary.
3. Now repeat the movement but bending to the left instead. Hold for a second and come back to the starting position.
4. Repeat for the recommended amount of repetitions and then change hands.'
  WHERE name = 'Teapots' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie on the floor face down and place your hands about 36 inches apart while holding your torso up at arms length.
2. Next, lower yourself downward until your chest almost touches the floor as you inhale.
3. Now breathe out and press your upper body back up to the starting position while squeezing your chest.
4. After a brief pause at the top contracted position, you can begin to lower yourself downward again for as many repetitions as needed.'
  WHERE name = 'Tempo Push-ups' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. To begin, lie down on the floor or an exercise mat with your back pressed against the floor. Your arms should be lying across your sides with the palms facing down.
2. Your legs should be touching each other. Slowly elevate your legs up in the air until they are almost perpendicular to the floor with a slight bend at the knees. Your feet should be parallel to the floor.
3. Move your arms so that they are fully extended at a 45 degree angle from the floor. This is the starting position.
4. While keeping your lower back pressed against the floor, slowly lift your torso and use your hands to try and touch your toes. Remember to exhale while perform this part of the exercise.
5. Slowly begin to lower your torso and arms back down to the starting position while inhaling. Remember to keep your arms straight out pointing towards your toes.
6. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Toe Taps' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand up with your torso upright and a dumbbell on each hand being held at arms length. The elbows should be close to the torso.
2. The palms of the hands should be facing your torso. This will be your starting position.
3. Now, while holding your upper arm stationary, exhale and curl the weight forward while contracting the biceps. Continue to raise the weight until the biceps are fully contracted and the dumbbell is at shoulder level. Hold the contracted position for a brief moment as you squeeze the biceps. Tip: Focus on keeping the elbow stationary and only moving your forearm.
4. After the brief pause, inhale and slowly begin the lower the dumbbells back down to the starting position.
5. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Towel Curls' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. To begin, step onto the treadmill and select the desired option from the menu. Most treadmills have a manual setting, or you can select a program to run. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. Elevation can be adjusted to change the intensity of the workout.
2. Treadmills offer convenience, cardiovascular benefits, and usually have less impact than running outside. A 150 lb person will burn over 450 calories running 8 miles per hour for 30 minutes. Maintain proper posture as you run, and only hold onto the handles when necessary, such as when dismounting or checking your heart rate.'
  WHERE name = 'Treadmill Run' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Attach a straight or angled bar to a high pulley and grab with an overhand grip (palms facing down) at shoulder width.
2. Standing upright with the torso straight and a very small inclination forward, bring the upper arms close to your body and perpendicular to the floor. The forearms should be pointing up towards the pulley as they hold the bar. This is your starting position.
3. Using the triceps, bring the bar down until it touches the front of your thighs and the arms are fully extended perpendicular to the floor. The upper arms should always remain stationary next to your torso and only the forearms should move. Exhale as you perform this movement.
4. After a second hold at the contracted position, bring the bar slowly up to the starting point. Breathe in as you perform this step.
5. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Tricep Pushdown' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie flat on the floor (or exercise mat) on your back with your arms extended straight back behind your head and your legs extended also. This will be your starting position.
2. As you exhale, bend at the waist while simultaneously raising your legs and arms to meet in a jackknife position. Tip: The legs should be extended and lifted at approximately a 35-45 degree angle from the floor and the arms should be extended and parallel to your legs. The upper torso should be off the floor.
3. While inhaling, lower your arms and legs back to the starting position.
4. Repeat for the recommended amount of repetitions.'
  WHERE name = 'V-Ups' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie flat on the floor (or exercise mat) on your back with your arms extended straight back behind your head and your legs extended also. This will be your starting position.
2. As you exhale, bend at the waist while simultaneously raising your legs and arms to meet in a jackknife position. Tip: The legs should be extended and lifted at approximately a 35-45 degree angle from the floor and the arms should be extended and parallel to your legs. The upper torso should be off the floor.
3. While inhaling, lower your arms and legs back to the starting position.
4. Repeat for the recommended amount of repetitions.'
  WHERE name = 'V-Ups/Knee Raises' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Begin standing with your feet shoulder width apart and your hands on your hips.
2. Step forward with one leg, flexing the knees to drop your hips. Descend until your rear knee nearly touches the ground. Your posture should remain upright, and your front knee should stay above the front foot.
3. Drive through the heel of your lead foot and extend both knees to raise yourself back up.
4. Step forward with your rear foot, repeating the lunge on the opposite leg.'
  WHERE name = 'Walking Lunges' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. This exercise is best done with a partner. If you lack a partner, the ball can be thrown and retrieved or thrown against a wall.
2. Begin standing a few meters in front of your partner, both facing the same direction. Begin holding the ball between your legs.
3. Squat down and then forcefully reverse direction, coming to full extension and you toss the ball over your head to your partner.
4. Your partner can then roll the ball back to you. Repeat for the desired number of repetitions.'
  WHERE name = 'Wall Balls' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand with your feet shoulder width apart. You can place your hands behind your head. This will be your starting position.
2. Begin the movement by flexing your knees and hips, sitting back with your hips.
3. Continue down to full depth if you are able,and quickly reverse the motion until you return to the starting position. As you squat, keep your head and chest up and push your knees out.'
  WHERE name = 'Wall Sit' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Stand with your feet shoulder width apart. You can place your hands behind your head. This will be your starting position.
2. Begin the movement by flexing your knees and hips, sitting back with your hips.
3. Continue down to full depth if you are able,and quickly reverse the motion until you return to the starting position. As you squat, keep your head and chest up and push your knees out.'
  WHERE name = 'Wall Sits (Weighted)' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. Lie down on the floor placing your feet either under something that will not move or by having a partner hold them. Your legs should be bent at the knees.
2. Place your hands behind your head and lock them together by clasping your fingers. This is the starting position.
3. Elevate your upper body so that it creates an imaginary V-shape with your thighs. Breathe out when performing this part of the exercise.
4. Once you feel the contraction for a second, lower your upper body back down to the starting position while inhaling.
5. Repeat for the recommended amount of repetitions.'
  WHERE name = 'Weighted Sit-up' AND (form_notes IS NULL OR form_notes = '');

UPDATE exercises SET form_notes = '1. On a flat bench lie facedown with the hips on the edge of the bench, the legs straight with toes high off the floor and with the arms on top of the bench holding on to the front edge.
2. Squeeze your glutes and hamstrings and straighten the legs until they are level with the hips. This will be your starting position.
3. Start the movement by lifting the left leg higher than the right leg.
4. Then lower the left leg as you lift the right leg.
5. Continue alternating in this manner (as though you are doing a flutter kick in water) until you have done the recommended amount of repetitions for each leg. Make sure that you keep a controlled movement at all times. Tip: You will breathe normally as you perform this movement.'
  WHERE name = 'Windshields/Alternate Knee Raises' AND (form_notes IS NULL OR form_notes = '');
