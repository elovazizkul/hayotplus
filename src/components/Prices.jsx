import { useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import SectionHeader from './SectionHeader.jsx';
import { ui, useLang } from '../i18n.jsx';
import { categories, tests, packages, formatPrice } from '../data/prices.js';
import { scrollToId } from '../lib/api.js';

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[ʻʼ‘’`'´]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const badgeClass = {
  primary: 'bg-primary-fixed text-primary',
  secondary: 'bg-secondary-container text-on-secondary-container',
  neutral: 'bg-surface-container text-on-surface',
};

export default function Prices({ cart, onToggle, onAdd, onClear }) {
  const { t, lang } = useLang();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');

  const index = useMemo(
    () => tests.map((x) => ({ item: x, hay: norm([x.name.uz, x.name.ru, x.desc.uz, x.desc.ru, x.keywords].join(' ')) })),
    [],
  );

  const q = norm(query);
  const visible = index.filter(({ item, hay }) => (cat === 'all' || item.category === cat) && (!q || q.split(' ').every((w) => hay.includes(w))));

  const inCart = (id) => cart.some((c) => c.id === id);
  const total = cart.reduce((s, c) => s + c.price, 0);

  const orderPackage = (p) => {
    onAdd({ id: p.id, name: p.name, price: p.price });
    scrollToId('aloqa');
  };

  return (
    <section id="narxlar" className="bg-surface-container-low/40 py-space-xl md:py-16">
      <div className="container-page">
        <SectionHeader eyebrow={t(ui.prices.eyebrow)} title={t(ui.prices.title)} text={t(ui.prices.text)} />

        {/* Qidiruv va toifalar */}
        <div className="mb-space-lg flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-4 shadow-sm md:p-5">
          <div className="relative w-full">
            <Icon name="search" size={22} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(ui.prices.search)}
              aria-label={t(ui.prices.search)}
              className="h-12 w-full rounded-xl bg-surface-container-low pl-12 pr-10 text-body-md text-on-surface shadow-inner placeholder:text-on-surface-variant/80 focus:outline-none focus:ring-2 focus:ring-primary [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                aria-label="Tozalash"
              >
                <Icon name="close" />
              </button>
            )}
          </div>
          <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1" role="tablist">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={cat === c.id}
                onClick={() => setCat(c.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 font-ui text-label-md transition-colors ${
                  cat === c.id ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {t(c.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Jadval */}
        <div className="mb-4 overflow-hidden rounded-2xl bg-surface-container-lowest shadow-md">
          <div className="hidden grid-cols-12 gap-4 bg-surface-container-high px-6 py-4 font-ui text-label-xs uppercase tracking-wider text-on-surface-variant md:grid">
            <div className="col-span-6">{t(ui.prices.colName)}</div>
            <div className="col-span-2 text-center">{t(ui.prices.colTime)}</div>
            <div className="col-span-2 text-right">{t(ui.prices.colPrice)}</div>
            <div className="col-span-2 text-center">{t(ui.prices.colAction)}</div>
          </div>

          <div className="divide-y divide-surface-container">
            {visible.length === 0 && (
              <div className="flex items-center gap-3 px-6 py-8 text-body-sm text-on-surface-variant">
                <Icon name="search_off" size={22} className="text-outline" />
                {t(ui.prices.empty)}
              </div>
            )}
            {visible.map(({ item }) => {
              const selected = inCart(item.id);
              return (
                <div
                  key={item.id}
                  className={`grid grid-cols-1 items-center gap-3 px-4 py-4 transition-colors md:grid-cols-12 md:px-6 ${
                    selected ? 'bg-primary-fixed/20' : 'hover:bg-surface-container-low/40'
                  }`}
                >
                  <div className="flex flex-col md:col-span-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-title-md font-semibold text-on-surface">{t(item.name)}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-ui text-label-xs ${
                          item.accent === 'secondary' ? badgeClass.secondary : badgeClass.primary
                        }`}
                      >
                        {t(item.sample)}
                      </span>
                    </div>
                    <span className="text-body-sm text-on-surface-variant">{t(item.desc)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:contents">
                    <div className="flex items-center gap-1.5 text-body-sm text-on-surface-variant md:col-span-2 md:justify-center">
                      <Icon name="schedule" size={18} className="text-secondary" /> {item.days} {t(ui.prices.day)}
                    </div>
                    <div className="flex items-center font-ui text-title-md font-bold text-primary md:col-span-2 md:justify-end">
                      {formatPrice(item.price, lang)}
                    </div>
                  </div>
                  <div className="flex md:col-span-2 md:justify-center">
                    <button
                      type="button"
                      onClick={() => onToggle({ id: item.id, name: item.name, price: item.price })}
                      aria-pressed={selected}
                      className={`inline-flex w-full items-center justify-center gap-1 rounded-xl px-3.5 py-2 font-ui text-label-md transition-all md:w-auto ${
                        selected ? 'bg-primary text-on-primary' : 'bg-surface-container text-primary hover:bg-primary hover:text-on-primary'
                      }`}
                    >
                      <Icon name={selected ? 'check' : 'add'} size={18} /> {t(selected ? ui.prices.selected : ui.prices.select)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-space-xl flex items-start gap-2 font-ui text-label-md text-on-surface-variant">
          <Icon name="info" size={18} className="mt-px text-primary" />
          <span>{t(ui.prices.notice)}</span>
        </div>

        {/* Tanlangan tahlillar paneli */}
        {cart.length > 0 && (
          <div className="sticky bottom-20 z-30 mb-space-xl md:bottom-6">
            <div className="flex flex-col gap-3 rounded-2xl bg-inverse-surface p-4 text-inverse-on-surface shadow-floating sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
                  <Icon name="shopping_cart" />
                </div>
                <div className="flex flex-col">
                  <span className="font-ui text-label-md">{t(ui.prices.cartCount, { n: cart.length })}</span>
                  <span className="font-ui text-title-md font-bold">
                    {t(ui.prices.cartTotal)}: {formatPrice(total, lang)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClear}
                  className="rounded-xl px-3 py-2.5 font-ui text-label-md text-inverse-on-surface/80 hover:bg-white/10"
                >
                  {t(ui.prices.cartClear)}
                </button>
                <button
                  type="button"
                  onClick={() => scrollToId('aloqa')}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary-fixed-dim px-4 py-2.5 font-ui text-label-lg text-on-secondary-fixed hover:bg-secondary-fixed sm:flex-none"
                >
                  {t(ui.prices.cartGo)} <Icon name="arrow_forward" size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Check-up paketlar */}
        <div className="mb-space-md flex flex-col gap-2">
          <span className="font-ui text-label-xs font-bold uppercase tracking-widest text-secondary">{t(ui.prices.pkgEyebrow)}</span>
          <h3 className="font-display text-headline-md text-on-surface">{t(ui.prices.pkgTitle)}</h3>
        </div>
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-3">
          {packages.map((p) => (
            <div
              key={p.id}
              className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Icon name={p.icon} size={28} className={p.iconColor === 'secondary' ? 'text-secondary' : 'text-primary'} />
                  <span className={`rounded-full px-2.5 py-1 font-ui text-label-xs font-bold ${badgeClass[p.badgeStyle]}`}>{t(p.badge)}</span>
                </div>
                <h4 className="text-title-md font-bold text-on-surface">{t(p.name)}</h4>
                <p className="text-body-sm text-on-surface-variant">{t(p.desc)}</p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 pt-6">
                <div className="flex flex-col">
                  <span className="font-ui text-label-xs text-on-surface-variant">{t(ui.prices.pkgPrice)}</span>
                  <span className="font-ui text-title-md font-bold text-on-surface">{formatPrice(p.price, lang)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => orderPackage(p)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 font-ui text-label-md text-on-primary shadow-sm transition-all hover:bg-primary-container"
                >
                  {inCart(p.id) && <Icon name="check" size={18} />}
                  {t(ui.prices.order)}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
