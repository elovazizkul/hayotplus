import { useCallback, useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Advantages from './components/Advantages.jsx';
import Branches from './components/Branches.jsx';
import Prices from './components/Prices.jsx';
import Vaccination from './components/Vaccination.jsx';
import AiChat from './components/AiChat.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import { FloatingAi, MobileNav } from './components/FloatingNav.jsx';

const SECTION_IDS = ['bosh-sahifa', 'manzillar', 'narxlar', 'emlash', 'ai-yordamchi', 'aloqa'];

// Hozir ekranda qaysi bo'lim turganini aniqlaydi (menyuda ajratib ko'rsatish uchun)
function useActiveSection() {
  const [active, setActive] = useState('bosh-sahifa');
  useEffect(() => {
    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return active;
}

export default function App() {
  const active = useActiveSection();

  // Narxlar bo'limida tanlangan tahlillar ("savat") → Aloqa formasiga o'tadi
  const [cart, setCart] = useState([]);
  const toggle = useCallback(
    (item) => setCart((c) => (c.some((x) => x.id === item.id) ? c.filter((x) => x.id !== item.id) : [...c, item])),
    [],
  );
  const add = useCallback((item) => setCart((c) => (c.some((x) => x.id === item.id) ? c : [...c, item])), []);
  const remove = useCallback((id) => setCart((c) => c.filter((x) => x.id !== id)), []);
  const clear = useCallback(() => setCart([]), []);

  return (
    <>
      <a
        href="#asosiy"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >
        Asosiy qismga o'tish
      </a>
      <Header active={active} />
      <main id="asosiy" className="w-full bg-surface pt-20">
        <Hero />
        <Advantages />
        <Branches />
        <Prices cart={cart} onToggle={toggle} onAdd={add} onClear={clear} />
        <Vaccination />
        <AiChat />
        <Contact cart={cart} onRemove={remove} onClear={clear} />
      </main>
      <Footer />
      <FloatingAi hidden={active === 'ai-yordamchi' || active === 'aloqa' || (active === 'narxlar' && cart.length > 0)} />
      <MobileNav active={active} />
    </>
  );
}
