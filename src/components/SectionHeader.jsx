export default function SectionHeader({ eyebrow, title, text, center = false, eyebrowClass = 'text-primary', as: H = 'h2' }) {
  return (
    <div className={`mb-space-lg flex flex-col gap-2 ${center ? 'mx-auto max-w-2xl text-center' : ''}`}>
      {eyebrow && (
        <span className={`font-ui text-label-xs font-bold uppercase tracking-widest ${eyebrowClass}`}>{eyebrow}</span>
      )}
      <H className="font-display text-headline-lg-mobile text-on-surface md:text-headline-lg">{title}</H>
      {text && <p className="text-body-md text-on-surface-variant">{text}</p>}
    </div>
  );
}
