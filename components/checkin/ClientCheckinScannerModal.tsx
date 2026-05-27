import { useState, useRef, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { WebCameraView } from './WebCameraView';
import { Ionicons } from '@expo/vector-icons';
import { selfCheckin } from '@/hooks/useCheckins';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

type Props = {
  visible: boolean;
  clientId: string;
  onClose: () => void;
  /** Called after the check-in is recorded successfully. */
  onCheckedIn?: () => void;
};

/**
 * Returns true if the scanned QR value points at the gym check-in URL.
 * Accepts any URL whose path component ends with /checkin so the gym can
 * rotate the host (e.g. staging vs production) without invalidating signs.
 */
function isCheckinUrl(value: string): boolean {
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    const path = url.pathname.replace(/\/+$/, '');
    return path.endsWith('/checkin');
  } catch {
    // Not a URL — accept the bare path too in case the QR encodes a relative ref.
    return /\/checkin\/?(?:\?|$)/.test(trimmed);
  }
}

export function ClientCheckinScannerModal({ visible, clientId, onClose, onCheckedIn }: Props) {
  const t = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [webPermState, setWebPermState] = useState<'idle' | 'pending' | 'granted' | 'denied'>('idle');
  const [webPermError, setWebPermError] = useState<string>('');
  const cooldown = useRef(false);

  // On web, prompt for camera access explicitly — expo-camera's hook doesn't
  // reliably trigger the browser permission dialog here.
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    if (!navigator?.mediaDevices?.getUserMedia) {
      setWebPermError('mediaDevices API not available');
      setWebPermState('denied');
      return;
    }
    setWebPermState('pending');
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        stream.getTracks().forEach((track) => track.stop());
        setWebPermState('granted');
      })
      .catch((err: unknown) => {
        setWebPermError(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
        setWebPermState('denied');
      });
  }, [visible]);

  function handleClose() {
    setScanning(true);
    setStatus('idle');
    setStatusMsg('');
    setWebPermState('idle');
    cooldown.current = false;
    onClose();
  }

  async function handleBarcode({ data }: { data: string }) {
    if (!scanning || cooldown.current) return;
    cooldown.current = true;
    setScanning(false);

    if (!isCheckinUrl(data)) {
      setStatus('error');
      setStatusMsg('That QR code is not a thirty60track gym check-in code. Point your camera at the master QR posted at the gym.');
      return;
    }

    const { error } = await selfCheckin(clientId);
    if (error) {
      setStatus('error');
      setStatusMsg(`Check-in failed: ${error}`);
      return;
    }

    setStatus('success');
    setStatusMsg('Your visit has been recorded.');
    onCheckedIn?.();
  }

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: t.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: t.border }]}>
          <Text style={[styles.title, { color: t.textPrimary }]}>Scan Gym QR</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color={t.textPrimary as string} />
          </TouchableOpacity>
        </View>

        {Platform.OS === 'web' && webPermState === 'pending' ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.permText, { color: t.textPrimary }]}>Requesting camera…</Text>
          </View>
        ) : Platform.OS === 'web' && webPermState === 'denied' ? (
          <View style={styles.centered}>
            <Ionicons name="camera-outline" size={52} color={t.textSecondary as string} />
            <Text style={[styles.permText, { color: t.textPrimary }]}>
              Camera unavailable. Make sure the page is loaded over HTTPS and camera access is allowed in your browser settings.{webPermError ? `\n\n(${webPermError})` : ''}
            </Text>
          </View>
        ) : Platform.OS !== 'web' && !permission ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : Platform.OS !== 'web' && !permission?.granted ? (
          <View style={styles.centered}>
            <Ionicons name="camera-outline" size={52} color={t.textSecondary as string} />
            <Text style={[styles.permText, { color: t.textPrimary }]}>Camera permission needed</Text>
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnText}>Allow Camera</Text>
            </TouchableOpacity>
          </View>
        ) : status === 'success' ? (
          <View style={styles.centered}>
            <Ionicons name="checkmark-circle" size={72} color={colors.success} />
            <Text style={[styles.resultMsg, { color: t.textPrimary }]}>Checked In!</Text>
            <Text style={[styles.resultSub, { color: t.textSecondary }]}>{statusMsg}</Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={handleClose}
            >
              <Text style={styles.primaryBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : status === 'error' ? (
          <View style={styles.centered}>
            <Ionicons name="close-circle" size={72} color={colors.error} />
            <Text style={[styles.resultMsg, { color: t.textPrimary }]}>Couldn't Check In</Text>
            <Text style={[styles.resultSub, { color: t.textSecondary }]}>{statusMsg}</Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setStatus('idle');
                setStatusMsg('');
                setScanning(true);
                cooldown.current = false;
              }}
            >
              <Text style={styles.primaryBtnText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            {Platform.OS === 'web' ? (
              <WebCameraView
                key={facing}
                facing={facing}
                onQRDetected={(data) => handleBarcode({ data })}
              />
            ) : (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing={facing}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarcode}
              />
            )}
            <View style={styles.reticleWrap} pointerEvents="none">
              <View style={[styles.reticle, { borderColor: colors.primary }]}>
                <View style={[styles.corner, styles.cornerTL, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.cornerTR, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.cornerBL, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.cornerBR, { borderColor: colors.primary }]} />
              </View>
              <Text style={styles.reticleHint}>Point camera at the gym check-in QR</Text>
            </View>
            <TouchableOpacity
              style={styles.flipBtn}
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="camera-reverse-outline" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const CORNER = 24;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 56,
  },
  title: { ...typography.heading3 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
  permText: { ...typography.heading3, textAlign: 'center' },
  permBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.sm,
  },
  permBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },
  resultMsg: { ...typography.heading2, textAlign: 'center' },
  resultSub: { ...typography.body, textAlign: 'center', paddingHorizontal: spacing.lg },
  primaryBtn: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.sm,
    marginTop: spacing.sm, minWidth: 160, alignItems: 'center',
  },
  primaryBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },
  cameraWrap: { flex: 1, position: 'relative' },
  flipBtn: {
    position: 'absolute', bottom: spacing.xl, right: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 32,
    padding: spacing.sm,
  },
  reticleWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', gap: spacing.lg,
  },
  reticle: {
    width: 240, height: 240,
    position: 'relative',
  },
  corner: {
    position: 'absolute', width: CORNER, height: CORNER, borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  reticleHint: {
    color: '#fff', ...typography.body, fontWeight: '600',
    textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
});
