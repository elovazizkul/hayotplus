// Admin panel: /admin
import { useCallback, useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { api, dateTime, setUnauthorizedHandler } from './api.js';
import { Alert, Badge, Button, Field, inputClass, PageTitle } from './ui.jsx';
import ResourcePage from './ResourcePage.jsx';
import SettingsPage from './SettingsPage.jsx';
import McpPage from './McpPage.jsx';

const NAV = [
  { id: '', label: 'Bosh sahifa', icon: 'dashboard' },
  { id: 'leads', icon: 'inbox' },
  { id: 'tests', icon: 'biotech' },
  { id: 'categories', icon: 'category' },
  { id: 'packages', icon: 'inventory_2' },
  { id: 'vaccines', icon: 'vaccines' },
  { id: 'vaccine_rules', icon: 'rule' },
  { id: 'branches', icon: 'location_on' },
  { id: 'faq', icon: 'quiz' },
  { id: 'site', label: 'Sayt sozlamalari', icon: 'tune' },
  { id: 'integrations', label: 'AI va Telegram', icon: 'smart_toy' },
  { id: 'mcp', label: 'MCP (Claude)', icon: 'hub' },
  { id: 'audit', icon: 'history' },
  { id: 'security', label: 'Parol', icon: 'lock' },
];

const ACTIONS = { create: 'yaratdi', update: 'oʻzgartirdi', delete: 'oʻchirdi', settings: 'sozlamani oʻzgartirdi' };

const currentPage = () => window.location.pathname.replace(/^\/admin\/?/, '').replace(/\/$/, '');

function Login({ onDone }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/login', { method: 'POST', body: { password } });
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-container-low p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border border-outline-variant bg-white p-6">
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="" className="h-8 w-8" />
          <h1 className="text-lg font-bold text-on-surface">Hayot Plus admin</h1>
        </div>
        <Alert>{error}</Alert>
        <Field label="Parol">
          <input type="password" autoFocus autoComplete="current-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button type="submit" disabled={busy || !password} className="w-full">Kirish</Button>
      </form>
    </div>
  );
}

function Dashboard({ go }) {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api('/stats').then(setS).catch((e) => setError(e.message));
  }, []);
  if (!s) return <Alert>{error}</Alert>;
  const cards = [
    { label: 'Yangi arizalar', value: s.newLeads, page: 'leads' },
    { label: 'Bugungi arizalar', value: s.todayLeads, page: 'leads' },
    { label: 'Tahlillar', value: s.tests, page: 'tests' },
    { label: 'Paketlar', value: s.packages, page: 'packages' },
    { label: 'Vaksinalar', value: s.vaccines, page: 'vaccines' },
    { label: 'Filiallar', value: s.branches, page: 'branches' },
  ];
  return (
    <>
      <PageTitle title="Bosh sahifa" />
      <div className="mb-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => go('integrations')}><Badge on={s.aiReady}>AI yordamchi: {s.aiReady ? 'ulangan' : 'ulanmagan'}</Badge></button>
        <button type="button" onClick={() => go('integrations')}><Badge on={s.telegramReady}>Telegram: {s.telegramReady ? 'ulangan' : 'ulanmagan'}</Badge></button>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <button key={c.label} type="button" onClick={() => go(c.page)} className="rounded-xl border border-outline-variant bg-white p-4 text-left hover:border-primary">
            <div className="text-2xl font-bold text-on-surface">{c.value}</div>
            <div className="text-sm text-on-surface-variant">{c.label}</div>
          </button>
        ))}
      </div>
      <h2 className="mb-2 font-bold text-on-surface">Oxirgi oʻzgarishlar</h2>
      <div className="overflow-hidden rounded-xl border border-outline-variant bg-white">
        {s.recent.map((a) => (
          <div key={a.id} className="flex flex-wrap justify-between gap-2 border-t border-outline-variant/50 px-4 py-2.5 text-sm first:border-t-0">
            <span className="text-on-surface">{a.actor}: {ACTIONS[a.action] ?? a.action}{a.entity === 'settings' ? '' : ` ${a.entity}/${a.entity_id}`}</span>
            <span className="text-on-surface-variant">{dateTime(a.created_at)}</span>
          </div>
        ))}
        {!s.recent.length && <div className="px-4 py-8 text-center text-sm text-on-surface-variant">Hali oʻzgarish yoʻq</div>}
      </div>
    </>
  );
}

function PasswordPage({ onChanged }) {
  const [form, setForm] = useState({ current: '', next: '' });
  const [error, setError] = useState('');
  const submit = async () => {
    setError('');
    try {
      await api('/password', { method: 'POST', body: form });
      onChanged();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <>
      <PageTitle title="Parolni oʻzgartirish" subtitle="Oʻzgartirilgach, barcha qurilmalardan chiqiladi." />
      <div className="max-w-md space-y-4 rounded-xl border border-outline-variant bg-white p-5">
        <Alert>{error}</Alert>
        <Field label="Joriy parol"><input type="password" autoComplete="current-password" className={inputClass} value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} /></Field>
        <Field label="Yangi parol" hint="Kamida 10 belgi"><input type="password" autoComplete="new-password" className={inputClass} value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} /></Field>
        <Button disabled={!form.current || !form.next} onClick={submit}>Saqlash</Button>
      </div>
    </>
  );
}

export default function AdminApp() {
  const [authed, setAuthed] = useState(null);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(currentPage);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.title = 'Admin — Hayot Plus';
    setUnauthorizedHandler(() => setAuthed(false));
    api('/me').then(() => setAuthed(true)).catch(() => setAuthed(false));
    const onPop = () => setPage(currentPage());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (authed) api('/meta').then(setMeta).catch(() => setAuthed(false));
  }, [authed]);

  const go = useCallback((id) => {
    window.history.pushState(null, '', id ? `/admin/${id}` : '/admin');
    setPage(id);
    setMenuOpen(false);
  }, []);

  if (authed === null) return null;
  if (!authed) return <Login onDone={() => setAuthed(true)} />;
  if (!meta) return null;

  const resource = meta.resources.find((r) => r.name === page);
  const logout = async () => {
    await api('/logout', { method: 'POST', body: {} }).catch(() => {});
    setAuthed(false);
  };

  return (
    <div className="min-h-screen bg-surface-container-low md:flex">
      <aside className={`${menuOpen ? 'block' : 'hidden'} border-r border-outline-variant bg-white md:sticky md:top-0 md:block md:h-screen md:w-60 md:shrink-0 md:overflow-y-auto`}>
        <div className="hidden items-center gap-2 px-4 py-4 md:flex">
          <img src="/favicon.png" alt="" className="h-7 w-7" />
          <span className="font-bold text-on-surface">Hayot Plus</span>
        </div>
        <nav className="space-y-0.5 p-2">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => go(n.id)}
              aria-current={page === n.id ? 'page' : undefined}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium ${page === n.id ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <Icon name={n.icon} size={19} />
              {n.label || meta.resources.find((r) => r.name === n.id)?.label}
            </button>
          ))}
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low">
            <Icon name="open_in_new" size={19} />Saytni ochish
          </a>
          <button type="button" onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-error hover:bg-error-container">
            <Icon name="logout" size={19} />Chiqish
          </button>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-outline-variant bg-white px-4 py-3 md:hidden">
          <span className="font-bold text-on-surface">Hayot Plus admin</span>
          <button type="button" aria-label="Menyu" onClick={() => setMenuOpen((o) => !o)}><Icon name="menu" /></button>
        </div>
        <main className="p-4 md:p-6">
          {page === '' && <Dashboard go={go} />}
          {resource && <ResourcePage key={resource.name} resource={resource} />}
          {page === 'site' && <SettingsPage key="site" title="Sayt sozlamalari" subtitle="Telefon, ish vaqti, ijtimoiy tarmoqlar." groups={['site']} />}
          {page === 'integrations' && (
            <SettingsPage
              key="integrations"
              title="AI va Telegram"
              subtitle="Kalitlar shifrlangan holda saqlanadi va qayta koʻrsatilmaydi."
              groups={['ai', 'telegram']}
              tests={[
                { path: '/test/ai', label: 'Claude’ni tekshirish' },
                { path: '/test/telegram', label: 'Telegramni tekshirish' },
              ]}
            />
          )}
          {page === 'mcp' && <McpPage />}
          {page === 'security' && <PasswordPage onChanged={() => setAuthed(false)} />}
        </main>
      </div>
    </div>
  );
}
