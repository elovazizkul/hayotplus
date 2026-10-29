// Google Material Symbols ikonkasi. Nomlar: https://fonts.google.com/icons
// Yangi ikonka qo'shsangiz, index.html dagi icon_names ro'yxatiga ham qo'shing
// (README'da "Ikonka qo'shish" bo'limiga qarang).
export default function Icon({ name, size = 20, className = '', fill = false }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, ...(fill ? { fontVariationSettings: "'FILL' 1" } : null) }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
