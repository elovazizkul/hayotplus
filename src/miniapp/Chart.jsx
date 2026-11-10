// Ko'rsatkich grafigi: nuqtalar sana bo'yicha, yashil polosa — me'yor (oxirgi tahlildagi), qizil — me'yordan tashqari.
// Kutubxonasiz, oddiy SVG: tez yuklanadi va Telegram ichida ham, tungi rejimda ham bir xil ishlaydi.
import { fmtDay } from './texts.js';

const W = 320;
const H = 180;
const PAD = { l: 38, r: 14, t: 16, b: 30 };

const nice = (v) => {
  const a = Math.abs(v);
  return a >= 100 ? Math.round(v) : a >= 10 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
};

export default function Chart({ points, normLabel, target }) {
  const pts = points.filter((p) => typeof p.num === 'number');
  if (!pts.length) return null;
  const last = pts[pts.length - 1];
  const low = last.low;
  const high = last.high;
  const goals = [target?.low, target?.high].filter((v) => typeof v === 'number');

  const vals = pts.map((p) => p.num);
  const edges = [low, high, ...goals].filter((v) => typeof v === 'number');
  let min = Math.min(...vals, ...edges);
  let max = Math.max(...vals, ...edges);
  if (low === null && high !== null) min = Math.min(min, 0); // "< 42" → me'yor 0 dan 42 gacha
  if (min === max) {
    min -= Math.abs(min) * 0.2 || 1;
    max += Math.abs(max) * 0.2 || 1;
  }
  const span = max - min;
  min -= span * 0.12;
  max += span * 0.12;
  if (vals.every((v) => v >= 0) && min < 0 && (low === null || low >= 0)) min = Math.max(min, 0);

  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i) => PAD.l + (pts.length === 1 ? iw / 2 : (i * iw) / (pts.length - 1));
  const y = (v) => PAD.t + ih - ((v - min) / (max - min)) * ih;

  const bandTop = high !== null ? y(high) : PAD.t;
  const bandBottom = low !== null ? y(low) : PAD.t + ih;
  const hasBand = low !== null || high !== null;
  const labelEvery = Math.ceil(pts.length / 4);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="grafik" style={{ display: 'block' }}>
      {hasBand && <rect x={PAD.l} y={bandTop} width={iw} height={Math.max(bandBottom - bandTop, 1)} fill="var(--hp-norm)" />}
      {[min + (max - min) * 0.1, (min + max) / 2, max - (max - min) * 0.1].map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--hp-line)" strokeWidth="1" />
          <text x={PAD.l - 6} y={y(v) + 3} fontSize="10" textAnchor="end" fill="var(--hp-muted)">{nice(v)}</text>
        </g>
      ))}
      {goals.map((v) => (
        <line key={`goal-${v}`} x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--hp-goal)" strokeWidth="1.6" strokeDasharray="6 4" />
      ))}
      {pts.length > 1 && (
        <polyline points={pts.map((p, i) => `${x(i)},${y(p.num)}`).join(' ')} fill="none" stroke="var(--hp-primary)" strokeWidth="2" />
      )}
      {pts.map((p, i) => (
        <g key={`${p.order_id}-${i}`}>
          <circle cx={x(i)} cy={y(p.num)} r={i === pts.length - 1 ? 5 : 4} fill={p.flag ? 'var(--hp-bad)' : 'var(--hp-primary)'} stroke="var(--hp-card)" strokeWidth="1.5" />
          {(i % labelEvery === 0 || i === pts.length - 1) && (
            <text x={x(i)} y={H - 10} fontSize="9.5" textAnchor={pts.length === 1 ? 'middle' : i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle'} fill="var(--hp-muted)">{fmtDay(p.day).slice(0, 5)}</text>
          )}
        </g>
      ))}
      <text x={x(pts.length - 1)} y={y(last.num) - 9} fontSize="11" fontWeight="600" textAnchor={pts.length > 1 ? 'end' : 'middle'} fill={last.flag ? 'var(--hp-bad)' : 'var(--hp-text)'}>
        {last.text}
      </text>
      {hasBand && <text x={PAD.l + 4} y={PAD.t - 4} fontSize="9.5" fill="var(--hp-ok)">{normLabel}</text>}
    </svg>
  );
}
