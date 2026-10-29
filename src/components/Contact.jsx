import { useState } from 'react';
import Icon from './Icon.jsx';
import SectionHeader from './SectionHeader.jsx';
import { ui, useLang } from '../i18n.jsx';
import { site, telHref } from '../data/site.js';
import { branches } from '../data/branches.js';
import { formatPrice } from '../data/prices.js';
import { phoneDigits, sendLead } from '../lib/api.js';

export default function Contact({ cart, onRemove, onClear }) {
  const { t, lang } = useLang();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const isSending = status === 'sending';
  const main = branches.find((b) => b.main) || branches[0];
  const total = cart.reduce((s, c) => s + c.price, 0);

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const phone = String(f.get('phone') || '');
    if (phoneDigits(phone).length < 9) {
      setError(t(ui.form.phoneInvalid));
      return;
    }
    setError('');
    setStatus('sending');
    try {
      await sendLead({
        type: 'contact',
        lang,
        name: f.get('name'),
        phone,
        message: f.get('message'),
        tests: cart.map((c) => ({ name: c.name.uz, price: c.price })),
        total,
        company: f.get('company'),
      });
      setStatus('done');
      form.reset();
      onClear();
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="aloqa" className="bg-surface py-space-xl md:py-16">
      <div className="container-page">
        <SectionHeader eyebrow={t(ui.contact.eyebrow)} title={t(ui.contact.title)} text={t(ui.contact.text)} />

        <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-5">
            <div className="flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
              <h3 className="font-display text-headline-sm text-on-surface">{t(ui.contact.infoTitle)}</h3>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                  <Icon name="call" />
                </div>
                <div className="flex flex-col">
                  <span className="font-ui text-label-xs text-on-surface-variant">{t(ui.contact.phones)}</span>
                  {[site.phone, site.phone2].filter(Boolean).map((p) => (
                    <a key={p} href={telHref(p)} className="font-ui text-body-md font-bold text-on-surface transition-colors hover:text-primary">
                      {p}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
                  <Icon name="schedule" />
                </div>
                <div className="flex flex-col">
                  <span className="font-ui text-label-xs text-on-surface-variant">{t(ui.contact.hours)}</span>
                  <span className="text-body-sm font-semibold text-on-surface">{t(site.hours)}</span>
                  <span className="font-ui text-label-xs font-bold text-secondary">{t(site.hoursNote)}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                  <Icon name="location_on" />
                </div>
                <div className="flex flex-col">
                  <span className="font-ui text-label-xs text-on-surface-variant">{t(ui.contact.address)}</span>
                  <span className="text-body-sm font-semibold text-on-surface">{t(main.address)}</span>
                  {main.landmark && <span className="font-ui text-label-xs text-on-surface-variant">{t(main.landmark)}</span>}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <span className="font-ui text-label-xs font-bold uppercase text-on-surface-variant">{t(ui.contact.social)}</span>
                <div className="flex flex-wrap items-center gap-2">
                  {site.telegramBot && (
                    <a
                      href={`https://t.me/${site.telegramBot}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-surface-container px-3.5 py-2 font-ui text-label-md text-primary transition-colors hover:bg-primary hover:text-on-primary"
                    >
                      <Icon name="send" size={18} /> @{site.telegramBot}
                    </a>
                  )}
                  {site.instagram && (
                    <a
                      href={`https://instagram.com/${site.instagram}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-surface-container px-3.5 py-2 font-ui text-label-md text-primary transition-colors hover:bg-primary hover:text-on-primary"
                    >
                      <Icon name="photo_camera" size={18} /> @{site.instagram}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-6 shadow-xl md:p-8 lg:col-span-7">
            <div className="flex flex-col gap-1">
              <h3 className="text-title-md font-bold text-on-surface">{t(ui.contact.formTitle)}</h3>
              <p className="text-body-sm text-on-surface-variant">{t(ui.contact.formSub)}</p>
            </div>

            {status === 'done' ? (
              <div className="flex flex-col items-center gap-3 rounded-xl bg-secondary-container/60 p-6 text-center">
                <Icon name="task_alt" size={40} className="text-secondary" />
                <p className="font-ui text-label-lg text-on-secondary-fixed-variant">{t(ui.contact.success)}</p>
                <button type="button" onClick={() => setStatus('idle')} className="font-ui text-label-md text-primary underline">
                  {t(ui.vacc.again)}
                </button>
              </div>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={onSubmit}>
                <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

                {cart.length > 0 && (
                  <div className="flex flex-col gap-2 rounded-xl bg-primary-fixed/30 p-4">
                    <span className="label">{t(ui.contact.selectedTests)}</span>
                    <div className="flex flex-wrap gap-2">
                      {cart.map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest py-1 pl-3 pr-1.5 font-ui text-label-md text-on-surface shadow-sm"
                        >
                          {t(c.name)} · {formatPrice(c.price, lang)}
                          <button
                            type="button"
                            onClick={() => onRemove(c.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
                            aria-label="O'chirish"
                          >
                            <Icon name="close" size={16} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <span className="font-ui text-label-lg font-bold text-primary">
                      {t(ui.prices.cartTotal)}: {formatPrice(total, lang)}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="label">{t(ui.contact.name)}</span>
                    <input name="name" required maxLength={80} placeholder={t(ui.contact.namePh)} className="field h-12 px-4" autoComplete="name" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="label">{t(ui.contact.phone)}</span>
                    <input
                      name="phone"
                      type="tel"
                      required
                      maxLength={20}
                      defaultValue="+998 "
                      placeholder="+998 90 123-45-67"
                      className="field h-12 px-4 font-ui"
                      autoComplete="tel"
                      inputMode="tel"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="label">{t(ui.contact.msg)}</span>
                  <textarea
                    name="message"
                    rows={3}
                    maxLength={1000}
                    required={cart.length === 0}
                    placeholder={t(ui.contact.msgPh)}
                    className="field h-auto resize-none p-4"
                  />
                </label>

                {error && <p className="font-ui text-label-md text-error">{error}</p>}
                {status === 'error' && (
                  <p className="rounded-xl bg-error-container p-3 font-ui text-label-md text-on-error-container">
                    {t(ui.form.error, { phone: site.phone })}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button type="submit" disabled={status === 'sending'} className="btn-primary h-12 min-w-[200px] flex-1">
                    <Icon name={isSending ? 'hourglass_top' : 'send'} />
                    <span>{status === 'sending' ? t(ui.form.sending) : t(ui.contact.submit)}</span>
                  </button>
                  {site.telegramBot && (
                    <a
                      href={`https://t.me/${site.telegramBot}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-telegram px-5 font-ui text-label-lg text-white shadow-sm transition-all hover:opacity-90 sm:flex-none"
                    >
                      <Icon name="send" />
                      <span>{t(ui.contact.telegram)}</span>
                    </a>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
