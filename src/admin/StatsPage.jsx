// Sayt statistikasi: tashriflar, QR orqali natijalar va AI izohlar (server/stats.js)
import { useEffect, useState } from 'react';
import { api } from './api.js';
import { Alert, PageTitle } from './ui.jsx';

// Har bir kartochka bir yoki bir nechta hisoblagich yig'indisi
const CARDS = [
  { id: 'visitors', label: 'Noyob tashrif buyuruvchilar', hint: 'Bir kunda bir odam bir marta sanaladi', metrics: ['uniq:site'] },
  { id: 'views', label: 'Bosh sahifa ochilishi', hint: 'Har bir ochilish', metrics: ['view:home'] },
  { id: 'natija', label: '“Natija” sahifasi ochilishi', hint: 'QR skaner sahifasi', metrics: ['view:natija'] },
  { id: 'results', label: 'Natijalar koʻrildi', hint: 'QR/havola orqali natija ochildi', metrics: ['results:ok'] },
  { id: 'ai', label: 'AI izohlar', hint: 'Yangi + takroriy (keshdan)', metrics: ['ai:new', 'ai:cached'] },
  { id: 'aiNew', label: 'AI izoh: yangi', hint: 'n8n/OpenAI ishlatildi', metrics: ['ai:new'] },
  { id: 'pending', label: 'Natija hali tayyor emas', hint: 'QR skanerlandi, lekin tahlil hali bajarilmoqda', metrics: ['results:pending'] },
  { id: 'botLink', label: '“Telegram’ga yuborish” bosildi', hint: 'Natijalar botiga havola yaratildi', metrics: ['bot:link'] },
  { id: 'botPdf', label: 'Bot: PDF yuborildi', hint: 'Bemor Telegram’da natijani oldi', metrics: ['bot:pdf'] },
  { id: 'botAuto', label: 'Bot: PDF avtomatik yuborildi', hint: 'Natija tayyor boʻlishi bilan bot oʻzi yubordi', metrics: ['bot:auto'] },
  { id: 'botUpdated', label: 'Bot: natijalar yangilandi', hint: 'Yuborilgandan keyin natija toʻldirildi — yangi PDF ketdi', metrics: ['bot:updated'] },
  { id: 'botOperator', label: 'Bot: “operator yuboradi” deb yozildi', hint: 'N kun ichida natija chiqmadi (autsors)', metrics: ['bot:operator'] },
  { id: 'botPending', label: 'Bot: hali tayyor emas', hint: 'Bemor botda oʻzi tekshirdi, natija hali yoʻq', metrics: ['bot:pending'] },
  { id: 'errors', label: 'Muammolar', hint: 'AI xatosi, kunlik chegara, topilmagan natija, bot xatosi', metrics: ['ai:error', 'ai:limit', 'results:notfound', 'bot:error'] },
];
const PERIODS = [
  { key: 'today', label: 'Bugun' },
  { key: 'week', label: '7 kun' },
  { key: 'month', label: '30 kun' },
  { key: 'total', label: 'Jami' },
];

const sum = (obj, metrics) => metrics.reduce((s, m) => s + (Number(obj?.[m]) || 0), 0);

function Chart({ days, card }) {
  const values = days.map((d) => sum(d, card.metrics));
  const max = Math.max(1, ...values);
  return (
    <div className="rounded-xl border border-outline-variant bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-bold text-on-surface">{card.label}: kunlar boʻyicha</h2>
        <span className="text-sm text-on-surface-variant">eng koʻp: {max === 1 && !values.some(Boolean) ? 0 : max}</span>
      </div>
      <div className="flex h-40 items-end gap-[2px]">
        {days.map((d, i) => (
          <div key={d.day} className="group relative flex h-full flex-1 items-end" title={`${d.day}: ${values[i]}`}>
            <div className="w-full rounded-t bg-primary/80 group-hover:bg-primary" style={{ height: `${(values[i] / max) * 100}%`, minHeight: values[i] ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-on-surface-variant">
        <span>{days[0]?.day}</span>
        <span>{days[days.length - 1]?.day}</span>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);
  const [selected, setSelected] = useState('visitors');

  useEffect(() => {
    api(`/site-stats?days=${days}`).then(setData).catch((e) => setError(e.message));
  }, [days]);

  if (!data) return <Alert>{error}</Alert>;
  const card = CARDS.find((c) => c.id === selected);

  return (
    <>
      <PageTitle
        title="Statistika"
        subtitle="Saytga tashriflar va AI izohdan foydalanish. Tashqi xizmatlarsiz va cookie'siz; vaqt — Toshkent boʻyicha."
      />
      <div className="mb-5 overflow-x-auto rounded-xl border border-outline-variant bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-surface-container-low text-left text-on-surface-variant">
              <th className="px-4 py-2.5 font-medium">Koʻrsatkich</th>
              {PERIODS.map((p) => <th key={p.key} className="px-4 py-2.5 text-right font-medium">{p.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {CARDS.map((c) => (
              <tr
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`cursor-pointer border-t border-outline-variant/50 ${selected === c.id ? 'bg-primary-fixed/40' : 'hover:bg-surface-container-low'}`}
              >
                <td className="px-4 py-2.5">
                  <div className="font-medium text-on-surface">{c.label}</div>
                  <div className="text-xs text-on-surface-variant">{c.hint}</div>
                </td>
                {PERIODS.map((p) => (
                  <td key={p.key} className="px-4 py-2.5 text-right text-base font-bold text-on-surface">
                    {c.metrics.reduce((s, m) => s + (data.totals[m]?.[p.key] || 0), 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-on-surface-variant">Grafik:</span>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={`rounded-full px-3 py-1 ${days === d ? 'bg-primary text-on-primary' : 'bg-white text-on-surface ring-1 ring-outline-variant'}`}
          >
            {d} kun
          </button>
        ))}
        <span className="text-on-surface-variant">· jadvaldagi qatorni bosing</span>
      </div>
      <Chart days={data.days} card={card} />
    </>
  );
}
