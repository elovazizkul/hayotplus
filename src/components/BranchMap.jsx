import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from './Icon.jsx';
import { ui, useLang } from '../i18n.jsx';
import { branches } from '../data/branches.js';
import { site, telHref } from '../data/site.js';

// Xaritadagi belgi (pin) — dizayndagi ko'rinishda
function pinIcon(label, active, main) {
  const html = `
    <div class="flex flex-col items-center" style="transform: translate(-50%, -100%); position:absolute; left:0; top:0;">
      <div class="${
        active ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface'
      } mb-1 whitespace-nowrap rounded px-2 py-0.5 font-ui text-label-xs font-semibold shadow">${label}</div>
      <div class="flex ${active ? 'h-9 w-9 ring-4 ring-primary-fixed' : 'h-7 w-7'} items-center justify-center rounded-full bg-primary text-on-primary shadow-lg">
        <span class="material-symbols-outlined" style="font-size:${active ? 20 : 16}px">${main ? 'corporate_fare' : 'location_on'}</span>
      </div>
    </div>`;
  return L.divIcon({ html, className: 'branch-pin', iconSize: [0, 0] });
}

function FlyTo({ selected }) {
  const map = useMap();
  useEffect(() => {
    const b = branches[selected];
    if (b) map.flyTo([b.lat, b.lng], Math.max(map.getZoom(), 12), { duration: 0.8 });
  }, [selected, map]);
  return null;
}

export default function BranchMap({ selected, onSelect }) {
  const { t } = useLang();
  const [map, setMap] = useState(null);
  const b = branches[selected];

  const bounds = useMemo(() => L.latLngBounds(branches.map((x) => [x.lat, x.lng])).pad(0.15), []);
  const isTouch = typeof window !== 'undefined' && L.Browser.mobile;

  return (
    <div className="relative flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-4 shadow-lg md:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="explore" className="text-primary" />
          <span className="text-title-md text-on-surface">{t(ui.branches.mapTitle)}</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-surface-container p-1">
          <button
            type="button"
            onClick={() => map && map.zoomIn()}
            className="flex h-8 w-8 items-center justify-center rounded font-ui text-label-lg font-bold text-on-surface hover:bg-surface-container-lowest"
            aria-label="Zoom +"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => map && map.zoomOut()}
            className="flex h-8 w-8 items-center justify-center rounded font-ui text-label-lg font-bold text-on-surface hover:bg-surface-container-lowest"
            aria-label="Zoom −"
          >
            −
          </button>
        </div>
      </div>

      {/* isolate — xarita sarlavha (header) ustiga chiqib ketmasligi uchun */}
      <div className="relative isolate h-[380px] w-full overflow-hidden rounded-xl bg-surface-container-low shadow-inner sm:h-[460px]">
        <MapContainer
          bounds={bounds}
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={!isTouch}
          ref={setMap}
          className="h-full w-full"
          attributionControl
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
          />
          {branches.map((x, i) => (
            <Marker
              key={x.id}
              position={[x.lat, x.lng]}
              icon={pinIcon(t(x.short), i === selected, x.main)}
              zIndexOffset={i === selected ? 1000 : 0}
              eventHandlers={{ click: () => onSelect(i) }}
              title={t(x.name)}
            />
          ))}
          <FlyTo selected={selected} />
        </MapContainer>

        {b && (
          <div className="absolute bottom-4 left-4 right-4 z-[600] flex items-center justify-between gap-2 rounded-xl bg-surface-container-lowest/95 p-3.5 shadow-lg backdrop-blur-md">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                <Icon name="directions_walk" size={22} />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-body-md font-bold text-on-surface">
                  {t(b.short)} ({t(b.city)}) {t(ui.branches.selected)}
                </span>
                <span className="truncate font-ui text-label-xs text-on-surface-variant">
                  {t(b.address)}
                  {b.hours ? ` • ${b.hours}` : ''}
                </span>
              </div>
            </div>
            <a
              href={telHref(b.phone || site.phone)}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-secondary px-3 py-2 font-ui text-label-md font-semibold text-on-secondary"
            >
              <Icon name="call" size={18} /> <span className="hidden sm:inline">{t(ui.branches.call)}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
