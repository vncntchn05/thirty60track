import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, StyleSheet,
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
      'The pectoralis major (large fan-shaped muscle) drives horizontal adduction, flexion, and internal rotation of the shoulder. The pectoralis minor beneath it assists with scapular protraction and depression.',
    warmup_and_stretches:
      '• Arm circles (small → large)\n• Band pull-aparts\n• Doorway pec stretch — forearm against frame, rotate torso away (hold 20 s each side)\n• Cat-cow thoracic extension\n• Light cable fly warm-up sets',
    common_injuries:
      '• Pectoral muscle tear (most common during heavy bench press)\n• Shoulder impingement from excessive internal rotation\n• AC joint irritation from wide-grip pressing\n• Proximal bicep tendon strain at sternal attachment',
    rehab_exercises:
      '• Banded external rotation\n• Face pulls (cable or band)\n• Serratus activation wall slides\n• Light dumbbell flyes with neutral spine\n• Push-up progressions: wall → incline → floor',
  },
  Shoulders: {
    function_description:
      'The deltoid (anterior, lateral, posterior heads) controls arm abduction, flexion, and extension. The rotator cuff (supraspinatus, infraspinatus, teres minor, subscapularis) dynamically stabilizes the glenohumeral joint. The trapezius controls scapular elevation, retraction, and depression.',
    warmup_and_stretches:
      '• Shoulder circles forward and back\n• Cross-body arm stretch (hold 20 s each side)\n• Doorway pec stretch\n• Band pull-aparts\n• Prone Y/T/W raises with very light weight\n• Wall angels',
    common_injuries:
      '• Rotator cuff impingement or partial/full tear\n• AC joint sprain\n• Glenohumeral instability or dislocation\n• Bicipital tendinopathy\n• SLAP labral tear',
    rehab_exercises:
      '• Sidelying external rotation (ER)\n• Full can raises (supraspinatus)\n• Cable face pulls\n• Banded shoulder ER/IR at 0° and 90° abduction\n• Scapular retraction and depression holds\n• Light lateral raises (elbow slightly bent)',
  },
  Arms: {
    function_description:
      'Biceps brachii: elbow flexion and forearm supination, also assists shoulder flexion. Brachialis: pure elbow flexion (strongest flexor). Triceps brachii (long, medial, lateral heads): elbow extension. Forearm flexors/extensors control wrist and grip. Brachioradialis stabilizes the forearm mid-position.',
    warmup_and_stretches:
      '• Wrist circles (both directions)\n• Forearm flexor stretch — arm extended, fingers pulled back toward body\n• Overhead tricep stretch (elbow behind head)\n• Prayer stretch for wrist flexors\n• Light band curls and pushdowns to activate',
    common_injuries:
      '• Bicep tendon rupture (distal at elbow, or proximal at shoulder)\n• Medial epicondylitis (golfer\'s elbow) — forearm flexors\n• Lateral epicondylitis (tennis elbow) — forearm extensors\n• Tricep tendon strain\n• Cubital tunnel syndrome (ulnar nerve)',
    rehab_exercises:
      '• Eccentric wrist curls over edge of bench (golfer\'s elbow)\n• Eccentric wrist extensions over edge of bench (tennis elbow)\n• Supination/pronation with light dumbbell\n• Isometric bicep holds at 90°\n• Band tricep pushdowns (light, slow)\n• Grip strengthening with putty or thick band',
  },
  Core: {
    function_description:
      'Rectus abdominis: spinal flexion ("crunch" motion). Internal/external obliques: rotation and lateral flexion. Transverse abdominis (TVA): acts as a natural lifting belt — intra-abdominal pressure. Erector spinae: spinal extension and anti-flexion. Together they stabilize the spine under all loaded movement.',
    warmup_and_stretches:
      '• Diaphragmatic breathing in 90-90 position\n• Cat-cow (5–10 slow reps)\n• Dead bug (slow, controlled, lower back pressed to floor)\n• Child\'s pose with lateral reach\n• Lying hip flexor stretch (single leg)\n• Knee-to-chest pulls',
    common_injuries:
      '• Lower back muscle strain (erectors/QL overload)\n• Herniated disc (L4–L5 most common)\n• Sports hernia (athletic pubalgia)\n• SI joint dysfunction\n• Rib stress fracture from heavy oblique overuse',
    rehab_exercises:
      '• McGill Big Three: curl-up, side plank, bird dog\n• Pallof press (anti-rotation)\n• Dead bug progressions\n• Glute bridge (core activation pattern)\n• Suitcase carry (anti-lateral-flexion)\n• 90-90 breathing with TVA bracing',
  },
  Hips: {
    function_description:
      'Adductors (longus, brevis, magnus, gracilis, pectineus): medial thigh — stabilize knee and assist hip flexion. Hip flexors (iliopsoas, rectus femoris): drive leg forward in gait and during squats/deadlifts. Hip abductors (gluteus medius, TFL): pelvic stability during single-leg loading.',
    warmup_and_stretches:
      '• Standing hip circles\n• Wide-stance squat hold (inner thigh stretch)\n• Half-kneeling hip flexor stretch with posterior pelvic tilt\n• Lateral lunge (adductor stretch)\n• 90/90 hip stretch on floor\n• Cossack squats (controlled depth)',
    common_injuries:
      '• Groin strain (adductor tear — acute from sprinting or kicking)\n• Hip flexor strain\n• Femoroacetabular impingement (FAI)\n• IT band syndrome (lateral)\n• Hip labral tear',
    rehab_exercises:
      '• Side-lying hip abduction (controlled)\n• Clamshells (with or without band)\n• Copenhagen adductor plank\n• Banded hip flexion marching\n• Eccentric adductor squeeze (ball between knees)\n• Hip 90/90 mobility transitions',
  },
  Back: {
    function_description:
      'Latissimus dorsi: shoulder adduction, extension, and internal rotation — the primary pulling muscle. Rhomboids: scapular retraction. Trapezius (upper/mid/lower): scapular elevation, retraction, and depression. Erector spinae: spinal extension, anti-flexion. Quadratus lumborum (QL): lateral stabilizer of the lumbar spine.',
    warmup_and_stretches:
      '• Cat-cow\n• Child\'s pose with arm reach\n• Thread-the-needle thoracic rotation\n• Hanging lat stretch from bar (decompress)\n• Band pull-aparts\n• Chest-supported row warm-up sets (very light)',
    common_injuries:
      '• Lower back muscle strain (most common gym injury)\n• Herniated disc (cervical or lumbar)\n• Spondylolisthesis (vertebral slippage)\n• Lat or rhomboid strain\n• Sciatica (sciatic nerve compression, often from disc)',
    rehab_exercises:
      '• McGill bird dog\n• Prone Y raises (scapular control)\n• Chest-supported dumbbell row (light, neutral spine)\n• Half-kneeling cable pulldown\n• Jefferson curl (light, slow eccentric)\n• Back extension isometric hold',
  },
  Glutes: {
    function_description:
      'Gluteus maximus: primary hip extensor and external rotator — powers squats, deadlifts, and running. Gluteus medius: hip abduction and pelvic stability during single-leg stance (prevents Trendelenburg drop). Gluteus minimus: assists abduction and internal rotation. Together they are the engine of athletic performance.',
    warmup_and_stretches:
      '• Bodyweight glute bridge (slow squeeze at top)\n• Pigeon pose on floor (hold 30–45 s)\n• Figure-4 stretch (supine or seated)\n• Fire hydrants\n• Hip circles on all fours\n• Lateral band walks (mini band above knees)',
    common_injuries:
      '• Proximal hamstring tendinopathy (deep glute / high hamstring pain)\n• Piriformis syndrome (sciatic-like pain, not true sciatica)\n• Gluteal tendinopathy (lateral hip pain, worse with sitting)\n• SI joint dysfunction\n• Hip impingement (FAI)',
    rehab_exercises:
      '• Clamshells\n• Glute bridge progressions (bilateral → single-leg)\n• Single-leg hip thrust (bodyweight)\n• Side-lying hip abduction (controlled)\n• Terminal knee extensions\n• Step-ups (low box, controlled descent)',
  },
  Legs: {
    function_description:
      'Quadriceps (rectus femoris, vastus medialis, lateralis, intermedius): knee extension; rectus femoris also flexes hip. Hamstrings (biceps femoris, semitendinosus, semimembranosus): knee flexion and hip extension. Calves (gastrocnemius + soleus): plantarflexion. Tibialis anterior: dorsiflexion. Together they absorb and produce force in every lower-body movement.',
    warmup_and_stretches:
      '• Leg swings forward/lateral\n• Standing quad stretch\n• Standing hamstring stretch (hinge with straight leg)\n• Slow calf raises (stretch at bottom)\n• Ankle circles\n• Walking lunges\n• Inchworm',
    common_injuries:
      '• ACL/PCL tear (knee ligaments)\n• Patellar tendinopathy (jumper\'s knee — from high-volume jumping)\n• Hamstring strain (Grade I–III, often from sprinting)\n• Quadricep strain\n• Shin splints (medial tibial stress syndrome)\n• Achilles tendinopathy or rupture\n• Plantar fasciitis',
    rehab_exercises:
      '• Terminal knee extensions (VMO activation)\n• Nordic hamstring curls (slow eccentric)\n• Single-leg calf raises (eccentric emphasis)\n• Leg press (light, controlled)\n• Wall sit isometric hold\n• Eccentric heel drops for Achilles\n• Quad sets (isometric)',
  },
};

const MUSCLE_GROUPS = ['Chest', 'Shoulders', 'Arms', 'Core', 'Hips', 'Back', 'Glutes', 'Legs'] as const;

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
};

export function EncyclopediaPanel({ selectedMuscle, onSelectMuscle, isTrainer }: Props) {
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
            ) : (
              <Text style={[styles.sectionBody, { color: t.textPrimary }]}>
                {getContent(key) || <Text style={{ color: t.textSecondary as string }}>No content yet.</Text>}
              </Text>
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
});
