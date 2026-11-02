import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { applyContent } from './data/hydrate.js';
import { site, telHref } from './data/site.js';
import { LangProvider } from './i18n.jsx';
import './index.css';

// Server bazadagi ma'lumotni sahifaga qo'shib beradi
applyContent(window.__CONTENT__);

// Sayt yangilangach, ochiq turgan sahifa eski faylni so'rashi mumkin: bir marta qayta yuklaymiz
window.addEventListener('vite:preloadError', (event) => {
  try {
    const last = Number(sessionStorage.getItem('chunkReload')) || 0;
    if (Date.now() - last < 60000) return;
    sessionStorage.setItem('chunkReload', String(Date.now()));
  } catch {
    return;
  }
  event.preventDefault();
  window.location.reload();
});

const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));
const isAdmin = /^\/admin(\/|$)/.test(window.location.pathname);

function CrashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-body-lg text-on-surface">Sahifani ochib boʻlmadi. Страницу не удалось открыть.</p>
      <a href={telHref(site.phone)} className="font-bold text-primary">
        {site.phone}
      </a>
      <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-primary px-5 py-2.5 text-on-primary">
        Yangilash / Обновить
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<CrashScreen />}>
      {isAdmin ? (
        <Suspense fallback={null}>
          <AdminApp />
        </Suspense>
      ) : (
        <LangProvider>
          <App />
        </LangProvider>
      )}
    </ErrorBoundary>
  </React.StrictMode>,
);
