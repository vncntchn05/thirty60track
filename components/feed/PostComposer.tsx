import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, useTheme } from '@/constants/theme';
import { createPost, uploadPostImage } from '@/hooks/useFeed';
import type { UserRole } from '@/lib/auth';

type Props = {
  authorId: string;
  authorName: string;
  authorRole: NonNullable<UserRole>;
  onPosted: () => void;
};

export function PostComposer({ authorId, authorName, authorRole, onPosted }: Props) {
  const t = useTheme();
  const [body, setBody] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickImage() {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Photo library access is required to attach images.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handlePost() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);

    let image_url: string | null = null;
    if (imageUri) {
      const { url, error: uploadErr } = await uploadPostImage(imageUri, authorId);
      if (uploadErr) {
        setError(`Image upload failed: ${uploadErr}`);
        setSubmitting(false);
        return;
      }
      image_url = url;
    }

    const { error: postErr } = await createPost({
      body: trimmed,
      author_role: authorRole,
      author_name: authorName,
      image_url,
    });

    setSubmitting(false);
    if (postErr) {
      setError(postErr);
      return;
    }

    setBody('');
    setImageUri(null);
    onPosted();
  }

  const canPost = body.trim().length > 0 && !submitting;

  return (
    <View style={[styles.container, { backgroundColor: t.surface, borderColor: t.border }]}>
      {/* Avatar + input row */}
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Ionicons
            name={authorRole === 'trainer' ? 'person' : 'body'}
            size={18}
            color={colors.primary}
          />
        </View>
        <TextInput
          style={[styles.input, { color: t.textPrimary, borderColor: t.border }]}
          placeholder="Share something with the community…"
          placeholderTextColor={t.textSecondary}
          value={body}
          onChangeText={setBody}
          multiline
          maxLength={1000}
        />
      </View>

      {/* Image preview */}
      {imageUri ? (
        <View style={styles.imagePreviewWrap}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
          <TouchableOpacity
            style={styles.removeImageBtn}
            onPress={() => setImageUri(null)}
          >
            <Ionicons name="close-circle" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Error */}
      {error ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      ) : null}

      {/* Footer: attach + post */}
      <View style={[styles.footer, { borderTopColor: t.border }]}>
        <TouchableOpacity style={styles.attachBtn} onPress={pickImage} disabled={submitting}>
          <Ionicons name="image-outline" size={22} color={t.textSecondary} />
          <Text style={[styles.attachLabel, { color: t.textSecondary }]}>Photo</Text>
        </TouchableOpacity>

        {submitting ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <TouchableOpacity
            style={[styles.postBtn, { backgroundColor: canPost ? colors.primary : t.border }]}
            onPress={handlePost}
            disabled={!canPost}
          >
            <Text style={[styles.postBtnLabel, { color: canPost ? '#000' : t.textSecondary }]}>
              Post
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    margin: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryDark + '33',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  input: {
    flex: 1,
    ...typography.body,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    padding: spacing.sm,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  imagePreviewWrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: 180 },
  removeImageBtn: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
  errorText: { ...typography.bodySmall, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  attachBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  attachLabel: { ...typography.bodySmall, fontWeight: '500' },
  postBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  postBtnLabel: { ...typography.label, fontWeight: '700' },
});
