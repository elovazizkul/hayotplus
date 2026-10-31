// MCP: Claude'ni saytga ulash uchun tokenlar
import { useCallback, useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { api, dateTime } from './api.js';
import { Alert, Badge, Button, Field, inputClass, PageTitle } from './ui.jsx';

export default function McpPage() {
  const [tokens, setTokens] = useState([]);
  const [form, setForm] = useState({ name: 'Claude Code', can_write: true, can_read_leads: false });
  const [created, setCreated] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => api('/mcp-tokens').then((r) => setTokens(r.tokens)).catch((e) => setError(e.message)), []);
  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    setError('');
    try {
      setCreated(await api('/mcp-tokens', { method: 'POST', body: form }));
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const revoke = async (t) => {
    if (!window.confirm(`“${t.name}” tokeni bekor qilinsinmi?`)) return;
    try {
      await api(`/mcp-tokens/${t.id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const url = `${window.location.origin}/mcp`;
  const command = created ? `claude mcp add --transport http hayotplus ${url} --header "Authorization: Bearer ${created.token}"` : '';

  return (
    <>
      <PageTitle title="MCP: Claude bilan boshqarish" subtitle="Claude saytdagi maʼlumotlarni oʻqiydi va oʻzgartiradi. Har bir oʻzgarish tarixga yoziladi." />
      <div className="max-w-3xl space-y-5">
        {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
          <Alert>Sayt hali HTTPS’da emas. Token ochiq tarmoq orqali uzatilishi mumkin: domen va HTTPS ulangandan keyin yarating.</Alert>
        )}
        <Alert>{error}</Alert>

        {created && (
          <div className="space-y-2 rounded-xl border border-primary bg-primary-fixed/30 p-4">
            <p className="text-sm font-semibold text-on-surface">Token yaratildi. U faqat hozir koʻrinadi, nusxalab oling.</p>
            <p className="text-sm text-on-surface-variant">Claude Code’ga ulash uchun terminalda bajaring:</p>
            <pre className="overflow-x-auto rounded-lg bg-inverse-surface p-3 text-xs text-inverse-on-surface">{command}</pre>
            <Button variant="ghost" onClick={() => navigator.clipboard.writeText(command)}><Icon name="content_copy" size={18} />Nusxalash</Button>
          </div>
        )}

        <div className="space-y-3 rounded-xl border border-outline-variant bg-white p-5">
          <h2 className="font-bold text-on-surface">Yangi token</h2>
          <Field label="Nomi"><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm text-on-surface">
            <input type="checkbox" className="h-4 w-4" checked={form.can_write} onChange={(e) => setForm({ ...form, can_write: e.target.checked })} />
            Oʻzgartirishga ruxsat (yoqilmasa, faqat oʻqiydi)
          </label>
          <label className="flex items-center gap-2 text-sm text-on-surface">
            <input type="checkbox" className="h-4 w-4" checked={form.can_read_leads} onChange={(e) => setForm({ ...form, can_read_leads: e.target.checked })} />
            Arizalarni koʻrishga ruxsat (bemorlarning ismi va telefoni Claude’ga uzatiladi)
          </label>
          <Button onClick={create}><Icon name="key" size={18} />Token yaratish</Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Nomi</th>
                <th className="px-4 py-3">Ruxsat</th>
                <th className="px-4 py-3">Oxirgi ishlatilgan</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => (
                <tr key={t.id} className="border-t border-outline-variant/50">
                  <td className="px-4 py-2.5">{t.name}<span className="block text-xs text-on-surface-variant">{t.prefix}…</span></td>
                  <td className="space-x-1 px-4 py-2.5">
                    <Badge on={t.can_write}>{t.can_write ? 'Yozish' : 'Faqat oʻqish'}</Badge>
                    {t.can_read_leads && <Badge on>Arizalar</Badge>}
                  </td>
                  <td className="px-4 py-2.5">{dateTime(t.last_used_at)}</td>
                  <td className="px-4 py-2.5 text-right">
                    {t.revoked_at ? <Badge on={false}>Bekor qilingan</Badge> : <Button variant="danger" onClick={() => revoke(t)}>Bekor qilish</Button>}
                  </td>
                </tr>
              ))}
              {!tokens.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-on-surface-variant">Hali token yoʻq</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
