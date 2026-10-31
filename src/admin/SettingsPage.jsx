// Sozlamalar: sayt ma'lumotlari, AI yordamchi, Telegram.
// Kalitlar brauzerga qaytmaydi: faqat "saqlangan" belgisi ko'rinadi.
import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { api } from './api.js';
import { Alert, Badge, Button, Field, inputClass, PageTitle } from './ui.jsx';

function SettingInput({ s, value, onChange, onClear }) {
  if (s.type === 'bool') {
    return (
      <label className="flex items-center gap-2 text-sm font-medium text-on-surface">
        <input type="checkbox" className="h-4 w-4" checked={value === 'true'} onChange={(e) => onChange(String(e.target.checked))} />
        {s.label}
      </label>
    );
  }
  if (s.type === 'secret') {
    return (
      <Field label={s.label} hint={s.hint}>
        <div className="mb-1"><Badge on={s.isSet}>{s.isSet ? 'Saqlangan' : 'Kiritilmagan'}</Badge></div>
        <div className="flex gap-2">
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass}
            placeholder={s.isSet ? 'Almashtirish uchun yangisini kiriting' : 'Qiymatni shu yerga qoʻying'}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
          {s.isSet && <Button variant="danger" onClick={onClear}>Oʻchirish</Button>}
        </div>
      </Field>
    );
  }
  if (s.type === 'select') {
    return (
      <Field label={s.label} hint={s.hint}>
        <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
          {s.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>
    );
  }
  if (s.type === 'textarea') {
    return <Field label={s.label} hint={s.hint}><textarea rows={5} className={inputClass} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></Field>;
  }
  return <Field label={s.label} hint={s.hint}><input className={inputClass} inputMode={s.type === 'int' ? 'numeric' : undefined} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></Field>;
}

export default function SettingsPage({ title, subtitle, groups, tests = [] }) {
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState({});
  const [message, setMessage] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/settings').then((r) => setSettings(r.settings)).catch((e) => setMessage({ error: e.message }));
  }, []);

  const save = async (values) => {
    setBusy(true);
    setMessage({});
    try {
      const r = await api('/settings', { method: 'PUT', body: values });
      setSettings(r.settings);
      setDraft({});
      setMessage({ ok: 'Saqlandi' });
    } catch (e) {
      setMessage({ error: e.message });
    } finally {
      setBusy(false);
    }
  };

  const clearSecret = (s) => {
    if (window.confirm(`“${s.label}” oʻchirilsinmi?`)) save({ [s.key]: '' });
  };

  const runTest = async (path) => {
    setBusy(true);
    setMessage({});
    try {
      const r = await api(path, { method: 'POST', body: {} });
      setMessage({ ok: r.reply ? `Ishlayapti (${r.model}): ${r.reply}` : 'Ishlayapti: Telegramni tekshiring' });
    } catch (e) {
      setMessage({ error: e.message });
    } finally {
      setBusy(false);
    }
  };

  if (!settings) return <Alert>{message.error}</Alert>;
  const shown = settings.filter((s) => groups.includes(s.group));
  const dirty = Object.keys(draft).length > 0;

  return (
    <>
      <PageTitle title={title} subtitle={subtitle} />
      <div className="max-w-2xl space-y-4 rounded-xl border border-outline-variant bg-white p-5">
        {shown.map((s) => (
          <SettingInput
            key={s.key}
            s={s}
            value={draft[s.key] ?? s.value}
            onChange={(v) => setDraft((d) => ({ ...d, [s.key]: v }))}
            onClear={() => clearSecret(s)}
          />
        ))}
        <Alert>{message.error}</Alert>
        <Alert kind="ok">{message.ok}</Alert>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button disabled={busy || !dirty} onClick={() => save(draft)}><Icon name="save" size={18} />Saqlash</Button>
          {tests.map((t) => (
            <Button key={t.path} variant="ghost" disabled={busy || dirty} onClick={() => runTest(t.path)}>{t.label}</Button>
          ))}
        </div>
      </div>
    </>
  );
}
