import { useState } from 'react';
import Icon from './Icon.jsx';
import SectionHeader from './SectionHeader.jsx';
import { ui, useLang } from '../i18n.jsx';
import { vaccines, vaccineRules } from '../data/vaccines.js';
import { branches } from '../data/branches.js';
import { formatPrice } from '../data/prices.js';
import { site } from '../data/site.js';
import { phoneDigits, sendLead } from '../lib/api.js';

// "2026-10-29T14:30" formatidagi hozirgi vaqt (sana tanlashda o'tgan kunni bloklash uchun)
function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function Vaccination() {
  const { t, lang } = useLang();
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');
  const isSending = status === 'sending';

  const onSubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const phone = String(f.get('phone') || '');
    if (phoneDigits(phone).length < 9) {
      setError(t(ui.form.phoneInvalid));
      return;
    }
    setError('');
    setStatus('sending');
    try {
      await sendLead({
        type: 'vaccine',
        lang,
        name: f.get('name'),
        phone,
        vaccine: f.get('vaccine'),
        datetime: f.get('datetime'),
        branch: f.get('branch'),
        company: f.get('company'), // spam-botlar uchun tuzoq (ko'rinmas maydon)
      });
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="emlash" className="bg-surface py-space-xl md:py-16">
      <div className="container-page">
        <SectionHeader eyebrow={t(ui.vacc.eyebrow)} eyebrowClass="text-secondary" title={t(ui.vacc.title)} text={t(ui.vacc.text)} />

        <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-md lg:col-span-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {vaccines.map((v) => (
                <div key={v.id} className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <Icon name={v.icon} size={28} className={v.iconColor === 'secondary' ? 'text-secondary' : 'text-primary'} />
                      <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-right font-ui text-label-xs font-semibold text-on-surface">
                        {t(v.tag)}
                      </span>
                    </div>
                    <h3 className="text-title-md font-bold text-on-surface">{t(v.name)}</h3>
                    <p className="text-body-sm text-on-surface-variant">{t(v.desc)}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <span className="font-ui text-body-md font-bold text-primary">
                      {v.priceFrom && lang === 'ru' ? `${t(ui.vacc.from)} ` : ''}
                      {formatPrice(v.price, lang)}
                      {v.priceFrom && lang !== 'ru' ? t(ui.vacc.from) : ''}
                    </span>
                    <span className="font-ui text-label-xs font-semibold text-secondary">{t(v.note)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl bg-surface-container-low p-6">
              <div className="flex items-center gap-2">
                <Icon name="verified" size={24} className="text-primary" />
                <h4 className="text-title-md font-bold text-on-surface">{t(ui.vacc.rulesTitle)}</h4>
              </div>
              <ul className="flex flex-col gap-2 text-body-sm text-on-surface-variant">
                {vaccineRules.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Icon name="check_circle" size={18} className="mt-0.5 text-secondary" />
                    <span>
                      <strong className="text-on-surface">
                        {i + 1}. {t(r.title)}:
                      </strong>{' '}
                      {t(r.text)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-6 shadow-xl lg:col-span-5">
            <div className="flex items-center gap-3 pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
                <Icon name="event_available" size={24} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-title-md font-bold text-on-surface">{t(ui.vacc.formTitle)}</h3>
                <span className="font-ui text-label-xs text-on-surface-variant">{t(ui.vacc.formSub)}</span>
              </div>
            </div>

            {status === 'done' ? (
              <div className="flex flex-col items-center gap-3 rounded-xl bg-secondary-container/60 p-6 text-center">
                <Icon name="task_alt" size={40} className="text-secondary" />
                <p className="font-ui text-label-lg text-on-secondary-fixed-variant">{t(ui.vacc.success)}</p>
                <button type="button" onClick={() => setStatus('idle')} className="font-ui text-label-md text-primary underline">
                  {t(ui.vacc.again)}
                </button>
              </div>
            ) : (
              <form className="flex flex-col gap-3" onSubmit={onSubmit} noValidate={false}>
                <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                <label className="flex flex-col gap-1">
                  <span className="label">{t(ui.vacc.name)}</span>
                  <input name="name" required maxLength={80} placeholder={t(ui.vacc.namePh)} className="field" autoComplete="name" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="label">{t(ui.vacc.phone)}</span>
                  <input
                    name="phone"
                    type="tel"
                    required
                    maxLength={20}
                    placeholder="+998 90 123-45-67"
                    defaultValue="+998 "
                    className="field font-ui"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="label">{t(ui.vacc.type)}</span>
                  <select name="vaccine" className="field">
                    {vaccines.map((v) => (
                      <option key={v.id} value={v.name.uz}>
                        {t(v.name)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="label">{t(ui.vacc.time)}</span>
                  <input name="datetime" type="datetime-local" required min={nowLocal()} className="field" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="label">{t(ui.vacc.branch)}</span>
                  <select name="branch" className="field">
                    {branches.map((b) => (
                      <option key={b.id} value={`${b.name.uz} — ${b.address.uz}`}>
                        {t(b.short)} ({t(b.city)})
                      </option>
                    ))}
                  </select>
                </label>

                {error && <p className="font-ui text-label-md text-error">{error}</p>}
                {status === 'error' && (
                  <p className="rounded-xl bg-error-container p-3 font-ui text-label-md text-on-error-container">
                    {t(ui.form.error, { phone: site.phone })}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-secondary font-ui text-label-lg text-on-secondary shadow-md shadow-secondary/20 transition-all hover:bg-on-secondary-container disabled:opacity-60"
                >
                  <Icon name={isSending ? 'hourglass_top' : 'check'} />
                  <span>{status === 'sending' ? t(ui.form.sending) : t(ui.vacc.submit)}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
