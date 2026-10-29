import { lazy, Suspense, useState } from 'react';
import Icon from './Icon.jsx';
import SectionHeader from './SectionHeader.jsx';
import { ui, useLang } from '../i18n.jsx';
import { branches, directionsUrl, yandexMapUrl } from '../data/branches.js';
import { telHref } from '../data/site.js';

// Xarita kutubxonasi og'ir — sahifa tezroq ochilishi uchun keyinroq yuklanadi
const BranchMap = lazy(() => import('./BranchMap.jsx'));

function MapSkeleton() {
  return <div className="h-[520px] animate-pulse rounded-2xl bg-surface-container-lowest shadow-lg" />;
}

export default function Branches() {
  const { t } = useLang();
  const [selected, setSelected] = useState(0);

  return (
    <section id="manzillar" className="bg-surface py-space-xl md:py-16">
      <div className="container-page">
        <SectionHeader eyebrow={t(ui.branches.eyebrow)} title={t(ui.branches.title)} text={t(ui.branches.text)} />

        <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
          <ul className="flex flex-col gap-3 lg:col-span-6">
            {branches.map((b, i) => {
              const active = i === selected;
              return (
                <li key={b.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(i)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSelected(i))}
                    aria-pressed={active}
                    className={`cursor-pointer rounded-xl bg-surface-container-lowest p-4 transition-all md:p-5 ${
                      active ? 'shadow-md ring-2 ring-primary' : 'shadow-sm hover:shadow'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {b.main && <Icon name="corporate_fare" size={24} className="text-primary" />}
                        <h3 className="text-title-md font-bold text-on-surface">
                          {!b.main && <span className="text-on-surface-variant">{i}-filial: </span>}
                          {t(b.name)}
                        </h3>
                      </div>
                      {b.main ? (
                        <span className="whitespace-nowrap rounded-full bg-primary px-2.5 py-1 font-ui text-label-xs text-on-primary">
                          {t(ui.branches.mainBadge)}
                        </span>
                      ) : (
                        <span className="whitespace-nowrap rounded bg-surface-container px-2 py-0.5 font-ui text-label-xs text-on-surface">
                          {t(b.city)}
                        </span>
                      )}
                    </div>

                    <p className="mb-2 text-body-sm text-on-surface-variant">
                      {t(b.address)}
                      {b.landmark && (
                        <span className="font-medium text-on-surface">
                          {' '}
                          ({t(ui.branches.landmark)}: {t(b.landmark)})
                        </span>
                      )}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-body-sm text-on-surface-variant">
                      {b.hours && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="schedule" size={16} className="text-secondary" /> {b.hours}
                        </span>
                      )}
                      {b.phone && (
                        <a
                          href={telHref(b.phone)}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 font-ui hover:text-primary"
                        >
                          <Icon name="call" size={16} className="text-primary" /> {b.phone}
                        </a>
                      )}
                      {b.parking && (
                        <span className="rounded bg-surface-container px-2 py-0.5 font-ui text-label-xs font-semibold text-on-surface">
                          {t(ui.branches.parking)}
                        </span>
                      )}
                    </div>

                    {active && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <a
                          href={yandexMapUrl(b)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 font-ui text-label-md text-primary transition-colors hover:bg-primary hover:text-on-primary"
                        >
                          <Icon name="map" size={18} /> {t(ui.branches.onMap)}
                        </a>
                        <a
                          href={directionsUrl(b)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 font-ui text-label-md text-on-surface transition-colors hover:bg-surface-container-high"
                        >
                          <Icon name="near_me" size={18} /> {t(ui.branches.route)}
                        </a>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="lg:sticky lg:top-24 lg:col-span-6">
            <Suspense fallback={<MapSkeleton />}>
              <BranchMap selected={selected} onSelect={setSelected} />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
