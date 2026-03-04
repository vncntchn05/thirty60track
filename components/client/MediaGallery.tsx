import { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, FlatList, Modal, Image,
  TouchableOpacity, TextInput, ScrollView, ActivityIndicator,
  Alert, Dimensions, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { DatePicker } from '@/components/ui/DatePicker';
import { useClientMedia, type ClientMediaWithUrl } from '@/hooks/useClientMedia';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

// ─── Constants ────────────────────────────────────────────────────

const GAP = spacing.xs;
const THUMB_SIZE = (Dimensions.get('window').width - spacing.md * 2 - GAP * 2) / 3;
const TODAY = new Date().toISOString().split('T')[0];

type UploadAsset = {
  uri: string;
  type: 'image' | 'video';
  mimeType: string;
};

function isoToLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtDate(iso: string) {
  return isoToLocal(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ─── Thumbnail ────────────────────────────────────────────────────

function MediaThumb({ item, onPress }: { item: ClientMediaWithUrl; onPress: () => void }) {
  const [active, setActive] = useState(false);
  const show = () => setActive(true);
  const hide = () => setActive(false);

  return (
    <Pressable
      style={styles.thumb}
      onPress={onPress}
      onPressIn={show}
      onPressOut={hide}
      onHoverIn={show}
      onHoverOut={hide}
    >
      {item.media_type === 'image' ? (
        <Image source={{ uri: item.url }} style={styles.thumbImage} resizeMode="cover" />
      ) : (
        <View style={styles.videoThumb}>
          <Ionicons name="play-circle" size={32} color={colors.textInverse} />
        </View>
      )}
      {active && (
        <View style={styles.thumbOverlay} pointerEvents="none">
          <Text style={styles.thumbOverlayDate} numberOfLines={1}>
            {isoToLocal(item.taken_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
          {item.notes
            ? <Text style={styles.thumbOverlayNotes} numberOfLines={2}>{item.notes}</Text>
            : null}
        </View>
      )}
    </Pressable>
  );
}

// ─── Upload modal content ─────────────────────────────────────────

type UploadModalProps = {
  asset: UploadAsset;
  date: string;
  notes: string;
  uploading: boolean;
  error: string | null;
  onChangeDate: (d: string) => void;
  onChangeNotes: (n: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  t: ReturnType<typeof useTheme>;
};

function UploadModalContent(props: UploadModalProps) {
  const { asset, date, notes, uploading, error, onChangeDate, onChangeNotes, onConfirm, onCancel, t } = props;
  return (
    <View style={[styles.modalSheet, { backgroundColor: t.background }]}>
      <View style={[styles.modalHeader, { borderBottomColor: t.border }]}>
        <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Upload Media</Text>
        <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={24} color={t.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
        {/* Preview */}
        <View style={[styles.previewBox, { backgroundColor: t.surface }]}>
          {asset.type === 'image' ? (
            <Image source={{ uri: asset.uri }} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <View style={styles.videoPreviewPlaceholder}>
              <Ionicons name="videocam" size={48} color={t.textSecondary} />
              <Text style={[styles.videoPreviewLabel, { color: t.textSecondary }]}>Video selected</Text>
            </View>
          )}
        </View>

        <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>DATE</Text>
        <DatePicker value={date} onChange={onChangeDate} />

        <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>NOTES</Text>
        <TextInput
          style={[styles.notesInput, { color: t.textPrimary, borderColor: t.border, backgroundColor: t.surface }]}
          value={notes}
          onChangeText={onChangeNotes}
          placeholder="Optional notes…"
          placeholderTextColor={t.textSecondary}
          multiline
          textAlignVertical="top"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryBtn, uploading && styles.disabledBtn]}
          onPress={onConfirm}
          disabled={uploading}
        >
          {uploading
            ? <ActivityIndicator size="small" color={colors.textInverse} />
            : <Text style={styles.primaryBtnText}>Upload</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Detail modal content ─────────────────────────────────────────

type DetailModalProps = {
  item: ClientMediaWithUrl;
  hasPrev: boolean;
  hasNext: boolean;
  editing: boolean;
  editDate: string;
  editNotes: string;
  saving: boolean;
  editError: string | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
  onChangeDate: (d: string) => void;
  onChangeNotes: (n: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  t: ReturnType<typeof useTheme>;
};

function DetailModalContent(props: DetailModalProps) {
  const {
    item, hasPrev, hasNext, editing, editDate, editNotes, saving, editError,
    onClose, onPrev, onNext, onStartEdit, onDelete, onChangeDate, onChangeNotes, onSaveEdit, onCancelEdit, t,
  } = props;

  return (
    <View style={styles.detailOverlay}>
      {/* Close button */}
      <TouchableOpacity style={styles.detailCloseBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.85)" />
      </TouchableOpacity>

      {/* Media area */}
      <View style={styles.detailMediaArea}>
        {item.media_type === 'image' ? (
          <Image source={{ uri: item.url }} style={styles.detailImage} resizeMode="contain" />
        ) : (
          <Video
            key={item.id}
            source={{ uri: item.url }}
            style={styles.detailVideo}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
          />
        )}

        {/* Prev / Next arrows */}
        {hasPrev && (
          <TouchableOpacity style={[styles.navArrow, styles.navArrowLeft]} onPress={onPrev} hitSlop={{ top: 16, bottom: 16, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={32} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        )}
        {hasNext && (
          <TouchableOpacity style={[styles.navArrow, styles.navArrowRight]} onPress={onNext} hitSlop={{ top: 16, bottom: 16, left: 8, right: 8 }}>
            <Ionicons name="chevron-forward" size={32} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        )}
      </View>

      {/* Metadata panel */}
      <View style={[styles.detailPanel, { backgroundColor: t.surface }]}>
        {!editing ? (
          <>
            <Text style={[styles.detailDate, { color: t.textPrimary }]}>{fmtDate(item.taken_at)}</Text>
            {item.notes
              ? <Text style={[styles.detailNotes, { color: t.textSecondary }]}>{item.notes}</Text>
              : null}
            <View style={styles.detailActions}>
              <TouchableOpacity style={styles.detailActionBtn} onPress={onStartEdit}>
                <Ionicons name="pencil-outline" size={18} color={colors.primary} />
                <Text style={[styles.detailActionLabel, { color: colors.primary }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.detailActionBtn} onPress={onDelete}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
                <Text style={[styles.detailActionLabel, { color: colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>DATE</Text>
            <DatePicker value={editDate} onChange={onChangeDate} />
            <Text style={[styles.fieldLabel, { color: t.textSecondary, marginTop: spacing.sm }]}>NOTES</Text>
            <TextInput
              style={[styles.notesInput, { color: t.textPrimary, borderColor: t.border, backgroundColor: t.background }]}
              value={editNotes}
              onChangeText={onChangeNotes}
              placeholder="Optional notes…"
              placeholderTextColor={t.textSecondary}
              multiline
              textAlignVertical="top"
            />
            {editError ? <Text style={styles.errorText}>{editError}</Text> : null}
            <View style={styles.editFormActions}>
              <Pressable onPress={onCancelEdit} style={styles.cancelBtn}>
                <Text style={[styles.cancelBtnText, { color: t.textSecondary }]}>Cancel</Text>
              </Pressable>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.disabledBtn]}
                onPress={onSaveEdit}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color={colors.textInverse} />
                  : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────

export function MediaGallery({ clientId }: { clientId: string }) {
  const { media, loading, error, uploadMedia, updateMedia, deleteMedia } = useClientMedia(clientId);
  const t = useTheme();

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadAsset, setUploadAsset] = useState<UploadAsset | null>(null);
  const [uploadDate, setUploadDate] = useState(TODAY);
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Detail modal state
  const [detailItem, setDetailItem] = useState<ClientMediaWithUrl | null>(null);
  const [editing, setEditing] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Upload handlers ──

  async function handlePickMedia() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library to upload media.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploadAsset({
      uri: asset.uri,
      type: (asset.type ?? 'image') as 'image' | 'video',
      mimeType: asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
    });
    setUploadDate(TODAY);
    setUploadNotes('');
    setUploadError(null);
    setShowUpload(true);
  }

  const handleConfirmUpload = useCallback(async () => {
    if (!uploadAsset) return;
    setUploading(true);
    setUploadError(null);
    const { error: err } = await uploadMedia({
      uri: uploadAsset.uri,
      mimeType: uploadAsset.mimeType,
      mediaType: uploadAsset.type,
      takenAt: uploadDate,
      notes: uploadNotes.trim() || null,
    });
    setUploading(false);
    if (err) { setUploadError(err); return; }
    setShowUpload(false);
  }, [uploadAsset, uploadDate, uploadNotes, uploadMedia]);

  // ── Detail handlers ──

  function handleOpenDetail(item: ClientMediaWithUrl) {
    setDetailItem(item);
    setEditing(false);
    setEditError(null);
  }

  function handleCloseDetail() {
    setDetailItem(null);
    setEditing(false);
  }

  function handleNav(dir: 1 | -1) {
    if (!detailItem) return;
    const idx = media.findIndex((m) => m.id === detailItem.id);
    const next = media[idx + dir];
    if (next) { setDetailItem(next); setEditing(false); setEditError(null); }
  }

  function handleStartEdit() {
    if (!detailItem) return;
    setEditDate(detailItem.taken_at);
    setEditNotes(detailItem.notes ?? '');
    setEditError(null);
    setEditing(true);
  }

  const handleSaveEdit = useCallback(async () => {
    if (!detailItem) return;
    setSaving(true);
    setEditError(null);
    const { error: err } = await updateMedia(detailItem.id, {
      taken_at: editDate,
      notes: editNotes.trim() || null,
    });
    setSaving(false);
    if (err) { setEditError(err); return; }
    setDetailItem(null);
    setEditing(false);
  }, [detailItem, editDate, editNotes, updateMedia]);

  function handleDeletePress() {
    if (!detailItem) return;
    Alert.alert(
      'Delete media',
      'This will permanently delete this file. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            const { error: err } = await deleteMedia(detailItem.id);
            if (err) Alert.alert('Error', err);
            else handleCloseDetail();
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={media}
        numColumns={3}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.gridRow}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <MediaThumb item={item} onPress={() => handleOpenDetail(item)} />
        )}
        ListHeaderComponent={
          error
            ? <Text style={[styles.errorText, { marginBottom: spacing.sm }]}>{error}</Text>
            : loading
              ? <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
              : null
        }
        ListEmptyComponent={
          !loading
            ? <Text style={[styles.emptyText, { color: t.textSecondary }]}>No photos or videos yet.</Text>
            : null
        }
      />

      {/* Camera FAB */}
      <TouchableOpacity style={styles.fab} onPress={handlePickMedia} accessibilityLabel="Add media">
        <Ionicons name="camera" size={20} color={colors.textInverse} />
        <Text style={styles.fabLabel}>Add Media</Text>
      </TouchableOpacity>

      {/* Upload modal */}
      <Modal
        visible={showUpload && uploadAsset !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUpload(false)}
      >
        {uploadAsset !== null && (
          <UploadModalContent
            asset={uploadAsset}
            date={uploadDate}
            notes={uploadNotes}
            uploading={uploading}
            error={uploadError}
            onChangeDate={setUploadDate}
            onChangeNotes={setUploadNotes}
            onConfirm={handleConfirmUpload}
            onCancel={() => setShowUpload(false)}
            t={t}
          />
        )}
      </Modal>

      {/* Detail modal */}
      <Modal
        visible={detailItem !== null}
        animationType="fade"
        transparent
        onRequestClose={handleCloseDetail}
      >
        {detailItem !== null && (() => {
          const idx = media.findIndex((m) => m.id === detailItem.id);
          return (
            <DetailModalContent
              item={detailItem}
              hasPrev={idx > 0}
              hasNext={idx < media.length - 1}
              editing={editing}
              editDate={editDate}
              editNotes={editNotes}
              saving={saving}
              editError={editError}
              onClose={handleCloseDetail}
              onPrev={() => handleNav(-1)}
              onNext={() => handleNav(1)}
              onStartEdit={handleStartEdit}
              onDelete={handleDeletePress}
              onChangeDate={setEditDate}
              onChangeNotes={setEditNotes}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={() => setEditing(false)}
              t={t}
            />
          );
        })()}
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Grid ──
  grid: { padding: spacing.md, paddingBottom: spacing.xxl + 56 },
  gridRow: { gap: GAP },
  thumb: {
    width: THUMB_SIZE, height: THUMB_SIZE,
    borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.surfaceDark,
  },
  thumbImage: { width: '100%', height: '100%' },
  videoThumb: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xs,
    gap: 3,
  },
  thumbOverlayDate: { fontSize: 15, fontWeight: '700', color: colors.textInverse, lineHeight: 20, textAlign: 'center' },
  thumbOverlayNotes: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 17, textAlign: 'center' },
  loader: { marginVertical: spacing.md },
  emptyText: { ...typography.body, textAlign: 'center', marginTop: spacing.xl },
  errorText: { ...typography.bodySmall, color: colors.error },

  // ── Camera FAB ──
  fab: {
    position: 'absolute', bottom: spacing.xl, right: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
    borderRadius: radius.full, backgroundColor: colors.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabLabel: { ...typography.body, color: colors.textInverse, fontWeight: '700' },

  // ── Upload modal ──
  modalSheet: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderBottomWidth: 1,
  },
  modalTitle: { ...typography.heading3 },
  modalBody: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  previewBox: {
    height: 220, borderRadius: radius.md, overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
  },
  previewImage: { width: '100%', height: '100%' },
  videoPreviewPlaceholder: { alignItems: 'center', gap: spacing.sm },
  videoPreviewLabel: { ...typography.body },
  fieldLabel: { ...typography.label, letterSpacing: 0.5 },
  notesInput: {
    ...typography.body,
    borderWidth: 1, borderRadius: radius.md,
    padding: spacing.md, minHeight: 80,
  },
  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  primaryBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },
  disabledBtn: { opacity: 0.6 },

  // ── Detail modal ──
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'space-between' },
  detailCloseBtn: { position: 'absolute', top: spacing.xl, right: spacing.md, zIndex: 10 },
  navArrow: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: spacing.sm },
  navArrowLeft: { left: 0 },
  navArrowRight: { right: 0 },
  detailMediaArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  detailImage: { width: '100%', height: '100%' },
  detailVideo: { width: '100%', aspectRatio: 16 / 9 },
  detailPanel: {
    borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.md, gap: spacing.sm,
    maxHeight: '55%',
  },
  detailDate: { ...typography.heading3 },
  detailNotes: { ...typography.body },
  detailActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  detailActionBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs },
  detailActionLabel: { ...typography.body, fontWeight: '600' },
  editFormActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary },
  cancelBtnText: { ...typography.body },
  saveBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm, backgroundColor: colors.primary },
  saveBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '600' },
});
