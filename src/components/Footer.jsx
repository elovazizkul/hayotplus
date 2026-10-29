import Icon from './Icon.jsx';
import { Logo } from './Header.jsx';
import { ui, useLang } from '../i18n.jsx';
import { site, telHref } from '../data/site.js';
import { branches } from '../data/branches.js';

export default function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface-container-low pb-28 pt-space-xl text-on-surface md:pb-space-xl">
      <div className="container-page">
        <div className="grid grid-cols-1 gap-space-lg pb-space-lg md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-space-md">
            <Logo sub={t(ui.footer.region)} />
            <p className="text-body-sm text-on-surface-variant">{t(ui.footer.about)}</p>
            {site.licenseNumber && (
              <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-surface-container px-3 py-1.5">
                <Icon name="verified" size={18} className="text-secondary" />
                <span className="font-ui text-label-xs font-medium text-on-surface">
                  {t(ui.footer.license)}: {site.licenseNumber}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-space-sm">
            <h3 className="text-title-md text-on-surface">{t(ui.footer.branchesTitle)}</h3>
            <ul className="flex flex-col gap-space-sm text-body-sm text-on-surface-variant">
              {branches.map((b) => (
                <li key={b.id} className="flex items-start gap-2">
                  <Icon name="home_pin" size={18} className="mt-0.5 text-primary" />
                  <span>
                    <strong className="text-on-surface">{t(b.short)}:</strong> {t(b.address)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-space-sm">
            <h3 className="text-title-md text-on-surface">{t(ui.footer.quickTitle)}</h3>
            <ul className="flex flex-col gap-space-xs text-body-sm text-on-surface-variant">
              {ui.footer.quick.map((q, i) => (
                <li key={i}>
                  <a href={q.href} className="transition-colors hover:text-primary">
                    {t(q.label)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-space-sm">
            <h3 className="text-title-md text-on-surface">{t(ui.footer.contactTitle)}</h3>
            <p className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              <Icon name="schedule" size={18} className="text-primary" />
              <span>{t(site.hours)}</span>
            </p>
            {[site.phone, site.phone2].filter(Boolean).map((p) => (
              <a key={p} href={telHref(p)} className="flex items-center gap-2 text-body-sm font-medium text-on-surface hover:text-primary">
                <Icon name="call" size={18} className="text-primary" />
                <span className="font-ui text-data-mono">{p}</span>
              </a>
            ))}
            <div className="flex items-center gap-3 pt-2">
              {(site.telegramChannel || site.telegramBot) && (
                <a
                  href={`https://t.me/${site.telegramChannel || site.telegramBot}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 font-ui text-label-md text-primary transition-colors hover:bg-primary hover:text-on-primary"
                >
                  <Icon name="send" size={16} />
                  <span>Telegram</span>
                </a>
              )}
              {site.instagram && (
                <a
                  href={`https://instagram.com/${site.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 font-ui text-label-md text-primary transition-colors hover:bg-primary hover:text-on-primary"
                >
                  <Icon name="photo_camera" size={16} />
                  <span>Instagram</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-space-sm border-t border-surface-container pt-space-md font-ui text-label-md text-on-surface-variant md:flex-row">
          <p>
            © {year} {site.name}. {t(ui.footer.rights)}
          </p>
        </div>
      </div>
    </footer>
  );
}
