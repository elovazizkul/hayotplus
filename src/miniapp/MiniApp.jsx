// Telegram Mini App "Mening tahlillarim" (/app): profillar, ko'rsatkichlar, grafiklar, tashriflar, solishtirish.
// Kirish parolsiz — Telegram imzosi (initData) har bir so'rovda serverga yuboriladi (server/bot/app-api.js).
// Ranglar — saytning firma ranglari; Telegram tungi rejimida avtomatik qorong'i mavzu.
import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import Chart from './Chart.jsx';
import { analyteName, fmtDay, profileTitle, REL, tr } from './texts.js';

const THEMES = {
  light: {
    '--hp-bg': '#eef4ff', '--hp-card': '#ffffff', '--hp-head': '#00628e', '--hp-head-text': '#ffffff',
    '--hp-text': '#131b2e', '--hp-muted': '#5f6b78', '--hp-line': '#e2e8f5', '--hp-primary': '#00628e',
    '--hp-on-primary': '#ffffff', '--hp-soft': '#d6fbe9', '--hp-on-soft': '#005236', '--hp-ok': '#006c49',
    '--hp-bad': '#ba1a1a', '--hp-norm': '#d6fbe9', '--hp-chip': 'rgba(255,255,255,0.18)', '--hp-chip-on': '#ffffff',
    '--hp-chip-on-text': '#00628e', '--hp-warn-bg': '#fff4dc', '--hp-warn-text': '#7a5200',
  },
  dark: {
    '--hp-bg': '#0f1724', '--hp-card': '#1a2433', '--hp-head': '#0b3550', '--hp-head-text': '#e6edf6',
    '--hp-text': '#e6edf6', '--hp-muted': '#9fb3c8', '--hp-line': '#263244', '--hp-primary': '#8bceff',
    '--hp-on-primary': '#001e2f', '--hp-soft': '#003824', '--hp-on-soft': '#6ffbbe', '--hp-ok': '#4edea3',
    '--hp-bad': '#ffb4ab', '--hp-norm': 'rgba(78,222,163,0.16)', '--hp-chip': 'rgba(255,255,255,0.12)', '--hp-chip-on': '#8bceff',
    '--hp-chip-on-text': '#001e2f', '--hp-warn-bg': '#3a2c0b', '--hp-warn-text': '#ffd88a',
  },
};

const TG_SCRIPT = 'https://telegram.org/js/telegram-web-app.js';

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

const readLang = () => {
  try {
    const v = localStorage.getItem('hp-app-lang');
    return v === 'ru' || v === 'uz' ? v : null;
  } catch {
    return null;
  }
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

function valueColor(p) {
  return p?.flag ? 'var(--hp-bad)' : 'var(--hp-ok)';
}
const arrow = (p) => (p?.flag === 'high' ? ' ↑' : p?.flag === 'low' ? ' ↓' : '');

export default function MiniApp() {
  const tele = useTelegram();
  const [lang, setLangState] = useState(readLang() || 'uz');
  const [me, setMe] = useState(null);
  const [pid, setPid] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('analytes');
  const [screen, setScreen] = useState({ name: 'home' });
  const [toast, setToast] = useState('');
  const [picking, setPicking] = useState([]); // solishtirish uchun tanlangan tashriflar
  const [moving, setMoving] = useState(null); // ko'chirilayotgan tashrif

  const t = useCallback((k, v) => tr(k, lang, v), [lang]);
  const setLang = (l) => {
    setLangState(l);
    try {
      localStorage.setItem('hp-app-lang', l);
    } catch {
      /* ixtiyoriy */
    }
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
      if (!readLang() && (m.lang === 'ru' || m.lang === 'uz')) setLangState(m.lang);
      setPid((cur) => cur ?? (m.profiles[0]?.id ?? (m.unassigned ? 'none' : null)));
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
    const goBack = () => setScreen({ name: 'home' });
    if (screen.name === 'home') back.hide();
    else back.show();
    back.onClick(goBack);
    return () => back.offClick(goBack);
  }, [tele.tg, screen.name]);

  const theme = THEMES[tele.scheme || 'light'];
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
  const current = pid === 'none' ? { id: null } : profiles.find((p) => p.id === pid);

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

  // ---------- Sarlavha: profillar ----------
  const header = (
    <header className="px-4 pb-4 pt-3" style={{ background: 'var(--hp-head)', color: 'var(--hp-head-text)' }}>
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-[19px] font-semibold">
          {screen.name === 'home' ? t('title') : screen.name === 'compare' ? t('compareTitle') : analyteName(data?.analytes.find((a) => a.aid === screen.aid) || {}, lang)}
        </h1>
        <div className="flex overflow-hidden rounded-full text-[12px] font-semibold" style={{ background: 'var(--hp-chip)' }}>
          {['uz', 'ru'].map((l) => (
            <button key={l} type="button" onClick={() => setLang(l)} className="px-2.5 py-1" style={lang === l ? { background: 'var(--hp-chip-on)', color: 'var(--hp-chip-on-text)' } : undefined}>
              {l === 'uz' ? 'OʻZ' : 'RU'}
            </button>
          ))}
        </div>
      </div>
      {screen.name === 'home' && (profiles.length > 0 || me.unassigned > 0) && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {profiles.map((p) => (
            <button key={p.id} type="button" onClick={() => setPid(p.id)} className="shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold"
              style={pid === p.id ? { background: 'var(--hp-chip-on)', color: 'var(--hp-chip-on-text)' } : { background: 'var(--hp-chip)', color: 'var(--hp-head-text)' }}>
              {profileTitle(p, lang)}
            </button>
          ))}
          {me.unassigned > 0 && (
            <button type="button" onClick={() => setPid('none')} className="shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold"
              style={pid === 'none' ? { background: 'var(--hp-chip-on)', color: 'var(--hp-chip-on-text)' } : { background: 'var(--hp-chip)', color: 'var(--hp-head-text)' }}>
              {t('unassigned')} · {me.unassigned}
            </button>
          )}
        </div>
      )}
      {screen.name !== 'home' && current && (
        <p className="mt-1 text-[13px] opacity-85">{current.id ? profileTitle(current, lang) : t('unassigned')}</p>
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
          {current.id && (
            <Button kind="soft" onClick={async () => { await api('/favorite', { pid: current.id, aid: a.aid, on: !a.favorite }); await loadData(pid); }}>
              {a.favorite ? t('removeFav') : t('addFav')}
            </Button>
          )}
          <p className="px-2 text-center text-[12px]" style={{ color: 'var(--hp-muted)' }}>{t('footer')}</p>
        </main>
      </>,
    );
  }

  // ---------- Solishtirish ----------
  if (screen.name === 'compare') {
    const [first, second] = [...screen.pair].sort((x, y) => {
      const dx = data.visits.find((v) => v.id === x)?.day || '';
      const dy = data.visits.find((v) => v.id === y)?.day || '';
      return dx < dy ? -1 : dx > dy ? 1 : x - y;
    });
    const va = data.visits.find((v) => v.id === first);
    const vb = data.visits.find((v) => v.id === second);
    const rows = data.analytes
      .map((a) => ({ a, p1: a.points.find((p) => p.order_id === first), p2: a.points.find((p) => p.order_id === second) }))
      .filter((r) => r.p1 || r.p2);
    const trend = (r) => (typeof r.p1?.num === 'number' && typeof r.p2?.num === 'number' ? (r.p2.num > r.p1.num ? '↗' : r.p2.num < r.p1.num ? '↘' : '=') : '');
    return shell(
      <>
        {header}
        <main className="p-4">
          <div className={card} style={cardStyle}>
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 pb-2 text-[12px] font-semibold" style={{ color: 'var(--hp-muted)' }}>
              <span>{t('wasNow')}</span><span className="text-right">{fmtDay(va?.day)}</span><span className="text-right">{fmtDay(vb?.day)}</span><span />
            </div>
            {rows.map((r) => (
              <div key={r.a.aid} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 py-2.5" style={{ borderTop: '1px solid var(--hp-line)' }}>
                <span className="text-[14px]">{analyteName(r.a, lang)}</span>
                <span className="text-right text-[14px]" style={{ color: r.p1 ? valueColor(r.p1) : 'var(--hp-muted)' }}>{r.p1 ? `${r.p1.text}${arrow(r.p1)}` : '—'}</span>
                <span className="text-right text-[14px] font-semibold" style={{ color: r.p2 ? valueColor(r.p2) : 'var(--hp-muted)' }}>{r.p2 ? `${r.p2.text}${arrow(r.p2)}` : '—'}</span>
                <span className="w-4 text-center text-[14px]" style={{ color: 'var(--hp-muted)' }}>{trend(r)}</span>
              </div>
            ))}
          </div>
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

  const settings = current.id ? <ProfileSettings key={current.id} profile={current} t={t} lang={lang} api={api} onSaved={async () => { flash(t('saved')); await refresh(); }} /> : null;

  return shell(
    <>
      {header}
      <main className="space-y-3 p-4">
        {current.id && !current.sex && (
          <div className={`${card} space-y-3`} style={{ background: 'var(--hp-warn-bg)', color: 'var(--hp-warn-text)' }}>
            <p className="text-[14px]">{t('sexAsk')}</p>
            <div className="flex gap-2">
              <Button onClick={async () => { await api('/profile', { pid: current.id, sex: 'm' }); await refresh(); }}>{t('male')}</Button>
              <Button onClick={async () => { await api('/profile', { pid: current.id, sex: 'f' }); await refresh(); }}>{t('female')}</Button>
            </div>
          </div>
        )}
        {pid === 'none' && <div className={card} style={cardStyle}><p className="text-[14px]" style={{ color: 'var(--hp-muted)' }}>{t('unassignedHint')}</p></div>}

        <div className="grid grid-cols-2 gap-1 rounded-xl p-1" style={{ background: 'var(--hp-card)' }}>
          {['analytes', 'visits'].map((k) => (
            <button key={k} type="button" onClick={() => { setTab(k); setPicking([]); setMoving(null); }} className="rounded-lg py-2 text-[14px] font-semibold"
              style={tab === k ? { background: 'var(--hp-primary)', color: 'var(--hp-on-primary)' } : { color: 'var(--hp-muted)' }}>
              {t(k === 'analytes' ? 'tabAnalytes' : 'tabVisits')}
            </button>
          ))}
        </div>

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
          <>
            {data.visits.length >= 2 && (
              <Button kind="soft" onClick={() => (picking.length === 2 ? setScreen({ name: 'compare', pair: picking }) : setPicking(picking.length ? [] : [-1]))}>
                {picking.length === 2 ? t('compareShow') : t('compare')}
              </Button>
            )}
            {picking.length > 0 && picking.length < 2 && <p className="px-1 text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t('comparePick')}</p>}
            <div className="rounded-2xl px-4 pb-1 pt-1" style={cardStyle}>
              {data.visits.map((v) => {
                const picked = picking.includes(v.id);
                return (
                  <div key={v.id} className="py-3" style={{ borderTop: '1px solid var(--hp-line)' }}>
                    <div className="flex items-center justify-between gap-2">
                      {picking.length > 0 ? (
                        <button type="button" className="flex items-center gap-2 text-left"
                          onClick={() => setPicking((cur) => {
                            const list = cur.filter((x) => x !== -1);
                            return picked ? list.filter((x) => x !== v.id) : [...list, v.id].slice(-2);
                          })}>
                          <Icon name={picked ? 'check_box' : 'check_box_outline_blank'} size={22} />
                          <span><span className="block text-[15px]">{fmtDay(v.day)}</span><span className="block text-[12px]" style={{ color: 'var(--hp-muted)' }}>{t('blank', { n: v.number })} · {t('items', { n: v.count })}</span></span>
                        </button>
                      ) : (
                        <span><span className="block text-[15px]">{fmtDay(v.day)}</span><span className="block text-[12px]" style={{ color: 'var(--hp-muted)' }}>{t('blank', { n: v.number })} · {t('items', { n: v.count })}</span></span>
                      )}
                      {picking.length === 0 && (
                        <span className="flex shrink-0 gap-2">
                          <button type="button" className="rounded-lg px-3 py-1.5 text-[13px] font-semibold" style={{ background: 'var(--hp-primary)', color: 'var(--hp-on-primary)' }}
                            onClick={async () => {
                              try {
                                await api('/pdf', { orderId: v.id });
                                flash(t('pdfSent'));
                              } catch (e) {
                                flash(e.code === 'gone' ? t('pdfGone') : t('error'));
                              }
                            }}>
                            {t('pdf')}
                          </button>
                          <button type="button" className="rounded-lg px-3 py-1.5 text-[13px] font-semibold" style={{ background: 'var(--hp-soft)', color: 'var(--hp-on-soft)' }} onClick={() => setMoving(moving === v.id ? null : v.id)}>
                            {t('move')}
                          </button>
                        </span>
                      )}
                    </div>
                    {moving === v.id && (
                      <div className="mt-3 space-y-2">
                        <p className="text-[13px]" style={{ color: 'var(--hp-muted)' }}>{t('moveTo')}</p>
                        <div className="flex flex-wrap gap-2">
                          {[...profiles.filter((p) => p.id !== current.id), ...(current.id ? [{ id: 'none' }] : [])].map((p) => (
                            <button key={p.id} type="button" className="rounded-full px-3 py-1.5 text-[13px] font-semibold" style={{ border: '1px solid var(--hp-line)', color: 'var(--hp-primary)' }}
                              onClick={async () => { await api('/move', { orderId: v.id, pid: p.id }); setMoving(null); flash(t('moved')); await refresh(); }}>
                              {p.id === 'none' ? t('unassigned') : profileTitle(p, lang)}
                            </button>
                          ))}
                          <button type="button" className="rounded-full px-3 py-1.5 text-[13px]" style={{ color: 'var(--hp-muted)' }} onClick={() => setMoving(null)}>{t('cancel')}</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
        {settings}
        <p className="px-2 text-center text-[12px]" style={{ color: 'var(--hp-muted)' }}>{t('footer')}</p>
      </main>
    </>,
  );
}

// Profilni qayta nomlash va jinsini o'zgartirish
function ProfileSettings({ profile, t, lang, api, onSaved }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(profile.label || '');
  const [sex, setSex] = useState(profile.sex || null);
  const [relation, setRelation] = useState(profile.relation);
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--hp-card)' }}>
      <button type="button" className="flex w-full items-center justify-between text-[14px] font-semibold" style={{ color: 'var(--hp-primary)' }} onClick={() => setOpen(!open)}>
        {t('profileSettings')}
        <Icon name={open ? 'expand_less' : 'expand_more'} size={20} />
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            {Object.keys(REL).map((r) => (
              <button key={r} type="button" onClick={() => setRelation(r)} className="rounded-full px-3 py-1.5 text-[13px] font-semibold"
                style={relation === r ? { background: 'var(--hp-primary)', color: 'var(--hp-on-primary)' } : { border: '1px solid var(--hp-line)', color: 'var(--hp-text)' }}>
                {REL[r][lang]}
              </button>
            ))}
          </div>
          <label className="block text-[13px]" style={{ color: 'var(--hp-muted)' }}>
            {t('profileName')}
            <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} placeholder={REL[relation]?.[lang]}
              className="mt-1 w-full rounded-xl px-3 py-2.5 text-[15px]" style={{ background: 'var(--hp-bg)', color: 'var(--hp-text)', border: '1px solid var(--hp-line)' }} />
          </label>
          <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--hp-muted)' }}>
            {t('sex')}:
            {['m', 'f'].map((s) => (
              <button key={s} type="button" onClick={() => setSex(s)} className="rounded-full px-3 py-1.5 text-[13px] font-semibold"
                style={sex === s ? { background: 'var(--hp-primary)', color: 'var(--hp-on-primary)' } : { border: '1px solid var(--hp-line)', color: 'var(--hp-text)' }}>
                {t(s === 'm' ? 'male' : 'female')}
              </button>
            ))}
          </div>
          <Button onClick={async () => { await api('/profile', { pid: profile.id, label, sex, relation }); onSaved(); }}>{t('save')}</Button>
        </div>
      )}
    </div>
  );
}
