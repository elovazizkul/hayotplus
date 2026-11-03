import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { ui, useLang } from '../i18n.jsx';
import { centerSquare, decodeRegion, getDetector, getJsQR, newContext } from './decode.js';

// Telefon kamerasi orqali QR-kodni o'qiydi.
// - yuqori aniqlik (Full HD) so'raladi, avtofokus doimiy rejimda;
// - kamera qo'llasa — optik/raqamli yaqinlashtirish (1x/2x/3x) va chiroq;
// - jsQR kadr markazini ham alohida o'qiydi: telefonni uzoqroq tutsa ham ishlaydi.
// onResult(text) true qaytarsa — skanerlash to'xtaydi.
export default function QrScanner({ onResult, onError }) {
  const { t } = useLang();
  const videoRef = useRef(null);
  const trackRef = useRef(null);
  const handlers = useRef({ onResult, onError });
  handlers.current = { onResult, onError };
  const [zoom, setZoom] = useState(null); // { min, max, value }
  const [torch, setTorch] = useState(null); // null — chiroq yo'q, true/false — holati

  useEffect(() => {
    let stream;
    let raf;
    let stopped = false;
    const ctx = newContext();

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
      } catch {
        handlers.current.onError();
        return;
      }
      if (stopped) return stream.getTracks().forEach((tr) => tr.stop());

      const track = stream.getVideoTracks()[0];
      trackRef.current = track;
      const caps = track.getCapabilities?.() || {};
      if (caps.focusMode?.includes('continuous')) {
        track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
      }
      if (caps.zoom && caps.zoom.max > caps.zoom.min) {
        // Telefon yaqin masofada fokus qila olmaydi: 2x bilan uzoqroqdan aniq ko'rinadi
        const value = Math.min(Math.max(2, caps.zoom.min), caps.zoom.max);
        track.applyConstraints({ advanced: [{ zoom: value }] }).catch(() => {});
        setZoom({ min: caps.zoom.min, max: caps.zoom.max, value });
      }
      if (caps.torch) setTorch(false);

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play().catch(() => {});

      const detector = await getDetector();
      let jsQR = null;
      if (!detector) {
        try {
          jsQR = await getJsQR();
        } catch {
          handlers.current.onError();
          return;
        }
      }

      let frame = 0;
      const read = async () => {
        if (detector) return (await detector.detect(video))[0]?.rawValue;
        const w = video.videoWidth;
        const h = video.videoHeight;
        // Navbat bilan: markaz, markazning kichik qismi (uzoqdagi QR uchun), butun kadr
        const step = frame++ % 3;
        if (step === 0) return decodeRegion(jsQR, ctx, video, centerSquare(w, h, 0.65), 900);
        if (step === 1) return decodeRegion(jsQR, ctx, video, centerSquare(w, h, 0.35), 700);
        return decodeRegion(jsQR, ctx, video, [0, 0, w, h], 960);
      };

      let last = 0;
      const tick = async (now) => {
        if (stopped) return;
        if (now - last > 150 && video.readyState >= 2 && video.videoWidth) {
          last = now;
          const text = await read().catch(() => null);
          if (stopped) return;
          if (text && handlers.current.onResult(text)) return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      trackRef.current = null;
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  const setZoomValue = (value) => {
    trackRef.current?.applyConstraints({ advanced: [{ zoom: value }] }).catch(() => {});
    setZoom((z) => ({ ...z, value }));
  };

  const toggleTorch = () => {
    const next = !torch;
    trackRef.current?.applyConstraints({ advanced: [{ torch: next }] }).then(() => setTorch(next)).catch(() => setTorch(null));
  };

  const zoomSteps = zoom ? [1, 2, 3].filter((z) => z >= zoom.min && z <= zoom.max) : [];

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-black">
        <video ref={videoRef} playsInline muted autoPlay className="aspect-square w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="aspect-square w-[65%] rounded-2xl border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
        </div>
      </div>
      {(zoomSteps.length > 1 || torch !== null) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {zoomSteps.length > 1 && (
            <div className="flex rounded-full bg-surface-container p-1" role="group" aria-label={t(ui.result.zoom)}>
              {zoomSteps.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZoomValue(z)}
                  aria-pressed={Math.round(zoom.value) === z}
                  className={`rounded-full px-3.5 py-1.5 font-ui text-label-md ${Math.round(zoom.value) === z ? 'bg-primary text-on-primary' : 'text-on-surface'}`}
                >
                  {z}x
                </button>
              ))}
            </div>
          )}
          {torch !== null && (
            <button
              type="button"
              onClick={toggleTorch}
              aria-pressed={torch}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 font-ui text-label-md ${torch ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'}`}
            >
              <Icon name="flashlight_on" size={18} />
              {t(ui.result.torch)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
