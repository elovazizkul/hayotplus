// ============================================================
//  MCP SERVER — Claude saytni shu yerdan boshqaradi
// ============================================================
//  Manzil: POST /mcp, sarlavha: Authorization: Bearer hp_mcp_...
//  Tokenlar admin panelda (MCP boʻlimi) yaratiladi va bekor qilinadi.
//  Amallar admin panel bilan bir xil repo.js orqali o'tadi, shu sabab
//  tekshiruvlar bir xil va har bir o'zgarish tarixga yoziladi.
//  Maxfiy kalitlar MCP orqali hech qachon o'qilmaydi va o'zgartirilmaydi.
// ============================================================

import { Router } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { query } from './db.js';
import { refreshContent } from './content.js';
import * as repo from './repo.js';
import { resources } from './resources.js';
import { updateSettings, viewSettings } from './settings.js';
import { rateLimit, sha256 } from './security.js';

const SITE_GROUPS = ['site', 'ai', 'telegram'];
const ok = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
const fail = (err) => ({ isError: true, content: [{ type: 'text', text: err.message || 'Xatolik' }] });

const safe = (fn) => async (args) => {
  try {
    return ok(await fn(args));
  } catch (err) {
    if (!(err instanceof repo.ApiError)) console.error('MCP error:', err?.message);
    return fail(err instanceof repo.ApiError ? err : new Error('Server xatosi'));
  }
};

function buildServer(token) {
  const server = new McpServer(
    { name: 'hayotplus', version: '1.0.0' },
    {
      instructions:
        'Hayot Plus Med laboratoriya saytini boshqarish. Avval describe_site chaqirib, boʻlimlar va maydonlarni bilib oling. Narxlar soʻmda, butun son. Har bir matn uz va ru tillarida saqlanadi: ikkalasini ham toʻldiring. Oʻchirishdan oldin foydalanuvchidan tasdiq oling; yashirish uchun active=false ishlating.',
    },
  );

  const actor = `mcp:${token.name}`;
  const visible = Object.keys(resources).filter((n) => !resources[n].private || token.can_read_leads);
  const writable = visible.filter((n) => resources[n].ops.some((o) => o !== 'list' && o !== 'get'));
  const name = z.enum(visible);
  const guard = (n) => {
    if (!visible.includes(n)) throw new repo.ApiError(403, 'Bu boʻlimga ruxsat yoʻq');
    return n;
  };

  const read = { readOnlyHint: true };

  server.registerTool(
    'describe_site',
    { description: 'Boʻlimlar, maydonlar, filtrlar va sozlamalar roʻyxati. Ishni shundan boshlang.', inputSchema: {}, annotations: read },
    safe(async () => ({
      can_write: token.can_write,
      resources: visible.map((n) => {
        const r = resources[n];
        return {
          name: n,
          label: r.label,
          operations: r.ops,
          fields: r.fields.map(({ name: field, label, type, required, readOnly, options, ref }) => ({
            name: field, label, type, required, readOnly, ref, options: options?.map((o) => o.value),
          })),
          filters: r.fields.filter((f) => f.filter).flatMap((f) => {
            if (f.type === 'int' || f.type === 'number') return [`${f.name}_min`, `${f.name}_max`];
            if (f.type === 'datetime') return [`${f.name}_from`, `${f.name}_to`];
            return [f.name];
          }),
        };
      }),
      settings: (await viewSettings(SITE_GROUPS)).filter((s) => s.type !== 'secret').map((s) => s.key),
    })),
  );

  server.registerTool(
    'list_records',
    {
      description: 'Boʻlimdagi yozuvlarni qidirish, filtrlash, tartiblash va sahifalab olish.',
      inputSchema: {
        resource: name,
        search: z.string().optional().describe('Matn boʻyicha qidiruv'),
        filters: z.record(z.union([z.string(), z.number(), z.boolean()])).optional().describe('Masalan: {"category_id":"biokimyo","price_max":100000,"active":true}'),
        sort: z.string().optional().describe('Maydon nomi'),
        direction: z.enum(['asc', 'desc']).optional(),
        page: z.number().int().min(1).optional(),
        page_size: z.number().int().min(1).max(repo.LIMITS.maxPageSize).optional(),
      },
      annotations: read,
    },
    safe(({ resource, search, filters, sort, direction, page, page_size }) =>
      repo.list(guard(resource), { q: search, filters, sort, dir: direction, page, pageSize: page_size })),
  );

  server.registerTool(
    'get_record',
    { description: 'Bitta yozuvni ID boʻyicha olish.', inputSchema: { resource: name, id: z.string() }, annotations: read },
    safe(({ resource, id }) => repo.get(guard(resource), id)),
  );

  server.registerTool(
    'get_stats',
    { description: 'Faol tahlillar, paketlar, filiallar soni va arizalar statistikasi.', inputSchema: {}, annotations: read },
    safe(async () => {
      const { newLeads, todayLeads, totalLeads, ...content } = await repo.stats();
      return token.can_read_leads ? { ...content, newLeads, todayLeads, totalLeads } : content;
    }),
  );

  server.registerTool(
    'get_settings',
    { description: 'Sayt sozlamalari: telefon, ish vaqti, AI modeli. Maxfiy kalitlar faqat “bor/yoʻq” koʻrinishida.', inputSchema: {}, annotations: read },
    safe(() => viewSettings(SITE_GROUPS)),
  );

  if (!token.can_write) return server;

  const writeName = z.enum(writable);
  const guardWrite = (n) => {
    if (!writable.includes(n)) throw new repo.ApiError(403, 'Bu boʻlimga yozish ruxsati yoʻq');
    return n;
  };
  const data = z.record(z.any()).describe('Maydon nomi → qiymat (describe_site ga qarang)');

  server.registerTool(
    'create_record',
    {
      description: 'Yangi yozuv yaratish (tahlil, paket, vaksina, filial, FAQ...).',
      inputSchema: { resource: writeName, id: z.string().optional().describe('Boʻsh qolsa, avtomatik yaratiladi'), data },
    },
    safe(({ resource, id, data: d }) => repo.create(guardWrite(resource), { ...d, id }, actor)),
  );

  server.registerTool(
    'update_record',
    { description: 'Yozuvning koʻrsatilgan maydonlarini oʻzgartirish.', inputSchema: { resource: writeName, id: z.string(), data } },
    safe(({ resource, id, data: d }) => repo.update(guardWrite(resource), id, d, actor)),
  );

  server.registerTool(
    'delete_record',
    {
      description: 'Yozuvni butunlay oʻchirish. Avval foydalanuvchidan tasdiq oling. Vaqtincha yashirish uchun update_record bilan active=false qiling.',
      inputSchema: { resource: writeName, id: z.string() },
      annotations: { destructiveHint: true },
    },
    safe(({ resource, id }) => repo.remove(guardWrite(resource), id, actor)),
  );

  server.registerTool(
    'bulk_update_prices',
    {
      description: 'Bir nechta narxni birdaniga oʻzgartirish. Bittasi xato boʻlsa, hech biri saqlanmaydi.',
      inputSchema: {
        items: z.array(z.object({
          resource: z.enum(['tests', 'packages', 'vaccines']),
          id: z.string(),
          price: z.number().int().min(0),
        })).min(1).max(500),
      },
    },
    safe(({ items }) => repo.bulkPrices(items, actor)),
  );

  server.registerTool(
    'update_settings',
    {
      description: 'Sayt sozlamalarini oʻzgartirish (masalan site.phone, ai.model). Maxfiy kalitlarni bu yerdan oʻzgartirib boʻlmaydi.',
      inputSchema: { values: z.record(z.string()) },
    },
    safe(async ({ values }) => {
      const changed = await updateSettings(values, actor, { allowed: (s) => s.type !== 'secret' });
      await refreshContent();
      return { changed };
    }),
  );

  return server;
}

async function authenticate(req, res, next) {
  try {
    const header = String(req.headers.authorization || '');
    const raw = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const { rows } = raw
      ? await query('SELECT * FROM mcp_tokens WHERE token_hash = $1 AND revoked_at IS NULL', [sha256(raw)])
      : { rows: [] };
    if (!rows[0]) {
      res.setHeader('WWW-Authenticate', 'Bearer');
      return res.status(401).json({ error: 'Yaroqsiz token' });
    }
    req.mcpToken = rows[0];
    await query('UPDATE mcp_tokens SET last_used_at = now() WHERE id = $1', [rows[0].id]);
    next();
  } catch (err) {
    next(err);
  }
}

const mcp = Router();

mcp.use(authenticate, rateLimit({ windowMs: 60000, max: 240, key: (req) => `mcp:${req.mcpToken.id}` }));

mcp.post('/', async (req, res, next) => {
  try {
    // Holatsiz rejim: har bir so'rovga alohida server
    const server = buildServer(req.mcpToken);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on('close', () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    next(err);
  }
});

const notAllowed = (req, res) => {
  res.setHeader('Allow', 'POST');
  res.status(405).json({ error: 'Faqat POST' });
};
mcp.get('/', notAllowed);
mcp.delete('/', notAllowed);

export default mcp;
