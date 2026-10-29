import Icon from './Icon.jsx';
import { ui, useLang } from '../i18n.jsx';

// O'ng pastdagi "AI Yordamchi" tugmasi
export function FloatingAi({ hidden }) {
  const { t } = useLang();
  return (
    <div
      className={`fixed bottom-24 right-4 z-40 transition-all duration-300 md:bottom-6 md:right-6 ${
        hidden ? 'pointer-events-none translate-y-4 opacity-0' : 'opacity-100'
      }`}
    >
      <a
        href="#ai-yordamchi"
        className="flex items-center gap-2 rounded-full bg-primary px-4 py-3.5 text-on-primary shadow-floating transition-all hover:bg-primary-container"
        aria-label={t(ui.nav.ai)}
      >
        <Icon name="smart_toy" size={24} />
        <span className="hidden pr-1 font-ui text-label-lg font-bold md:inline">{t(ui.nav.ai)}</span>
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-secondary-fixed" />
        </span>
      </a>
    </div>
  );
}

// Telefonda pastdagi menyu
export function MobileNav({ active }) {
  const { t } = useLang();
  const items = [
    { id: 'manzillar', icon: 'location_on', label: ui.nav.branches },
    { id: 'narxlar', icon: 'receipt_long', label: ui.nav.prices },
    { id: 'emlash', icon: 'vaccines', label: ui.nav.vaccination },
    { id: 'ai-yordamchi', icon: 'neurology', label: ui.nav.aiShort },
  ];
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-surface-container-lowest/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-lg md:hidden">
      <nav className="grid grid-cols-4 items-center justify-items-center px-2 py-2" aria-label="Pastki menyu">
        {items.map((it) => (
          <a
            key={it.id}
            href={`#${it.id}`}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              active === it.id ? 'font-bold text-primary' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <Icon name={it.icon} size={22} fill={active === it.id} />
            <span className="font-ui text-label-xs">{t(it.label)}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
