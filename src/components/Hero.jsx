import { useState } from 'react';
import Icon from './Icon.jsx';
import { ui, useLang } from '../i18n.jsx';
import { site } from '../data/site.js';

export default function Hero() {
  const { t } = useLang();
  const [imgOk, setImgOk] = useState(Boolean(site.heroImage));

  return (
    <section
      id="bosh-sahifa"
      className="relative overflow-hidden bg-gradient-to-b from-primary-fixed/20 via-surface to-surface pb-space-xl pt-space-md md:pt-space-lg"
    >
      <div className="container-page">
        <div className="grid grid-cols-1 items-center gap-space-lg lg:grid-cols-12 lg:gap-space-xl">
          <div className="flex flex-col gap-space-md lg:col-span-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-container-low px-3.5 py-1.5 shadow-sm">
              <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-secondary" />
              <span className="font-ui text-label-xs font-bold uppercase tracking-wider text-secondary">
                {t(site.heroTagline)}
              </span>
            </div>

            <h1 className="text-balance font-display text-display-hero-mobile tracking-tight text-on-surface md:text-display-hero">
              {t(ui.hero.title1)}{' '}
              <span className="text-primary underline decoration-secondary-fixed-dim decoration-4 underline-offset-8">
                {t(ui.hero.title2)}
              </span>
            </h1>

            <p className="max-w-xl text-body-lg text-on-surface-variant">{t(ui.hero.text)}</p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#manzillar"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-ui text-label-lg text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-primary-container active:scale-[0.98]"
              >
                <Icon name="location_on" />
                <span>{t(ui.hero.ctaBranches)}</span>
              </a>
              <a
                href="#narxlar"
                className="inline-flex items-center gap-2 rounded-xl bg-surface-container px-6 py-3.5 font-ui text-label-lg text-primary shadow-sm transition-all hover:scale-[1.02] hover:bg-surface-container-high active:scale-[0.98]"
              >
                <Icon name="receipt_long" />
                <span>{t(ui.nav.prices)}</span>
              </a>
              <a
                href="#emlash"
                className="inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3.5 font-ui text-label-lg text-on-secondary shadow-md shadow-secondary/20 transition-all hover:scale-[1.02] hover:bg-on-secondary-container active:scale-[0.98]"
              >
                <Icon name="vaccines" />
                <span>{t(ui.nav.vaccination)}</span>
              </a>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-space-md sm:grid-cols-3">
              {ui.hero.stats.map((s, i) => (
                <div key={i} className="flex flex-col gap-1 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
                  <span className={`font-ui text-title-md font-bold ${s.color === 'secondary' ? 'text-secondary' : 'text-primary'}`}>
                    {t(s.value, { year: site.foundedYear })}
                  </span>
                  <span className="text-body-sm font-semibold text-on-surface">{t(s.title)}</span>
                  <span className="font-ui text-label-xs text-on-surface-variant">{t(s.sub)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-3 shadow-xl">
              {imgOk ? (
                <img
                  src={site.heroImage}
                  onError={() => setImgOk(false)}
                  alt={t({ uz: 'Hayot Plus laboratoriyasi', ru: 'Лаборатория Hayot Plus' })}
                  className="h-[340px] w-full rounded-xl object-cover sm:h-[440px]"
                  loading="eager"
                  fetchpriority="high"
                />
              ) : (
                <div className="flex h-[340px] w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary-fixed via-surface-container-low to-secondary-container/40 sm:h-[440px]">
                  <img src="/logo.png" alt="" className="h-40 w-40 opacity-90" />
                </div>
              )}

              {site.qualityBadge && (
                <div className="absolute left-6 top-6 flex items-center gap-2.5 rounded-xl bg-surface-container-lowest/95 px-3.5 py-2.5 shadow-md backdrop-blur-md">
                  <Icon name="verified_user" size={24} className="text-secondary" />
                  <div className="flex flex-col">
                    <span className="font-ui text-label-md font-bold text-on-surface">{t(site.qualityBadge.title)}</span>
                    <span className="font-ui text-label-xs text-on-surface-variant">{t(site.qualityBadge.subtitle)}</span>
                  </div>
                </div>
              )}

              {site.accuracyBadge && (
                <div className="absolute bottom-6 right-6 flex items-center gap-3 rounded-xl bg-surface-container-lowest/95 px-4 py-3 shadow-lg backdrop-blur-md">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                    <Icon name="speed" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-body-sm font-bold text-on-surface">{t(site.accuracyBadge.title)}</span>
                    <span className="font-ui text-label-xs font-semibold text-secondary">{t(site.accuracyBadge.subtitle)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
