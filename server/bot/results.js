// Tahlil raqamlarini bazaga yozish (3-bosqich). Faqat bemor roziligi bilan chaqiriladi.
// Bir blankning raqamlari har safar to'liq almashtiriladi: natija to'ldirilsa yoki tuzatilsa — eski qatorlar qolmaydi.

import { query, tx } from '../db.js';
import { isoDate, parseRef, parseValue } from './values.js';
import { defaultRemindMonths, isKeyAnalyte } from './key-analytes.js';

const cut = (s, n) => String(s ?? '').trim().slice(0, n);

export async function saveResults(orderId, lab) {
  const measuredOn = isoDate(lab.date);
  return tx(async (c) => {
    await c.query('DELETE FROM lab_results WHERE order_id = $1', [orderId]);
    let rows = 0;
    let newAnalytes = 0;
    for (const g of lab.groups) {
      for (const x of g.items) {
        const name = cut(x.name, 200);
        if (!name) continue;
        const { rows: [a] } = await c.query(
          `INSERT INTO lab_analytes (lis_name, group_title, unit, seen_count, is_key, remind_months) VALUES ($1, $2, $3, 1, $4, $5)
           ON CONFLICT (lis_name, group_title) DO UPDATE SET
             seen_count = lab_analytes.seen_count + 1, last_seen = now(),
             unit = CASE WHEN lab_analytes.unit = '' THEN EXCLUDED.unit ELSE lab_analytes.unit END
           RETURNING id, (xmax = 0) AS inserted`,
          [name, cut(g.title, 120), cut(x.unit, 40), isKeyAnalyte(g.title, name), defaultRemindMonths(name)],
        );
        if (a.inserted) newAnalytes += 1;
        const ref = parseRef(x.ref);
        await c.query(
          `INSERT INTO lab_results (order_id, analyte_id, value_text, value_num, unit, ref_text, ref_low, ref_high, measured_on)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [orderId, a.id, cut(x.value, 100), parseValue(x.value), cut(x.unit, 40), cut(x.ref, 200), ref.low, ref.high, measuredOn],
        );
        rows += 1;
      }
    }
    return { rows, newAnalytes };
  });
}

export const countRows = (lab) => lab.groups.reduce((n, g) => n + g.items.length, 0);

export function logParse(orderId, outcome, { parsed = 0, saved = 0, newAnalytes = 0 } = {}) {
  return query(
    'INSERT INTO parse_log (order_id, outcome, rows_parsed, rows_saved, new_analytes) VALUES ($1, $2, $3, $4, $5)',
    [orderId, outcome, parsed, saved, newAnalytes],
  ).catch((err) => console.error('parse_log:', err.message));
}
