import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { ui, useLang } from '../i18n.jsx';
import { site, telHref } from '../data/site.js';

export const NAV = [
  { id: 'bosh-sahifa', label: ui.nav.home },
  { id: 'manzillar', label: ui.nav.branches },
  { id: 'narxlar', label: ui.nav.prices },
  { id: 'emlash', label: ui.nav.vaccination },
  { id: 'ai-yordamchi', label: ui.nav.ai },
  { id: 'aloqa', label: ui.nav.contact },
];

export function Logo({ sub }) {
  const { t } = useLang();
  return (
    <a href="#bosh-sahifa" className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label={site.name}>
      <img src="/logo-192.png" alt="" width="36" height="36" className="h-9 w-9 shrink-0 object-contain" />
      <span className="flex min-w-0 flex-col">
        <span className="whitespace-nowrap font-display text-title-md font-semibold leading-tight tracking-tight text-primary sm:text-headline-sm">
          {site.name}
        </span>
        <span className="hidden whitespace-nowrap font-ui text-label-xs font-medium uppercase tracking-wide text-on-surface-variant sm:block">
          {sub || t(ui.brandSub)}
        </span>
      </span>
    </a>
  );
}

export function LangSwitch() {
  const { lang, setLang } = useLang();
  const btn = (code, label) => (
    <button
      type="button"
      onClick={() => setLang(code)}
      aria-pressed={lang === code}
      className={`rounded-full px-2.5 py-1 font-ui text-label-xs transition-colors ${
        lang === code
          ? 'bg-surface-container-lowest font-bold text-primary shadow-sm'
          : 'font-medium text-on-surface-variant hover:text-on-surface'
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex items-center rounded-full bg-surface-container-low p-1" role="group" aria-label="Til / Язык">
      {btn('uz', 'OʻZ')}
      {btn('ru', 'RU')}
    </div>
  );
}

export default function Header({ active }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface-container-lowest/90 shadow-elevated backdrop-blur-xl">
      <div className="container-page flex h-20 items-center justify-between gap-space-md">
        <Logo />

        <nav className="hidden items-center gap-space-lg xl:flex" aria-label="Asosiy menyu">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={active === item.id ? 'page' : undefined}
              className={`py-space-xs font-ui text-label-lg transition-colors ${
                active === item.id ? 'font-bold text-primary' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {t(item.label)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-space-sm md:gap-space-md">
          <LangSwitch />
          <a
            href={telHref(site.phone)}
            className="hidden items-center gap-2 rounded-xl bg-primary px-space-md py-2.5 font-ui text-label-md text-on-primary shadow-glow transition-all hover:bg-primary-container sm:flex"
          >
            <Icon name="call" size={18} />
            <span className="hidden lg:inline">{t(ui.nav.call)}</span>
            <span className="font-ui text-data-mono font-bold">{site.phone}</span>
          </a>
          <a
            href={telHref(site.phone)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary sm:hidden"
            aria-label={t(ui.nav.call)}
          >
            <Icon name="call" size={20} />
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container text-on-surface xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={t(ui.nav.menu)}
          >
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          className="border-t border-surface-container bg-surface-container-lowest xl:hidden"
          aria-label="Mobil menyu"
        >
          <div className="container-page flex flex-col py-2">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-3 font-ui text-label-lg ${
                  active === item.id ? 'bg-primary-fixed/50 font-bold text-primary' : 'text-on-surface hover:bg-surface-container-low'
                }`}
              >
                {t(item.label)}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
