import { useEffect, useRef } from 'react';

// Telefon kamerasi orqali QR-kodni o'qiydi. Android/Chrome'da brauzerning o'z
// o'quvchisi (BarcodeDetector), iPhone'da jsQR kutubxonasi ishlatiladi.
// onResult(text) true qaytarsa — skanerlash to'xtaydi.
export default function QrScanner({ onResult, onError }) {
  const videoRef = useRef(null);
  const handlers = useRef({ onResult, onError });
  handlers.current = { onResult, onError };

  useEffect(() => {
    let stream;
    let raf;
    let stopped = false;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      } catch {
        handlers.current.onError();
        return;
      }
      if (stopped) return stream.getTracks().forEach((t) => t.stop());
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play().catch(() => {});

      let detector = null;
      let jsQR = null;
      try {
        if ('BarcodeDetector' in window && (await window.BarcodeDetector.getSupportedFormats()).includes('qr_code')) {
          detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        }
      } catch {
        detector = null;
      }
      if (!detector) {
        try {
          jsQR = (await import('jsqr')).default;
        } catch {
          handlers.current.onError();
          return;
        }
      }

      const read = async () => {
        if (detector) return (await detector.detect(video))[0]?.rawValue;
        const scale = Math.min(1, 640 / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })?.data;
      };

      let last = 0;
      const tick = async (now) => {
        if (stopped) return;
        if (now - last > 250 && video.readyState >= 2 && video.videoWidth) {
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
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      <video ref={videoRef} playsInline muted autoPlay className="aspect-square w-full object-cover sm:aspect-video" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-2/3 w-2/3 max-w-[260px] rounded-2xl border-4 border-white/80 sm:h-3/4 sm:w-auto sm:aspect-square" />
      </div>
    </div>
  );
}
