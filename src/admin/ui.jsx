// Admin panelning kichik umumiy elementlari
import Icon from '../components/Icon.jsx';

const buttonStyles = {
  primary: 'bg-primary text-on-primary hover:bg-primary-container',
  ghost: 'border border-outline-variant bg-white text-on-surface hover:bg-surface-container-low',
  danger: 'border border-error text-error hover:bg-error-container',
};

export function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  );
}

export const inputClass =
  'w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-surface-container-low disabled:text-on-surface-variant';

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-on-surface">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-on-surface-variant">{hint}</span>}
    </label>
  );
}

export function Alert({ kind = 'error', children }) {
  if (!children) return null;
  const style = kind === 'error' ? 'bg-error-container text-on-error-container' : 'bg-secondary-container/50 text-on-secondary-fixed-variant';
  return <div className={`rounded-lg px-3 py-2 text-sm ${style}`}>{children}</div>;
}

export function Badge({ on, children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${on ? 'bg-secondary-container/60 text-on-secondary-fixed-variant' : 'bg-surface-container-high text-on-surface-variant'}`}>
      {children}
    </span>
  );
}

export function PageTitle({ title, subtitle, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-on-surface-variant">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="flex h-full w-full max-w-xl flex-col bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
          <h2 className="text-lg font-bold text-on-surface">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Yopish" className="rounded-lg p-1 hover:bg-surface-container-low">
            <Icon name="close" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-between gap-2 border-t border-outline-variant px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
