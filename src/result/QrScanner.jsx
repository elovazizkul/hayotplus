import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { ui, useLang } from '../i18n.jsx';
import { centerSquare, getDetector, getJsQR, getZXing, grab, newContext } from './decode.js';

// Kvitansiyadagi QR juda zich (49×49 katak): qancha ko'p piksel, shuncha uzoqdan o'qiladi.
// Telefon qo'llasa — 4K, bo'lmasa brauzer eng yaqin sifatni beradi.
const RESOLUTION = { width: { ideal: 3840 }, height: { ideal: 2160 } };

// Kamera sozlamalari bitta chaqiruvda beriladi: applyConstraints avvalgilarini almashtiradi,
// aniqlik ko'rsatilmasa, brauzer kamerani past sifatga (640×480) qaytarishi mumkin.
// Har bir imkoniyat alohida — telefon bittasini qo'llamasa, qolganlari baribir ishlaydi.
function applyCamera(track, { zoom, torch, focus = 'continuous', point }) {
  const advanced = [{ focusMode: focus }];
  if (point) advanced.push({ pointsOfInterest: [point] });
  if (zoom) advanced.push({ zoom });
  if (torch !== null && torch !== undefined) advanced.push({ torch });
  return track.applyConstraints({ ...RESOLUTION, advanced }).catch(() => {});
}

// Telefon kamerasi orqali QR-kodni o'qiydi. onResult(text) true qaytarsa — to'xtaydi.
export default function QrScanner({ onResult, onError }) {
  const { t } = useLang();
  const params = new URLSearchParams(window.location.search);
  const debug = params.has('debug');
  const videoRef = useRef(null);
  const trackRef = useRef(null);
  const settingsRef = useRef({ zoom: null, torch: null });
  const handlers = useRef({ onResult, onError });
  handlers.current = { onResult, onError };

  const [cameras, setCameras] = useState([]);
  const [deviceId, setDeviceId] = useState(null);
  const [zoom, setZoom] = useState(null); // { min, max, value }
  const [torch, setTorch] = useState(null); // null — chiroq yo'q
  const [status, setStatus] = useState({});

  useEffect(() => {
    let stream;
    let timer;
    let stopped = false;
    const ctx = newContext();

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId }, ...RESOLUTION } : { facingMode: { ideal: 'environment' }, ...RESOLUTION },
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
      const zoomCaps = caps.zoom && caps.zoom.max > caps.zoom.min ? caps.zoom : null;
      // Telefon juda yaqinda fokus qila olmaydi: 2x bilan uzoqroqdan aniq ko'rinadi
      const startZoom = zoomCaps ? Math.min(Math.max(2, zoomCaps.min), zoomCaps.max) : null;
      settingsRef.current = { zoom: startZoom, torch: caps.torch ? false : null, focusModes: caps.focusMode || [] };
      setZoom(zoomCaps ? { min: zoomCaps.min, max: zoomCaps.max, value: startZoom } : null);
      setTorch(caps.torch ? false : null);
      await applyCamera(track, settingsRef.current);

      // Bir nechta orqa kamera bo'lsa — almashtirish tugmasi (ba'zi telefonlarda keng burchakli kamera fokus qilmaydi)
      navigator.mediaDevices.enumerateDevices().then((list) => {
        if (stopped) return;
        const videos = list.filter((d) => d.kind === 'videoinput');
        const back = videos.filter((d) => /back|rear|environment|задн|тыл/i.test(d.label));
        setCameras(back.length > 1 ? back : videos);
        // iPhone Pro: "Triple/Dual Wide" kamera yaqinlashganda o'zi makro rejimga o'tadi
        const macro = !deviceId && videos.find((d) => /triple|dual wide/i.test(d.label));
        if (macro && macro.deviceId !== track.getSettings?.().deviceId) setDeviceId(macro.deviceId);
      }).catch(() => {});

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play().catch(() => {});

      const [detector, zxing] = await Promise.all([getDetector(), getZXing()]);
      const jsQR = zxing ? null : await getJsQR().catch(() => null);
      const decode = zxing || jsQR;
      if (!decode && !detector) {
        handlers.current.onError();
        return;
      }

      // Navbat bilan: brauzer o'quvchisi (butun kadr), markaz to'liq aniqlikda,
      // markazning kichik qismi kattalashtirib, butun kadr
      const steps = [];
      if (detector) steps.push(async () => (await detector.detect(video))[0]?.rawValue);
      if (decode) {
        steps.push((w, h) => decode(grab(ctx, video, centerSquare(w, h, 0.65), 1600)));
        steps.push((w, h) => decode(grab(ctx, video, centerSquare(w, h, 0.35), 1100, 2)));
        if (detector) steps.push(async () => (await detector.detect(video))[0]?.rawValue);
        steps.push((w, h) => decode(grab(ctx, video, [0, 0, w, h], 1600)));
      }
      const decoderName = [detector && 'native', zxing ? 'ZXing' : jsQR && 'jsQR'].filter(Boolean).join('+');

      let frame = 0;
      const tick = async () => {
        if (stopped) return;
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (video.readyState >= 2 && w) {
          const started = performance.now();
          const text = await steps[frame % steps.length](w, h).catch(() => null);
          frame += 1;
          if (stopped) return;
          if (frame % 10 === 1 || text) {
            setStatus({ w, h, decoder: decoderName, frames: frame, ms: Math.round(performance.now() - started), label: track.label });
          }
          if (text && handlers.current.onResult(text)) return;
        }
        timer = setTimeout(tick, 80);
      };
      tick();
    })();

    return () => {
      stopped = true;
      clearTimeout(timer);
      trackRef.current = null;
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, [deviceId]);

  const update = (patch) => {
    Object.assign(settingsRef.current, patch);
    if (trackRef.current) applyCamera(trackRef.current, settingsRef.current);
  };

  const setZoomValue = (value) => {
    update({ zoom: value });
    setZoom((z) => ({ ...z, value }));
  };

  const toggleTorch = () => {
    update({ torch: !torch });
    setTorch(!torch);
  };

  // Ekranga bosilganda — shu nuqtaga qayta fokus
  const focusAt = (e) => {
    const track = trackRef.current;
    const modes = settingsRef.current.focusModes || [];
    if (!track || !modes.includes('single-shot')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const point = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
    applyCamera(track, { ...settingsRef.current, focus: 'single-shot', point });
    setTimeout(() => trackRef.current === track && applyCamera(track, settingsRef.current), 2500);
  };

  const nextCamera = () => {
    const current = trackRef.current?.getSettings?.().deviceId;
    const i = cameras.findIndex((c) => c.deviceId === current);
    setDeviceId(cameras[(i + 1) % cameras.length].deviceId);
  };

  const zoomSteps = zoom ? [1, 2, 3].filter((z) => z >= zoom.min && z <= zoom.max) : [];
  const btn = (on) => `flex items-center gap-1.5 rounded-full px-3.5 py-2 font-ui text-label-md ${on ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'}`;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-black" onClick={focusAt}>
        <video ref={videoRef} playsInline muted autoPlay className="aspect-square w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="aspect-square w-[65%] rounded-2xl border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
        </div>
      </div>
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
          <button type="button" onClick={toggleTorch} aria-pressed={torch} className={btn(torch)}>
            <Icon name="flashlight_on" size={18} />
            {t(ui.result.torch)}
          </button>
        )}
        {cameras.length > 1 && (
          <button type="button" onClick={nextCamera} className={btn(false)}>
            <Icon name="cameraswitch" size={18} />
            {t(ui.result.switchCamera)}
          </button>
        )}
      </div>
      {status.w && (
        <p className="text-center font-ui text-label-xs text-on-surface-variant">
          {t(ui.result.searching)} · {status.w}×{status.h} · {status.decoder} · {status.frames}
          {debug && ` · ${status.ms} ms · ${status.label} · zoom ${zoom ? `${zoom.min}–${zoom.max}` : '—'}`}
        </p>
      )}
    </div>
  );
}
