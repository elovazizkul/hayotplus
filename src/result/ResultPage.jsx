// /natija — QR-kod orqali tahlil natijalari va ularning AI izohi.
// Natijalar laboratoriya dasturidan server orqali olinadi; bemor ismi bu yerga kelmaydi.
import { useCallback, useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { LangSwitch } from '../components/Header.jsx';
import { ui, useLang } from '../i18n.jsx';
import { site, telHref } from '../data/site.js';
import { parseResultLink, refFromLocation } from './link.js';
import QrScanner from './QrScanner.jsx';

const r = ui.result;

const post = async (path, body) => {
  const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { status: res.status, ok: res.ok, data: await res.json().catch(() => ({})) };
};

function Phone() {
  return (
    <a href={telHref(site.phone)} className="whitespace-nowrap font-ui font-bold text-primary">
      {site.phone}
    </a>
  );
}

function Notice({ kind = 'info', children }) {
  const style = kind === 'error' ? 'bg-error-container text-on-error-container' : 'bg-surface-container-low text-on-surface';
  return <div className={`rounded-xl px-4 py-3 text-body-md ${style}`}>{children}</div>;
}

function ScanCard({ onRef }) {
  const { t } = useLang();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');

  const accept = (text) => {
    const ref = parseResultLink(text);
    if (!ref) {
      setError(t(r.badLink));
      return false;
    }
    setScanning(false);
    onRef(ref);
    return true;
  };

  return (
    <div className="space-y-4 rounded-2xl bg-surface-container-lowest p-5 shadow-sm md:p-6">
      <p className="text-body-md text-on-surface-variant">{t(r.intro)}</p>
      {scanning ? (
        <>
          <QrScanner onResult={accept} onError={() => { setScanning(false); setError(t(r.cameraError)); }} />
          <p className="text-center font-ui text-label-md text-on-surface-variant">{t(r.scanHint)}</p>
          <button type="button" onClick={() => setScanning(false)} className="w-full rounded-xl bg-surface-container px-5 py-3 font-ui text-label-lg text-on-surface">
            {t(r.scanStop)}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => { setError(''); setScanning(true); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-ui text-label-lg text-on-primary shadow-lg shadow-primary/20 hover:bg-primary-container"
        >
          <Icon name="qr_code_scanner" />
          {t(r.scan)}
        </button>
      )}
      {error && <Notice kind="error">{error}</Notice>}
      <form
        onSubmit={(e) => { e.preventDefault(); setError(''); accept(link); }}
        className="space-y-2 border-t border-surface-container pt-4"
      >
        <label htmlFor="result-link" className="block font-ui text-label-md text-on-surface-variant">{t(r.pasteLabel)}</label>
        <div className="flex gap-2">
          <input
            id="result-link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            inputMode="url"
            autoComplete="off"
            placeholder="https://hy.todevelop.ru/q/r/result?id=..."
            className="min-w-0 flex-1 rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-body-md text-on-surface"
          />
          <button type="submit" disabled={!link.trim()} className="rounded-xl bg-surface-container px-4 font-ui text-label-md text-primary disabled:opacity-50">
            {t(r.pasteButton)}
          </button>
        </div>
      </form>
    </div>
  );
}

function ResultsList({ lab, abnormal }) {
  const { t } = useLang();
  return (
    <div className="space-y-4 rounded-2xl bg-surface-container-lowest p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap gap-x-4 gap-y-1 font-ui text-label-md text-on-surface-variant">
        {lab.number && <span>{t(r.blank, { n: lab.number })}</span>}
        {lab.date && <span>{t(r.date, { d: lab.date })}</span>}
        {lab.age !== null && <span>{t(r.age, { n: lab.age })}</span>}
      </div>
      {lab.groups.map((g, gi) => (
        <section key={gi}>
          {g.title && <h2 className="mb-1 text-title-md font-bold text-on-surface">{g.title}</h2>}
          <ul>
            {g.items.map((x, i) => {
              const flag = abnormal.get(x.name);
              return (
                <li key={i} className="flex items-start justify-between gap-3 border-t border-surface-container py-2.5">
                  <span className="text-body-sm text-on-surface">{x.name}</span>
                  <span className="shrink-0 text-right">
                    <span className={`font-ui text-body-md font-bold ${flag ? 'text-error' : 'text-on-surface'}`}>
                      {x.value}
                      {flag === 'high' && ' ↑'}
                      {flag === 'low' && ' ↓'}
                    </span>
                    {x.unit && <span className="font-ui text-label-xs text-on-surface-variant"> {x.unit}</span>}
                    {x.ref && <span className="block font-ui text-label-xs text-on-surface-variant">{t(r.colRef)}: {x.ref}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Answer({ a }) {
  const { t } = useLang();
  return (
    <div className="space-y-4">
      {a.urgency === 'urgent' && <Notice kind="error"><b>{t(r.urgent)}</b></Notice>}
      {a.summary && <p className="text-body-md text-on-surface">{a.summary}</p>}
      {a.abnormal.length > 0 ? (
        <div>
          <h3 className="mb-2 font-ui text-label-lg font-bold text-on-surface">{t(r.abnormalTitle)}</h3>
          <ul className="space-y-2">
            {a.abnormal.map((x, i) => (
              <li key={i} className="rounded-xl bg-surface-container-low px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-body-sm font-semibold text-on-surface">{x.name}</span>
                  <span className="font-ui text-label-md font-bold text-error">
                    {x.value} · {t(x.flag === 'low' ? r.low : r.high)}
                  </span>
                </div>
                {x.comment && <p className="mt-1 text-body-sm text-on-surface-variant">{x.comment}</p>}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <Notice>{t(r.allNormal)}</Notice>
      )}
      {a.specialty !== 'none' && a.specialty_name && (
        <p className="flex items-center gap-2 font-ui text-label-lg font-bold text-primary">
          <Icon name="stethoscope" size={22} />
          {t(r.specialist, { s: a.specialty_name })}
        </p>
      )}
      {a.advice && <p className="text-body-md text-on-surface">{a.advice}</p>}
      {a.disclaimer && <p className="text-body-sm italic text-on-surface-variant">{a.disclaimer}</p>}
    </div>
  );
}

function AiBlock({ refData, enabled, onAnswer }) {
  const { t, lang } = useLang();
  const [sex, setSex] = useState(null);
  const [state, setState] = useState({ status: 'idle' });

  const ask = async () => {
    setState({ status: 'asking' });
    try {
      const res = await post('/api/interpret', { ...refData, sex, lang });
      if (res.ok) {
        setState({ status: 'done', answer: res.data.answer });
        onAnswer(res.data.answer);
      } else {
        const msg = res.status === 503 ? r.aiOff : res.data.error === 'daily_limit' ? r.limit : res.status === 429 ? r.tooMany : r.aiError;
        setState({ status: 'error', msg });
      }
    } catch {
      setState({ status: 'error', msg: r.aiError });
    }
  };

  const sexButton = (value, label) => (
    <button
      type="button"
      onClick={() => setSex(value)}
      aria-pressed={sex === value}
      className={`flex-1 rounded-xl px-4 py-3 font-ui text-label-lg ${sex === value ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'}`}
    >
      {t(label)}
    </button>
  );

  return (
    <div className="space-y-4 rounded-2xl bg-surface-container-lowest p-5 shadow-sm md:p-6">
      <h2 className="flex items-center gap-2 text-title-md font-bold text-on-surface">
        <Icon name="auto_awesome" className="text-secondary" />
        {t(r.aiTitle)}
      </h2>
      {!enabled ? (
        <Notice>{t(r.aiOff, { phone: site.phone })}</Notice>
      ) : state.status === 'done' ? (
        <Answer a={state.answer} />
      ) : (
        <>
          <p className="text-body-md text-on-surface-variant">{t(r.sexQuestion)}</p>
          <div className="flex gap-2">
            {sexButton('m', r.male)}
            {sexButton('f', r.female)}
          </div>
          <button
            type="button"
            onClick={ask}
            disabled={!sex || state.status === 'asking'}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-4 font-ui text-label-lg text-on-secondary shadow-md disabled:opacity-50"
          >
            <Icon name="auto_awesome" />
            {state.status === 'asking' ? t(r.asking) : t(r.ask)}
          </button>
          {state.status === 'error' && <Notice kind="error">{t(state.msg, { phone: site.phone })}</Notice>}
        </>
      )}
    </div>
  );
}

export default function ResultPage() {
  const { t } = useLang();
  const [ref, setRef] = useState(refFromLocation);
  const [status, setStatus] = useState(ref ? 'loading' : 'idle');
  const [lab, setLab] = useState(null);
  const [abnormal, setAbnormal] = useState(new Map());

  const load = useCallback(async (next) => {
    setRef(next);
    setLab(null);
    setAbnormal(new Map());
    setStatus('loading');
    try {
      const res = await post('/api/results', next);
      if (res.ok) {
        setLab(res.data);
        setStatus('ready');
      } else {
        setStatus(res.status === 404 || res.status === 400 ? 'notFound' : res.status === 429 ? 'tooMany' : 'lisError');
      }
    } catch {
      setStatus('lisError');
    }
  }, []);

  useEffect(() => {
    document.title = `${t(r.title)} — ${site.name}`;
  }, [t]);

  useEffect(() => {
    if (ref) load(ref);
    // faqat sahifa ochilganda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => {
    window.history.replaceState(null, '', '/natija');
    setRef(null);
    setLab(null);
    setStatus('idle');
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-surface-container bg-surface-container-lowest">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2 font-ui text-label-md text-on-surface-variant hover:text-primary">
            <img src="/logo-192.png" alt="" width="32" height="32" className="h-8 w-8" />
            <span className="hidden font-display text-title-md font-semibold text-primary sm:inline">{site.name}</span>
            <span className="sm:hidden">{t(r.back)}</span>
          </a>
          <LangSwitch />
        </div>
      </header>

      <main className="container-page max-w-2xl space-y-4 py-6 md:py-10">
        <h1 className="font-display text-headline-sm font-semibold text-on-surface md:text-headline-md">{t(r.title)}</h1>

        {status === 'idle' && <ScanCard onRef={load} />}
        {status === 'loading' && <Notice>{t(r.loading)}</Notice>}
        {(status === 'notFound' || status === 'lisError' || status === 'tooMany') && (
          <>
            <Notice kind="error">{t(status === 'notFound' ? r.notFound : status === 'tooMany' ? r.tooMany : r.lisError, { phone: site.phone })}</Notice>
            <button type="button" onClick={() => (status === 'notFound' ? reset() : load(ref))} className="rounded-xl bg-surface-container px-5 py-3 font-ui text-label-lg text-primary">
              {t(status === 'notFound' ? r.another : r.retry)}
            </button>
          </>
        )}
        {status === 'ready' && lab && (
          <>
            <AiBlock key={`${ref.id}`} refData={ref} enabled={lab.interpretEnabled} onAnswer={(a) => setAbnormal(new Map(a.abnormal.map((x) => [x.name, x.flag])))} />
            <ResultsList lab={lab} abnormal={abnormal} />
            <p className="text-body-sm text-on-surface-variant">
              {t(r.questions)} <Phone />
            </p>
            <button type="button" onClick={reset} className="font-ui text-label-md text-primary underline">
              {t(r.another)}
            </button>
          </>
        )}
      </main>
    </div>
  );
}
