// QR-kodni rasm yoki video kadridan o'qish.
// Brauzerning o'z o'quvchisi (BarcodeDetector, Android/Chrome) bo'lsa — u, bo'lmasa jsQR (iPhone).

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

let jsQRPromise;
export const getJsQR = () => (jsQRPromise ||= import('jsqr').then((m) => m.default));

// Markazdagi kvadrat: part — kadrning qisqa tomoniga nisbatan ulushi
export function centerSquare(w, h, part) {
  const s = Math.round(Math.min(w, h) * part);
  return [Math.round((w - s) / 2), Math.round((h - s) / 2), s, s];
}

// Kadrning bir qismini (sx, sy, sw, sh) ko'pi bilan `max` pikselga keltirib jsQR bilan o'qiydi.
// Kichik qismni qirqib olish — "raqamli yaqinlashtirish": telefonni uzoqroq tutsa ham o'qiydi.
export function decodeRegion(jsQR, ctx, source, [sx, sy, sw, sh], max, inversion = 'dontInvert') {
  const canvas = ctx.canvas;
  const scale = Math.min(1, max / Math.max(sw, sh));
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(img.data, img.width, img.height, { inversionAttempts: inversion })?.data || null;
}

export const newContext = () => document.createElement('canvas').getContext('2d', { willReadFrequently: true });

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
  const image = await loadImage(file);
  const w = image.naturalWidth || image.width;
  const h = image.naturalHeight || image.height;

  const detector = await getDetector();
  if (detector) {
    try {
      const found = await detector.detect(image);
      if (found[0]?.rawValue) return found[0].rawValue;
    } catch {
      /* jsQR bilan urinib ko'ramiz */
    }
  }

  const jsQR = await getJsQR();
  const ctx = newContext();
  const attempts = [
    [[0, 0, w, h], 1600],
    [centerSquare(w, h, 0.6), 1200],
    [centerSquare(w, h, 0.35), 1000],
    [[0, 0, w, h], 900],
  ];
  for (const [region, max] of attempts) {
    const text = decodeRegion(jsQR, ctx, image, region, max, 'attemptBoth');
    if (text) return text;
  }
  return null;
}
