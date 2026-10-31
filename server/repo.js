// Barcha o'qish/yozish amallari shu yerda. Admin panel va MCP aynan shu
// funksiyalarni chaqiradi, shuning uchun tekshiruv va tarix ikkalasida bir xil.

import { query, tx } from './db.js';
import { refreshContent } from './content.js';
import { resources, tableOf } from './resources.js';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const res = (name, op) => {
  const r = Object.hasOwn(resources, name) ? resources[name] : null;
  if (!r) throw new ApiError(404, `Bunday boʻlim yoʻq: ${name}`);
  if (op && !r.ops.includes(op)) throw new ApiError(405, `“${r.label}” boʻlimida bu amal mumkin emas`);
  return r;
};

const checkId = (r, id) => {
  if (r.numericId && !/^\d+$/.test(String(id))) throw new ApiError(400, 'ID raqam boʻlishi kerak');
  return id;
};

const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[ʻʼ‘’`'´]/g, '')
    .replace(/[^a-z0-9а-яё]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

const random = () => Math.random().toString(36).slice(2, 7);

// Kelgan ma'lumotni maydon tavsifi bo'yicha tekshiradi va tozalaydi
function clean(r, input, { partial }) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApiError(400, 'Maʼlumot obyekt boʻlishi kerak');
  const byName = new Map(r.fields.map((f) => [f.name, f]));
  const out = {};
  const errors = [];

  for (const [key, raw] of Object.entries(input)) {
    if (key === 'id') continue;
    const f = byName.get(key);
    if (!f) {
      errors.push(`nomaʼlum maydon: ${key}`);
      continue;
    }
    if (f.readOnly) {
      errors.push(`${f.label}: oʻzgartirib boʻlmaydi`);
      continue;
    }
    let v = raw;
    switch (f.type) {
      case 'int':
      case 'number': {
        v = typeof raw === 'string' ? Number(raw.replace(/\s/g, '').replace(',', '.')) : raw;
        if (raw === '' || typeof v !== 'number' || !Number.isFinite(v) || (f.type === 'int' && !Number.isInteger(v))) {
          errors.push(`${f.label}: raqam kerak`);
          continue;
        }
        if (f.min !== undefined && v < f.min) {
          errors.push(`${f.label}: ${f.min} dan kichik boʻlmasin`);
          continue;
        }
        break;
      }
      case 'bool':
        if (typeof v !== 'boolean') {
          errors.push(`${f.label}: true yoki false kerak`);
          continue;
        }
        break;
      case 'tags':
        v = Array.isArray(raw) ? raw : String(raw ?? '').split(',');
        v = v.map((x) => String(x).trim()).filter(Boolean).slice(0, 50);
        break;
      case 'select':
        v = String(raw ?? '');
        if (!f.options.some((o) => o.value === v)) {
          errors.push(`${f.label}: ruxsat etilgan qiymatlar — ${f.options.map((o) => o.value || '(boʻsh)').join(', ')}`);
          continue;
        }
        break;
      default:
        v = String(raw ?? '').trim().slice(0, 5000);
    }
    out[key] = v;
  }

  for (const f of r.fields) {
    if (f.readOnly) continue;
    const empty = out[f.name] === undefined || out[f.name] === '';
    if (f.required && (partial ? f.name in out && empty : empty)) errors.push(`${f.label}: toʻldirilishi shart`);
    if (!partial && out[f.name] === undefined && f.default !== undefined) out[f.name] = f.default;
  }

  if (errors.length) throw new ApiError(400, errors.join('; '));
  return out;
}

function friendly(err) {
  if (err.code === '23505') return new ApiError(409, 'Bunday ID bilan yozuv allaqachon bor');
  if (err.code === '23503' || err.code === '23001') return new ApiError(409, 'Bu yozuvga boshqa yozuvlar bogʻlangan (masalan, toifadagi tahlillar). Avval ularni oʻzgartiring yoki oʻchirish oʻrniga yashiring.');
  return err;
}

// Bemor ma'lumotlari tarixga yozilmaydi — faqat qaysi maydon o'zgargani
const snapshot = (r, row, changed) => {
  if (!row) return null;
  if (r.private) return { fields: Object.keys(changed || {}) };
  return row;
};

async function audit(c, actor, action, entity, entityId, before, after) {
  await c.query('INSERT INTO audit_log (actor, action, entity, entity_id, before, after) VALUES ($1,$2,$3,$4,$5,$6)', [
    actor,
    action,
    entity,
    String(entityId ?? ''),
    before ? JSON.stringify(before) : null,
    after ? JSON.stringify(after) : null,
  ]);
}
export { audit };

export const LIMITS = { defaultPageSize: 20, maxPageSize: 100 };

// params: { q, sort, dir, page, pageSize, filters: { category_id, price_min, price_max, created_at_from, ... } }
export async function list(name, params = {}) {
  const r = res(name, 'list');
  const table = tableOf(name);
  const where = [];
  const values = [];
  const add = (v) => {
    values.push(v);
    return `$${values.length}`;
  };

  const q = String(params.q ?? '').trim();
  if (q) {
    const like = add(`%${q.replace(/[\\%_]/g, '\\$&')}%`);
    where.push(`(${r.search.map((c) => `${c}::text ILIKE ${like}`).join(' OR ')})`);
  }

  const filters = params.filters || {};
  for (const f of r.fields) {
    if (!f.filter) continue;
    if (f.type === 'int' || f.type === 'number') {
      for (const [suffix, op] of [['_min', '>='], ['_max', '<=']]) {
        const v = filters[f.name + suffix];
        if (v === undefined || v === '') continue;
        if (!Number.isFinite(Number(v))) throw new ApiError(400, `${f.label}: raqam kerak`);
        where.push(`${f.name} ${op} ${add(Number(v))}`);
      }
    } else if (f.type === 'datetime') {
      for (const [suffix, op] of [['_from', '>='], ['_to', '<']]) {
        const v = filters[f.name + suffix];
        if (v === undefined || v === '') continue;
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) throw new ApiError(400, `${f.label}: sana notoʻgʻri`);
        if (suffix === '_to') d.setDate(d.getDate() + 1); // oxirgi kun ham kirsin
        where.push(`${f.name} ${op} ${add(d.toISOString())}`);
      }
    } else if (f.type === 'bool') {
      const v = filters[f.name];
      if (v === undefined || v === '') continue;
      where.push(`${f.name} = ${add(v === true || v === 'true')}`);
    } else {
      const v = filters[f.name];
      if (v === undefined || v === '') continue;
      where.push(`${f.name} = ${add(String(v))}`);
    }
  }

  const sortable = new Set([...r.fields.map((f) => f.name), 'id']);
  const sort = sortable.has(params.sort) ? params.sort : r.sort;
  const dir = (params.dir || r.dir) === 'desc' ? 'DESC' : 'ASC';
  const pageSize = Math.min(Math.max(Number(params.pageSize) || LIMITS.defaultPageSize, 1), LIMITS.maxPageSize);
  const page = Math.max(Math.floor(Number(params.page)) || 1, 1);
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = (await query(`SELECT COUNT(*) AS n FROM ${table} ${whereSql}`, values)).rows[0].n;
  const { rows } = await query(
    `SELECT * FROM ${table} ${whereSql} ORDER BY ${sort} ${dir}, id ASC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
    values,
  );
  return { items: rows, total, page, pageSize, pages: Math.max(Math.ceil(total / pageSize), 1) };
}

export async function get(name, id) {
  const r = res(name, 'get');
  checkId(r, id);
  const { rows } = await query(`SELECT * FROM ${tableOf(name)} WHERE id = $1`, [id]);
  if (!rows[0]) throw new ApiError(404, 'Yozuv topilmadi');
  return rows[0];
}

export async function create(name, input, actor) {
  const r = res(name, 'create');
  const data = clean(r, input, { partial: false });
  const id = String(input.id ?? '').trim() || `${slug(data[r.idFrom]) || name}-${random()}`;
  if (!/^[\p{L}\p{N}_-]{1,60}$/u.test(id)) throw new ApiError(400, 'ID faqat harf, raqam, - va _ dan iborat boʻlsin');
  const cols = ['id', ...Object.keys(data)];
  const vals = [id, ...Object.values(data)];
  try {
    const row = await tx(async (c) => {
      const { rows } = await c.query(
        `INSERT INTO ${tableOf(name)} (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
        vals,
      );
      await audit(c, actor, 'create', name, id, null, snapshot(r, rows[0], data));
      return rows[0];
    });
    if (r.public) await refreshContent();
    return row;
  } catch (err) {
    throw friendly(err);
  }
}

export async function update(name, id, input, actor) {
  const r = res(name, 'update');
  checkId(r, id);
  const data = clean(r, input, { partial: true });
  const cols = Object.keys(data);
  if (!cols.length) throw new ApiError(400, 'Oʻzgartirish uchun maʼlumot yoʻq');
  const table = tableOf(name);
  try {
    const row = await tx(async (c) => {
      const before = (await c.query(`SELECT * FROM ${table} WHERE id = $1 FOR UPDATE`, [id])).rows[0];
      if (!before) throw new ApiError(404, 'Yozuv topilmadi');
      const sets = cols.map((k, i) => `${k} = $${i + 2}`).join(', ');
      const { rows } = await c.query(`UPDATE ${table} SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`, [id, ...Object.values(data)]);
      await audit(c, actor, 'update', name, id, snapshot(r, before, data), snapshot(r, rows[0], data));
      return rows[0];
    });
    if (r.public) await refreshContent();
    return row;
  } catch (err) {
    throw friendly(err);
  }
}

export async function remove(name, id, actor) {
  const r = res(name, 'delete');
  checkId(r, id);
  const table = tableOf(name);
  try {
    await tx(async (c) => {
      const before = (await c.query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id])).rows[0];
      if (!before) throw new ApiError(404, 'Yozuv topilmadi');
      await audit(c, actor, 'delete', name, id, snapshot(r, before, {}), null);
    });
    if (r.public) await refreshContent();
    return { ok: true };
  } catch (err) {
    throw friendly(err);
  }
}

// Bir nechta narxni bitta tranzaksiyada o'zgartirish
export async function bulkPrices(items, actor) {
  const allowed = ['tests', 'packages', 'vaccines'];
  const changed = await tx(async (c) => {
    const out = [];
    for (const { resource, id, price } of items) {
      if (!allowed.includes(resource)) throw new ApiError(400, `Narx bu boʻlimda yoʻq: ${resource}`);
      if (!Number.isInteger(price) || price < 0) throw new ApiError(400, `Notoʻgʻri narx: ${id}`);
      const before = (await c.query(`SELECT * FROM ${resource} WHERE id = $1 FOR UPDATE`, [id])).rows[0];
      if (!before) throw new ApiError(404, `Topilmadi: ${resource}/${id}`);
      const { rows } = await c.query(`UPDATE ${resource} SET price = $2, updated_at = now() WHERE id = $1 RETURNING *`, [id, price]);
      await audit(c, actor, 'update', resource, id, before, rows[0]);
      out.push({ resource, id, old_price: before.price, new_price: price });
    }
    return out;
  });
  await refreshContent();
  return changed;
}

export async function stats() {
  const one = async (sql) => (await query(sql)).rows[0].n;
  const [tests, packages, vaccines, branches, newLeads, todayLeads, totalLeads] = await Promise.all([
    one('SELECT COUNT(*) n FROM tests WHERE active'),
    one('SELECT COUNT(*) n FROM packages WHERE active'),
    one('SELECT COUNT(*) n FROM vaccines WHERE active'),
    one('SELECT COUNT(*) n FROM branches WHERE active'),
    one(`SELECT COUNT(*) n FROM leads WHERE status = 'new'`),
    one(`SELECT COUNT(*) n FROM leads WHERE created_at >= date_trunc('day', now())`),
    one('SELECT COUNT(*) n FROM leads'),
  ]);
  return { tests, packages, vaccines, branches, newLeads, todayLeads, totalLeads };
}
