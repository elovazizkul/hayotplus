// Telegram Mini App "Mening tahlillarim" (/app): kimning tahlillari (avatar + nom), grafiklar, kvitansiyalar.
// Kvitansiyani ochganda har bir natija yonida "oldingi safar" ko'rinadi — alohida "solishtirish" rejimi yo'q.
// Kirish parolsiz — Telegram imzosi (initData) har bir so'rovda serverga yuboriladi (server/bot/app-api.js).
// Ranglar — saytning firma ranglari; Telegram tungi rejimida avtomatik qorong'i mavzu.
import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { AVATAR_COLORS, AVATAR_IMAGES, AVATARS, avatarOf, avatarUrl, colorOf, isImageAvatar } from '../data/avatars.js';
import Chart from './Chart.jsx';
import { analyteName, fmtDay, profileTitle, REL, tr } from './texts.js';

const THEMES = {
  light: {
    '--hp-bg': '#eef4ff', '--hp-card': '#ffffff', '--hp-head': '#00628e', '--hp-head-text': '#ffffff',
    '--hp-text': '#131b2e', '--hp-muted': '#5f6b78', '--hp-line': '#e2e8f5', '--hp-primary': '#00628e',
    '--hp-on-primary': '#ffffff', '--hp-soft': '#d6fbe9', '--hp-on-soft': '#005236', '--hp-ok': '#006c49',
    '--hp-bad': '#ba1a1a', '--hp-norm': '#d6fbe9', '--hp-chip': 'rgba(255,255,255,0.16)', '--hp-chip-on': '#ffffff',
    '--hp-chip-on-text': '#00628e', '--hp-warn-bg': '#fff4dc', '--hp-warn-text': '#7a5200',
  },
  dark: {
    '--hp-bg': '#0f1724', '--hp-card': '#1a2433', '--hp-head': '#0b3550', '--hp-head-text': '#e6edf6',
    '--hp-text': '#e6edf6', '--hp-muted': '#9fb3c8', '--hp-line': '#263244', '--hp-primary': '#8bceff',
    '--hp-on-primary': '#001e2f', '--hp-soft': '#003824', '--hp-on-soft': '#6ffbbe', '--hp-ok': '#4edea3',
    '--hp-bad': '#ffb4ab', '--hp-norm': 'rgba(78,222,163,0.16)', '--hp-chip': 'rgba(255,255,255,0.10)', '--hp-chip-on': '#8bceff',
    '--hp-chip-on-text': '#001e2f', '--hp-warn-bg': '#3a2c0b', '--hp-warn-text': '#ffd88a',
  },
};

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

const valueColor = (p) => (p?.flag ? 'var(--hp-bad)' : 'var(--hp-ok)');
const arrow = (p) => (p?.flag === 'high' ? ' ↑' : p?.flag === 'low' ? ' ↓' : '');

export default function MiniApp() {
  const tele = useTelegram();
  const [lang, setLangState] = useState(store.get('hp-app-lang') || 'uz');
  const [me, setMe] = useState(null);
  const [pid, setPid] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('analytes');
  const [screen, setScreen] = useState({ name: 'home' });
  const [toast, setToast] = useState('');
  const [hint, setHint] = useState(!store.get(HINT_KEY));
  const [owner, setOwner] = useState(false); // kvitansiyada "kimniki" tanlovi ochiqmi

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
    const back = tele.tg?.BackButton;
    if (!back) return undefined;
    const goBack = () => {
      setScreen({ name: 'home' });
      setOwner(false);
    };
    if (screen.name === 'home') back.hide();
    else back.show();
    back.onClick(goBack);
    return () => back.offClick(goBack);
  }, [tele.tg, screen.name]);

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
  const title = screen.name === 'chart'
    ? analyteName(data?.analytes.find((a) => a.aid === screen.aid) || {}, lang)
    : screen.name === 'visit' ? fmtDay(visitOf(screen.id)?.day) : t('title');

  // ---------- Sarlavha: kimning tahlillari ----------
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

  const header = (
    <header className="px-4 pb-4 pt-3" style={{ background: 'var(--hp-head)', color: 'var(--hp-head-text)' }}>
      <div className="flex items-center justify-between gap-2">
        <h1 className="min-w-0 truncate font-display text-[19px] font-semibold">{title}</h1>
        <div className="flex shrink-0 overflow-hidden rounded-full text-[12px] font-semibold" style={{ background: 'var(--hp-chip)' }}>
          {['uz', 'ru'].map((l) => (
            <button key={l} type="button" onClick={() => setLang(l)} className="px-2.5 py-1" style={lang === l ? { background: 'var(--hp-chip-on)', color: 'var(--hp-chip-on-text)' } : undefined}>
              {l === 'uz' ? 'OʻZ' : 'RU'}
            </button>
          ))}
        </div>
      </div>
      {screen.name === 'home' && (profiles.length > 0 || me.unassigned > 0) && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {profiles.map(chip)}
          {me.unassigned > 0 && chip(UNKNOWN)}
        </div>
      )}
      {screen.name !== 'home' && current && (
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
    <div className="space-y-1 px-2 text-center text-[12px]" style={{ color: 'var(--hp-muted)' }}>
      <p>{t('footer')}</p>
      {/* CC BY 4.0 talabi: rasm mualliflarini ko'rsatish */}
      <p className="text-[10.5px] opacity-80">
        Rasmlar: <a href="https://www.dicebear.com/licenses/" target="_blank" rel="noreferrer" className="underline">DiceBear</a> — Adventurer, Lorelei (Lisa Wischofsky), Big Smile (Ashley Seo); CC BY 4.0 / CC0
      </p>
    </div>
  );

  // ---------- Grafik ----------
  if (screen.name === 'chart') {
    const a = data.analytes.find((x) => x.aid === screen.aid);
    if (!a) return shell(<>{header}</>);
    const numeric = a.points.some((p) => typeof p.num === 'number');
    return shell(
      <>
        {header}
        <main className="space-y-3 p-4">
          <div className={card} style={cardStyle}>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[13px]" style={{ color: 'var(--hp-muted)' }}>{a.unit}</span>
              <span className="text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t('times', { n: a.points.length })}</span>
            </div>
            {numeric ? <Chart points={a.points} normLabel={t('norm')} /> : <p className="text-[14px]">{t('noNumbers')}</p>}
          </div>
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
          {current.id !== 'none' && (
            <Button kind="soft" onClick={async () => { await api('/favorite', { pid: current.id, aid: a.aid, on: !a.favorite }); await loadData(pid); }}>
              {a.favorite ? t('removeFav') : t('addFav')}
            </Button>
          )}
          {footer}
        </main>
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
    return shell(
      <>
        {header}
        <main className="space-y-3 p-4">
          <div className="rounded-2xl px-4 py-1" style={cardStyle}>
            {rows.map(({ a, p, prev }) => (
              <button key={a.aid} type="button" onClick={() => setScreen({ name: 'chart', aid: a.aid })} className="flex w-full items-center justify-between gap-3 py-3 text-left" style={{ borderTop: '1px solid var(--hp-line)' }}>
                <span className="min-w-0">
                  <span className="block text-[15px]">{analyteName(a, lang)}</span>
                  <span className="block text-[12px]" style={{ color: 'var(--hp-muted)' }}>
                    {prev ? t('before', { d: fmtDay(prev.day).slice(0, 5), v: prev.text }) : t('firstTime')}
                  </span>
                </span>
                <span className="shrink-0 text-[16px] font-semibold" style={{ color: valueColor(p) }}>{p.text}{arrow(p)}</span>
              </button>
            ))}
          </div>
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
                    onClick={async () => { await api('/move', { orderId: v.id, pid: p.id }); setOwner(false); setScreen({ name: 'home' }); flash(t('moved')); await refresh(); }}>
                    <Avatar p={p} size={30} dark={dark} />{nameOf(p)}
                  </button>
                ))}
                <button type="button" className="w-full py-2 text-[14px]" style={{ color: 'var(--hp-muted)' }} onClick={() => setOwner(false)}>{t('cancel')}</button>
              </div>
            )}
          </div>
          {footer}
        </main>
      </>,
    );
  }

  // ---------- Bosh ekran ----------
  const latest = (a) => a.points[a.points.length - 1];
  const favs = data.analytes.filter((a) => a.favorite);
  const rest = data.analytes.filter((a) => !a.favorite).sort((x, y) => analyteName(x, lang).localeCompare(analyteName(y, lang)));

  const row = (a) => {
    const p = latest(a);
    return (
      <button key={a.aid} type="button" onClick={() => setScreen({ name: 'chart', aid: a.aid })} className="flex w-full items-center justify-between gap-3 py-3 text-left" style={{ borderTop: '1px solid var(--hp-line)' }}>
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

  return shell(
    <>
      {header}
      <main className="space-y-3 p-4">
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

        <div className="grid grid-cols-2 gap-1 rounded-xl p-1" style={{ background: 'var(--hp-card)' }}>
          {['analytes', 'visits'].map((k) => (
            <button key={k} type="button" onClick={() => setTab(k)} className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[14px] font-semibold"
              style={tab === k ? { background: 'var(--hp-primary)', color: 'var(--hp-on-primary)' } : { color: 'var(--hp-muted)' }}>
              <Icon name={k === 'analytes' ? 'monitoring' : 'receipt_long'} size={18} />
              {t(k === 'analytes' ? 'tabAnalytes' : 'tabVisits')}
            </button>
          ))}
        </div>
        <p className="px-1 text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t(tab === 'analytes' ? 'chartsHint' : 'receiptsHint')}</p>

        {tab === 'analytes' ? (
          <>
            {favs.length > 0 && (
              <div className="rounded-2xl px-4 pb-1 pt-3" style={cardStyle}>
                <p className="text-[12px] font-semibold" style={{ color: 'var(--hp-muted)' }}>{t('favorites')}</p>
                {favs.map(row)}
              </div>
            )}
            <div className="rounded-2xl px-4 pb-1 pt-3" style={cardStyle}>
              <p className="text-[12px] font-semibold" style={{ color: 'var(--hp-muted)' }}>{t('all')}</p>
              {rest.map(row)}
              {!data.analytes.length && <p className="py-3 text-[14px]">{t('empty')}</p>}
            </div>
          </>
        ) : (
          <div className="rounded-2xl px-4 py-1" style={cardStyle}>
            {data.visits.map((v) => (
              <button key={v.id} type="button" onClick={() => setScreen({ name: 'visit', id: v.id })} className="flex w-full items-center justify-between gap-3 py-3.5 text-left" style={{ borderTop: '1px solid var(--hp-line)' }}>
                <span>
                  <span className="block text-[16px] font-semibold">{fmtDay(v.day)}</span>
                  <span className="block text-[12px]" style={{ color: 'var(--hp-muted)' }}>{t('items', { n: v.count })}</span>
                </span>
                <Icon name="chevron_right" size={22} className="opacity-60" />
              </button>
            ))}
          </div>
        )}
        {current.id !== 'none' && (
          <ProfileEditor key={current.id} profile={current} t={t} lang={lang} api={api} dark={dark} onSaved={async () => { flash(t('saved')); await refresh(); }} />
        )}
        {footer}
      </main>
    </>,
  );
}

// Profilni tahrirlash: rasm (emoji), rang, kimligi, nomi, jinsi
function ProfileEditor({ profile, t, lang, api, dark, onSaved }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    label: profile.label || '', sex: profile.sex || null, relation: profile.relation,
    avatar: avatarOf(profile), color: Object.keys(AVATAR_COLORS).find((k) => AVATAR_COLORS[k] === colorOf(profile)),
  });
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const preview = { ...profile, ...draft };
  const pill = (on) => (on ? { background: 'var(--hp-primary)', color: 'var(--hp-on-primary)' } : { border: '1px solid var(--hp-line)', color: 'var(--hp-text)' });

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--hp-card)' }}>
      <button type="button" className="flex w-full items-center justify-between gap-2 text-left text-[14px] font-semibold" style={{ color: 'var(--hp-primary)' }} onClick={() => setOpen(!open)}>
        <span className="flex items-center gap-2"><Avatar p={profile} size={28} dark={dark} />{t('profileSettings')}</span>
        <Icon name={open ? 'expand_less' : 'expand_more'} size={20} />
      </button>
      {open && (
        <div className="mt-4 space-y-4">
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
          <Button onClick={async () => { await api('/profile', { pid: profile.id, ...draft }); setOpen(false); onSaved(); }}>{t('save')}</Button>
        </div>
      )}
    </div>
  );
}
