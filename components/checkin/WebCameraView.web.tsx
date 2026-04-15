import { useRef, useEffect, useState } from 'react';

type Props = {
  facing: 'front' | 'back';
  onQRDetected: (data: string) => void;
};

declare class BarcodeDetector {
  constructor(options: { formats: string[] });
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
  static getSupportedFormats(): Promise<string[]>;
}

export function WebCameraView({ facing, onQRDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const onQRDetectedRef = useRef(onQRDetected);
  onQRDetectedRef.current = onQRDetected;
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
      setUnsupported(true);
      return;
    }
    detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      // Stop any previous stream/scan loop
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }

      // Enumerate devices — labels are available because permission was already granted
      let constraints: MediaStreamConstraints;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');

        let target: MediaDeviceInfo | undefined;
        if (facing === 'back') {
          target =
            videoDevices.find(d => /back|rear|environment/i.test(d.label)) ??
            (videoDevices.length > 1 ? videoDevices[videoDevices.length - 1] : undefined);
        } else {
          target =
            videoDevices.find(d => /front|user|selfie|facetime/i.test(d.label)) ??
            videoDevices[0];
        }

        constraints = target?.deviceId
          ? { video: { deviceId: { exact: target.deviceId } } }
          : { video: { facingMode: facing === 'back' ? 'environment' : 'user' } };
      } catch {
        constraints = { video: { facingMode: facing === 'back' ? 'environment' : 'user' } };
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        scan();
      } catch (err) {
        console.error('[WebCameraView] getUserMedia error:', err);
      }
    }

    function scan() {
      if (cancelled || !detectorRef.current || !videoRef.current) return;
      const video = videoRef.current;
      if (video.readyState < 2) { rafRef.current = requestAnimationFrame(scan); return; }

      detectorRef.current.detect(video)
        .then(results => {
          if (results.length > 0 && !cancelled) onQRDetectedRef.current(results[0].rawValue);
          if (!cancelled) rafRef.current = requestAnimationFrame(scan);
        })
        .catch(() => { if (!cancelled) rafRef.current = requestAnimationFrame(scan); });
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    };
  }, [facing]);

  if (unsupported) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#fff', textAlign: 'center', padding: 24, fontSize: 15 }}>
        QR scanning is not supported in this browser.{'\n'}Please use Chrome on Android or Safari 17.4+ on iOS.
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as React.CSSProperties}
    />
  );
}
