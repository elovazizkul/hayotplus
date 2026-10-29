import Icon from './Icon.jsx';
import SectionHeader from './SectionHeader.jsx';
import { ui, useLang } from '../i18n.jsx';

export default function Advantages() {
  const { t } = useLang();
  return (
    <section className="bg-surface-container-low/50 py-space-xl md:py-16">
      <div className="container-page">
        <SectionHeader center eyebrow={t(ui.adv.eyebrow)} title={t(ui.adv.title)} text={t(ui.adv.text)} />
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-4">
          {ui.adv.items.map((item) => (
            <div
              key={item.icon}
              className="group flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                  item.tone === 'secondary' ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-fixed text-primary'
                }`}
              >
                <Icon name={item.icon} size={28} />
              </div>
              <h3 className="font-display text-headline-sm text-on-surface">{t(item.title)}</h3>
              <p className="text-body-sm text-on-surface-variant">{t(item.text)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
