import { useState, type ReactNode } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, StyleSheet, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { useEncyclopedia } from '@/hooks/useEncyclopedia';
import type { MuscleGroupEntry } from '@/types';

// ─── Default content fallbacks ─────────────────────────────────

type Defaults = Pick<MuscleGroupEntry,
  'function_description' | 'warmup_and_stretches' | 'common_injuries' | 'rehab_exercises'>;

const DEFAULT_CONTENT: Record<string, Defaults> = {
  Chest: {
    function_description:
      'The pectoralis major is a large fan-shaped muscle with two heads: the clavicular head (upper chest, active in incline pressing and shoulder flexion) and the sternocostal head (mid/lower chest, dominant in flat and decline pressing). Its primary actions are horizontal adduction, flexion, and internal rotation of the humerus at the glenohumeral joint. The pectoralis minor lies beneath it, originating on the 3rd–5th ribs and inserting on the coracoid process of the scapula — it protracts and depresses the scapula and assists with forced inhalation. The serratus anterior works in tandem to upwardly rotate the scapula during pressing movements. All three must be trained and stretched for balanced upper body mechanics.',
    warmup_and_stretches:
      '• Arm circles (small → large, 10 each direction) — progressively mobilises the glenohumeral joint\n• Band pull-aparts (15–20 reps, medium tension) — activates posterior shoulder and opens the chest\n• Doorway pec stretch — forearm on frame at 90°, rotate torso away slowly; hold 20–30 s per side; shift arm height to target upper/mid/lower pec fibres\n• Thoracic extension over foam roller (5 segments, 30 s each) — opens the T-spine to reduce compensatory shoulder impingement\n• Cat-cow thoracic extension (10 slow reps) — spinal preparation\n• Chest-supported dumbbell retraction (2 × 15 light) — activates scapular stabilisers before loading\n• Light cable fly warm-up sets (2 × 20, very light) — grooves the pressing pattern and increases local blood flow',
    common_injuries:
      '• Pectoral muscle tear — most commonly at the musculotendinous junction during heavy bench press with excessive external rotation; Grade III tears require surgical repair; presents with sudden sharp pain and visible chest deformity\n• Shoulder impingement syndrome — supraspinatus tendon compressed under the acromion during pressing; worsened by protracted scapula and excessive internal rotation load\n• AC (acromioclavicular) joint sprain — irritated by very wide-grip pressing or heavy dips; presents as superior shoulder pain localised to the AC joint\n• Proximal bicep tendon irritation at the sternal attachment — from aggressive pec stretching or flye overshoot at end range\n• Anterior capsule stretch/laxity — chronic overstretching of the anterior shoulder capsule from excessive depth in dips or flyes',
    rehab_exercises:
      '• Banded external rotation at 0° — directly counteracts the internal rotation dominance of heavy chest pressing; 3 × 15 per side\n• Cable face pulls (high pulley, elbows above hands, 3 × 15) — balances the anterior drive of pressing with posterior deltoid and rotator cuff activation\n• Serratus anterior wall slides — forearm pressed to wall, slide arms overhead while maintaining contact; activates the serratus, preventing scapular winging and impingement\n• Light dumbbell flyes on incline (2 × 15, mild stretch, no overshoot) — low-load tissue remodelling at the pec insertion\n• Push-up progressions: wall push-up → incline → floor → weighted; eccentric focus (3 s lowering) to stimulate collagen synthesis in tendons\n• Band-resisted scapular protraction and retraction rows — restores full scapular mobility and strength needed for safe pressing mechanics',
  },
  Shoulders: {
    function_description:
      'The shoulder complex is the most mobile joint in the body, requiring a precise balance between mobility and stability. The deltoid muscle has three distinct heads: anterior (shoulder flexion and horizontal adduction, dominant in front raises and pressing), lateral (shoulder abduction, dominant in lateral raises and overhead work), and posterior (horizontal abduction and external rotation, dominant in reverse flyes and rows). The rotator cuff is a group of four muscles (supraspinatus, infraspinatus, teres minor, subscapularis — "SITS") that dynamically stabilise the glenohumeral joint by compressing the humeral head into the glenoid fossa during all shoulder movement. The rotator cuff must fire before the deltoid during every shoulder movement to prevent impingement. The trapezius (upper, middle, lower fibres) manages scapular elevation, retraction, and depression. Scapular upward rotation during overhead pressing is coordinated by the serratus anterior and lower trapezius — weakness in either causes compensatory impingement.',
    warmup_and_stretches:
      '• Shoulder pendulum swings (30 s per arm) — gravitational traction decompresses the subacromial space\n• Shoulder circles forward and back (10 each direction)\n• Cross-body arm stretch — hold 20–30 s per side; targets the posterior shoulder capsule and posterior deltoid\n• Doorway pec stretch (upper and mid pec variations) — opens anterior chest to allow full shoulder ROM\n• Band pull-aparts (medium tension, 2 × 20) — posterior deltoid and external rotator activation\n• Prone Y/T/W raises with very light weight or no weight — activates lower trap, middle trap, and posterior deltoid in a scapular-stable position\n• Wall angels (10 slow reps) — proprioceptive training for scapular control and thoracic extension\n• Hip 90/90 with thoracic rotation — improves T-spine mobility that feeds into safe overhead mechanics',
    common_injuries:
      '• Rotator cuff impingement syndrome — tendon compression in the subacromial space, typically affecting the supraspinatus; caused by scapular dyskinesis, poor posture, or excessive overhead volume without adequate posterior cuff strength\n• Rotator cuff partial or full-thickness tear — supraspinatus most commonly; severe tears cause significant strength loss and require surgical evaluation; partial tears can often be rehabilitated conservatively\n• Acromioclavicular (AC) joint sprain or separation — caused by direct impact or fall on outstretched hand; graded I–VI by severity; Grade I–II managed conservatively\n• Glenohumeral instability — anterior instability is most common, often from a subluxation or dislocation event; requires rotator cuff strengthening and proprioceptive training\n• Bicipital tendinopathy — inflammation of the long head of biceps in its groove; often co-exists with rotator cuff pathology\n• SLAP labral tear — tearing of the superior labrum from anterior to posterior; common in overhead athletes and those with repetitive eccentric shoulder loading',
    rehab_exercises:
      '• Sidelying external rotation — isolates infraspinatus and teres minor; keep elbow at 90°, rotate against gravity; 3 × 15 per side with light dumbbell\n• Full can raises (supraspinatus) — arm at 30° in the scapular plane, thumb up, raise to eye level; 3 × 15\n• Cable face pulls (high pulley, elbows high) — trains posterior deltoid, external rotators, and middle/lower trap simultaneously; arguably the highest-priority shoulder health exercise\n• Banded shoulder ER/IR at 0° and 90° abduction — works through the rotator cuff range relevant to both pressing and overhead lifting\n• Scapular retraction and depression holds (5 s isometric, 3 × 12) — trains lower and middle trapezius to provide a stable base for shoulder movement\n• Light lateral raises with elbow slightly bent and controlled eccentric (3 s lowering) — rebuilds mid-deltoid capacity at low load\n• Sleeper stretch (for tight posterior capsule) — lying on affected shoulder, gently press forearm toward the floor; hold 20–30 s',
  },
  Arms: {
    function_description:
      'The arm musculature performs both elbow and forearm functions. Biceps brachii (short and long heads): primary actions are elbow flexion and forearm supination; the long head also contributes to shoulder flexion and stabilisation of the humeral head. Brachialis (beneath the biceps): the strongest pure elbow flexor regardless of forearm position — it is active whether the hand is supinated, neutral, or pronated. Brachioradialis: elbow flexion with the forearm in neutral (hammer) position; also acts as a forearm stabiliser during wrist loading. Triceps brachii (long, medial, lateral heads): sole elbow extensor — all three heads must be trained. The long head also assists shoulder extension (active in overhead tricep exercises). Forearm flexors (8 muscles including flexor carpi radialis and ulnaris, flexor digitorum): wrist flexion and finger grip — often undertrained and a source of elbow pain. Forearm extensors (including extensor carpi radialis longus and brevis): wrist extension and finger extension — commonly overloaded in racquet sports and pulling-dominant training.',
    warmup_and_stretches:
      '• Wrist circles (10 each direction per wrist) — mobilises the wrist and radioulnar joints\n• Forearm flexor stretch — arm straight, palm up, gently pull fingers back toward you; hold 20–30 s per side; targets flexor digitorum and carpi tendons at the medial epicondyle\n• Forearm extensor stretch — arm straight, palm down, gently press fingers toward floor; hold 20–30 s; targets tendons at the lateral epicondyle\n• Overhead tricep stretch (elbow behind head, gentle pressure down) — stretches the long head through full range; hold 20 s per side\n• Prayer stretch and reverse prayer — combined wrist flexion and extension range of motion\n• Light band curls (2 × 15) — activates biceps and forearm flexors\n• Light pushdowns (2 × 15) — activates triceps and establishes elbow extension pattern',
    common_injuries:
      '• Distal bicep tendon rupture — complete tear at the elbow insertion; typically occurs during an eccentric overload (sudden forced extension during a supinated curl); presents with a "pop," significant bruising, and the "Popeye" deformity; requires surgical repair\n• Proximal bicep tendon pathology — inflammation or partial tear at the shoulder; often co-occurs with rotator cuff impingement\n• Medial epicondylitis ("golfer\'s elbow") — overuse tendinopathy of the common flexor tendon at the medial epicondyle; from high volume of wrist flexion under load; responds well to eccentric rehabilitation\n• Lateral epicondylitis ("tennis elbow") — overuse tendinopathy of the common extensor tendon at the lateral epicondyle; from repetitive wrist extension and gripping; eccentric exercises are first-line treatment\n• Tricep tendon strain or partial tear — at the olecranon insertion; from heavy close-grip pressing or skull crushers, especially at end range\n• Cubital tunnel syndrome — compression of the ulnar nerve at the medial elbow; causes numbness and tingling in the ring and little fingers; aggravated by prolonged elbow flexion',
    rehab_exercises:
      '• Eccentric wrist curls over edge of bench (golfer\'s elbow) — 3 × 15 per side, slow 3–5 s lowering; stimulates collagen synthesis in the flexor tendon\n• Eccentric wrist extensions over edge of bench (tennis elbow) — same protocol; most evidence-supported treatment for lateral epicondylitis\n• Forearm supination/pronation with light dumbbell — full range, controlled; restores radioulnar mobility\n• Isometric bicep holds at 90° (5 × 30 s) — reduces pain and maintains strength during acute tendinopathy phases\n• Band tricep pushdowns (light, slow 3 s eccentric) — tendon loading without compressive force at the elbow\n• Grip strengthening with therapy putty or thick-handled implements — rebuilds distal forearm and intrinsic hand strength; important for elbow tendinopathy recovery\n• Tyler Twist / reverse Tyler Twist (FlexBar exercises) — strong evidence for lateral and medial epicondylitis; eccentric-concentric rotation exercises',
  },
  Core: {
    function_description:
      'The core is not just the "six-pack" — it is a cylindrical pressure system that stabilises the spine under all loads. Rectus abdominis: anterior spinal flexion ("crunch" motion); secondarily resists hyperextension. External obliques: rotation to the opposite side and lateral flexion; also assist trunk flexion. Internal obliques: rotation to the same side; lateral flexion; co-activate with TVA for intra-abdominal pressure. Transverse abdominis (TVA): the deepest layer — wraps around the trunk like a corset; when contracted it dramatically increases intra-abdominal pressure (IAP), stiffening the lumbar spine for safe loading under heavy squats and deadlifts. This is the physiological basis for the Valsalva manoeuvre in maximal lifts. Erector spinae (iliocostalis, longissimus, spinalis): spinal extension and resisting spinal flexion under load. Multifidus: deep spinal stabilisers that maintain vertebral control; often inhibited after lumbar disc injury and must be deliberately retrained. Quadratus lumborum (QL): lateral flexion and stabilisation of the 12th rib during breathing under load.',
    warmup_and_stretches:
      '• Diaphragmatic breathing in 90-90 position (5 deep breaths, 5 s exhale) — establishes diaphragmatic control and TVA engagement before loading\n• Cat-cow (10 slow reps, full spinal range) — mobilises all thoracic and lumbar segments\n• Dead bug (5–8 slow reps per side, lumbar flat to floor throughout) — activates TVA and multi-joint coordination before loading\n• Child\'s pose with lateral reach (30 s per side) — stretches QL and lateral trunk\n• Prone cobra / Superman hold (3 × 10 s) — activates lumbar extensors in a safe position\n• Standing hip flexor stretch with posterior pelvic tilt — addresses anterior pelvic tilt that increases lumbar extension stress\n• Lying knee-to-chest pulls (30 s per side) — decompresses lumbar facet joints',
    common_injuries:
      '• Lumbar muscle strain (erectors and QL overload) — the most common acute gym injury; caused by sudden high load with poor position or fatigue; typically resolves with active rest and graded loading\n• Lumbar disc herniation — L4–L5 and L5–S1 are most common levels; nucleus pulposus protrudes and may compress nerve roots causing radicular pain; McKenzie extension protocol can centralise symptoms; most cases resolve without surgery\n• Sports hernia / athletic pubalgia — weakness of the inguinal canal floor from explosive cutting, kicking, or twisting; not a true hernia; presents as chronic groin pain; common in football players\n• Sacroiliac (SI) joint dysfunction — pain at the posterior pelvis; common during load transfer exercises; often responds to targeted gluteal strengthening and pelvic stability work\n• Rib stress fracture — from excessive oblique rotation and high rowing/twisting volume; presents as localised rib pain that worsens with breathing\n• Lumbar spondylolisthesis — anterior slippage of one vertebra relative to the adjacent one; particularly common at L5–S1; worsened by extension-heavy exercises',
    rehab_exercises:
      '• McGill Big Three — designed by Professor Stuart McGill, world-leading spinal researcher at University of Waterloo: (1) Modified curl-up: head lifted just off ground, no spinal flexion — protects lumbar discs while activating rectus abdominis; (2) Side plank: anti-lateral-flexion endurance for QL and obliques; (3) Bird dog: contralateral arm/leg extension in quadruped — activates erectors, multifidus, and glutes while maintaining neutral spine\n• Pallof press (cable or band) — anti-rotation core stiffness; move cable to arm\'s length and resist rotation; 3 × 10 per side with 2 s pause\n• Dead bug progressions — supine TVA activation with alternating limb extension; maintains lumbar contact with floor throughout\n• Suitcase carry (unilateral loaded carry) — anti-lateral-flexion functional strength; walk 20 m per side with challenging dumbbell weight\n• 90-90 breathing with TVA bracing — for restoring proper diaphragm/TVA coordination post-injury\n• Glute bridge — establishes posterior chain (glute + hamstring + erector) co-activation as foundation for posterior chain loading',
  },
  Hips: {
    function_description:
      'The hip is the body\'s most powerful joint complex. Adductors (adductor longus, brevis, magnus, gracilis, pectineus): medial thigh muscles that adduct the leg toward the midline and stabilise the knee during single-leg loading; adductor magnus also assists hip extension and is often undertrained relative to the lateral hip. Hip flexors: the iliopsoas (iliacus + psoas major) is the primary hip flexor in standing gait; psoas major also compresses lumbar vertebrae and contributes to lumbar stability; rectus femoris (quad muscle) also flexes the hip and becomes a limiting factor in hip mobility when tight. Hip abductors: gluteus medius is the primary abductor and pelvic stabiliser during single-leg stance — weakness causes the Trendelenburg sign (pelvis drops on the unsupported side) and compensatory knee valgus during squatting and running. Tensor fasciae latae (TFL): abduction and internal rotation; feeds into the iliotibial band (ITB). Piriformis: external rotation of the hip; can compress the sciatic nerve if hypertonic (piriformis syndrome).',
    warmup_and_stretches:
      '• Hip circles on all fours (10 large circles per side) — circumduction of the femoral head through the acetabulum\n• Standing hip circles (10 each direction per leg) — active mobility warm-up\n• Half-kneeling hip flexor stretch — knee on floor, squeeze glute of rear leg, shift forward until stretch felt in front of hip; hold 30 s per side; posterior pelvic tilt increases stretch on psoas\n• Wide-stance squat hold with thoracic rotation (30 s, then alternate) — combined adductor and thoracic stretch\n• Lateral lunge with pause (8 per side) — dynamic adductor stretch through controlled range\n• 90/90 hip stretch on floor (45–60 s per side, both internal and external rotation) — the gold standard hip mobility drill\n• Cossack squats (10 slow, controlled reps) — dynamic adductor and hip flexor mobility through full range',
    common_injuries:
      '• Adductor / groin strain — acute muscle tear from explosive kicking, sprinting, or lateral movement; graded I–III by severity; return to sport guided by strength symmetry and pain-free ROM\n• Iliopsoas tendinopathy or hip flexor strain — overuse from excessive sprinting, stair climbing, or loaded hip flexion; presents as anterior hip or groin pain\n• Femoroacetabular impingement (FAI) — bony abnormality of the femoral head (cam) or acetabulum (pincer) that causes impingement and labral damage in deep hip flexion; common in lifters who squat deep with poor femoral head clearance\n• Hip labral tear — cartilaginous rim tear, often associated with FAI; presents as clicking, catching, and deep groin pain; diagnosed by MRI arthrogram\n• Iliotibial band syndrome — friction of the ITB over the lateral femoral condyle; common in distance runners with hip abductor weakness; typically presents as lateral knee pain that worsens at the 30° knee flexion point\n• Piriformis syndrome — hypertonic piriformis compresses the sciatic nerve, causing buttock and posterior leg pain; differentiated from true sciatica (disc origin) by specific provocative tests',
    rehab_exercises:
      '• Clamshells (banded or not, 3 × 20 per side) — targets gluteus medius with minimal lumbar involvement; essential for hip abductor rehabilitation\n• Side-lying hip abduction with controlled eccentric (3 s lowering) — pure hip abductor strengthening\n• Copenhagen adductor plank — evidence-based eccentric adductor loading; strongest groin injury prevention exercise in sports medicine literature; progress from short-lever to full long-lever version\n• Banded hip flexion marching in standing — targets iliopsoas through functional range\n• Single-leg balance progressions — proprioception and neuromuscular control; essential for pelvic stability return-to-sport\n• Hip 90/90 mobility transitions — moving between internal and external rotation in 90/90 position; improves joint centration\n• Eccentric hip adductor squeeze with Pilates ball — graded adductor loading for groin strain rehabilitation',
  },
  Back: {
    function_description:
      'The posterior trunk contains some of the largest and most functionally important muscles in the body. Latissimus dorsi: the widest muscle in the body; originates from the thoracolumbar fascia, posterior iliac crest, and lower thoracic vertebrae; inserts on the intertubercular groove of the humerus; primary actions are shoulder adduction, extension, and internal rotation — the primary pulling muscle in rows and pull-ups. Rhomboids (major and minor): retract the scapula and downwardly rotate it; often inhibited and weak in those with rounded posture. Middle trapezius: scapular retraction. Lower trapezius: scapular depression and upward rotation — critical for safe overhead lifting and often very weak in the modern population. Erector spinae (iliocostalis, longissimus, spinalis): three bilateral columns that extend the spine; primary movers in deadlift and good morning. Multifidus: deep spinal stabilisers at each vertebral level; first muscle inhibited by pain and the last to recover; directly controls intersegmental motion. Quadratus lumborum (QL): lateral flexion and stabilisation of the lumbar spine; the most common source of acute "back spasm."',
    warmup_and_stretches:
      '• Cat-cow (10 slow reps, full thoracic and lumbar range) — segmental spinal mobility\n• Child\'s pose with arm reach (30 s per side) — combined lat and QL stretch; reaching overhead increases the lat component\n• Thread-the-needle thoracic rotation (8 reps per side, slow) — rotational mobilisation of the thoracic spine\n• Hanging lat stretch from bar (3 × 20 s) — spinal decompression and passive lat stretch under bodyweight\n• Prone cobra / Superman (3 × 8 s holds) — activates lumbar extensors and lower trap\n• Band pull-aparts (2 × 20, medium tension) — activates middle and lower trap, rhomboids\n• Chest-supported dumbbell row warm-up sets (very light, 2 × 15) — establishes scapular mechanics before heavier loading',
    common_injuries:
      '• Lumbar muscle strain (erector spinae, QL) — the most common gym injury globally; acute onset from sudden load or poor position; managed with active rest, heat, and graded return to loading\n• Lumbar disc herniation — L4–L5 (most common) and L5–S1; nucleus pulposus pushes through annular tears; can compress L4/L5/S1 nerve roots causing radicular symptoms; most resolve conservatively within 3–6 months\n• Thoracic disc herniation — less common; often presents as mid-back pain with or without myelopathy\n• Spondylolisthesis — anterior vertebral slippage, most commonly L5 on S1; worsened by extension-heavy exercise; stability training and avoiding hyperextension are key\n• Lat or rhomboid strain — from excessive pull volume, especially heavy rows with poor scapular control\n• Sciatica (sciatic nerve compression) — usually from L4/L5/S1 disc pathology or piriformis syndrome; presents as posterior leg pain, numbness, or tingling\n• Thoracic outlet syndrome — compression of the brachial plexus between the clavicle and first rib; causes arm numbness and weakness in overhead positions',
    rehab_exercises:
      '• McGill bird dog (3 × 8 per side, 8 s holds) — contralateral arm/leg extension with neutral spine; gold-standard for multifidus and erector spinae rehabilitation; requires and trains precise spinal control\n• Prone Y/T/W/I raises (light or no weight) — comprehensive lower and middle trapezius strengthening; addresses scapular dyskinesis common in those with back injuries\n• Chest-supported dumbbell row (light, neutral spine, 3 × 12) — horizontal pulling strength without lumbar compression\n• Half-kneeling cable pulldown — vertical pulling in a position that neutralises lumbar extension compensation\n• Jefferson curl (very light, 5–10 kg, slow controlled eccentric and concentric flexion) — evidence-informed spinal flexion loading for posterior chain resilience; requires pain-free baseline before introducing\n• Reverse hyper extension or back extension isometric holds — restores posterior chain strength while avoiding compressive disc loading',
  },
  Glutes: {
    function_description:
      'The gluteal complex is the body\'s most powerful muscle group and the foundation of athletic performance. Gluteus maximus: the largest muscle in the body; originates on the posterior ilium, sacrum, and coccyx; inserts on the gluteal tuberosity of the femur and the iliotibial band; primary functions are hip extension (most powerful on flat-to-hip-flexed range) and external rotation; powers sprinting, jumping, squatting, and deadlifting. Its force output determines athletic explosive power more than any other single muscle. Gluteus medius: originates on the lateral ilium and inserts on the greater trochanter; primary hip abductor and the key stabiliser of the pelvis during single-leg stance; prevents the Trendelenburg gait (pelvis drop to non-weight-bearing side); weakness causes excessive knee valgus (knock-knee) during squats, lunges, and running — a major ACL risk factor in female athletes. Gluteus minimus: sits beneath the medius; assists hip abduction and medial rotation. Piriformis and other deep external hip rotators: stabilise the femoral head in the acetabulum and control hip rotation under load.',
    warmup_and_stretches:
      '• Bodyweight glute bridge with 2 s pause at the top (2 × 15) — activates the glutes neurologically before loading; focus on squeezing at the top\n• Pigeon pose on floor or yoga block (hold 30–60 s per side) — stretches the piriformis and external rotators; particularly important for those who sit for extended periods\n• Figure-4 stretch (supine or seated) — gentle external rotator and piriformis stretch; hold 30 s\n• Fire hydrants (banded, 2 × 15 per side) — activates gluteus medius in hip abduction before lateral loading\n• Hip circles on all fours (10 per side, large arc) — circumducts the hip joint and activates glute med in all planes\n• Lateral band walks (mini band above knees, 2 × 15 per direction) — prime hip abductors and external rotators before squats and lunges\n• Clamshells (banded, 2 × 20) — isolates gluteus medius for targeted activation before compound movements',
    common_injuries:
      '• Proximal hamstring tendinopathy (high hamstring / deep gluteal pain) — overuse injury at the ischial tuberosity attachment; worsened by running uphill, deadlifts, and prolonged sitting; managed with load management and eccentric-isometric tendon loading protocols\n• Piriformis syndrome — hypertonic piriformis compresses the sciatic nerve near the sciatic notch; presents as buttock pain radiating down the posterior thigh; differentiated from disc sciatica by provocation tests (FAIR test)\n• Gluteal tendinopathy — irritation of the gluteus medius or minimus tendons at the greater trochanter; presents as lateral hip pain worse with prolonged sitting, single-leg loading, and leg crossing; avoid compressive stretches in early rehab\n• Sacroiliac (SI) joint dysfunction — pain at the posterior pelvis; from poor load transfer between spine and pelvis; targeted glute strengthening improves SI stability\n• Hip impingement (FAI) — bony cam or pincer morphology causing pain in deep hip positions; limits squat depth; often requires modified technique and hip mobility work',
    rehab_exercises:
      '• Clamshells (progressions: unresisted → banded → cable) — isolated gluteus medius loading from pain-free range\n• Glute bridge to single-leg glute bridge progressions — starts bilaterally to establish hip extension mechanics, progresses to unilateral for functional pelvic stability\n• Hip thrust (barbell or dumbbell) — maximal gluteus maximus activation across the full hip extension range; most EMG-validated exercise for glute hypertrophy; load progressively\n• Side-lying hip abduction (controlled, 3 s lowering) — pure gluteus medius strengthening; key for Trendelenburg rehabilitation\n• Terminal knee extension (band behind knee, stand on affected leg) — VMO and gluteus medius co-activation for knee and hip stability\n• Step-ups (low box, controlled 3 s descent) — functional single-leg gluteal loading; the eccentric descent is the therapeutic component\n• Isometric hip abduction (wall press, 5 × 30 s) — pain-inhibition-free loading for gluteal tendinopathy; first-line treatment before eccentric loading',
  },
  Hands: {
    function_description:
      'The hand and wrist form the body\'s most dexterous joint complex — 27 bones across the wrist and hand, with over 30 muscles (intrinsic and extrinsic) coordinated by the median, ulnar, and radial nerves. Intrinsic hand muscles fall into four groups: thenar muscles (abductor pollicis brevis, flexor pollicis brevis, opponens pollicis — forming the thumb eminence; all median nerve); hypothenar muscles (abductor digiti minimi, flexor digiti minimi, opponens digiti minimi — the little finger eminence; ulnar nerve); lumbricals (four muscles connecting the flexor digitorum profundus tendons to the extensor apparatus — uniquely flex the MCP joints while simultaneously extending the IP joints); and interossei (4 dorsal abduct the fingers, 3 palmar adduct them — all powered by the deep ulnar nerve). Extrinsic forearm muscles provide primary grip force: flexor digitorum superficialis (flexes PIP joints), flexor digitorum profundus (flexes DIP joints, allowing independent finger depth), flexor carpi radialis and ulnaris (wrist flexion), extensor digitorum (extends all four fingers), and extensor carpi radialis longus/brevis plus extensor carpi ulnaris (wrist extension). The wrist joint complex includes the radiocarpal joint (primary articulation between the distal radius and proximal carpal row), the midcarpal joint (between proximal and distal carpal rows), and the distal radioulnar joint (DRUJ), which governs forearm pronation and supination. Grip strength is one of the strongest epidemiological predictors of all-cause mortality — a reminder that the hands are never an afterthought in physical training.',
    warmup_and_stretches:
      '• Wrist circles (10 per direction per wrist, progressive arc) — mobilises the radiocarpal and midcarpal joints and distributes synovial fluid before loading\n• Prayer stretch — palms pressed together at chest height, slowly lower hands toward waist while maintaining palm contact; feel stretch through the forearm flexors; hold 20–30 s\n• Reverse prayer stretch — backs of hands pressed together behind the back, gently lift away from spine; targets wrist extensors and the dorsal joint capsule; hold 20–30 s\n• Forearm flexor stretch — arm extended, palm up, gently pull fingers back with the opposite hand; hold 20–30 s; targets flexor digitorum superficialis and carpi tendons at the medial epicondyle\n• Forearm extensor stretch — arm extended, palm down, gently press the back of the hand toward the floor; hold 20–30 s; targets extensor carpi tendons and the posterior wrist capsule\n• Loaded wrist stretch in quadruped — hands flat on floor, lean forward progressively to load the wrists in extension; essential before push-ups, planche, or handstand work; rotate hands sideways and backward for full capsule coverage\n• Finger extension spreads (10 slow reps) — spread all fingers apart as wide as possible then close; activates the dorsal interossei and counteracts the flexor dominance built up from daily gripping',
    common_injuries:
      '• Carpal tunnel syndrome — compression of the median nerve under the flexor retinaculum at the base of the wrist; causes pain, numbness, and tingling in the thumb, index, middle, and radial ring finger; worsened by prolonged wrist flexion and repetitive gripping; managed with night splinting, nerve glides, and activity modification; advanced cases require surgical release\n• De Quervain\'s tenosynovitis — inflammation of the abductor pollicis longus and extensor pollicis brevis tendons in their shared sheath on the radial (thumb) side of the wrist; positive Finkelstein test; common in new parents and athletes with repetitive thumb loading\n• TFCC tear (triangular fibrocartilage complex) — the cartilage and ligament complex on the ulnar side of the wrist acts as the primary shock absorber; injury causes ulnar-sided wrist pain, clicking, and instability; mechanism is a fall on an outstretched hand (FOOSH) or repetitive forearm rotation; often misdiagnosed due to anatomical complexity\n• Scaphoid fracture — the most common carpal bone fracture; mechanism is FOOSH; often missed on initial X-ray (MRI is diagnostic); the proximal pole has poor vascular supply and is at high risk of avascular necrosis and non-union if not immobilised promptly\n• A2 pulley injury — the A2 annular pulley on the proximal phalanx is the most load-bearing pulley in the finger flexor sheath; rupture causes bowstringing of the flexor tendons; most common in rock climbers and gymnasts during crimping; graded I–IV by severity\n• Dorsal wrist impingement syndrome — synovial tissue is pinched between dorsal wrist structures at end-range wrist extension; common in gymnasts, weightlifters, and anyone performing front squats or Olympic cleans; presents as reproducible pain at the back of the wrist',
    rehab_exercises:
      '• Rice bucket exercises — submerge the hand in dry rice and perform finger flexion, extension, abduction, and adduction against the resistance of the grain; rebuilds intrinsic hand strength and finger extensor endurance (the often-neglected counterpart to grip flexors); 3 sets of 2–3 minutes; particularly effective post-tendinopathy\n• Finger extension band exercises — loop a rubber band around all five fingers, spread fingers against resistance; directly counteracts the flexor dominance of heavy lifting and climbing; 3 × 20 reps; progress to thicker bands\n• Eccentric wrist curls over bench edge (palm up, 3 × 12–15, 3–5 s lowering) — loads flexor tendons eccentrically; stimulates collagen synthesis in the flexor tendons; first-line rehabilitation for golfer\'s elbow and wrist flexor tendinopathy\n• Eccentric wrist extensions over bench edge (palm down, same protocol) — first-line treatment for wrist extensor tendinopathy and lateral epicondylitis\n• Tyler Twist and Reverse Tyler Twist (FlexBar) — eccentric loading of wrist extensors and flexors respectively using a flexible rubber bar; clinical trials show 81% pain reduction and 79% strength improvement vs standard physiotherapy for lateral epicondylitis\n• Dead hangs from pull-up bar (3 × 20–45 s, passive hang) — decompresses the wrist and finger joints; builds grip endurance through sustained loaded stretch; essential for climbers and gymnasts\n• Putty or therapy clay gripping — progressive resistance from isometric squeezes to dynamic pinching; rebuilds fine motor control and intrinsic hand strength after fracture or nerve injury\n• Wrist roller (forward and backward rolls) — full ROM strengthening of wrist flexors and extensors with built-in progressive overload',
  },
  Feet: {
    function_description:
      'The foot and ankle form the body\'s primary interface with the ground — 26 bones, 33 joints, and over 100 muscles, tendons, and ligaments work together across every step, jump, and landing. Intrinsic foot muscles occupy four plantar layers: the first (most superficial) contains the abductor hallucis (medial border; abducts and flexes the great toe), flexor digitorum brevis (central sole; flexes the lateral four toes at MTP and IP joints), and abductor digiti minimi (lateral border; abducts the fifth toe). Deeper layers include the quadratus plantae, lumbricals, adductor hallucis, and interossei — collectively stabilising the metatarsal arch, controlling toe movement, and providing proprioceptive feedback that regulates balance on every surface. Extrinsic muscles originate in the lower leg: tibialis anterior (strongest dorsiflexor; also inverts the foot; innervated by the deep peroneal nerve); gastrocnemius and soleus (the calf pair, joined at the Achilles tendon — the largest tendon in the body — to the calcaneus; gastrocnemius dominates with knee extended, soleus with knee flexed); tibialis posterior (primary inverter and the dynamic support of the medial longitudinal arch — weakness causes progressive flat foot); and the fibularis muscles (longus and brevis — evert the foot and are the primary dynamic stabilisers of the lateral ankle). The ankle joint complex consists of the talocrural joint (hinge between the tibia/fibula mortise and talus — dorsiflexion and plantarflexion), the subtalar joint (inversion and eversion — essential for terrain adaptation), and the Lisfranc tarsometatarsal complex (the keystone of the midfoot arch; disruption causes significant long-term disability). The plantar fascia spans from the calcaneus to the metatarsal heads — it maintains the medial longitudinal arch and functions as a tension spring during the propulsive phase of walking and running.',
    warmup_and_stretches:
      '• Ankle circles (10 per direction per ankle) — full 360° rotations mobilise the talocrural and subtalar joints and distribute synovial fluid before loading\n• Ankle alphabet — seated with leg extended, trace capital letters in the air with the big toe using only foot movement; covers dorsiflexion, plantarflexion, inversion, and eversion in coordinated patterns; 1–2 alphabets per foot\n• Plantar fascia stretch — seated, cross foot over opposite knee, grasp toes and gently pull toward shin (toe extension); hold 20–30 s; especially important as a morning first-stretch for those with plantar fascia pain\n• Gastrocnemius stretch — hands on wall, rear leg straight and heel pressed flat; hold 30 s; the two-joint gastrocnemius requires a straight knee to achieve full stretch\n• Soleus stretch — same position but bend the rear knee 20–30°; gastrocnemius is now slackened and the soleus is fully stretched; hold 30 s; critical for ankle dorsiflexion mobility and squat depth\n• Towel toe scrunches (activation) — sit with a small towel flat on the floor; scrunch the towel toward you using only the toes for 20–30 s; activates intrinsic foot muscles before loading\n• Short foot exercise — sit with foot flat on floor, shorten the foot by pulling the ball of the foot toward the heel without curling the toes; hold 3 s; 10 reps per foot; activates the plantar intrinsics and teaches dynamic arch control\n• Banded ankle dorsiflexion mobilisation — loop a resistance band around the ankle and anchor it behind; drive the knee forward over the toes; unlocks talocrural mobility essential for full squat depth',
    common_injuries:
      '• Plantar fasciitis — inflammation at the calcaneal attachment of the plantar fascia; the most common cause of heel pain; morning first-step pain (post-static dyskinesia) is pathognomonic; caused by overuse, tight calves, reduced ankle dorsiflexion, and sudden training load spikes; initial treatment includes calf and plantar fascia stretching, intrinsic foot strengthening, and load management\n• Achilles tendinopathy — mid-portion (2–6 cm proximal to the calcaneal insertion, where blood supply is poorest) or insertional variety; presents as morning stiffness and pain at the start of activity; caused by rapid increases in running or jump volume; the Alfredson eccentric heel-drop protocol (3 × 15 twice daily for 12 weeks) is gold-standard treatment with 90% patient improvement; avoid passive stretching of an acutely inflamed Achilles\n• Lateral ankle sprain — the most common musculoskeletal injury across all sports; the anterior talofibular ligament (ATFL) is injured first and most often; the calcaneofibular ligament (CFL) tears in more severe sprains; mechanism is inversion with plantarflexion; graded I–III by severity; inadequately rehabilitated sprains lead to chronic instability and dramatically increased re-injury risk\n• High ankle sprain (syndesmotic injury) — injury to the distal tibiofibular syndesmosis from external rotation or hyperdorsiflexion; longer recovery than a lateral sprain; requires careful management to prevent chronic ankle instability and mortise widening\n• Metatarsal stress fracture — second metatarsal most common; from repetitive impact without adequate recovery; often missed on initial X-ray (MRI detects bone stress reaction before radiograph changes); managed with a boot and progressive load reduction\n• Morton\'s neuroma — nerve thickening between the 3rd and 4th metatarsal heads; causes sharp burning forefoot pain and a sensation of walking on a pebble; caused by repetitive compression from narrow footwear; managed conservatively with wider shoes, metatarsal padding, and corticosteroid injection\n• Hallux valgus (bunion) — lateral deviation of the great toe with medial prominence of the 1st metatarsal head; driven by footwear, biomechanics, and genetics; can cause secondary Morton\'s neuroma and lesser toe crowding',
    rehab_exercises:
      '• Alfredson eccentric heel-drop protocol (mid-portion Achilles tendinopathy) — stand on step with heel off the back edge; lower heel slowly below step level (eccentric phase), use the uninvolved leg to return to start; 3 × 15 with straight knee (gastrocnemius), 3 × 15 with knee bent 30° (soleus); twice daily, 7 days/week for 12 weeks; 90% of patients show significant improvement in clinical trials\n• Single-leg eccentric calf raises on step (Achilles and plantar fascia) — same eccentric loading principle but bodyweight only; start bilateral, progress to single-leg bodyweight, then add load in a backpack or weight vest\n• Towel scrunches — scrunch a towel toward you using toes only; 3 × 30 s per foot; targets flexor digitorum brevis and plantar lumbricals; key in plantar fasciitis, flat foot, and post-ankle sprain rehabilitation\n• Short foot exercise (intrinsic foot activation) — shorten the foot without curling toes; 3 × 10 reps with 3 s holds; activates plantar intrinsics; improves arch height and proprioception; reduces plantar fascia load\n• Single-leg balance progressions — stand on one leg for time; progress by closing eyes, standing on a foam pad or BOSU, or adding upper body movement; trains peroneal muscle activation and ankle proprioception; dynamic balance deficits are associated with a 48% greater risk of ankle sprain\n• Y-Balance reach exercise — stand on one leg, reach the opposite leg forward, then posteromedial, then posterolateral; tests and trains dynamic ankle stability and hip-knee-ankle coordination\n• Marble pick-up — scatter 15–20 marbles and use toes only to pick them up one at a time and drop them into a bowl; trains fine intrinsic motor control and proprioceptive feedback; excellent post-nerve or post-surgery foot rehabilitation\n• Tibialis anterior raises (seated, toes toward shin against gravity or band resistance, 3 × 15–20) — strengthens the primary dorsiflexor; important in shin splint prevention and correction of foot drop following nerve injury',
  },
  Legs: {
    function_description:
      'The lower limb musculature must generate and absorb enormous forces across three joints. Quadriceps (four muscles): rectus femoris (also a hip flexor — unique among the quads), vastus lateralis, vastus medialis, vastus intermedius; collectively extend the knee; the VMO (vastus medialis oblique) stabilises the patella medially and is critical for knee tracking. Hamstrings (three muscles): biceps femoris long and short heads (lateral), semitendinosus (medial), semimembranosus (medial); primary actions are knee flexion and hip extension; the long head is a two-joint muscle and the most commonly strained at high running speeds. They are also the primary ACL synergists — hamstring strength is the primary ACL protective mechanism. Calves: gastrocnemius (two heads, crosses the knee; powerful plantarflexor, assists knee flexion) and soleus (single joint, high proportion of slow-twitch fibres, active during prolonged low-speed work). Tibialis anterior: dorsiflexion and foot inversion; controls foot slap; the muscle most commonly affected in shin splints. Peroneals: evert the foot; critical for ankle stability and lateral ankle sprain prevention.',
    warmup_and_stretches:
      '• Leg swings forward/lateral (15 per side, progressive arc) — active hip and knee mobility; increases synovial fluid in the joint\n• Walking lunges (10 per side) — dynamic quad and hip flexor stretch combined with glute activation\n• Standing quad stretch (hold 20 s per side) — lengthens the rectus femoris and anterior knee capsule\n• Standing hamstring stretch with hinge (hold 20 s, keep spine neutral) — distal hamstring and gastrocnemius combined stretch\n• Slow calf raises with full stretch at bottom (2 × 15) — activates and warms the gastrocnemius and Achilles tendon\n• Ankle circles and dorsiflexion mobilisation against wall (10 reps per side) — essential before squats; limited dorsiflexion is the primary cause of heel rise in squats\n• Inchworm (10 reps) — integrative hamstring/calf stretch with dynamic transition into push-up position; full posterior chain preparation',
    common_injuries:
      '• ACL (anterior cruciate ligament) tear — occurs during deceleration, pivoting, or landing from a jump with knee in valgus; 3× more common in females due to anatomical and hormonal factors; reconstruction typically uses patellar tendon or hamstring graft; 9–12 month return-to-sport timeline\n• PCL tear — less common; typically from posterior knee trauma (dashboard impact); often managed conservatively\n• Patellar tendinopathy ("jumper\'s knee") — overuse degeneration of the patellar tendon at the inferior pole of the patella; from high eccentric load in jumping athletes; eccentric decline squat protocol is the evidence-backed first-line treatment\n• Hamstring strain (Grade I–III) — most common acute injury in sprinting and kicking sports; Grade I (microscopic tears) to Grade III (complete rupture); proximal free tendon tears near the ischial tuberosity are the most severe\n• Shin splints (medial tibial stress syndrome) — periosteal inflammation along the medial tibia from training load spikes or biomechanical factors; a continuum toward tibial stress fracture; manage with load reduction and gait analysis\n• Achilles tendinopathy — mid-portion (2–6 cm above insertion) or insertional; from excessive running volume; eccentric loading (Alfredson protocol) is gold standard for mid-portion; modified for insertional\n• Plantar fasciitis — inflammation of the plantar fascia origin at the calcaneus; from high impact loading and reduced ankle dorsiflexion; morning pain on first steps is pathognomonic',
    rehab_exercises:
      '• Terminal knee extensions (TKE, band behind knee, 3 × 20) — VMO activation without compressive patellar loading; first exercise in ACL and patellofemoral rehabilitation\n• Nordic hamstring curls (slow 5 s eccentric, 3 × 6–10) — the most evidence-based injury prevention exercise in sport; reduces hamstring strain incidence by ~50% in athletes; requires a spotter or Nordic bench\n• Single-leg eccentric calf raises on step edge (3 × 15, 3 s lowering) — gold-standard Achilles tendinopathy rehabilitation; progress to full bodyweight then loaded\n• Leg press (45°, light to moderate load, 90° knee flexion) — closed kinetic chain quad strengthening with reduced ACL stress compared to open chain extension\n• Wall sit isometric holds (3 × 30–60 s) — pain-free isometric quadriceps loading; reduces pain in patellar tendinopathy and builds foundational quad strength\n• Decline board eccentric squat (30° decline, 3 × 15, slow lowering) — maximises patellar tendon load in the evidence-backed range; standard first-line intervention for patellar tendinopathy\n• Quad sets (supine isometric contraction, 10 s holds × 10) — very early stage rehabilitation; maintains quad activation after injury or surgery without joint motion',
  },
};

// ─── Seg type & RichText ────────────────────────────────────────

type Seg = string | { t: string; url: string };

function RichText({ segs, style }: { segs: Seg[]; style?: object }) {
  return (
    <Text style={style as any}>
      {segs.map((seg, i) =>
        typeof seg === 'string' ? (
          <Text key={i}>{seg}</Text>
        ) : (
          <Text key={i} style={styles.inlineLink} onPress={() => Linking.openURL(seg.url)}>
            {seg.t}
          </Text>
        )
      )}
    </Text>
  );
}

// ─── Rich content (display only) ───────────────────────────────

const RICH_CONTENT: Record<string, Record<keyof Defaults, Seg[]>> = {
  Chest: {
    function_description: [
      'The ',
      { t: 'pectoralis major', url: 'https://en.wikipedia.org/wiki/Pectoralis_major' },
      ' has two heads: the clavicular head (upper chest, active in incline pressing and shoulder flexion) and the sternocostal head (mid/lower chest, dominant in flat and decline pressing). Its primary actions are ',
      { t: 'horizontal adduction', url: 'https://en.wikipedia.org/wiki/Anatomical_terms_of_motion' },
      ', flexion, and internal rotation of the humerus at the ',
      { t: 'glenohumeral joint', url: 'https://en.wikipedia.org/wiki/Glenohumeral_joint' },
      '. The ',
      { t: 'pectoralis minor', url: 'https://en.wikipedia.org/wiki/Pectoralis_minor' },
      ' lies beneath it, originating on the 3rd–5th ribs and inserting on the coracoid process — it protracts and depresses the scapula and assists with forced inhalation. The ',
      { t: 'serratus anterior', url: 'https://en.wikipedia.org/wiki/Serratus_anterior_muscle' },
      ' works in tandem to upwardly rotate the scapula during pressing. All three must be trained and stretched for balanced upper body mechanics.',
    ],
    warmup_and_stretches: [
      '• Arm circles (small → large, 10 each direction) — progressively mobilises the ',
      { t: 'glenohumeral joint', url: 'https://en.wikipedia.org/wiki/Glenohumeral_joint' },
      '\n• Band pull-aparts (15–20 reps, medium tension) — activates posterior shoulder and opens the chest\n• Doorway pec stretch — forearm on frame at 90°, rotate torso away; hold 20–30 s per side; shift arm height to target upper/mid/lower pec fibres\n• Thoracic extension over foam roller (5 segments, 30 s each) — opens the ',
      { t: 'thoracic spine', url: 'https://en.wikipedia.org/wiki/Thoracic_vertebrae' },
      ' to reduce compensatory shoulder impingement\n• Cat-cow thoracic extension (10 slow reps)\n• Light cable fly warm-up sets (2 × 20, very light)',
    ],
    common_injuries: [
      '• ',
      { t: 'Pectoral muscle tear', url: 'https://en.wikipedia.org/wiki/Pectoralis_major_muscle_rupture' },
      ' — most commonly at the musculotendinous junction during heavy bench press; Grade III tears require surgical repair; presents with sudden pain and visible chest deformity\n• ',
      { t: 'Shoulder impingement', url: 'https://en.wikipedia.org/wiki/Shoulder_impingement_syndrome' },
      ' — supraspinatus tendon compressed under the acromion during pressing; worsened by protracted scapula and excessive internal rotation load\n• ',
      { t: 'AC joint', url: 'https://en.wikipedia.org/wiki/Acromioclavicular_joint' },
      ' sprain — irritated by very wide-grip pressing or heavy dips; pain localised to the superior shoulder\n• Proximal bicep tendon strain at sternal attachment\n• Anterior capsule laxity from excessive depth in dips or flyes',
    ],
    rehab_exercises: [
      '• Banded external rotation at 0° — counteracts the internal rotation dominance of heavy chest pressing; 3 × 15 per side\n• Cable face pulls (high pulley, elbows above hands, 3 × 15) — balances the anterior drive of pressing\n• ',
      { t: 'Serratus anterior', url: 'https://en.wikipedia.org/wiki/Serratus_anterior_muscle' },
      ' wall slides — prevents scapular winging and subacromial impingement\n• Light dumbbell flyes on incline (2 × 15, mild stretch, no overshoot) — low-load tissue remodelling\n• Push-up progressions: wall → incline → floor → weighted; eccentric focus (3 s lowering) to stimulate ',
      { t: 'collagen', url: 'https://en.wikipedia.org/wiki/Collagen' },
      ' synthesis in tendons',
    ],
  },
  Shoulders: {
    function_description: [
      'The shoulder is the most mobile joint in the body, requiring precise balance between mobility and stability. The ',
      { t: 'deltoid', url: 'https://en.wikipedia.org/wiki/Deltoid_muscle' },
      ' has three heads: anterior (shoulder flexion, horizontal adduction), lateral (abduction), and posterior (horizontal abduction, external rotation). The ',
      { t: 'rotator cuff', url: 'https://en.wikipedia.org/wiki/Rotator_cuff' },
      ' — supraspinatus, infraspinatus, teres minor, subscapularis ("SITS") — dynamically stabilises the ',
      { t: 'glenohumeral joint', url: 'https://en.wikipedia.org/wiki/Glenohumeral_joint' },
      ' by compressing the humeral head into the glenoid fossa. The rotator cuff must fire before the deltoid during every shoulder movement. The ',
      { t: 'trapezius', url: 'https://en.wikipedia.org/wiki/Trapezius_muscle' },
      ' (upper/mid/lower) manages scapular elevation, retraction, and depression. Scapular upward rotation during overhead work is coordinated by the ',
      { t: 'serratus anterior', url: 'https://en.wikipedia.org/wiki/Serratus_anterior_muscle' },
      ' and lower trapezius — weakness in either causes impingement.',
    ],
    warmup_and_stretches: [
      '• Shoulder pendulum swings (30 s per arm) — gravitational traction decompresses the subacromial space\n• Band pull-aparts (2 × 20, medium tension) — posterior deltoid and ',
      { t: 'external rotator', url: 'https://en.wikipedia.org/wiki/Rotator_cuff' },
      ' activation\n• Cross-body arm stretch (20–30 s per side) — targets the posterior shoulder capsule\n• Prone Y/T/W raises (very light or no weight) — activates lower trap, middle trap, and posterior deltoid in a scapular-stable position\n• Wall angels (10 slow reps) — proprioceptive training for scapular control and ',
      { t: 'thoracic extension', url: 'https://en.wikipedia.org/wiki/Thoracic_vertebrae' },
    ],
    common_injuries: [
      '• ',
      { t: 'Rotator cuff impingement', url: 'https://en.wikipedia.org/wiki/Shoulder_impingement_syndrome' },
      ' — tendon compression in the subacromial space, typically the supraspinatus; from scapular dyskinesis or excessive overhead volume\n• ',
      { t: 'Rotator cuff tear', url: 'https://en.wikipedia.org/wiki/Rotator_cuff_tear' },
      ' (partial or full-thickness) — supraspinatus most common; severe tears require surgical evaluation\n• ',
      { t: 'AC joint sprain', url: 'https://en.wikipedia.org/wiki/Acromioclavicular_joint' },
      ' — from direct impact or fall; graded I–VI\n• Glenohumeral instability or dislocation\n• ',
      { t: 'Bicipital tendinopathy', url: 'https://en.wikipedia.org/wiki/Bicipital_tendinopathy' },
      ' — long head of biceps in its groove; often co-exists with rotator cuff pathology\n• ',
      { t: 'SLAP labral tear', url: 'https://en.wikipedia.org/wiki/SLAP_tear' },
      ' — superior labrum tear; common in overhead athletes',
    ],
    rehab_exercises: [
      '• Sidelying external rotation — isolates infraspinatus and teres minor; 3 × 15 per side with light dumbbell\n• Full can raises (supraspinatus) — arm at 30° in the scapular plane, raise to eye level; 3 × 15\n• Cable face pulls (high pulley, elbows high) — trains posterior deltoid, external rotators, and middle/lower trap\n• Banded shoulder ER/IR at 0° and 90° abduction\n• Scapular retraction and depression holds (5 s isometric, 3 × 12)\n• ',
      { t: 'Sleeper stretch', url: 'https://en.wikipedia.org/wiki/Rotator_cuff' },
      ' — lying on affected shoulder, gently press forearm toward the floor; addresses tight posterior capsule (hold 20–30 s)',
    ],
  },
  Arms: {
    function_description: [
      { t: 'Biceps brachii', url: 'https://en.wikipedia.org/wiki/Biceps' },
      ' (short and long heads): elbow flexion and forearm ',
      { t: 'supination', url: 'https://en.wikipedia.org/wiki/Supination_and_pronation' },
      '; the long head also stabilises the humeral head during shoulder loading. ',
      { t: 'Brachialis', url: 'https://en.wikipedia.org/wiki/Brachialis_muscle' },
      ': the strongest pure elbow flexor regardless of forearm position. ',
      { t: 'Brachioradialis', url: 'https://en.wikipedia.org/wiki/Brachioradialis' },
      ': elbow flexion in neutral (hammer) grip. ',
      { t: 'Triceps brachii', url: 'https://en.wikipedia.org/wiki/Triceps_brachii_muscle' },
      ' (long, medial, lateral heads): the sole elbow extensor; the long head also assists shoulder extension. Forearm flexors (',
      { t: 'flexor carpi radialis', url: 'https://en.wikipedia.org/wiki/Flexor_carpi_radialis_muscle' },
      ', ulnaris, digitorum): wrist flexion and grip. Forearm extensors: wrist extension — commonly overloaded in racquet sports.',
    ],
    warmup_and_stretches: [
      '• Wrist circles (10 each direction per wrist)\n• Forearm flexor stretch — arm straight, palm up, pull fingers back; hold 20–30 s; targets tendons at the ',
      { t: 'medial epicondyle', url: 'https://en.wikipedia.org/wiki/Medial_epicondyle_of_the_humerus' },
      '\n• Forearm extensor stretch — arm straight, palm down, press fingers toward floor; hold 20–30 s; targets tendons at the ',
      { t: 'lateral epicondyle', url: 'https://en.wikipedia.org/wiki/Lateral_epicondyle_of_the_humerus' },
      '\n• Overhead tricep stretch (elbow behind head, gentle pressure down) — stretches the long head; hold 20 s per side\n• Light band curls (2 × 15) and pushdowns (2 × 15) — activates both flexors and extensors',
    ],
    common_injuries: [
      '• ',
      { t: 'Distal bicep tendon rupture', url: 'https://en.wikipedia.org/wiki/Biceps_tendon_rupture' },
      ' — tear at the elbow during eccentric overload; presents with "pop," bruising, and "Popeye" deformity; requires surgical repair\n• ',
      { t: 'Medial epicondylitis', url: 'https://en.wikipedia.org/wiki/Medial_epicondylitis' },
      ' ("golfer\'s elbow") — overuse tendinopathy of the common flexor tendon; responds well to eccentric rehabilitation\n• ',
      { t: 'Lateral epicondylitis', url: 'https://en.wikipedia.org/wiki/Lateral_epicondylitis' },
      ' ("tennis elbow") — overuse tendinopathy of the common extensor tendon; eccentric exercises are first-line treatment\n• Tricep tendon strain at the ',
      { t: 'olecranon', url: 'https://en.wikipedia.org/wiki/Olecranon' },
      ' insertion — from heavy close-grip pressing\n• ',
      { t: 'Cubital tunnel syndrome', url: 'https://en.wikipedia.org/wiki/Cubital_tunnel_syndrome' },
      ' — ulnar nerve compression at the medial elbow; causes ring and little finger numbness',
    ],
    rehab_exercises: [
      '• Eccentric wrist curls over edge of bench (golfer\'s elbow) — 3 × 15 per side, 3–5 s lowering; stimulates ',
      { t: 'collagen', url: 'https://en.wikipedia.org/wiki/Collagen' },
      ' synthesis in the flexor tendon\n• Eccentric wrist extensions over edge of bench (tennis elbow) — same protocol; most evidence-supported treatment for lateral epicondylitis\n• Forearm supination/pronation with light dumbbell — restores radioulnar mobility\n• Isometric bicep holds at 90° (5 × 30 s) — reduces pain during acute tendinopathy\n• Band tricep pushdowns (light, slow 3 s eccentric)\n• Tyler Twist / reverse Tyler Twist (FlexBar exercises) — strong clinical evidence for both ',
      { t: 'medial', url: 'https://en.wikipedia.org/wiki/Medial_epicondylitis' },
      ' and ',
      { t: 'lateral epicondylitis', url: 'https://en.wikipedia.org/wiki/Lateral_epicondylitis' },
    ],
  },
  Core: {
    function_description: [
      'The core is a cylindrical pressure system. ',
      { t: 'Rectus abdominis', url: 'https://en.wikipedia.org/wiki/Rectus_abdominis_muscle' },
      ': anterior spinal flexion; resists hyperextension. Internal/external obliques: rotation and lateral flexion. ',
      { t: 'Transverse abdominis', url: 'https://en.wikipedia.org/wiki/Transverse_abdominal_muscle' },
      ' (TVA): the deepest layer — wraps like a corset and dramatically increases ',
      { t: 'intra-abdominal pressure', url: 'https://en.wikipedia.org/wiki/Intra-abdominal_pressure' },
      ' (IAP) during the Valsalva manoeuvre, stiffening the lumbar spine under heavy loads. ',
      { t: 'Erector spinae', url: 'https://en.wikipedia.org/wiki/Erector_spinae_muscles' },
      ': spinal extension and anti-flexion under load. ',
      { t: 'Multifidus', url: 'https://en.wikipedia.org/wiki/Multifidus_muscle' },
      ': deep spinal stabilisers at each vertebral level — first muscle inhibited after lumbar injury and must be deliberately retrained. ',
      { t: 'Quadratus lumborum', url: 'https://en.wikipedia.org/wiki/Quadratus_lumborum_muscle' },
      ' (QL): lateral flexion and 12th rib stabilisation.',
    ],
    warmup_and_stretches: [
      '• Diaphragmatic breathing in 90-90 position (5 breaths, 5 s exhale) — establishes TVA engagement before loading\n• Cat-cow (10 slow reps, full thoracic and lumbar range) — segmental spinal mobility\n• Dead bug (5–8 reps per side, lumbar flat to floor) — activates TVA and multi-joint coordination\n• Child\'s pose with lateral reach (30 s per side) — stretches ',
      { t: 'quadratus lumborum', url: 'https://en.wikipedia.org/wiki/Quadratus_lumborum_muscle' },
      '\n• Prone cobra (3 × 10 s holds) — activates lumbar extensors in a safe position\n• Standing hip flexor stretch with posterior pelvic tilt — addresses anterior pelvic tilt that increases lumbar extension stress',
    ],
    common_injuries: [
      '• Lumbar muscle strain (erectors/QL overload) — most common acute gym injury; managed with active rest and graded loading\n• ',
      { t: 'Lumbar disc herniation', url: 'https://en.wikipedia.org/wiki/Spinal_disc_herniation' },
      ' — L4–L5 and L5–S1 most common; may compress nerve roots causing radicular pain; McKenzie extension can centralise symptoms\n• ',
      { t: 'Sports hernia', url: 'https://en.wikipedia.org/wiki/Athletic_pubalgia' },
      ' (athletic pubalgia) — inguinal canal floor weakness from explosive cutting or kicking\n• ',
      { t: 'SI joint dysfunction', url: 'https://en.wikipedia.org/wiki/Sacroiliac_joint_dysfunction' },
      ' — pain at the posterior pelvis; responds to targeted gluteal and pelvic stability work\n• ',
      { t: 'Spondylolisthesis', url: 'https://en.wikipedia.org/wiki/Spondylolisthesis' },
      ' — anterior vertebral slippage at L5–S1; worsened by extension-heavy exercises',
    ],
    rehab_exercises: [
      '• McGill Big Three (Professor ',
      { t: 'Stuart McGill', url: 'https://en.wikipedia.org/wiki/Stuart_McGill' },
      ', spinal biomechanist): (1) Modified curl-up — no spinal flexion, preserves lumbar discs; (2) Side plank — anti-lateral-flexion endurance; (3) Bird dog — posterior chain activation with neutral spine\n• Pallof press (cable or band) — ',
      { t: 'anti-rotation', url: 'https://en.wikipedia.org/wiki/Core_(anatomy)' },
      ' core stiffness; 3 × 10 per side with 2 s pause\n• Dead bug progressions — supine TVA activation with alternating limb extension\n• Suitcase carry (unilateral loaded carry) — anti-lateral-flexion functional strength; 20 m per side\n• 90-90 breathing with TVA bracing — restores diaphragm/TVA coordination post-injury',
    ],
  },
  Hips: {
    function_description: [
      { t: 'Hip adductors', url: 'https://en.wikipedia.org/wiki/Hip_adductors' },
      ' (adductor longus, brevis, magnus, gracilis, pectineus): medial thigh — adduct the leg toward the midline, stabilise the knee during single-leg loading; adductor magnus also assists hip extension. Hip flexors: the ',
      { t: 'iliopsoas', url: 'https://en.wikipedia.org/wiki/Iliopsoas' },
      ' (iliacus + psoas major) is the primary hip flexor in gait; psoas major also compresses lumbar vertebrae and contributes to lumbar stability. ',
      { t: 'Rectus femoris', url: 'https://en.wikipedia.org/wiki/Rectus_femoris_muscle' },
      ' also flexes the hip and limits hip mobility when tight. Hip abductors: ',
      { t: 'gluteus medius', url: 'https://en.wikipedia.org/wiki/Gluteus_medius_muscle' },
      ' is the primary pelvic stabiliser during single-leg stance — weakness causes the ',
      { t: 'Trendelenburg sign', url: 'https://en.wikipedia.org/wiki/Trendelenburg_gait' },
      ' and knee valgus. ',
      { t: 'Tensor fasciae latae', url: 'https://en.wikipedia.org/wiki/Tensor_fasciae_latae_muscle' },
      ' (TFL): abduction and internal rotation; feeds into the ',
      { t: 'iliotibial band', url: 'https://en.wikipedia.org/wiki/Iliotibial_band' },
      '.',
    ],
    warmup_and_stretches: [
      '• Hip circles on all fours (10 per side, large arc) — circumduction of the femoral head through the acetabulum\n• Half-kneeling hip flexor stretch — knee down, squeeze rear glute, shift forward; hold 30 s per side; posterior pelvic tilt increases stretch on the ',
      { t: 'psoas', url: 'https://en.wikipedia.org/wiki/Psoas_major_muscle' },
      '\n• Wide-stance squat hold with thoracic rotation (30 s) — combined adductor and thoracic stretch\n• 90/90 hip stretch on floor (45–60 s per side) — targets both internal and external hip rotation\n• Cossack squats (10 slow reps) — dynamic adductor and hip flexor mobility through full range',
    ],
    common_injuries: [
      '• Adductor / groin strain — acute tear from explosive sprinting or lateral movement; graded I–III; return guided by strength symmetry\n• ',
      { t: 'Iliopsoas', url: 'https://en.wikipedia.org/wiki/Iliopsoas' },
      ' tendinopathy or hip flexor strain — from excessive sprinting or loaded hip flexion\n• ',
      { t: 'Femoroacetabular impingement', url: 'https://en.wikipedia.org/wiki/Femoroacetabular_impingement' },
      ' (FAI) — cam or pincer bony morphology causing impingement in deep hip flexion; common in lifters who squat deep\n• ',
      { t: 'Hip labral tear', url: 'https://en.wikipedia.org/wiki/Hip_labral_tear' },
      ' — cartilaginous rim tear; presents as clicking and deep groin pain; diagnosed by MRI arthrogram\n• ',
      { t: 'IT band syndrome', url: 'https://en.wikipedia.org/wiki/Iliotibial_band_syndrome' },
      ' — ITB friction over the lateral femoral condyle; common in runners with hip abductor weakness\n• ',
      { t: 'Piriformis syndrome', url: 'https://en.wikipedia.org/wiki/Piriformis_syndrome' },
      ' — hypertonic piriformis compresses the sciatic nerve near the sciatic notch',
    ],
    rehab_exercises: [
      '• Clamshells (banded, 3 × 20 per side) — targets gluteus medius with minimal lumbar involvement\n• Side-lying hip abduction with 3 s eccentric\n• ',
      { t: 'Copenhagen adductor plank', url: 'https://en.wikipedia.org/wiki/Copenhagen_exercise' },
      ' — evidence-based eccentric adductor loading; strongest groin injury prevention exercise in sports medicine; progress from short-lever to full long-lever\n• Banded hip flexion marching in standing — targets ',
      { t: 'iliopsoas', url: 'https://en.wikipedia.org/wiki/Iliopsoas' },
      ' through functional range\n• Single-leg balance progressions — proprioception and pelvic stability\n• Hip 90/90 mobility transitions — improves joint centration between internal and external rotation',
    ],
  },
  Back: {
    function_description: [
      { t: 'Latissimus dorsi', url: 'https://en.wikipedia.org/wiki/Latissimus_dorsi_muscle' },
      ': originates from the thoracolumbar fascia, posterior iliac crest, and lower thoracic vertebrae; inserts on the intertubercular groove of the humerus; primary actions are shoulder adduction, extension, and internal rotation — the primary pulling muscle in rows and pull-ups. ',
      { t: 'Rhomboids', url: 'https://en.wikipedia.org/wiki/Rhomboid_muscles' },
      ': retract the scapula; often inhibited in those with rounded posture. ',
      { t: 'Trapezius', url: 'https://en.wikipedia.org/wiki/Trapezius_muscle' },
      ' (upper/mid/lower): scapular elevation, retraction, depression, and upward rotation. ',
      { t: 'Erector spinae', url: 'https://en.wikipedia.org/wiki/Erector_spinae_muscles' },
      ': bilateral columns extending the spine. ',
      { t: 'Multifidus', url: 'https://en.wikipedia.org/wiki/Multifidus_muscle' },
      ': intersegmental spinal control — first inhibited after injury. ',
      { t: 'Quadratus lumborum', url: 'https://en.wikipedia.org/wiki/Quadratus_lumborum_muscle' },
      ' (QL): lateral stabiliser; the most common source of acute "back spasm."',
    ],
    warmup_and_stretches: [
      '• Cat-cow (10 slow reps, full thoracic and lumbar range)\n• Child\'s pose with arm reach (30 s per side) — combined lat and QL stretch\n• Thread-the-needle thoracic rotation (8 reps per side) — rotational mobilisation of the ',
      { t: 'thoracic spine', url: 'https://en.wikipedia.org/wiki/Thoracic_vertebrae' },
      '\n• Hanging lat stretch from bar (3 × 20 s) — spinal decompression under bodyweight\n• Band pull-aparts (2 × 20) — middle and lower trap, rhomboids\n• Prone cobra (3 × 8 s holds) — activates lumbar extensors and lower trap',
    ],
    common_injuries: [
      '• Lumbar muscle strain (erectors, QL) — most common gym injury; managed with active rest and graded return\n• ',
      { t: 'Lumbar disc herniation', url: 'https://en.wikipedia.org/wiki/Spinal_disc_herniation' },
      ' — L4–L5 and L5–S1; can compress nerve roots causing ',
      { t: 'radiculopathy', url: 'https://en.wikipedia.org/wiki/Radiculopathy' },
      '; most resolve conservatively within 3–6 months\n• ',
      { t: 'Spondylolisthesis', url: 'https://en.wikipedia.org/wiki/Spondylolisthesis' },
      ' — anterior vertebral slippage at L5–S1; worsened by hyperextension\n• Lat or rhomboid strain from excessive pull volume\n• ',
      { t: 'Sciatica', url: 'https://en.wikipedia.org/wiki/Sciatica' },
      ' — sciatic nerve compression, usually from L4/L5/S1 disc or ',
      { t: 'piriformis syndrome', url: 'https://en.wikipedia.org/wiki/Piriformis_syndrome' },
    ],
    rehab_exercises: [
      '• McGill bird dog (3 × 8 per side, 8 s holds) — gold standard for ',
      { t: 'multifidus', url: 'https://en.wikipedia.org/wiki/Multifidus_muscle' },
      ' and erector rehabilitation; trains precise spinal control without compression\n• Prone Y/T/W/I raises — comprehensive lower and middle trapezius strengthening\n• Chest-supported dumbbell row (light, neutral spine, 3 × 12)\n• Half-kneeling cable pulldown — vertical pulling without lumbar extension compensation\n• Jefferson curl (very light, slow controlled ',
      { t: 'spinal flexion', url: 'https://en.wikipedia.org/wiki/Spinal_disc_herniation' },
      ' loading) — evidence-informed posterior chain resilience for healthy athletes\n• Back extension isometric holds — restores posterior chain strength without disc compression',
    ],
  },
  Glutes: {
    function_description: [
      { t: 'Gluteus maximus', url: 'https://en.wikipedia.org/wiki/Gluteus_maximus_muscle' },
      ': the largest muscle in the body; originates on the posterior ilium, sacrum, and coccyx; inserts on the gluteal tuberosity and ',
      { t: 'iliotibial band', url: 'https://en.wikipedia.org/wiki/Iliotibial_band' },
      '; powers hip extension and external rotation — the foundation of sprinting, jumping, and heavy lifting. ',
      { t: 'Gluteus medius', url: 'https://en.wikipedia.org/wiki/Gluteus_medius_muscle' },
      ': primary hip abductor and the key pelvic stabiliser during single-leg stance — prevents the ',
      { t: 'Trendelenburg gait', url: 'https://en.wikipedia.org/wiki/Trendelenburg_gait' },
      ' (pelvis drop on the unsupported side); weakness causes knee valgus during squats and running — a major ',
      { t: 'ACL injury', url: 'https://en.wikipedia.org/wiki/Anterior_cruciate_ligament_injury' },
      ' risk factor in female athletes. ',
      { t: 'Gluteus minimus', url: 'https://en.wikipedia.org/wiki/Gluteus_minimus_muscle' },
      ': assists abduction and medial rotation.',
    ],
    warmup_and_stretches: [
      '• Bodyweight glute bridge with 2 s pause at top (2 × 15) — neurological activation before loading\n• Pigeon pose on floor (30–60 s per side) — stretches the ',
      { t: 'piriformis', url: 'https://en.wikipedia.org/wiki/Piriformis_muscle' },
      ' and external rotators\n• Fire hydrants with mini band (2 × 15 per side) — activates gluteus medius in hip abduction\n• Lateral band walks (2 × 15 per direction) — primes hip abductors and external rotators before squats and lunges\n• Clamshells (banded, 2 × 20) — isolates gluteus medius for targeted activation',
    ],
    common_injuries: [
      '• ',
      { t: 'Proximal hamstring tendinopathy', url: 'https://en.wikipedia.org/wiki/Hamstring' },
      ' — overuse at the ischial tuberosity; worsened by running uphill and prolonged sitting; managed with tendon loading protocols\n• ',
      { t: 'Piriformis syndrome', url: 'https://en.wikipedia.org/wiki/Piriformis_syndrome' },
      ' — sciatic nerve compression; differentiated from disc sciatica by the FAIR test\n• ',
      { t: 'Gluteal tendinopathy', url: 'https://en.wikipedia.org/wiki/Gluteal_tendinopathy' },
      ' — gluteus medius/minimus tendon irritation at the ',
      { t: 'greater trochanter', url: 'https://en.wikipedia.org/wiki/Greater_trochanter' },
      '; worse with prolonged sitting and leg crossing; avoid compressive stretches in early rehab\n• ',
      { t: 'SI joint', url: 'https://en.wikipedia.org/wiki/Sacroiliac_joint_dysfunction' },
      ' dysfunction — poor load transfer; targeted glute strengthening improves SI stability',
    ],
    rehab_exercises: [
      '• Clamshells (unresisted → banded → cable progressions) — isolated gluteus medius from pain-free range\n• Glute bridge to ',
      { t: 'single-leg hip thrust', url: 'https://en.wikipedia.org/wiki/Hip_thrust' },
      ' progressions — maximum EMG-validated exercise for glute hypertrophy; load progressively\n• Side-lying hip abduction (controlled 3 s lowering) — pure gluteus medius strengthening\n• Isometric hip abduction wall press (5 × 30 s) — first-line treatment for ',
      { t: 'gluteal tendinopathy', url: 'https://en.wikipedia.org/wiki/Gluteal_tendinopathy' },
      ' before eccentric loading\n• Step-ups (low box, 3 s controlled descent) — functional single-leg gluteal loading',
    ],
  },
  Legs: {
    function_description: [
      { t: 'Quadriceps', url: 'https://en.wikipedia.org/wiki/Quadriceps_femoris_muscle' },
      ' (rectus femoris, vastus medialis, lateralis, intermedius): extend the knee; rectus femoris is a two-joint muscle that also flexes the hip. The VMO (vastus medialis oblique) stabilises the patella medially — critical for ',
      { t: 'patellar tracking', url: 'https://en.wikipedia.org/wiki/Patellar_tracking_disorder' },
      '. ',
      { t: 'Hamstrings', url: 'https://en.wikipedia.org/wiki/Hamstring' },
      ' (biceps femoris, semitendinosus, semimembranosus): knee flexion and hip extension; the primary ',
      { t: 'ACL synergists', url: 'https://en.wikipedia.org/wiki/Anterior_cruciate_ligament_injury' },
      ' — hamstring strength is the primary ACL protective mechanism. Calves: ',
      { t: 'gastrocnemius', url: 'https://en.wikipedia.org/wiki/Gastrocnemius_muscle' },
      ' (crosses the knee; powerful plantarflexor) and ',
      { t: 'soleus', url: 'https://en.wikipedia.org/wiki/Soleus_muscle' },
      ' (single-joint, slow-twitch dominant, active during prolonged low-speed work). ',
      { t: 'Tibialis anterior', url: 'https://en.wikipedia.org/wiki/Tibialis_anterior_muscle' },
      ': dorsiflexion; most affected in ',
      { t: 'shin splints', url: 'https://en.wikipedia.org/wiki/Medial_tibial_stress_syndrome' },
      '.',
    ],
    warmup_and_stretches: [
      '• Leg swings forward/lateral (15 per side, progressive arc) — active hip and knee mobility\n• Walking lunges (10 per side) — dynamic quad and hip flexor stretch with glute activation\n• Ankle circles and dorsiflexion mobilisation against wall (10 reps per side) — essential before squats; limited ',
      { t: 'dorsiflexion', url: 'https://en.wikipedia.org/wiki/Anatomical_terms_of_motion' },
      ' is the primary cause of heel rise\n• Slow calf raises with full stretch at bottom (2 × 15) — warms the ',
      { t: 'Achilles tendon', url: 'https://en.wikipedia.org/wiki/Achilles_tendon' },
      '\n• Inchworm (10 reps) — full posterior chain preparation from hamstrings to calves',
    ],
    common_injuries: [
      '• ',
      { t: 'ACL tear', url: 'https://en.wikipedia.org/wiki/Anterior_cruciate_ligament_injury' },
      ' — occurs during deceleration, pivoting, or valgus landing; 3× more common in females; reconstruction takes 9–12 months return-to-sport\n• ',
      { t: 'Patellar tendinopathy', url: 'https://en.wikipedia.org/wiki/Patellar_tendinopathy' },
      ' ("jumper\'s knee") — overuse degeneration at the inferior patellar pole; ',
      { t: 'eccentric decline squat', url: 'https://en.wikipedia.org/wiki/Patellar_tendinopathy' },
      ' protocol is evidence-backed first-line treatment\n• ',
      { t: 'Hamstring strain', url: 'https://en.wikipedia.org/wiki/Hamstring#Injuries' },
      ' (Grade I–III) — most common acute injury in sprinting; proximal free tendon tears are most severe\n• ',
      { t: 'Medial tibial stress syndrome', url: 'https://en.wikipedia.org/wiki/Medial_tibial_stress_syndrome' },
      ' (shin splints) — a continuum toward stress fracture; manage with load reduction and gait analysis\n• ',
      { t: 'Achilles tendinopathy', url: 'https://en.wikipedia.org/wiki/Achilles_tendinopathy' },
      ' — mid-portion or insertional; ',
      { t: 'Alfredson eccentric heel drop protocol', url: 'https://en.wikipedia.org/wiki/Achilles_tendinopathy' },
      ' is gold standard for mid-portion\n• ',
      { t: 'Plantar fasciitis', url: 'https://en.wikipedia.org/wiki/Plantar_fasciitis' },
      ' — calcaneal insertion inflammation; morning first-step pain is pathognomonic',
    ],
    rehab_exercises: [
      '• Terminal knee extensions (TKE, band behind knee, 3 × 20) — VMO activation; first exercise in ',
      { t: 'ACL', url: 'https://en.wikipedia.org/wiki/Anterior_cruciate_ligament_injury' },
      ' and patellofemoral rehabilitation\n• ',
      { t: 'Nordic hamstring curls', url: 'https://en.wikipedia.org/wiki/Nordic_hamstring_exercise' },
      ' (slow 5 s eccentric, 3 × 6–10) — reduces hamstring strain incidence by ~50% in athletes; the most evidence-based injury prevention exercise in sport\n• Single-leg eccentric calf raises on step edge (3 × 15, 3 s lowering) — gold-standard ',
      { t: 'Achilles tendinopathy', url: 'https://en.wikipedia.org/wiki/Achilles_tendinopathy' },
      ' rehabilitation\n• Decline board eccentric squat (30°, 3 × 15, slow lowering) — maximises patellar tendon load in the evidence-backed range\n• Leg press (45°, moderate load, 90° flexion) — closed kinetic chain quad strengthening with reduced ACL stress vs. open chain\n• Wall sit isometric holds (3 × 30–60 s) — pain-free quadriceps loading for patellar tendinopathy',
    ],
  },
  Hands: {
    function_description: [
      'The hand and wrist form the body\'s most dexterous joint complex — 27 bones with over 30 muscles coordinated by the median, ulnar, and radial nerves. Intrinsic muscles: ',
      { t: 'thenar group', url: 'https://en.wikipedia.org/wiki/Thenar_eminence' },
      ' (abductor pollicis brevis, flexor pollicis brevis, opponens pollicis — thumb eminence); ',
      { t: 'hypothenar group', url: 'https://en.wikipedia.org/wiki/Hypothenar_eminence' },
      ' (abductor, flexor, and opponens digiti minimi — little finger eminence); ',
      { t: 'lumbricals', url: 'https://en.wikipedia.org/wiki/Lumbricals_of_the_hand' },
      ' (four muscles connecting ',
      { t: 'flexor digitorum profundus', url: 'https://en.wikipedia.org/wiki/Flexor_digitorum_profundus_muscle' },
      ' tendons to the extensor apparatus — uniquely flex the MCP joints while extending the IP joints); and ',
      { t: 'interossei', url: 'https://en.wikipedia.org/wiki/Interossei_of_the_hand' },
      ' (4 dorsal abduct fingers, 3 palmar adduct — all deep ulnar nerve). Extrinsic forearm muscles provide grip force: ',
      { t: 'flexor digitorum superficialis', url: 'https://en.wikipedia.org/wiki/Flexor_digitorum_superficialis_muscle' },
      ' (flexes PIP joints), flexor digitorum profundus (DIP joints), ',
      { t: 'flexor carpi radialis', url: 'https://en.wikipedia.org/wiki/Flexor_carpi_radialis_muscle' },
      ' and ulnaris (wrist flexion), extensor digitorum, and ',
      { t: 'extensor carpi radialis', url: 'https://en.wikipedia.org/wiki/Extensor_carpi_radialis_longus_muscle' },
      ' longus/brevis plus extensor carpi ulnaris (wrist extension). The wrist joint complex: the ',
      { t: 'radiocarpal joint', url: 'https://en.wikipedia.org/wiki/Wrist' },
      ' (distal radius + proximal carpal row — primary wrist articulation), midcarpal joint, and ',
      { t: 'distal radioulnar joint', url: 'https://en.wikipedia.org/wiki/Distal_radioulnar_articulation' },
      ' (governing forearm pronation/supination). Grip strength is one of the strongest epidemiological predictors of all-cause mortality.',
    ],
    warmup_and_stretches: [
      '• Wrist circles (10 per direction per wrist) — mobilises the ',
      { t: 'radiocarpal', url: 'https://en.wikipedia.org/wiki/Wrist' },
      ' and midcarpal joints; distributes synovial fluid before loading\n• Prayer stretch — palms pressed together at chest, slowly lower toward waist; stretches wrist flexors and the ',
      { t: 'flexor retinaculum', url: 'https://en.wikipedia.org/wiki/Flexor_retinaculum_of_the_hand' },
      '; hold 20–30 s\n• Reverse prayer stretch — backs of hands pressed together behind the back, gently lift away from spine; targets wrist extensors and dorsal joint capsule; hold 20–30 s\n• Forearm flexor stretch — arm extended, palm up, pull fingers back; hold 20–30 s; targets ',
      { t: 'flexor carpi tendons', url: 'https://en.wikipedia.org/wiki/Flexor_carpi_radialis_muscle' },
      ' at the medial epicondyle\n• Forearm extensor stretch — arm extended, palm down, press back of hand toward floor; hold 20–30 s; targets extensor carpi tendons at the lateral epicondyle\n• Loaded wrist stretch in quadruped — hands flat on floor, lean forward to load the wrists in extension; rotate hands sideways and backward for full capsule coverage; essential before push-ups, planche, or handstand work\n• Finger extension spreads (10 slow reps) — spread fingers wide then close; activates the ',
      { t: 'dorsal interossei', url: 'https://en.wikipedia.org/wiki/Interossei_of_the_hand' },
      ' and counteracts the flexor dominance built up from daily gripping',
    ],
    common_injuries: [
      '• ',
      { t: 'Carpal tunnel syndrome', url: 'https://en.wikipedia.org/wiki/Carpal_tunnel_syndrome' },
      ' — median nerve compressed under the ',
      { t: 'flexor retinaculum', url: 'https://en.wikipedia.org/wiki/Flexor_retinaculum_of_the_hand' },
      '; causes numbness in the thumb, index, middle, and radial ring finger; worsened by prolonged wrist flexion and repetitive gripping; managed with night splinting and nerve glides\n• ',
      { t: 'De Quervain\'s tenosynovitis', url: 'https://en.wikipedia.org/wiki/De_Quervain_syndrome' },
      ' — inflammation of the abductor pollicis longus and extensor pollicis brevis tendons on the radial side of the wrist; positive Finkelstein test; common in athletes with repetitive thumb loading\n• ',
      { t: 'TFCC tear', url: 'https://en.wikipedia.org/wiki/Triangular_fibrocartilage' },
      ' (triangular fibrocartilage complex) — the cartilage complex on the ulnar side of the wrist; injury causes ulnar-sided wrist pain, clicking, and instability; mechanism is FOOSH or repetitive forearm rotation\n• ',
      { t: 'Scaphoid fracture', url: 'https://en.wikipedia.org/wiki/Scaphoid_fracture' },
      ' — most common carpal bone fracture; often missed on initial X-ray; proximal pole has poor vascular supply and is at high risk of ',
      { t: 'avascular necrosis', url: 'https://en.wikipedia.org/wiki/Avascular_necrosis' },
      ' if not immobilised promptly\n• A2 pulley injury — the ',
      { t: 'A2 annular pulley', url: 'https://en.wikipedia.org/wiki/Annular_pulley' },
      ' on the proximal phalanx is the most load-bearing in the finger sheath; rupture causes bowstringing; most common in rock climbers during crimping; graded I–IV\n• ',
      { t: 'Dorsal wrist impingement', url: 'https://en.wikipedia.org/wiki/Wrist' },
      ' — synovial tissue pinched at end-range wrist extension; common in gymnasts, weightlifters, and Olympic lifters',
    ],
    rehab_exercises: [
      '• Rice bucket exercises — hand submerged in dry rice performing finger flexion, extension, abduction, and adduction; rebuilds ',
      { t: 'intrinsic hand muscles', url: 'https://en.wikipedia.org/wiki/Intrinsic_muscles_of_the_hand' },
      ' and the often-neglected finger extensors; 3 sets of 2–3 minutes\n• Finger extension band exercises — rubber band looped around all fingers, spread against resistance; counteracts flexor dominance from lifting and climbing; 3 × 20 reps\n• Eccentric wrist curls over bench edge (palm up, 3 × 12–15, 3–5 s lowering) — loads ',
      { t: 'flexor tendons', url: 'https://en.wikipedia.org/wiki/Flexor_digitorum_superficialis_muscle' },
      ' eccentrically; stimulates ',
      { t: 'collagen', url: 'https://en.wikipedia.org/wiki/Collagen' },
      ' synthesis; first-line rehabilitation for wrist flexor tendinopathy\n• Eccentric wrist extensions over bench edge (palm down, same protocol) — first-line treatment for wrist extensor tendinopathy\n• Tyler Twist and Reverse Tyler Twist (FlexBar) — eccentric loading of wrist extensors and flexors using a flexible rubber bar; ',
      { t: 'clinical trials', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2971639/' },
      ' show 81% pain reduction vs standard physiotherapy for lateral epicondylitis\n• Dead hangs from pull-up bar (3 × 20–45 s, passive hang) — decompresses wrist and finger joints; builds grip endurance; essential recovery tool for climbers and gymnasts\n• Putty gripping progressions — isometric squeezes to dynamic pinching; rebuilds fine motor control and intrinsic hand strength post-fracture or nerve injury\n• Wrist roller — forward and backward rolls with progressive load; full ROM strengthening of both wrist flexors and extensors',
    ],
  },
  Feet: {
    function_description: [
      'The foot and ankle form the body\'s primary interface with the ground — 26 bones, 33 joints, and over 100 muscles, tendons, and ligaments. Intrinsic foot muscles occupy four plantar layers: the first (superficial) contains ',
      { t: 'abductor hallucis', url: 'https://en.wikipedia.org/wiki/Abductor_hallucis_muscle' },
      ' (medial border; abducts and flexes the great toe), ',
      { t: 'flexor digitorum brevis', url: 'https://en.wikipedia.org/wiki/Flexor_digitorum_brevis_muscle' },
      ' (central sole; flexes the lateral four toes), and abductor digiti minimi (lateral border). Deeper layers include the quadratus plantae, lumbricals, adductor hallucis, and interossei — stabilising the metatarsal arch and providing critical ',
      { t: 'proprioceptive', url: 'https://en.wikipedia.org/wiki/Proprioception' },
      ' feedback. Extrinsic muscles: ',
      { t: 'tibialis anterior', url: 'https://en.wikipedia.org/wiki/Tibialis_anterior_muscle' },
      ' (strongest dorsiflexor; also inverts the foot); ',
      { t: 'gastrocnemius', url: 'https://en.wikipedia.org/wiki/Gastrocnemius_muscle' },
      ' and ',
      { t: 'soleus', url: 'https://en.wikipedia.org/wiki/Soleus_muscle' },
      ' (joined at the ',
      { t: 'Achilles tendon', url: 'https://en.wikipedia.org/wiki/Achilles_tendon' },
      ' — the largest tendon in the body; gastrocnemius dominant with knee extended, soleus with knee flexed); ',
      { t: 'tibialis posterior', url: 'https://en.wikipedia.org/wiki/Tibialis_posterior_muscle' },
      ' (primary inverter; dynamic support of the medial longitudinal arch — weakness causes progressive flat foot); and the ',
      { t: 'fibularis (peroneal) muscles', url: 'https://en.wikipedia.org/wiki/Fibularis_longus' },
      ' (primary dynamic stabilisers of the lateral ankle). The ankle complex: ',
      { t: 'talocrural joint', url: 'https://en.wikipedia.org/wiki/Ankle' },
      ' (dorsiflexion/plantarflexion), ',
      { t: 'subtalar joint', url: 'https://en.wikipedia.org/wiki/Subtalar_joint' },
      ' (inversion/eversion), and ',
      { t: 'Lisfranc joint', url: 'https://en.wikipedia.org/wiki/Lisfranc_injury' },
      ' (midfoot keystone; disruption causes significant disability). The ',
      { t: 'plantar fascia', url: 'https://en.wikipedia.org/wiki/Plantar_fascia' },
      ' spans from the calcaneus to the metatarsal heads — it maintains the medial arch and functions as a tension spring during walking and running.',
    ],
    warmup_and_stretches: [
      '• Ankle circles (10 per direction per ankle) — mobilises the ',
      { t: 'talocrural', url: 'https://en.wikipedia.org/wiki/Ankle' },
      ' and subtalar joints; distributes synovial fluid\n• Ankle alphabet — trace capital letters with the big toe using only foot movement; covers all ankle planes in coordinated patterns; 1–2 alphabets per foot\n• Plantar fascia stretch — seated, cross foot over knee, pull toes toward shin; hold 20–30 s; especially important as a morning first-stretch for ',
      { t: 'plantar fasciitis', url: 'https://en.wikipedia.org/wiki/Plantar_fasciitis' },
      '\n• Gastrocnemius stretch — hands on wall, rear leg straight; hold 30 s; knee must be straight to fully stretch the two-joint ',
      { t: 'gastrocnemius', url: 'https://en.wikipedia.org/wiki/Gastrocnemius_muscle' },
      '\n• Soleus stretch — same position with rear knee bent 20–30°; ',
      { t: 'soleus', url: 'https://en.wikipedia.org/wiki/Soleus_muscle' },
      ' is now fully stretched; critical for dorsiflexion mobility and squat depth; hold 30 s\n• Towel toe scrunches (activation) — scrunch towel toward you using only toes for 20–30 s; activates the ',
      { t: 'plantar intrinsic muscles', url: 'https://en.wikipedia.org/wiki/Intrinsic_muscles_of_the_foot' },
      ' before loading\n• Short foot exercise — shorten the foot by pulling ball of foot toward heel without curling toes; hold 3 s; 10 reps; activates intrinsics and teaches dynamic ',
      { t: 'arch', url: 'https://en.wikipedia.org/wiki/Arches_of_the_foot' },
      ' control\n• Banded ankle dorsiflexion mobilisation — drive knee forward over toes against anchored band; unlocks talocrural mobility essential for full squat depth',
    ],
    common_injuries: [
      '• ',
      { t: 'Plantar fasciitis', url: 'https://en.wikipedia.org/wiki/Plantar_fasciitis' },
      ' — inflammation at the calcaneal attachment of the plantar fascia; most common cause of heel pain; morning first-step pain is pathognomonic; caused by tight calves, reduced dorsiflexion, and training load spikes\n• ',
      { t: 'Achilles tendinopathy', url: 'https://en.wikipedia.org/wiki/Achilles_tendinopathy' },
      ' — mid-portion (2–6 cm proximal to insertion, where blood supply is poorest) or insertional; morning stiffness; caused by rapid increases in running or jump volume; ',
      { t: 'Alfredson eccentric heel-drop protocol', url: 'https://pubmed.ncbi.nlm.nih.gov/9572443/' },
      ' is gold-standard treatment with 90% improvement rates across clinical trials\n• ',
      { t: 'Lateral ankle sprain', url: 'https://en.wikipedia.org/wiki/Ankle_sprain' },
      ' — most common musculoskeletal injury; the ',
      { t: 'anterior talofibular ligament (ATFL)', url: 'https://en.wikipedia.org/wiki/Anterior_talofibular_ligament' },
      ' is injured first and most often; mechanism is inversion with plantarflexion; inadequately rehabilitated sprains cause chronic instability and dramatically increased re-injury risk\n• High ankle sprain (',
      { t: 'syndesmotic injury', url: 'https://en.wikipedia.org/wiki/Syndesmosis' },
      ') — injury to the distal tibiofibular syndesmosis from external rotation; longer recovery than a lateral sprain\n• ',
      { t: 'Metatarsal stress fracture', url: 'https://en.wikipedia.org/wiki/Stress_fracture' },
      ' — second metatarsal most common; from repetitive impact without recovery; often missed on initial X-ray; MRI detects bone stress reaction early\n• ',
      { t: 'Morton\'s neuroma', url: 'https://en.wikipedia.org/wiki/Morton%27s_neuroma' },
      ' — nerve thickening between the 3rd and 4th metatarsal heads; sharp burning forefoot pain; caused by repetitive compression from narrow footwear\n• ',
      { t: 'Hallux valgus', url: 'https://en.wikipedia.org/wiki/Hallux_valgus' },
      ' (bunion) — lateral deviation of the great toe; driven by footwear and biomechanics; can cause secondary Morton\'s neuroma and lesser toe crowding',
    ],
    rehab_exercises: [
      '• Alfredson eccentric heel-drop protocol — stand on step with heel off back edge; lower heel below step (eccentric phase), return with uninvolved leg; 3 × 15 with straight knee (',
      { t: 'gastrocnemius', url: 'https://en.wikipedia.org/wiki/Gastrocnemius_muscle' },
      '), 3 × 15 with knee bent (soleus); twice daily for 12 weeks; ',
      { t: 'clinical evidence', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3277725/' },
      ' shows 90% of patients achieve significant improvement\n• Single-leg eccentric calf raises on step — same loading principle; progress from bilateral bodyweight → single-leg bodyweight → loaded\n• Towel scrunches — scrunch towel with toes only; 3 × 30 s per foot; targets ',
      { t: 'flexor digitorum brevis', url: 'https://en.wikipedia.org/wiki/Flexor_digitorum_brevis_muscle' },
      ' and plantar lumbricals; key in plantar fasciitis and post-ankle sprain rehab\n• Short foot exercise — pull ball of foot toward heel without toe curl; 3 × 10 reps with 3 s holds; activates ',
      { t: 'plantar intrinsics', url: 'https://en.wikipedia.org/wiki/Intrinsic_muscles_of_the_foot' },
      '; improves arch height and proprioception\n• Single-leg balance progressions — eyes open → eyes closed → foam pad → BOSU; trains ',
      { t: 'peroneal muscle', url: 'https://en.wikipedia.org/wiki/Fibularis_longus' },
      ' activation and ankle proprioception; dynamic balance deficits are associated with 48% greater ankle sprain risk\n• Y-Balance reach exercise — stand on one leg, reach opposite leg forward, posteromedial, and posterolateral; trains dynamic ankle stability and hip-knee-ankle coordination\n• Marble pick-up — scatter 15–20 marbles, pick up with toes into a bowl; trains fine ',
      { t: 'intrinsic motor control', url: 'https://en.wikipedia.org/wiki/Intrinsic_muscles_of_the_foot' },
      ' and proprioceptive feedback; excellent post-nerve or post-surgery foot rehabilitation\n• Tibialis anterior raises (toes toward shin against gravity or band, 3 × 15–20) — strengthens the primary ',
      { t: 'dorsiflexor', url: 'https://en.wikipedia.org/wiki/Tibialis_anterior_muscle' },
      '; important in shin splint prevention and foot drop correction',
    ],
  },
};

const MUSCLE_GROUPS = ['Chest', 'Shoulders', 'Arms', 'Core', 'Hips', 'Back', 'Glutes', 'Legs', 'Hands', 'Feet'] as const;

type Section = { key: keyof Defaults; label: string; icon: string };
const SECTIONS: Section[] = [
  { key: 'function_description', label: 'Function', icon: 'fitness-outline' },
  { key: 'warmup_and_stretches', label: 'Warm-up & Stretches', icon: 'sunny-outline' },
  { key: 'common_injuries', label: 'Common Injuries', icon: 'warning-outline' },
  { key: 'rehab_exercises', label: 'Rehab Exercises', icon: 'bandage-outline' },
];

type Props = {
  selectedMuscle: string | null;
  onSelectMuscle: (muscle: string | null) => void;
  isTrainer: boolean;
  scrollHeader?: ReactNode;
};

export function EncyclopediaPanel({ selectedMuscle, onSelectMuscle, isTrainer, scrollHeader }: Props) {
  const t = useTheme();
  const { getEntry, upsertEntry } = useEncyclopedia();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Partial<Defaults>>({});

  const dbEntry = selectedMuscle ? getEntry(selectedMuscle) : null;
  const defaults = selectedMuscle ? (DEFAULT_CONTENT[selectedMuscle] ?? null) : null;

  function getContent(key: keyof Defaults): string {
    if (editing) return draft[key] ?? '';
    const val = dbEntry?.[key];
    return val ?? defaults?.[key] ?? '';
  }

  function startEditing() {
    if (!selectedMuscle) return;
    const base: Partial<Defaults> = defaults ?? {};
    setDraft({
      function_description: dbEntry?.function_description ?? base.function_description ?? '',
      warmup_and_stretches: dbEntry?.warmup_and_stretches ?? base.warmup_and_stretches ?? '',
      common_injuries:      dbEntry?.common_injuries      ?? base.common_injuries      ?? '',
      rehab_exercises:      dbEntry?.rehab_exercises      ?? base.rehab_exercises      ?? '',
    });
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setDraft({});
  }

  async function handleSave() {
    if (!selectedMuscle) return;
    setSaving(true);
    const { error } = await upsertEntry(selectedMuscle, draft);
    setSaving(false);
    if (error) {
      Alert.alert('Error', error);
    } else {
      setEditing(false);
      setDraft({});
    }
  }

  // ── No muscle selected: show grid of all muscle groups ──────

  if (!selectedMuscle) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: t.background }]}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        {scrollHeader}
        <Text style={[styles.gridHeading, { color: t.textSecondary }]}>
          Select a muscle group on the body map or tap a card below.
        </Text>
        <View style={styles.grid}>
          {MUSCLE_GROUPS.map((group) => {
            const entry = getEntry(group);
            const hasCustom = !!entry?.function_description;
            return (
              <TouchableOpacity
                key={group}
                style={[styles.groupCard, { backgroundColor: t.surface, borderColor: t.border }]}
                onPress={() => onSelectMuscle(group)}
                activeOpacity={0.7}
              >
                <Text style={[styles.groupCardName, { color: t.textPrimary }]}>{group}</Text>
                {hasCustom && (
                  <View style={[styles.customBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.customBadgeText}>Edited</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={14} color={t.textSecondary as string} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  // ── Muscle selected: show detail ─────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      {/* Header */}
      <View style={[styles.detailHeader, { borderBottomColor: t.border, backgroundColor: t.surface }]}>
        <TouchableOpacity
          onPress={() => { onSelectMuscle(null); setEditing(false); setDraft({}); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color={t.textPrimary as string} />
        </TouchableOpacity>
        <Text style={[styles.detailTitle, { color: t.textPrimary }]}>{selectedMuscle}</Text>
        {isTrainer && !editing && (
          <TouchableOpacity onPress={startEditing} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
        {isTrainer && editing && (
          <TouchableOpacity onPress={cancelEditing} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color={t.textSecondary as string} />
          </TouchableOpacity>
        )}
      </View>

      {/* Body */}
      <ScrollView
        style={styles.detailScroll}
        contentContainerStyle={styles.detailContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {scrollHeader}
        {SECTIONS.map(({ key, label, icon }) => (
          <View key={key} style={[styles.section, { borderColor: t.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name={icon as never} size={16} color={colors.primary} />
              <Text style={[styles.sectionLabel, { color: colors.primary }]}>{label}</Text>
            </View>
            {editing ? (
              <TextInput
                style={[styles.editInput, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.surface }]}
                value={draft[key] ?? ''}
                onChangeText={(v) => setDraft((d) => ({ ...d, [key]: v }))}
                multiline
                textAlignVertical="top"
                placeholderTextColor={t.textSecondary as string}
                placeholder={`Enter ${label.toLowerCase()}…`}
              />
            ) : dbEntry?.[key] ? (
              <Text style={[styles.sectionBody, { color: t.textPrimary }]}>
                {getContent(key) || <Text style={{ color: t.textSecondary as string }}>No content yet.</Text>}
              </Text>
            ) : (
              <RichText
                segs={RICH_CONTENT[selectedMuscle]?.[key] ?? [getContent(key)]}
                style={[styles.sectionBody, { color: t.textPrimary }]}
              />
            )}
          </View>
        ))}

        {isTrainer && editing && (
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color={colors.textInverse} />
              : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        )}

        {dbEntry?.updated_at && !editing && (
          <Text style={[styles.updatedAt, { color: t.textSecondary }]}>
            Last edited {new Date(dbEntry.updated_at).toLocaleDateString()}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Grid (no selection)
  gridContent: { padding: spacing.md, gap: spacing.sm },
  gridHeading: { ...typography.bodySmall, textAlign: 'center', marginBottom: spacing.xs },
  grid: { gap: spacing.sm },
  groupCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderRadius: radius.md, borderWidth: 1,
    gap: spacing.sm,
  },
  groupCardName: { ...typography.body, fontWeight: '600', flex: 1 },
  customBadge: {
    borderRadius: radius.sm, paddingHorizontal: spacing.xs, paddingVertical: 2,
  },
  customBadgeText: { ...typography.label, color: '#fff', fontWeight: '700' },

  // Detail header
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  detailTitle: { ...typography.body, fontWeight: '700', flex: 1 },

  // Detail body
  detailScroll: { flex: 1 },
  detailContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  section: {
    borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sectionLabel: { ...typography.label, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionBody: { ...typography.body, lineHeight: 22 },

  editInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.sm,
    padding: spacing.sm, minHeight: 120, lineHeight: 22,
  },

  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: spacing.sm + 2, alignItems: 'center', marginTop: spacing.xs,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '600' },

  updatedAt: { ...typography.label, textAlign: 'center' },

  // Inline links
  inlineLink: { color: colors.primary, textDecorationLine: 'underline' },
});
