// QR-kodni rasm yoki video kadridan o'qish. Uchta o'quvchi:
// - ZXing (zxing-wasm) — asosiy, xira va mayda kodlarni eng yaxshi o'qiydi; fayl saytning o'zidan yuklanadi;
// - brauzerning o'z o'quvchisi (BarcodeDetector) — Android/Chrome'da qo'shimcha;
// - jsQR — ZXing yuklanmasa, zaxira.

let detectorPromise;
export function getDetector() {
  detectorPromise ||= (async () => {
    try {
      if ('BarcodeDetector' in window && (await window.BarcodeDetector.getSupportedFormats()).includes('qr_code')) {
        return new window.BarcodeDetector({ formats: ['qr_code'] });
      }
    } catch {
      /* qo'llab-quvvatlanmaydi */
    }
    return null;
  })();
  return detectorPromise;
}

// (ImageData | Blob) → matn yoki null
let zxingPromise;
export function getZXing() {
  zxingPromise ||= (async () => {
    try {
      const [{ prepareZXingModule, readBarcodes }, { default: wasmUrl }] = await Promise.all([
        import('zxing-wasm/reader'),
        import('zxing-wasm/reader/zxing_reader.wasm?url'),
      ]);
      await prepareZXingModule({
        overrides: { locateFile: (path, prefix) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) },
        fireImmediately: true,
      });
      return async (input) =>
        (await readBarcodes(input, { formats: ['QRCode'], tryHarder: true, tryInvert: true, maxNumberOfSymbols: 1 }))[0]?.text || null;
    } catch (err) {
      console.error('ZXing yuklanmadi:', err);
      return null;
    }
  })();
  return zxingPromise;
}

// ImageData → matn yoki null
let jsQRPromise;
export function getJsQR() {
  jsQRPromise ||= import('jsqr').then(
    (m) => (img, inversion = 'dontInvert') => m.default(img.data, img.width, img.height, { inversionAttempts: inversion })?.data || null,
  );
  return jsQRPromise;
}

// Markazdagi kvadrat: part — kadrning qisqa tomoniga nisbatan ulushi
export function centerSquare(w, h, part) {
  const s = Math.round(Math.min(w, h) * part);
  return [Math.round((w - s) / 2), Math.round((h - s) / 2), s, s];
}

export const newContext = () => document.createElement('canvas').getContext('2d', { willReadFrequently: true });

// Kadrning bir qismini (sx, sy, sw, sh) `max` pikselga keltiradi (upTo — necha martagacha kattalashtirish mumkin).
// Kichik qismni olish — "raqamli yaqinlashtirish": telefonni uzoqroq tutsa ham o'qiladi.
export function grab(ctx, source, [sx, sy, sw, sh], max, upTo = 1) {
  const canvas = ctx.canvas;
  const scale = Math.min(upTo, max / Math.max(sw, sh));
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

async function loadImage(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* eski brauzer — pastdagi usul */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

// Telefon kamerasi ilovasida olingan surat: to'liq aniqlik va avtofokus bilan
export async function decodeImageFile(file) {
  const zxing = await getZXing();
  if (zxing) {
    try {
      const text = await zxing(file); // ZXing o'zi turli o'lchamlarda qidiradi
      if (text) return text;
    } catch {
      /* boshqa usullar bilan */
    }
  }

  const image = await loadImage(file);
  const w = image.naturalWidth || image.width;
  const h = image.naturalHeight || image.height;

  const detector = await getDetector();
  if (detector) {
    try {
      const found = await detector.detect(image);
      if (found[0]?.rawValue) return found[0].rawValue;
    } catch {
      /* davom etamiz */
    }
  }

  const ctx = newContext();
  const regions = [
    [centerSquare(w, h, 0.6), 1600],
    [centerSquare(w, h, 0.3), 1200],
    [[0, 0, w, h], 2000],
  ];
  if (zxing) {
    for (const [region, max] of regions) {
      const text = await zxing(grab(ctx, image, region, max)).catch(() => null);
      if (text) return text;
    }
  }
  const jsQR = await getJsQR();
  for (const [region, max] of regions) {
    const text = jsQR(grab(ctx, image, region, Math.min(max, 1400)), 'attemptBoth');
    if (text) return text;
  }
  return null;
}
