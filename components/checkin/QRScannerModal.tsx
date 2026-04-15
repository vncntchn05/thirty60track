import { useState, useRef, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { recordCheckin } from '@/hooks/useCheckins';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

type Props = {
  visible: boolean;
  trainerId: string;
  onClose: () => void;
  /** Optional: called with the client name after a successful scan */
  onCheckinRecorded?: (clientName: string) => void;
};

const QR_PAYLOAD_TYPE = 'thirty60_checkin';

export function QRScannerModal({ visible, trainerId, onClose, onCheckinRecorded }: Props) {
  const t = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [webPermState, setWebPermState] = useState<'idle' | 'pending' | 'granted' | 'denied'>('idle');
  const [webPermError, setWebPermError] = useState<string>('');
  const cooldown = useRef(false);

  // On web, getUserMedia triggers the browser's native permission prompt.
  // expo-camera's useCameraPermissions hook does not reliably do this on web.
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
      .then(stream => {
        // Release the stream — CameraView will open its own.
        stream.getTracks().forEach(t => t.stop());
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

    let payload: { type: string; clientId: string } | null = null;
    try {
      payload = JSON.parse(data);
    } catch {
      setStatus('error');
      setStatusMsg('Invalid QR code — not a thirty60track check-in code.');
      return;
    }

    if (payload?.type !== QR_PAYLOAD_TYPE || !payload?.clientId) {
      setStatus('error');
      setStatusMsg('Invalid QR code — not a thirty60track check-in code.');
      return;
    }

    // Verify the client belongs to this trainer
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('id, full_name')
      .eq('id', payload.clientId)
      .single();

    if (clientErr || !client) {
      setStatus('error');
      setStatusMsg('Client not found. Make sure this client is in your roster.');
      return;
    }

    const { error } = await recordCheckin({ clientId: client.id, trainerId });
    if (error) {
      setStatus('error');
      setStatusMsg(`Check-in failed: ${error}`);
      return;
    }

    setStatus('success');
    setStatusMsg(`${client.full_name} checked in!`);
    onCheckinRecorded?.(client.full_name);
  }

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: t.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: t.border }]}>
          <Text style={[styles.title, { color: t.textPrimary }]}>Scan Client QR</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color={t.textPrimary as string} />
          </TouchableOpacity>
        </View>

        {/* Camera / permission / result area */}
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
        ) : status !== 'idle' ? (
          /* Result screen */
          <View style={styles.centered}>
            <Ionicons
              name={status === 'success' ? 'checkmark-circle' : 'close-circle'}
              size={72}
              color={status === 'success' ? colors.success : colors.error}
            />
            <Text style={[styles.resultMsg, { color: t.textPrimary }]}>{statusMsg}</Text>
            <TouchableOpacity
              style={[styles.scanAgainBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setStatus('idle');
                setStatusMsg('');
                setScanning(true);
                cooldown.current = false;
              }}
            >
              <Text style={styles.scanAgainText}>Scan Another</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Live camera */
          <View style={styles.cameraWrap}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing={facing}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarcode}
            />
            {/* Targeting reticle */}
            <View style={styles.reticleWrap} pointerEvents="none">
              <View style={[styles.reticle, { borderColor: colors.primary }]}>
                <View style={[styles.corner, styles.cornerTL, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.cornerTR, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.cornerBL, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.cornerBR, { borderColor: colors.primary }]} />
              </View>
              <Text style={styles.reticleHint}>Point camera at client's QR code</Text>
            </View>
            {/* Flip camera button */}
            <TouchableOpacity
              style={styles.flipBtn}
              onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
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
    paddingTop: 56, // safe area
  },
  title: { ...typography.heading3 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
  permText: { ...typography.heading3, textAlign: 'center' },
  permBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.sm,
  },
  permBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },
  resultMsg: { ...typography.heading3, textAlign: 'center', paddingHorizontal: spacing.lg },
  scanAgainBtn: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, marginTop: spacing.sm,
  },
  scanAgainText: { ...typography.body, fontWeight: '700', color: colors.textInverse },
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
