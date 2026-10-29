# Hayot Plus Med — laboratoriya sayti

Google Stitch'da chizilgan dizayn asosida React (Vite + Tailwind) da qurilgan sayt.
Vercel'da doimiy ishlashga tayyor: GitHub'ga o'zgarish saqlansa, sayt avtomatik yangilanadi.

**Saytdagi bo'limlar:** Bosh sahifa · Afzalliklar · Manzillar (haqiqiy xarita) · Narxlar (qidiruv, toifalar, tahlil tanlash) · Check-up paketlar · Emlash (onlayn yozilish) · AI yordamchi · Aloqa · O'zbekcha/Ruscha til.

---

## 1. Vercel'ga joylash (bir marta, ~5 daqiqa)

1. https://vercel.com ga kiring → **Sign up / Log in with GitHub**.
2. **Add New… → Project** → ro'yxatdan `hayot-plus-med` repozitoriyasini tanlang → **Import**.
3. Hech narsani o'zgartirmang (Vercel o'zi "Vite" deb taniydi) → **Deploy**.
4. 1–2 daqiqadan keyin sayt `https://hayot-plus-med-xxxx.vercel.app` manzilida ochiladi.

Shu paytdan boshlab sayt doimiy ishlaydi. Bepul (Hobby) tarif bunday sayt uchun yetarli.

## 2. Sozlamalar (kalitlar) — Vercel → Project → Settings → Environment Variables

| Nomi | Nima uchun | Qayerdan olinadi |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Emlash va aloqa arizalari Telegram'ga kelishi uchun | Telegram'da @BotFather → `/newbot` |
| `TELEGRAM_CHAT_ID` | Arizalar tushadigan guruh | Botni guruhga qo'shing, guruhga xabar yozing, so'ng `https://api.telegram.org/bot<TOKEN>/getUpdates` ni oching — `"chat":{"id":-100...}` |
| `ANTHROPIC_API_KEY` | AI yordamchi haqiqiy AI bilan javob berishi uchun | https://console.anthropic.com → API Keys |
| `ANTHROPIC_MODEL` | (ixtiyoriy) model nomi | bo'sh qoldirsangiz `claude-haiku-5-5` |
| `LEAD_WEBHOOK_URL` | (ixtiyoriy) arizalarni n8n'ga ham yuborish | n8n → Webhook node → Production URL |

Kalit qo'shgandan keyin: **Deployments → oxirgisi → ⋯ → Redeploy**.

- Telegram kalitlari kiritilmaguncha formalar "yuborib bo'lmadi, qo'ng'iroq qiling" deb ko'rsatadi (ariza yo'qolib ketmasligi uchun ataylab shunday).
- AI kaliti bo'lmasa ham chat ishlaydi — tayyor javoblar (`src/data/faq.js`) bilan.
- API kalitlar faqat Vercel serverida turadi, sayt tashrifchilariga ko'rinmaydi.

## 3. Ma'lumotlarni o'zgartirish

Barcha matn va raqamlar `src/data/` papkasida — kod bilmasdan tahrirlasa bo'ladi:

| Fayl | Ichida |
|---|---|
| `src/data/site.js` | telefon, Telegram, Instagram, ish vaqti, litsenziya, rasm |
| `src/data/branches.js` | filiallar: manzil, telefon, ish vaqti, xaritadagi joy (lat/lng) |
| `src/data/prices.js` | tahlillar narxi, toifalar, check-up paketlar |
| `src/data/vaccines.js` | vaksinalar va emlash qoidalari |
| `src/data/faq.js` | AI chatdagi tayyor savol-javoblar |
| `src/i18n.jsx` | saytdagi qolgan matnlar (sarlavhalar, tugmalar) — uz/ru |

**Eng oson yo'l (kompyutersiz ham):** GitHub'da faylni oching → ✏️ (Edit) → o'zgartiring → **Commit changes**. Vercel 1–2 daqiqada saytni yangilaydi.

AI yordamchi narx/filial ma'lumotlarini shu fayllardan avtomatik oladi — alohida "o'rgatish" shart emas.

> ⚠️ Fayllarda `TEKSHIRING` deb belgilangan joylar Stitch o'ylab topgan namunalar (manzillar, telefonlar, narxlar, ISO 15189, 99.8%). E'lon qilishdan oldin haqiqiysi bilan almashtiring.

**O'z rasmingizni qo'yish:** laboratoriya suratini `public/hero.jpg` nomi bilan yuklang va `src/data/site.js` da `heroImage: '/hero.jpg'` deb yozing.

**O'z domeningiz (masalan hayotplus.uz):** Vercel → Settings → Domains → domenni kiriting va ko'rsatilgan DNS yozuvlarini domen sotib olgan joyingizda qo'shing.

## 4. Kompyuterda ishga tushirish (ixtiyoriy)

Node.js 18+ kerak.

```bash
npm install
npm run dev      # http://localhost:5173 — sayt (AI va formalar faqat Vercel'da ishlaydi)
npm run build    # tayyor versiyani dist/ papkaga yig'ish
```

AI va formalarni ham lokal sinash uchun: `npm i -g vercel` → `vercel dev`.

## 5. Tuzilma

```
api/chat.js         AI yordamchi (Claude API) — Vercel serverless funksiya
api/lead.js         Formalar → Telegram / n8n
src/data/*.js       Saytdagi barcha ma'lumotlar (shu yerni tahrirlang)
src/components/     Bo'limlar (Header, Hero, Branches, Prices, Vaccination, AiChat, Contact, Footer)
src/i18n.jsx        O'zbek/rus matnlari va til almashtirish
public/             Logo, favicon, rasmlar
```

Ikonkalar: [Material Symbols](https://fonts.google.com/icons). Yangi ikonka uchun `<Icon name="nom" />` yozish kifoya — kerakli ikonkalar ro'yxati build paytida avtomatik tuziladi.

Xarita: OpenStreetMap (bepul, kalit kerak emas). "Xaritada ko'rish" — Yandex, "Yo'nalish olish" — Google Maps.
