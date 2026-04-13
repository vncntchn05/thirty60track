import { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Linking, Image, Modal, Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { useExercise, useExerciseAlternatives } from '@/hooks/useExercises';
import { useExerciseMedia } from '@/hooks/useExerciseMedia';
import { getDbImageUrls } from '@/lib/exerciseDb';
import { APPROXIMATED_EXERCISES, EXERCISE_VARIANTS } from '@/lib/exerciseVariants';
import { useAuth } from '@/lib/auth';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { ExerciseCategory, EquipmentType } from '@/types';
import { EQUIPMENT_TYPES } from '@/types';

const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  strength:    'Strength',
  cardio:      'Cardio',
  flexibility: 'Flexibility',
  stretch:     'Stretch',
  other:       'Other',
};

/** Converts a free-exercise-db slug to a human-readable label. */
function slugToLabel(slug: string): string {
  return slug.replace(/_/g, ' ').replace(/ - /g, ' · ');
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const { role } = useAuth();
  const isTrainer = role === 'trainer';
  const { exercise, loading, error, updateExercise } = useExercise(id);
  const { media: customMedia, loading: mediaLoading, uploadMedia, deleteMedia } = useExerciseMedia(id ?? '');
  const { alternatives, loading: altLoading, removeAlternative } = useExerciseAlternatives(id);

  const [formNotes, setFormNotes] = useState('');
  const [helpUrl, setHelpUrl] = useState('');
  const [equipment, setEquipment] = useState<EquipmentType | null>(null);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [customLightbox, setCustomLightbox] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);

  // Variant tabs
  const variants = exercise ? (EXERCISE_VARIANTS[exercise.name] ?? null) : null;
  const isApproximated = exercise ? APPROXIMATED_EXERCISES.has(exercise.name) : false;
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  // Form images — recompute when variant changes
  const imageUrls = useMemo(
    () => (exercise ? getDbImageUrls(exercise.name, selectedVariant ?? undefined) : null),
    [exercise, selectedVariant],
  );
  const [imgLoaded, setImgLoaded] = useState<[boolean, boolean]>([false, false]);
  const [imgFailed, setImgFailed] = useState<[boolean, boolean]>([false, false]);
  const showImages = imgLoaded.some(Boolean);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

  // Reset image state when variant changes
  useEffect(() => {
    setImgLoaded([false, false]);
    setImgFailed([false, false]);
  }, [selectedVariant]);

  // Initialize fields once exercise data loads
  if (exercise && !initialized) {
    setFormNotes(exercise.form_notes ?? '');
    setHelpUrl(exercise.help_url ?? '');
    setEquipment(exercise.equipment ?? null);
    setInitialized(true);
  }

  const isDirty = exercise && (
    formNotes !== (exercise.form_notes ?? '') ||
    helpUrl !== (exercise.help_url ?? '') ||
    equipment !== (exercise.equipment ?? null)
  );

  async function handlePickMedia() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission required', 'Allow access to your media library to upload.'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.85,
      videoMaxDuration: 120,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const isVideo = asset.type === 'video';
    const mimeType = isVideo ? (asset.mimeType ?? 'video/mp4') : (asset.mimeType ?? 'image/jpeg');

    setUploading(true);
    const { error: err } = await uploadMedia({
      uri: asset.uri,
      mimeType,
      mediaType: isVideo ? 'video' : 'image',
      caption: null,
    });
    setUploading(false);
    if (err) Alert.alert('Upload failed', err);
  }

  async function handleDeleteMedia(mediaId: string) {
    Alert.alert('Delete media', 'Remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error: err } = await deleteMedia(mediaId);
          if (err) Alert.alert('Error', err);
        },
      },
    ]);
  }

  async function handleSave() {
    setSaving(true);
    const { error: err } = await updateExercise({
      form_notes: formNotes.trim() || null,
      help_url: helpUrl.trim() || null,
      equipment,
    });
    setSaving(false);
    if (err) Alert.alert('Error', err);
  }

  async function handleWatch() {
    const url = (helpUrl.trim() || (exercise?.help_url ?? '')).trim();
    if (!url) return;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) await Linking.openURL(url);
    else Alert.alert('Cannot open URL', url);
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !exercise) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>{error ?? 'Exercise not found.'}</Text>
      </View>
    );
  }

  const activeVariantSlug = selectedVariant ?? variants?.[0] ?? null;

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as never)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={t.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: t.textPrimary }]}>{exercise.name}</Text>
          <View style={styles.headerMeta}>
            {exercise.muscle_group ? (
              <Text style={[styles.headerSub, { color: t.textSecondary }]}>{exercise.muscle_group}</Text>
            ) : null}
            <Text style={[styles.headerSub, { color: colors.primary }]}>
              {CATEGORY_LABEL[exercise.category as ExerciseCategory] ?? exercise.category}
            </Text>
          </View>
        </View>
      </View>

      {/* Body */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form images section */}
        {imageUrls && (
          <View style={showImages ? undefined : styles.hidden}>
            <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Form Images</Text>

            {/* Variant tabs — only shown when 2+ variants exist */}
            {variants && variants.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.variantRow}
                contentContainerStyle={styles.variantRowContent}
                keyboardShouldPersistTaps="handled"
              >
                {variants.map((slug) => {
                  const active = activeVariantSlug === slug;
                  return (
                    <TouchableOpacity
                      key={slug}
                      style={[
                        styles.variantChip,
                        { borderColor: active ? colors.primary : t.border },
                        active && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => setSelectedVariant(slug)}
                    >
                      <Text style={[styles.variantChipText, { color: active ? colors.textInverse : t.textSecondary }]}>
                        {slugToLabel(slug)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.imageRow}>
              {imageUrls.map((uri, i) => (
                imgFailed[i] ? null : (
                  <TouchableOpacity key={uri} onPress={() => setLightboxUri(uri)} activeOpacity={0.8}>
                    <Image
                      source={{ uri }}
                      style={[styles.formImage, { backgroundColor: t.surface }]}
                      resizeMode="cover"
                      onLoad={() => setImgLoaded((prev) => prev.map((v, j) => j === i ? true : v) as [boolean, boolean])}
                      onError={() => setImgFailed((prev) => prev.map((v, j) => j === i ? true : v) as [boolean, boolean])}
                    />
                  </TouchableOpacity>
                )
              ))}
            </View>

            {/* Disclaimer for approximated exercises (only when no variant explicitly selected) */}
            {isApproximated && !selectedVariant && (
              <Text style={[styles.disclaimer, { color: t.textSecondary, borderColor: t.border }]}>
                No exact match found in the exercise database. Images shown are from a similar movement.
              </Text>
            )}
          </View>
        )}

        <Modal visible={lightboxUri !== null} transparent animationType="fade" onRequestClose={() => setLightboxUri(null)}>
          <Pressable style={styles.lightboxOverlay} onPress={() => setLightboxUri(null)}>
            {lightboxUri ? (
              <Image source={{ uri: lightboxUri }} style={styles.lightboxImage} resizeMode="contain" />
            ) : null}
          </Pressable>
        </Modal>

        {/* Custom media lightbox */}
        <Modal visible={customLightbox !== null} transparent animationType="fade" onRequestClose={() => setCustomLightbox(null)}>
          <Pressable style={styles.lightboxOverlay} onPress={() => setCustomLightbox(null)}>
            {customLightbox?.type === 'image' ? (
              <Image source={{ uri: customLightbox.uri }} style={styles.lightboxImage} resizeMode="contain" />
            ) : customLightbox?.type === 'video' ? (
              <Pressable onPress={(e) => e.stopPropagation()}>
                <Video
                  source={{ uri: customLightbox.uri }}
                  style={styles.lightboxVideo}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                />
              </Pressable>
            ) : null}
          </Pressable>
        </Modal>

        {/* ── Custom Media ── */}
        <View style={styles.customMediaHeader}>
          <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Custom Media</Text>
          {isTrainer && (
            uploading
              ? <ActivityIndicator size="small" color={colors.primary} />
              : (
                <TouchableOpacity onPress={handlePickMedia} style={styles.addMediaBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
              )
          )}
        </View>

        {mediaLoading ? (
          <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start' }} />
        ) : customMedia.length === 0 ? (
          <Text style={[styles.mediaEmpty, { color: t.textSecondary }]}>
            {isTrainer ? 'Tap + to upload images or videos' : 'No custom media uploaded yet'}
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaRow} contentContainerStyle={styles.mediaRowContent}>
            {customMedia.map((item) => (
              <View key={item.id} style={styles.mediaThumbWrap}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setCustomLightbox({ uri: item.url, type: item.media_type as 'image' | 'video' })}
                >
                  {item.media_type === 'image' ? (
                    <Image source={{ uri: item.url }} style={[styles.mediaThumb, { backgroundColor: t.surface }]} resizeMode="cover" />
                  ) : (
                    <View style={[styles.mediaThumb, styles.videoThumb, { backgroundColor: t.surface }]}>
                      <Ionicons name="play-circle" size={32} color={colors.textInverse} />
                    </View>
                  )}
                </TouchableOpacity>
                {isTrainer && (
                  <TouchableOpacity
                    style={styles.deleteMediaBtn}
                    onPress={() => handleDeleteMedia(item.id)}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        )}

        <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Equipment</Text>
        {isTrainer ? (
          <View style={styles.chipWrap}>
            {(Object.values(EQUIPMENT_TYPES) as EquipmentType[]).map((eq) => {
              const active = equipment === eq;
              return (
                <TouchableOpacity
                  key={eq}
                  style={[
                    styles.chip,
                    { borderColor: active ? colors.primary : t.border },
                    active && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setEquipment(active ? null : eq)}
                >
                  <Text style={[styles.chipText, { color: active ? colors.textInverse : t.textSecondary }]}>
                    {eq}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.readonlyValue, { color: t.textPrimary }]}>
            {exercise.equipment ?? '—'}
          </Text>
        )}

        <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Tutorial URL</Text>
        <View style={[styles.urlRow, { borderColor: t.border }]}>
          <Ionicons name="logo-youtube" size={20} color="#FF0000" />
          {isTrainer ? (
            <TextInput
              style={[styles.urlInput, { color: t.textPrimary }]}
              value={helpUrl}
              onChangeText={setHelpUrl}
              placeholder="https://youtu.be/…"
              placeholderTextColor={t.textSecondary as string}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          ) : (
            <Text style={[styles.urlInput, { color: helpUrl.trim() ? t.textPrimary : t.textSecondary }]} numberOfLines={1}>
              {helpUrl.trim() || 'No tutorial linked'}
            </Text>
          )}
          {(helpUrl.trim() || exercise.help_url) ? (
            <TouchableOpacity onPress={handleWatch} style={styles.watchBtn}>
              <Text style={styles.watchBtnText}>Watch</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Form Notes</Text>
        {isTrainer ? (
          <TextInput
            style={[styles.notesInput, { borderColor: t.border, color: t.textPrimary }]}
            value={formNotes}
            onChangeText={setFormNotes}
            placeholder={'1. Setup\n2. Brace core and take a deep breath\n3. Execute the movement\n…'}
            placeholderTextColor={t.textSecondary as string}
            multiline
            textAlignVertical="top"
          />
        ) : (
          <Text style={[styles.notesReadonly, { borderColor: t.border, color: t.textPrimary }]}>
            {formNotes.trim() || '—'}
          </Text>
        )}

        {/* ── Alternatives ── */}
        <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Alternatives</Text>
        {altLoading ? (
          <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start' }} />
        ) : alternatives.length === 0 ? (
          <Text style={[styles.altEmpty, { color: t.textSecondary }]}>No alternatives linked yet.</Text>
        ) : (
          <View style={styles.altList}>
            {alternatives.map((alt) => (
              <View key={alt.id} style={[styles.altRow, { backgroundColor: t.surface, borderColor: t.border }]}>
                <TouchableOpacity
                  style={styles.altRowMain}
                  onPress={() => router.push(`/exercise/${alt.id}` as never)}
                  activeOpacity={0.7}
                >
                  <View style={styles.altRowInfo}>
                    <Text style={[styles.altName, { color: t.textPrimary }]}>{alt.name}</Text>
                    <Text style={[styles.altMeta, { color: t.textSecondary }]}>
                      {[alt.muscle_group, alt.equipment].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={t.textSecondary} />
                </TouchableOpacity>
                {isTrainer && (
                  <TouchableOpacity
                    onPress={() => removeAlternative(alt.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.altRemoveBtn}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {isTrainer && isDirty ? (
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={colors.textInverse} />
              : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderBottomWidth: 1,
  },
  headerText: { flex: 1 },
  headerTitle: { ...typography.heading3 },
  headerMeta: { flexDirection: 'row', gap: spacing.sm, marginTop: 2, flexWrap: 'wrap' },
  headerSub: { ...typography.bodySmall, textTransform: 'capitalize' },

  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },

  fieldLabel: {
    ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: spacing.xs,
  },

  hidden: { display: 'none' },

  variantRow: { flexGrow: 0, marginTop: spacing.sm, marginBottom: spacing.sm },
  variantRowContent: { gap: spacing.xs, paddingRight: spacing.sm },
  variantChip: {
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  variantChipText: { ...typography.bodySmall, fontWeight: '600' },

  imageRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  formImage: { width: 90, height: 120, borderRadius: radius.md },

  disclaimer: {
    ...typography.bodySmall, marginTop: spacing.xs,
    borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    fontStyle: 'italic',
  },

  lightboxOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center', alignItems: 'center',
  },
  lightboxImage: { width: '90%', height: '80%' },
  lightboxVideo: { width: 320, height: 240 },

  customMediaHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  addMediaBtn: { padding: 2 },
  mediaEmpty: { ...typography.bodySmall, fontStyle: 'italic' },
  mediaRow: { flexGrow: 0 },
  mediaRowContent: { gap: spacing.sm, paddingVertical: spacing.xs },
  mediaThumbWrap: { position: 'relative' },
  mediaThumb: { width: 100, height: 130, borderRadius: radius.md },
  videoThumb: {
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a',
  },
  deleteMediaBtn: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: 'white', borderRadius: 9,
  },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  chipText: { ...typography.bodySmall, fontWeight: '600' },

  urlRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  urlInput: { ...typography.body, flex: 1 },
  watchBtn: {
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  watchBtnText: { ...typography.label, color: colors.textInverse, fontWeight: '700' },

  notesInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.md,
    padding: spacing.md, minHeight: 200, lineHeight: 22,
  },
  notesReadonly: {
    ...typography.body, borderWidth: 1, borderRadius: radius.md,
    padding: spacing.md, lineHeight: 22,
  },
  readonlyValue: { ...typography.body },

  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },

  errorText: { ...typography.body, color: colors.error, textAlign: 'center', paddingHorizontal: spacing.lg },

  altEmpty: { ...typography.bodySmall, fontStyle: 'italic' },
  altList: { gap: spacing.xs },
  altRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: radius.md, overflow: 'hidden',
  },
  altRowMain: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm,
  },
  altRowInfo: { flex: 1 },
  altName: { ...typography.body, fontWeight: '600' },
  altMeta: { ...typography.bodySmall, marginTop: 2 },
  altRemoveBtn: { paddingRight: spacing.sm, paddingLeft: spacing.xs },
});
