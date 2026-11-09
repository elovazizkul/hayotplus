// Laboratoriya blankini PDF qilish: ToDevelop sahifasini server ichidagi brauzer (Chromium) "chop etadi".
// Bemor laboratoriya beradigan asl blankni oladi. PDF faqat xotirada — diskka va bazaga yozilmaydi.
// Xavfsizlik: JavaScript o'chirilgan, sahifani faqat o'zimiz olgan HTML'dan quramiz (boshqa saytga o'tib bo'lmaydi),
// tashqaridan faqat uslub, shrift va rasmlar yuklanadi.

import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { LIS_HOST } from '../lis.js';

const CANDIDATES = [process.env.CHROMIUM_PATH, '/usr/bin/chromium-browser', '/usr/bin/chromium'].filter(Boolean);
const executablePath = () => CANDIDATES.find((p) => existsSync(p));

const ALLOWED = new Set(['stylesheet', 'image', 'font']);

// Bir vaqtda bitta PDF: Chromium ko'p xotira oladi
let chain = Promise.resolve();
const serial = (fn) => {
  const run = chain.then(fn, fn);
  chain = run.catch(() => {});
  return run;
};

const BASE = `<base href="https://${LIS_HOST}/q/r/">`;
const prepare = (html) => {
  const s = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  return /<head\b[^>]*>/i.test(s) ? s.replace(/<head\b[^>]*>/i, (m) => `${m}${BASE}`) : `${BASE}${s}`;
};

export function renderPdf(html) {
  return serial(async () => {
    const path = executablePath();
    if (!path) throw new Error('Chromium topilmadi');
    const browser = await puppeteer.launch({
      executablePath: path,
      headless: true,
      // Konteyner ichida: sandbox o'rniga JS o'chirilgan va faqat ishonchli HTML
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-first-run', '--mute-audio'],
    });
    try {
      const page = await browser.newPage();
      await page.setJavaScriptEnabled(false);
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const ok = req.method() === 'GET' && ALLOWED.has(req.resourceType()) && /^(https:|data:)/.test(req.url());
        (ok ? req.continue() : req.abort()).catch(() => {});
      });
      await page.setContent(prepare(html), { waitUntil: 'load', timeout: 20000 }).catch((err) => {
        if (err.name !== 'TimeoutError') throw err; // sekin shrift/rasm — baribir chop etamiz
      });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close().catch(() => {});
    }
  });
}
