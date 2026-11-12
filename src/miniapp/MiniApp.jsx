// Telegram Mini App "Mening tahlillarim" (/app). Bosh ekran — menyu: kimning tahlillari (avatar + nom),
// oxirgi tahlil kartochkasi va katta tugmalar (Grafiklar, Kvitansiyalar, Shifokorga, Tanlanganlar, Eslatmalar, Profil).
// Kvitansiyani ochganda har bir natija yonida "oldingi safar" ko'rinadi.
// Kirish parolsiz — Telegram imzosi (initData) har bir so'rovda serverga yuboriladi (server/bot/app-api.js).
// Ranglar — "Yalpiz va firuza" (egasi tanlagan); Telegram tungi rejimida qorong'i variant.
import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { AVATAR_COLORS, AVATAR_IMAGES, AVATARS, avatarOf, avatarUrl, colorOf, isImageAvatar } from '../data/avatars.js';
import { site } from '../data/site.js';
import Chart from './Chart.jsx';
import { analyteName, fmtDay, profileTitle, REL, tr } from './texts.js';

const THEMES = {
  light: {
    '--hp-bg': '#f3f8f7', '--hp-card': '#ffffff', '--hp-head': '#0f8a8a', '--hp-head-text': '#ffffff',
    '--hp-text': '#1d3330', '--hp-muted': '#5b6f6c', '--hp-line': '#e3eeec', '--hp-primary': '#0f8a8a',
    '--hp-on-primary': '#ffffff', '--hp-soft': '#d7f3ee', '--hp-on-soft': '#0b5e5a', '--hp-ok': '#13795b',
    '--hp-bad': '#c0392b', '--hp-norm': '#d7f3ee', '--hp-chip': 'rgba(255,255,255,0.18)', '--hp-chip-on': '#ffffff',
    '--hp-chip-on-text': '#0f6f6f', '--hp-warn-bg': '#fff4dc', '--hp-warn-text': '#7a5200', '--hp-goal': '#e08a00',
  },
  dark: {
    '--hp-bg': '#0e1918', '--hp-card': '#172625', '--hp-head': '#0b4f4f', '--hp-head-text': '#e2f2ef',
    '--hp-text': '#e2f2ef', '--hp-muted': '#9ab8b3', '--hp-line': '#243a38', '--hp-primary': '#5fd3c6',
    '--hp-on-primary': '#04302c', '--hp-soft': '#0f3f3a', '--hp-on-soft': '#9ff0e2', '--hp-ok': '#5fd39a',
    '--hp-bad': '#ffb4ab', '--hp-norm': 'rgba(95,211,198,0.16)', '--hp-chip': 'rgba(255,255,255,0.10)', '--hp-chip-on': '#5fd3c6',
    '--hp-chip-on-text': '#04302c', '--hp-warn-bg': '#3a2c0b', '--hp-warn-text': '#ffd88a', '--hp-goal': '#ffb74d',
  },
};

// Bosh ekrandagi tugmalar: har birining o'z yumshoq rangi (och / tungi)
const TILES = {
  charts: { icon: '📈', bg: '#d7f3ee', fg: '#0b5e5a', dbg: '#123b37', dfg: '#9ff0e2' },
  visits: { icon: '🧾', bg: '#dceeff', fg: '#174f86', dbg: '#16314d', dfg: '#b5d6ff' },
  report: { icon: '🩺', bg: '#ffe9d6', fg: '#8a4b14', dbg: '#3d2a17', dfg: '#ffc99a' },
  favs: { icon: '👁', bg: '#fff3c4', fg: '#7a5a00', dbg: '#3a3212', dfg: '#ffe38a' },
  reminders: { icon: '🔔', bg: '#efe4ff', fg: '#55349c', dbg: '#2b2148', dfg: '#d5c2ff' },
  profile: { icon: '👤', bg: '#ffe1ea', fg: '#922f52', dbg: '#3d1d28', dfg: '#ffb3c8' },
};

// "2026-08-01" + 3 oy → "2026-11-01"
const addMonths = (day, m) => {
  const [y, mo, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1 + m, d)).toISOString().slice(0, 10);
};
const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tashkent' });

const TG_SCRIPT = 'https://telegram.org/js/telegram-web-app.js';
const HINT_KEY = 'hp-app-hint-v1';
const UNKNOWN = { id: 'none', avatar: '❓', color: 'amber' };

function useTelegram() {
  const [state, setState] = useState({ status: 'loading' });
  useEffect(() => {
    const done = () => {
      const tg = window.Telegram?.WebApp;
      if (!tg?.initData) return setState({ status: 'outside' });
      tg.ready();
      tg.expand();
      setState({ status: 'ok', tg, scheme: tg.colorScheme === 'dark' ? 'dark' : 'light' });
    };
    if (window.Telegram?.WebApp) return done();
    const s = document.createElement('script');
    s.src = TG_SCRIPT;
    s.onload = done;
    s.onerror = () => setState({ status: 'outside' });
    document.head.appendChild(s);
    return undefined;
  }, []);
  useEffect(() => {
    if (state.status !== 'ok') return undefined;
    const tg = state.tg;
    const onTheme = () => setState((s) => ({ ...s, scheme: tg.colorScheme === 'dark' ? 'dark' : 'light' }));
    tg.onEvent('themeChanged', onTheme);
    return () => tg.offEvent('themeChanged', onTheme);
  }, [state.status, state.tg]);
  return state;
}

const store = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, v) {
    try {
      localStorage.setItem(key, v);
    } catch {
      /* ixtiyoriy */
    }
  },
};

const card = 'rounded-2xl p-4';
const cardStyle = { background: 'var(--hp-card)' };

function Button({ children, onClick, kind = 'primary', disabled, className = '' }) {
  const style = kind === 'primary'
    ? { background: 'var(--hp-primary)', color: 'var(--hp-on-primary)' }
    : kind === 'soft'
      ? { background: 'var(--hp-soft)', color: 'var(--hp-on-soft)' }
      : { background: 'transparent', color: 'var(--hp-primary)', border: '1px solid var(--hp-line)' };
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={style} className={`w-full rounded-xl px-4 py-3 text-[15px] font-semibold disabled:opacity-50 ${className}`}>
      {children}
    </button>
  );
}

// Avatar ichidagi rasm yoki emoji
function AvatarFace({ a, size }) {
  return isImageAvatar(a)
    ? <img src={avatarUrl(a)} alt="" width={size} height={size} className="h-full w-full" draggable="false" />
    : <span style={{ fontSize: Math.round(size * 0.58), lineHeight: 1 }}>{a}</span>;
}

// Profil belgisi: rangli doira ichida chizilgan rasm yoki emoji
function Avatar({ p, size = 28, dark }) {
  const c = p?.id === 'none' ? AVATAR_COLORS.amber : colorOf(p);
  return (
    <span className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full" aria-hidden="true"
      style={{ width: size, height: size, background: dark ? c.dark : c.bg }}>
      <AvatarFace a={p?.id === 'none' ? '❓' : avatarOf(p)} size={size} />
    </span>
  );
}

// Tahlil guruhlari (umumiy qon tahlili, biokimyo...). Guruhda "asosiy" belgilanganlar bo'lsa —
// faqat asosiylar va me'yordan tashqarilar ko'rinadi, qolgani "yana N ta" ostida. Og'ish hech qachon yashirilmaydi.
function GroupedList({ items, render, t }) {
  const [open, setOpen] = useState(() => new Set());
  const groups = [];
  const index = new Map();
  for (const it of items) {
    const g = it.a.group || '';
    if (!index.has(g)) {
      index.set(g, groups.length);
      groups.push({ title: g, items: [] });
    }
    groups[index.get(g)].items.push(it);
  }
  const toggle = (title) => setOpen((s) => {
    const n = new Set(s);
    if (n.has(title)) n.delete(title);
    else n.add(title);
    return n;
  });
  return groups.map((g) => {
    const hasKeys = g.items.some((it) => it.a.isKey);
    const expanded = open.has(g.title);
    const visible = !hasKeys || expanded ? g.items : g.items.filter((it) => it.a.isKey || it.p?.flag);
    const hidden = g.items.length - visible.length;
    return (
      <div key={g.title} className="rounded-2xl px-4 py-1" style={{ background: 'var(--hp-card)' }}>
        {g.title && <p className="pt-2 text-[12px] font-semibold" style={{ color: 'var(--hp-muted)' }}>{g.title}</p>}
        {visible.map(render)}
        {hasKeys && (hidden > 0 || expanded) && (
          <button type="button" onClick={() => toggle(g.title)} className="block w-full py-3 text-left text-[14px] font-semibold" style={{ borderTop: '1px solid var(--hp-line)', color: 'var(--hp-primary)' }}>
            {expanded ? t('moreHide') : t('moreNormal', { n: hidden })}
          </button>
        )}
      </div>
    );
  });
}

const valueColor = (p) => (p?.flag ? 'var(--hp-bad)' : 'var(--hp-ok)');
const arrow = (p) => (p?.flag === 'high' ? ' ↑' : p?.flag === 'low' ? ' ↓' : '');

export default function MiniApp() {
  const tele = useTelegram();
  const [lang, setLangState] = useState(store.get('hp-app-lang') || 'uz');
  const [me, setMe] = useState(null);
  const [pid, setPid] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [stack, setStack] = useState([{ name: 'home' }]); // ekranlar zanjiri: "orqaga" bitta oldingisiga qaytaradi
  const [toast, setToast] = useState('');
  const [hint, setHint] = useState(!store.get(HINT_KEY));
  const [betaOpen, setBetaOpen] = useState(false); // "Sinov rejimi" — to'liq matn ochiqmi
  const [owner, setOwner] = useState(false); // kvitansiyada "kimniki" tanlovi ochiqmi

  const screen = stack[stack.length - 1];
  const go = (s) => setStack((st) => [...st, s]);
  const goHome = () => setStack([{ name: 'home' }]);
  const dark = tele.scheme === 'dark';
  const t = useCallback((k, v) => tr(k, lang, v), [lang]);
  const setLang = (l) => {
    setLangState(l);
    store.set('hp-app-lang', l);
  };

  const api = useCallback(async (path, body) => {
    const res = await fetch(`/api/app${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'content-type': 'application/json', 'x-tg-init-data': tele.tg?.initData || '' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(json.error || 'error'), { code: json.error, status: res.status });
    return json;
  }, [tele.tg]);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const loadMe = useCallback(async () => {
    setError('');
    try {
      const m = await api('/me');
      setMe(m);
      if (!store.get('hp-app-lang') && (m.lang === 'ru' || m.lang === 'uz')) setLangState(m.lang);
      setPid((cur) => {
        const exists = cur === 'none' ? m.unassigned > 0 : m.profiles.some((p) => p.id === cur);
        return exists ? cur : (m.profiles[0]?.id ?? (m.unassigned ? 'none' : null));
      });
    } catch (e) {
      setError(e.code === 'no_user' ? 'noUser' : 'error');
    }
  }, [api]);

  const loadData = useCallback(async (p) => {
    if (p === null || p === undefined) return setData(null);
    try {
      setData(await api(`/data?pid=${p}`));
    } catch {
      setError('error');
    }
    return undefined;
  }, [api]);

  useEffect(() => {
    if (tele.status === 'ok') loadMe();
  }, [tele.status, loadMe]);
  useEffect(() => {
    loadData(pid);
  }, [pid, loadData]);

  // Telegram tepasidagi "orqaga" tugmasi
  useEffect(() => {
    const backBtn = tele.tg?.BackButton;
    if (!backBtn) return undefined;
    const onBack = () => {
      setStack((st) => (st.length > 1 ? st.slice(0, -1) : st));
      setOwner(false);
    };
    if (stack.length > 1) backBtn.show();
    else backBtn.hide();
    backBtn.onClick(onBack);
    return () => backBtn.offClick(onBack);
  }, [tele.tg, stack.length]);

  const theme = THEMES[dark ? 'dark' : 'light'];
  useEffect(() => {
    const tg = tele.tg;
    if (!tg) return;
    try {
      tg.setHeaderColor(theme['--hp-head']);
      tg.setBackgroundColor(theme['--hp-bg']);
    } catch {
      /* eski Telegram versiyalari */
    }
  }, [tele.tg, theme]);

  const profiles = useMemo(() => me?.profiles || [], [me]);
  const current = pid === 'none' ? UNKNOWN : profiles.find((p) => p.id === pid);
  const nameOf = (p) => (p.id === 'none' ? t('unassigned') : profileTitle(p, lang));

  const refresh = async () => {
    await loadMe();
    await loadData(pid);
  };

  const shell = (children) => (
    <div style={{ ...theme, background: 'var(--hp-bg)', color: 'var(--hp-text)', minHeight: '100vh' }} className="font-ui">
      {children}
      {toast && (
        <div className="fixed inset-x-4 bottom-4 z-50 rounded-xl px-4 py-3 text-center text-[14px]" style={{ background: 'var(--hp-text)', color: 'var(--hp-bg)' }}>
          {toast}
        </div>
      )}
    </div>
  );

  if (tele.status === 'loading') return shell(<p className="p-6 text-center">{t('loading')}</p>);
  if (tele.status === 'outside') return shell(<p className="p-6 text-center">{t('notInTelegram')}</p>);
  if (error) {
    return shell(
      <div className="space-y-4 p-6 text-center">
        <p>{t(error)}</p>
        {error === 'error' && <Button onClick={refresh}>{t('retry')}</Button>}
      </div>,
    );
  }
  if (!me) return shell(<p className="p-6 text-center">{t('loading')}</p>);

  const visitOf = (id) => data?.visits.find((v) => v.id === id);
  const TITLES = {
    charts: 'tCharts', visits: 'tVisits', favs: 'tFavs', watchAdd: 'watchAddTitle', reminders: 'tRem',
    remAdd: 'remAddTitle', remEdit: 'remEditTitle', profile: 'tProfile', report: 'reportTitle',
  };
  const title = screen.name === 'home' ? t('hello')
    : screen.name === 'chart' ? analyteName(data?.analytes.find((a) => a.aid === screen.aid) || {}, lang)
      : screen.name === 'visit' ? fmtDay(visitOf(screen.id)?.day) : t(TITLES[screen.name] || 'title');

  // ---------- Sarlavha ----------
  const chip = (p) => {
    const on = pid === p.id;
    return (
      <button key={p.id} type="button" onClick={() => setPid(p.id)} className="flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-[14px] font-semibold"
        style={on ? { background: 'var(--hp-chip-on)', color: 'var(--hp-chip-on-text)' } : { background: 'var(--hp-chip)', color: 'var(--hp-head-text)' }}>
        <Avatar p={p} size={30} dark={dark && !on} />
        {nameOf(p)}
        {p.id === 'none' && ` · ${me.unassigned}`}
      </button>
    );
  };

  const isHome = screen.name === 'home';
  const header = (
    <header className={`px-4 pt-3 ${isHome ? 'pb-9' : 'pb-4'}`} style={{ background: 'var(--hp-head)', color: 'var(--hp-head-text)' }}>
      <div className="flex items-center justify-between gap-2">
        <h1 className="min-w-0 truncate font-display text-[20px] font-semibold">{title}</h1>
        <div className="flex shrink-0 overflow-hidden rounded-full text-[12px] font-semibold" style={{ background: 'var(--hp-chip)' }}>
          {['uz', 'ru'].map((l) => (
            <button key={l} type="button" onClick={() => setLang(l)} className="px-2.5 py-1" style={lang === l ? { background: 'var(--hp-chip-on)', color: 'var(--hp-chip-on-text)' } : undefined}>
              {l === 'uz' ? 'OʻZ' : 'RU'}
            </button>
          ))}
        </div>
      </div>
      {isHome && (profiles.length > 0 || me.unassigned > 0) && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {profiles.map(chip)}
          {me.unassigned > 0 && chip(UNKNOWN)}
        </div>
      )}
      {!isHome && current && (
        <p className="mt-2 flex items-center gap-2 text-[14px]">
          <Avatar p={current} size={24} dark={dark} />
          {nameOf(current)}
          {screen.name === 'visit' && <span className="opacity-80">· {t('blank', { n: visitOf(screen.id)?.number })}</span>}
        </p>
      )}
    </header>
  );

  // ---------- Bo'sh holat / rozilik ----------
  if (!profiles.length && !me.unassigned) {
    return shell(
      <>
        {header}
        <main className="space-y-3 p-4">
          {me.dataConsent !== true ? (
            <div className={`${card} space-y-4`} style={cardStyle}>
              <p className="text-[15px] leading-relaxed">{t('noConsent')}</p>
              <Button onClick={async () => { await api('/consent', {}); flash(t('consentDone')); setTimeout(refresh, 4000); }}>
                {t('enableConsent')}
              </Button>
            </div>
          ) : (
            <div className={card} style={cardStyle}><p className="text-[15px]">{t('empty')}</p></div>
          )}
        </main>
      </>,
    );
  }

  if (!data || !current) return shell(<>{header}<p className="p-6 text-center">{t('loading')}</p></>);

  const footer = (
    <div className="space-y-1 px-2 pb-2 text-center text-[12px]" style={{ color: 'var(--hp-muted)' }}>
      <p>{t('footer')}</p>
      {/* CC BY 4.0 talabi: rasm mualliflarini ko'rsatish */}
      <p className="text-[10.5px] opacity-80">
        Rasmlar: <a href="https://www.dicebear.com/licenses/" target="_blank" rel="noreferrer" className="underline">DiceBear</a> — Adventurer, Lorelei (Lisa Wischofsky), Big Smile (Ashley Seo); CC BY 4.0 / CC0
      </p>
    </div>
  );
  const page = (children) => shell(<>{header}<main className="space-y-3 p-4">{children}{footer}</main></>);

  const latest = (a) => a.points[a.points.length - 1];
  const byName = (x, y) => analyteName(x, lang).localeCompare(analyteName(y, lang));
  const analyteRow = (a) => {
    const p = latest(a);
    return (
      <button key={a.aid} type="button" onClick={() => go({ name: 'chart', aid: a.aid })} className="flex w-full items-center justify-between gap-3 py-3 text-left" style={{ borderTop: '1px solid var(--hp-line)' }}>
        <span className="min-w-0">
          <span className="block text-[15px]">{analyteName(a, lang)}</span>
          <span className="block text-[12px]" style={{ color: 'var(--hp-muted)' }}>{fmtDay(p.day)} · {t('times', { n: a.points.length })}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[16px] font-semibold" style={{ color: valueColor(p) }}>
          {p.text}{arrow(p)}
          <Icon name="chevron_right" size={18} className="opacity-50" />
        </span>
      </button>
    );
  };
  const listCard = (children) => <div className="rounded-2xl px-4 py-1" style={cardStyle}>{children}</div>;

  // ---------- Grafik ----------
  if (screen.name === 'chart') {
    const a = data.analytes.find((x) => x.aid === screen.aid);
    if (!a) return shell(<>{header}</>);
    const numeric = a.points.some((p) => typeof p.num === 'number');
    return page(
      <>
        <div className={card} style={cardStyle}>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[13px]" style={{ color: 'var(--hp-muted)' }}>{a.unit}</span>
            <span className="text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t('times', { n: a.points.length })}</span>
          </div>
          {a.noCompare
            ? <><p className="text-[15px] font-semibold">{t('noCompare')}</p><p className="mt-1 text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t('noCompareHint')}</p></>
            : numeric
              ? <Chart points={a.points} target={a.target} normLabel={a.target ? `${t('norm')} · ${t('goalLine')}` : t('norm')} />
              : <p className="text-[14px]">{t('noNumbers')}</p>}
        </div>
        {current.id !== 'none' && (
          <div className={`${card} flex items-center justify-between gap-3`} style={cardStyle}>
            <span className="text-[14px]">
              {a.remindMonths > 0 ? t(a.reminderOff ? 'remindOff' : 'remindOn', { m: a.remindMonths }) : t('remNone')}
            </span>
            <button type="button" className="shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold" style={{ border: '1px solid var(--hp-line)', color: 'var(--hp-primary)' }}
              onClick={() => go({ name: 'remEdit', aid: a.aid })}>
              {a.remindMonths > 0 ? t('remSet') : t('remCreate')}
            </button>
          </div>
        )}
        {current.id !== 'none' && numeric && !a.noCompare && (
          <GoalCard key={a.aid} a={a} t={t} onSave={async (low, high) => { await api('/target', { pid: current.id, aid: a.aid, low, high }); await loadData(pid); flash(t('saved')); }} />
        )}
        <div className={card} style={cardStyle}>
          <div className="grid grid-cols-[1fr_auto] gap-x-3 pb-2 text-[12px] font-semibold" style={{ color: 'var(--hp-muted)' }}>
            <span>{t('date')} · {t('ref')}</span><span className="text-right">{t('value')}</span>
          </div>
          {[...a.points].reverse().map((p, i) => (
            <div key={`${p.order_id}-${i}`} className="grid grid-cols-[1fr_auto] gap-x-3 py-2.5" style={{ borderTop: '1px solid var(--hp-line)' }}>
              <span className="text-[14px]">{fmtDay(p.day)}<span className="block text-[12px]" style={{ color: 'var(--hp-muted)' }}>{p.ref}</span></span>
              <span className="text-right text-[15px] font-semibold" style={{ color: valueColor(p) }}>{p.text}{arrow(p)}</span>
            </div>
          ))}
        </div>
        {current.id !== 'none' && !a.noCompare && (
          <Button kind="soft" onClick={async () => { await api('/favorite', { pid: current.id, aid: a.aid, on: !a.favorite }); await loadData(pid); }}>
            {a.favorite ? t('removeFav') : t('addFav')}
          </Button>
        )}
      </>,
    );
  }

  // ---------- Kvitansiya: natijalar + oldingi safar ----------
  if (screen.name === 'visit') {
    const v = visitOf(screen.id);
    if (!v) return shell(<>{header}</>);
    const rows = data.analytes
      .map((a) => {
        const i = a.points.findIndex((p) => p.order_id === v.id);
        if (i < 0) return null;
        const prev = a.points.slice(0, i).reverse().find((p) => p.order_id !== v.id);
        return { a, p: a.points[i], prev };
      })
      .filter(Boolean);
    const targets = [...profiles.filter((p) => p.id !== current.id), ...(current.id !== 'none' ? [UNKNOWN] : [])];
    return page(
      <>
        <GroupedList key={v.id} t={t} items={rows} render={({ a, p, prev }) => (
          <button key={a.aid} type="button" onClick={() => go({ name: 'chart', aid: a.aid })} className="flex w-full items-center justify-between gap-3 py-3 text-left" style={{ borderTop: '1px solid var(--hp-line)' }}>
            <span className="min-w-0">
              <span className="block text-[15px]">{analyteName(a, lang)}</span>
              {!a.noCompare && (
                <span className="block text-[12px]" style={{ color: 'var(--hp-muted)' }}>
                  {prev ? t('before', { d: fmtDay(prev.day).slice(0, 5), v: prev.text }) : t('firstTime')}
                </span>
              )}
            </span>
            <span className="shrink-0 text-[16px] font-semibold" style={{ color: valueColor(p) }}>{p.text}{arrow(p)}</span>
          </button>
        )} />
        <Button onClick={async () => {
          try {
            await api('/pdf', { orderId: v.id });
            flash(t('pdfSent'));
          } catch (e) {
            flash(e.code === 'gone' ? t('pdfGone') : t('error'));
          }
        }}>
          <span className="inline-flex items-center gap-2"><Icon name="picture_as_pdf" size={20} />{t('getPdf')}</span>
        </Button>
        <div className={card} style={cardStyle}>
          <p className="text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t('otherOwner')}</p>
          {!owner ? (
            <button type="button" className="mt-1 text-[15px] font-semibold" style={{ color: 'var(--hp-primary)' }} onClick={() => setOwner(true)}>{t('changeOwner')}</button>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-[14px] font-semibold">{t('whose')}</p>
              {targets.map((p) => (
                <button key={p.id} type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[15px]" style={{ border: '1px solid var(--hp-line)' }}
                  onClick={async () => { await api('/move', { orderId: v.id, pid: p.id }); setOwner(false); goHome(); flash(t('moved')); await refresh(); }}>
                  <Avatar p={p} size={30} dark={dark} />{nameOf(p)}
                </button>
              ))}
              <button type="button" className="w-full py-2 text-[14px]" style={{ color: 'var(--hp-muted)' }} onClick={() => setOwner(false)}>{t('cancel')}</button>
            </div>
          )}
        </div>
      </>,
    );
  }

  // ---------- Grafiklar (hamma ko'rsatkichlar) ----------
  if (screen.name === 'charts') {
    const favs = data.analytes.filter((a) => a.favorite).sort(byName);
    const rest = data.analytes.filter((a) => !a.favorite).map((a) => ({ a, p: latest(a) }));
    return page(
      <>
        <p className="px-1 text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t('chartsHint')}</p>
        {favs.length > 0 && listCard(<><p className="pt-2 text-[12px] font-semibold" style={{ color: 'var(--hp-muted)' }}>{t('favorites')}</p>{favs.map(analyteRow)}</>)}
        <GroupedList t={t} items={rest} render={({ a }) => analyteRow(a)} />
      </>,
    );
  }

  // ---------- Kuzatuv: tanlangan ko'rsatkichlar barcha sanalar bo'yicha (jadval yoki diagramma) ----------
  if (screen.name === 'favs') {
    return page(<WatchScreen data={data} lang={lang} t={t} onOpen={(aid) => go({ name: 'chart', aid })} onAdd={() => go({ name: 'watchAdd' })} />);
  }

  // ---------- Kuzatuvga qo'shish / olib tashlash ----------
  if (screen.name === 'watchAdd') {
    const items = data.analytes.map((a) => ({ a, p: latest(a) }));
    return page(
      <GroupedList t={t} items={items} render={({ a }) => a.noCompare ? (
        <div key={a.aid} className="flex w-full items-center gap-3 py-3" style={{ borderTop: '1px solid var(--hp-line)', color: 'var(--hp-muted)' }}>
          <Icon name="block" size={22} className="shrink-0 opacity-60" />
          <span className="min-w-0">
            <span className="block text-[15px]">{analyteName(a, lang)}</span>
            <span className="block text-[12px]">{t('noCompare')}</span>
          </span>
        </div>
      ) : (
        <button key={a.aid} type="button" className="flex w-full items-center gap-3 py-3 text-left" style={{ borderTop: '1px solid var(--hp-line)' }}
          onClick={async () => { await api('/favorite', { pid: current.id, aid: a.aid, on: !a.favorite }); await loadData(pid); }}>
          <Icon name={a.favorite ? 'check_box' : 'check_box_outline_blank'} size={22} className="shrink-0" />
          <span className="text-[15px]">{analyteName(a, lang)}</span>
        </button>
      )} />,
    );
  }

  // ---------- Kvitansiyalar ----------
  if (screen.name === 'visits') {
    return page(
      <>
        <p className="px-1 text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t('receiptsHint')}</p>
        {listCard(data.visits.map((v) => {
          const bad = data.analytes.filter((a) => a.points.some((p) => p.order_id === v.id && p.flag)).length;
          return (
            <button key={v.id} type="button" onClick={() => go({ name: 'visit', id: v.id })} className="flex w-full items-center justify-between gap-3 py-3.5 text-left" style={{ borderTop: '1px solid var(--hp-line)' }}>
              <span>
                <span className="block text-[16px] font-semibold">{fmtDay(v.day)}</span>
                <span className="block text-[12px]" style={{ color: bad ? 'var(--hp-bad)' : 'var(--hp-muted)' }}>
                  {t('items', { n: v.count })}{bad ? ` · ${t('outOfRange', { n: bad })}` : ''}
                </span>
              </span>
              <Icon name="chevron_right" size={22} className="opacity-60" />
            </button>
          );
        }))}
      </>,
    );
  }

  // ---------- Eslatmalar ----------
  // Eslatmalar: bemor o'zi qo'yadi — kim uchun (profil), qaysi tahlil, necha oyda; laboratoriya tavsiyasi ⭐
  if (screen.name === 'reminders') {
    const today = todayIso();
    const list = data.analytes.filter((a) => a.remindMonths > 0).sort(byName);
    const smallBtn = { border: '1px solid var(--hp-line)', color: 'var(--hp-primary)' };
    return page(
      <>
        {profiles.length > 1 && (
          <div className={`${card} space-y-2`} style={cardStyle}>
            <p className="text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t('remFor')}</p>
            <div className="flex flex-wrap gap-2">
              {profiles.map((p) => (
                <button key={p.id} type="button" onClick={() => setPid(p.id)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[14px] font-semibold"
                  style={pid === p.id ? { background: 'var(--hp-primary)', color: 'var(--hp-on-primary)' } : { background: 'var(--hp-bg)', border: '1px solid var(--hp-line)' }}>
                  <Avatar p={p} size={26} dark={dark} />
                  {nameOf(p)}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className={card} style={{ background: 'var(--hp-soft)', color: 'var(--hp-on-soft)' }}><p className="text-[13px] leading-relaxed">{t('remHelp')}</p></div>
        {list.length ? listCard(list.map((a) => {
          const last = latest(a).day;
          const next = addMonths(last, a.remindMonths);
          const due = next <= today;
          return (
            <div key={a.aid} className="flex items-center justify-between gap-3 py-3" style={{ borderTop: '1px solid var(--hp-line)' }}>
              <button type="button" className="min-w-0 text-left" onClick={() => go({ name: 'remEdit', aid: a.aid })}>
                <span className="block text-[15px]">{a.reminderOff ? '🔕 ' : '🔔 '}{analyteName(a, lang)}</span>
                <span className="block text-[12px]" style={{ color: 'var(--hp-muted)' }}>
                  {t('remEvery', { m: a.remindMonths })}{!a.remindOwn && a.remindLab ? ` ⭐ ${t('remLabTag')}` : ''} · {t('remLast', { d: fmtDay(last) })}
                </span>
                {!a.reminderOff && (
                  <span className="block text-[12px] font-semibold" style={{ color: due ? 'var(--hp-bad)' : 'var(--hp-ok)' }}>
                    {due ? t('remDue') : t('remNext', { d: fmtDay(next) })}
                  </span>
                )}
              </button>
              <button type="button" className="shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold" style={smallBtn} onClick={() => go({ name: 'remEdit', aid: a.aid })}>
                {t('remSet')}
              </button>
            </div>
          );
        })) : <div className={card} style={cardStyle}><p className="text-[14px]">{t('remEmpty')}</p></div>}
        <Button onClick={() => go({ name: 'remAdd' })}>{t('remAdd')}</Button>
      </>,
    );
  }

  // Eslatma qo'shish: shu profilning eslatmasi yo'q tahlillari
  if (screen.name === 'remAdd') {
    const free = data.analytes.filter((a) => !(a.remindMonths > 0)).sort(byName);
    return page(
      !data.analytes.length ? <div className={card} style={cardStyle}><p className="text-[14px]">{t('remNoAnalytes')}</p></div>
        : !free.length ? <div className={card} style={cardStyle}><p className="text-[14px]">{t('remAllSet')}</p></div>
          : (
            <>
              <p className="px-1 text-[14px] font-semibold">{t('remPick')}</p>
              {listCard(free.map((a) => (
                <button key={a.aid} type="button" onClick={() => go({ name: 'remEdit', aid: a.aid })} className="flex w-full items-center justify-between gap-3 py-3 text-left" style={{ borderTop: '1px solid var(--hp-line)' }}>
                  <span className="min-w-0">
                    <span className="block text-[15px]">{analyteName(a, lang)}</span>
                    <span className="block text-[12px]" style={{ color: 'var(--hp-muted)' }}>{t('remLast', { d: fmtDay(latest(a).day) })}</span>
                  </span>
                  <Icon name="chevron_right" size={18} className="shrink-0 opacity-50" />
                </button>
              )))}
            </>
          ),
    );
  }

  if (screen.name === 'remEdit') {
    const a = data.analytes.find((x) => x.aid === screen.aid);
    if (!a || current.id === 'none') return shell(<>{header}</>);
    const save = async (body, back = true) => {
      try {
        await api('/reminder', { pid: current.id, aid: a.aid, ...body });
        await loadData(pid);
        flash(t('saved'));
        if (back) setStack((st) => (st.length > 1 ? st.slice(0, -1) : st));
      } catch {
        flash(t('error'));
      }
    };
    return page(<ReminderEditor key={`${current.id}:${a.aid}`} a={a} t={t} lang={lang} lastDay={latest(a).day} onSave={save} />);
  }

  // ---------- Profil ----------
  if (screen.name === 'profile' && current.id !== 'none') {
    return page(<ProfileEditor key={current.id} full profile={current} t={t} lang={lang} api={api} dark={dark} onSaved={async () => { flash(t('saved')); await refresh(); }} />);
  }

  // ---------- Shifokorga ko'rsatish (PDF) ----------
  if (screen.name === 'report') {
    return shell(
      <>
        {header}
        <ReportForm data={data} t={t} lang={lang}
          onSubmit={async (aids, months) => {
            try {
              await api('/report', { pid: current.id, aids, months });
              flash(t('reportSent'));
              goHome();
            } catch {
              flash(t('error'));
            }
          }} />
      </>,
    );
  }

  // ---------- Bosh ekran: menyu ----------
  const last = data.visits[0];
  const lastBad = last ? data.analytes.filter((a) => a.points.some((p) => p.order_id === last.id && p.flag)).length : 0;
  const tiles = current.id === 'none'
    ? ['charts', 'visits']
    : ['favs', 'charts', 'visits', 'report', 'reminders', 'profile'];
  const TILE_TEXT = {
    charts: ['tCharts', 'sCharts'], visits: ['tVisits', 'sVisits'], report: ['tDoctor', 'sDoctor'],
    favs: ['tFavs', 'sFavs'], reminders: ['tRem', 'sRem'], profile: ['tProfile', 'sProfile'],
  };

  return shell(
    <>
      {header}
      <main className="-mt-6 space-y-3 px-4 pb-4">
        {last ? (
          <button type="button" onClick={() => go({ name: 'visit', id: last.id })} className="relative w-full rounded-2xl p-4 text-left shadow-sm" style={cardStyle}>
            <span className="block text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t('lastVisit', { d: fmtDay(last.day) })}</span>
            <span className="mt-1 flex items-center justify-between gap-2">
              <span className="text-[15px] font-semibold" style={{ color: lastBad ? 'var(--hp-bad)' : 'var(--hp-ok)' }}>
                {lastBad ? t('outOfRange', { n: lastBad }) : t('allInRange')}
              </span>
              <span className="shrink-0 whitespace-nowrap text-[14px] font-semibold" style={{ color: 'var(--hp-primary)' }}>{t('view')}</span>
            </span>
          </button>
        ) : (
          <div className="relative rounded-2xl p-4 shadow-sm" style={cardStyle}><p className="text-[14px]">{t('empty')}</p></div>
        )}
        <div className={`${card} space-y-2`} style={{ background: 'var(--hp-warn-bg)', color: 'var(--hp-warn-text)' }}>
          <p className="text-[14px] font-semibold">{t('betaTitle')}</p>
          <p className="whitespace-pre-line text-[13px] leading-relaxed">{betaOpen ? t('betaFull', { phone: site.phone }) : t('betaShort')}</p>
          <button type="button" onClick={() => setBetaOpen((o) => !o)} className="text-[13px] font-semibold underline">
            {betaOpen ? t('betaLess') : t('betaMore')}
          </button>
        </div>
        {hint && (
          <div className={`${card} space-y-3`} style={{ background: 'var(--hp-soft)', color: 'var(--hp-on-soft)' }}>
            <p className="text-[15px] font-semibold">{t('hintTitle')}</p>
            <p className="whitespace-pre-line text-[14px] leading-relaxed">{t('hint')}</p>
            <Button onClick={() => { store.set(HINT_KEY, '1'); setHint(false); }}>{t('hintOk')}</Button>
          </div>
        )}
        {current.id !== 'none' && !current.sex && (
          <div className={`${card} space-y-3`} style={{ background: 'var(--hp-warn-bg)', color: 'var(--hp-warn-text)' }}>
            <p className="text-[14px]">{t('sexAsk')}</p>
            <div className="flex gap-2">
              <Button onClick={async () => { await api('/profile', { pid: current.id, sex: 'm' }); await refresh(); }}>{t('male')}</Button>
              <Button onClick={async () => { await api('/profile', { pid: current.id, sex: 'f' }); await refresh(); }}>{t('female')}</Button>
            </div>
          </div>
        )}
        {current.id === 'none' && <div className={card} style={cardStyle}><p className="text-[14px]" style={{ color: 'var(--hp-muted)' }}>{t('unassignedHint')}</p></div>}

        <div className="grid grid-cols-2 gap-3">
          {tiles.map((k) => {
            const c = TILES[k];
            const [tt, st] = TILE_TEXT[k];
            return (
              <button key={k} type="button" onClick={() => go({ name: k })} className="flex min-h-[112px] flex-col items-start justify-between rounded-2xl p-4 text-left active:scale-[0.98]"
                style={{ background: dark ? c.dbg : c.bg, color: dark ? c.dfg : c.fg }}>
                {k === 'profile'
                  ? <Avatar p={current} size={44} dark={dark} />
                  : <span className="flex h-11 w-11 items-center justify-center rounded-xl text-[24px]" style={{ background: dark ? 'rgba(255,255,255,0.08)' : '#ffffff' }}>{c.icon}</span>}
                <span className="mt-3">
                  <span className="block text-[16px] font-semibold leading-tight">{t(tt)}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug opacity-80">{t(st)}</span>
                </span>
              </button>
            );
          })}
        </div>
        {footer}
      </main>
    </>,
  );
}

// Eslatma muddatini tanlash: 1–12 oy, laboratoriya tavsiyasi ⭐ bilan; keyingi topshirish sanasi darhol ko'rinadi
const REMIND_STEPS = [1, 2, 3, 6, 12];
function ReminderEditor({ a, t, lang, lastDay, onSave }) {
  const active = a.remindMonths > 0 && !a.reminderOff;
  const [months, setMonths] = useState(a.remindOwn || a.remindLab || 3);
  const steps = [...new Set([...REMIND_STEPS, a.remindLab, a.remindOwn].filter((m) => m > 0))].sort((x, y) => x - y);
  const next = addMonths(lastDay, months);
  const overdue = next <= todayIso();
  return (
    <div className={`${card} space-y-4`} style={cardStyle}>
      <div>
        <p className="text-[16px] font-semibold">{analyteName(a, lang)}</p>
        <p className="text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t('remLast', { d: fmtDay(lastDay) })}</p>
      </div>
      <div className="space-y-2">
        <p className="text-[14px]">{t('remHow')}</p>
        <div className="flex flex-wrap gap-2">
          {steps.map((m) => (
            <button key={m} type="button" onClick={() => setMonths(m)} className="rounded-full px-3.5 py-1.5 text-[14px] font-semibold"
              style={months === m ? { background: 'var(--hp-primary)', color: 'var(--hp-on-primary)' } : { border: '1px solid var(--hp-line)' }}>
              {m === a.remindLab ? '⭐ ' : ''}{t('remChip', { m })}
            </button>
          ))}
        </div>
        {a.remindLab > 0 && <p className="text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t('remLabTip', { m: a.remindLab })}</p>}
        <p className="text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t('remDoctorTip')}</p>
      </div>
      <p className="text-[14px] font-semibold" style={{ color: overdue ? 'var(--hp-bad)' : 'var(--hp-ok)' }}>
        {overdue ? t('remOverdue') : t('remNextOn', { d: fmtDay(next) })}
      </p>
      <div className="space-y-2">
        <Button className="w-full" onClick={() => onSave({ on: true, months })}>{t('remSave')}</Button>
        {a.remindOwn > 0 && a.remindLab > 0 && a.remindOwn !== a.remindLab && (
          <Button kind="soft" className="w-full" onClick={() => onSave({ on: true, months: null })}>{t('remReset')}</Button>
        )}
        {active && <Button kind="soft" className="w-full" onClick={() => onSave({ on: false })}>{t('remDelete')}</Button>}
      </div>
    </div>
  );
}

// Kichik chiziqli diagramma (jadval qatorida): o'zgarish yo'nalishi bir qarashda
function Sparkline({ pts }) {
  const nums = pts.filter((p) => typeof p.num === 'number');
  if (nums.length < 2) return null;
  const W = 72;
  const H = 22;
  const vals = nums.map((p) => p.num);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const x = (i) => 2 + (i * (W - 4)) / (nums.length - 1);
  const y = (v) => (max === min ? H / 2 : 3 + (H - 6) * (1 - (v - min) / (max - min)));
  const last = nums[nums.length - 1];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" style={{ display: 'block', marginTop: 4 }}>
      <polyline points={nums.map((p, i) => `${x(i)},${y(p.num)}`).join(' ')} fill="none" stroke="var(--hp-primary)" strokeWidth="1.6" />
      <circle cx={x(nums.length - 1)} cy={y(last.num)} r="2.6" fill={last.flag ? 'var(--hp-bad)' : 'var(--hp-primary)'} />
    </svg>
  );
}

const shortDay = (d) => {
  const f = fmtDay(d);
  return `${f.slice(0, 6)}${f.slice(8)}`; // 09.11.26
};

// "Kuzatuv": kuzatuvdagi ko'rsatkichlar x barcha sanalar (cheklovsiz), davr tanlanadi; jadval yoki diagrammalar
function WatchScreen({ data, lang, t, onOpen, onAdd }) {
  const [months, setMonths] = useState(0);
  const [mode, setMode] = useState('table');
  const since = months ? addMonths(todayIso(), -months) : '';
  const inPeriod = (p) => !since || p.day >= since;
  const watched = data.analytes.filter((a) => a.favorite).sort((x, y) => analyteName(x, lang).localeCompare(analyteName(y, lang)));
  const visits = data.visits
    .filter((v) => (!since || v.day >= since) && watched.some((a) => a.points.some((p) => p.order_id === v.id)))
    .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : a.id - b.id));
  const segStyle = (on) => (on ? { background: 'var(--hp-primary)', color: 'var(--hp-on-primary)' } : { color: 'var(--hp-muted)' });
  const card2 = { background: 'var(--hp-card)' };

  if (!watched.length) {
    return (
      <>
        <div className="rounded-2xl p-4" style={card2}><p className="text-[14px] leading-relaxed">{t('favEmpty')}</p></div>
        <Button kind="soft" onClick={onAdd}>{t('watchAdd')}</Button>
      </>
    );
  }

  return (
    <>
      <p className="px-1 text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t('watchCount', { n: watched.length })}</p>
      <div className="grid grid-cols-4 gap-1 rounded-xl p-1" style={card2}>
        {[[6, 'm6'], [12, 'm12'], [36, 'm36'], [0, 'mAll']].map(([m, k]) => (
          <button key={m} type="button" onClick={() => setMonths(m)} className="rounded-lg py-2 text-[13px] font-semibold" style={segStyle(months === m)}>{t(k)}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-xl p-1" style={card2}>
        {['table', 'chart'].map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className="rounded-lg py-2 text-[14px] font-semibold" style={segStyle(mode === m)}>
            {t(m === 'table' ? 'modeTable' : 'modeChart')}
          </button>
        ))}
      </div>

      {!visits.length ? (
        <div className="rounded-2xl p-4" style={card2}><p className="text-[14px]">{t('noPeriod')}</p></div>
      ) : mode === 'table' ? (
        <>
          <div className="overflow-hidden rounded-2xl" style={card2}>
            <div className="overflow-x-auto">
              <table className="border-collapse text-[14px]" style={{ minWidth: '100%' }}>
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 px-3 py-2.5 text-left text-[12px] font-semibold" style={{ background: 'var(--hp-card)', color: 'var(--hp-muted)' }}>{t('watchName')}</th>
                    {visits.map((v) => (
                      <th key={v.id} className="whitespace-nowrap px-3 py-2.5 text-right text-[12px] font-semibold" style={{ color: 'var(--hp-muted)' }}>{shortDay(v.day)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {watched.map((a) => {
                    let prev = null;
                    return (
                      <tr key={a.aid} style={{ borderTop: '1px solid var(--hp-line)' }}>
                        <th className="sticky left-0 z-10 max-w-[150px] px-3 py-2 text-left align-top font-normal" style={{ background: 'var(--hp-card)', boxShadow: '1px 0 0 var(--hp-line)' }}>
                          <button type="button" className="text-left" onClick={() => onOpen(a.aid)}>
                            <span className="block text-[14px] leading-snug" style={{ color: 'var(--hp-text)' }}>{analyteName(a, lang)}</span>
                            <span className="block text-[11px]" style={{ color: 'var(--hp-muted)' }}>
                              {[a.unit, a.target?.high != null ? `≤ ${a.target.high}` : '', a.target?.low != null ? `≥ ${a.target.low}` : ''].filter(Boolean).join(' · ')}
                            </span>
                            <Sparkline pts={a.points.filter(inPeriod)} />
                          </button>
                        </th>
                        {visits.map((v) => {
                          const p = a.points.find((x) => x.order_id === v.id);
                          let dir = '';
                          if (p && typeof p.num === 'number') {
                            if (prev !== null) dir = p.num > prev ? ' ↗' : p.num < prev ? ' ↘' : '';
                            prev = p.num;
                          }
                          return (
                            <td key={v.id} className="whitespace-nowrap px-3 py-2 text-right align-top font-semibold" style={{ color: p ? valueColor(p) : 'var(--hp-muted)' }}>
                              {p ? `${p.text}${dir}` : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="px-1 text-[12px]" style={{ color: 'var(--hp-muted)' }}>{t('swipeHint')}</p>
        </>
      ) : (
        watched.map((a) => {
          const pts = a.points.filter(inPeriod);
          if (!pts.length) return null;
          const numeric = pts.some((p) => typeof p.num === 'number');
          return (
            <button key={a.aid} type="button" onClick={() => onOpen(a.aid)} className="block w-full rounded-2xl p-4 text-left" style={card2}>
              <span className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-[15px] font-semibold">{analyteName(a, lang)}</span>
                <span className="shrink-0 text-[12px]" style={{ color: 'var(--hp-muted)' }}>{a.unit}</span>
              </span>
              {numeric
                ? <Chart points={pts} target={a.target} normLabel={t('norm')} />
                : <span className="block text-[14px]">{pts.map((p) => `${fmtDay(p.day)}: ${p.text}`).join(' · ')}</span>}
            </button>
          );
        })
      )}
      <Button kind="soft" onClick={onAdd}>{t('watchAdd')}</Button>
    </>
  );
}

const inputStyle = { background: 'var(--hp-bg)', color: 'var(--hp-text)', border: '1px solid var(--hp-line)' };
const toNum = (s) => (String(s).trim() === '' ? null : Number(String(s).replace(',', '.')));
const fmtNum = (v) => (v === null || v === undefined ? '' : String(v).replace('.', ','));

// Shaxsiy maqsad: grafikda to'q sariq punktir
function GoalCard({ a, t, onSave }) {
  const [open, setOpen] = useState(false);
  const [low, setLow] = useState(fmtNum(a.target?.low));
  const [high, setHigh] = useState(fmtNum(a.target?.high));
  const [err, setErr] = useState('');
  const shown = a.target
    ? [a.target.low !== null ? `≥ ${fmtNum(a.target.low)}` : '', a.target.high !== null ? `≤ ${fmtNum(a.target.high)}` : ''].filter(Boolean).join('   ')
    : '';
  const save = async (l, h) => {
    const lo = toNum(l);
    const hi = toNum(h);
    if ((lo !== null && !Number.isFinite(lo)) || (hi !== null && !Number.isFinite(hi))) return setErr(t('goalBad'));
    if (lo !== null && hi !== null && lo > hi) return setErr(t('goalBad'));
    setErr('');
    await onSave(lo, hi);
    setOpen(false);
    return undefined;
  };
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--hp-card)' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] font-semibold">{t('goalTitle')}</span>
        {shown && <span className="text-[15px] font-semibold" style={{ color: 'var(--hp-goal)' }}>{shown}</span>}
      </div>
      {!shown && !open && <p className="mt-1 text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t('goalNone')}</p>}
      {!open ? (
        <button type="button" className="mt-2 text-[14px] font-semibold" style={{ color: 'var(--hp-primary)' }} onClick={() => setOpen(true)}>{t('goalSet')} ›</button>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[[t('goalLow'), low, setLow], [t('goalHigh'), high, setHigh]].map(([label, v, set]) => (
              <label key={label} className="block text-[12px]" style={{ color: 'var(--hp-muted)' }}>
                {label}
                <input value={v} onChange={(e) => { set(e.target.value); setErr(''); }} inputMode="decimal" placeholder={a.unit}
                  className="mt-1 w-full rounded-xl px-3 py-2.5 text-[16px]" style={inputStyle} />
              </label>
            ))}
          </div>
          <p className="text-[12px]" style={{ color: err ? 'var(--hp-bad)' : 'var(--hp-muted)' }}>{err || t('goalHint')}</p>
          <Button onClick={() => save(low, high)}>{t('save')}</Button>
          {a.target && <Button kind="ghost" onClick={() => { setLow(''); setHigh(''); save('', ''); }}>{t('goalClear')}</Button>}
        </div>
      )}
    </div>
  );
}

// "Shifokorga ko'rsatish": ko'rsatkichlar va davr tanlanadi, PDF bot chatiga keladi
function ReportForm({ data, t, lang, onSubmit }) {
  // Solishtirilmaydiganlar ro'yxat oxirida, tanlab bo'lmaydi
  const sorted = [...data.analytes].sort((x, y) => (x.noCompare - y.noCompare) || (y.favorite - x.favorite) || analyteName(x, lang).localeCompare(analyteName(y, lang)));
  const comparable = sorted.filter((a) => !a.noCompare);
  const [picked, setPicked] = useState(() => {
    // Tanlanganlar va asosiylar oldindan belgilangan
    const pre = comparable.filter((a) => a.favorite || a.isKey).map((a) => a.aid);
    return new Set(pre.length ? pre : comparable.slice(0, 6).map((a) => a.aid));
  });
  const [months, setMonths] = useState(12);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const toggle = (aid) => setPicked((s) => {
    const n = new Set(s);
    if (n.has(aid)) n.delete(aid);
    else n.add(aid);
    setErr('');
    return n;
  });
  return (
    <main className="space-y-3 p-4">
      <div className="rounded-2xl px-4 pb-1 pt-3" style={{ background: 'var(--hp-card)' }}>
        <p className="text-[13px] font-semibold" style={{ color: 'var(--hp-muted)' }}>{t('reportPick')}</p>
        {sorted.map((a) => a.noCompare ? (
          <div key={a.aid} className="flex w-full items-center gap-3 py-3" style={{ borderTop: '1px solid var(--hp-line)', color: 'var(--hp-muted)' }}>
            <Icon name="block" size={22} className="shrink-0 opacity-60" />
            <span className="min-w-0">
              <span className="block text-[15px]">{analyteName(a, lang)}</span>
              <span className="block text-[12px]">{t('noCompare')}</span>
            </span>
          </div>
        ) : (
          <button key={a.aid} type="button" onClick={() => toggle(a.aid)} className="flex w-full items-center gap-3 py-3 text-left" style={{ borderTop: '1px solid var(--hp-line)' }}>
            <Icon name={picked.has(a.aid) ? 'check_box' : 'check_box_outline_blank'} size={22} className="shrink-0" />
            <span className="text-[15px]">{a.favorite ? '★ ' : ''}{analyteName(a, lang)}</span>
          </button>
        ))}
      </div>
      <div className="rounded-2xl p-4" style={{ background: 'var(--hp-card)' }}>
        <p className="mb-2 text-[13px] font-semibold" style={{ color: 'var(--hp-muted)' }}>{t('reportPeriod')}</p>
        <div className="grid grid-cols-3 gap-2">
          {[[6, 'm6'], [12, 'm12'], [0, 'mAll']].map(([m, k]) => (
            <button key={m} type="button" onClick={() => setMonths(m)} className="rounded-xl py-2.5 text-[14px] font-semibold"
              style={months === m ? { background: 'var(--hp-primary)', color: 'var(--hp-on-primary)' } : { border: '1px solid var(--hp-line)', color: 'var(--hp-text)' }}>
              {t(k)}
            </button>
          ))}
        </div>
      </div>
      {err && <p className="px-1 text-[13px]" style={{ color: 'var(--hp-bad)' }}>{err}</p>}
      <Button disabled={busy} onClick={async () => {
        if (!picked.size) return setErr(t('reportNone'));
        setBusy(true);
        await onSubmit([...picked], months);
        setBusy(false);
        return undefined;
      }}>
        <span className="inline-flex items-center gap-2"><Icon name="stethoscope" size={20} />{t('reportMake')}</span>
      </Button>
    </main>
  );
}

// Profilni tahrirlash: rasm (emoji), rang, kimligi, nomi, jinsi
function ProfileEditor({ profile, t, lang, api, dark, onSaved, full = false }) {
  const [open, setOpen] = useState(full);
  const [draft, setDraft] = useState({
    label: profile.label || '', sex: profile.sex || null, relation: profile.relation,
    avatar: avatarOf(profile), color: Object.keys(AVATAR_COLORS).find((k) => AVATAR_COLORS[k] === colorOf(profile)),
  });
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const preview = { ...profile, ...draft };
  const pill = (on) => (on ? { background: 'var(--hp-primary)', color: 'var(--hp-on-primary)' } : { border: '1px solid var(--hp-line)', color: 'var(--hp-text)' });

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--hp-card)' }}>
      {!full && (
        <button type="button" className="flex w-full items-center justify-between gap-2 text-left text-[14px] font-semibold" style={{ color: 'var(--hp-primary)' }} onClick={() => setOpen(!open)}>
          <span className="flex items-center gap-2"><Avatar p={profile} size={28} dark={dark} />{t('profileSettings')}</span>
          <Icon name={open ? 'expand_less' : 'expand_more'} size={20} />
        </button>
      )}
      {open && (
        <div className={full ? 'space-y-4' : 'mt-4 space-y-4'}>
          <div className="flex items-center gap-3">
            <Avatar p={preview} size={56} dark={dark} />
            <span className="text-[17px] font-semibold">{profileTitle(preview, lang)}</span>
          </div>
          <div>
            <p className="mb-2 text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t('avatar')}</p>
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_IMAGES.map(({ id }) => (
                <button key={id} type="button" onClick={() => set('avatar', id)} className="aspect-square overflow-hidden rounded-full"
                  style={{ background: dark ? colorOf(preview).dark : colorOf(preview).bg, outline: draft.avatar === id ? '3px solid var(--hp-primary)' : 'none', outlineOffset: 2 }}>
                  <img src={avatarUrl(id)} alt="" className="h-full w-full" loading="lazy" draggable="false" />
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-8 gap-1.5">
              {AVATARS.map((a) => (
                <button key={a} type="button" onClick={() => set('avatar', a)} className="flex aspect-square items-center justify-center rounded-xl text-[22px]"
                  style={draft.avatar === a ? { outline: '2px solid var(--hp-primary)', background: 'var(--hp-bg)' } : { background: 'var(--hp-bg)' }}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t('color')}</p>
            <div className="flex gap-2.5">
              {Object.entries(AVATAR_COLORS).map(([k, c]) => (
                <button key={k} type="button" aria-label={k} onClick={() => set('color', k)} className="h-9 w-9 rounded-full"
                  style={{ background: dark ? c.dark : c.bg, outline: draft.color === k ? '2px solid var(--hp-primary)' : 'none', outlineOffset: 2 }} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t('who')}</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(REL).map((r) => (
                <button key={r} type="button" onClick={() => set('relation', r)} className="rounded-full px-3 py-1.5 text-[13px] font-semibold" style={pill(draft.relation === r)}>
                  {REL[r][lang]}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-[13px]" style={{ color: 'var(--hp-muted)' }}>
            {t('profileName')}
            <input value={draft.label} onChange={(e) => set('label', e.target.value)} maxLength={40} placeholder={REL[draft.relation]?.[lang]}
              className="mt-1 w-full rounded-xl px-3 py-2.5 text-[15px]" style={{ background: 'var(--hp-bg)', color: 'var(--hp-text)', border: '1px solid var(--hp-line)' }} />
          </label>
          <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--hp-muted)' }}>
            {t('sex')}:
            {['m', 'f'].map((s) => (
              <button key={s} type="button" onClick={() => set('sex', s)} className="rounded-full px-3 py-1.5 text-[13px] font-semibold" style={pill(draft.sex === s)}>
                {t(s === 'm' ? 'male' : 'female')}
              </button>
            ))}
          </div>
          <Button onClick={async () => { await api('/profile', { pid: profile.id, ...draft }); if (!full) setOpen(false); onSaved(); }}>{t('save')}</Button>
        </div>
      )}
    </div>
  );
}
