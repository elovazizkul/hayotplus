import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { applyContent } from './data/hydrate.js';
import { LangProvider } from './i18n.jsx';
import './index.css';

// Server bazadagi ma'lumotni sahifaga qo'shib beradi
applyContent(window.__CONTENT__);

const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));
const isAdmin = /^\/admin(\/|$)/.test(window.location.pathname);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    ) : (
      <LangProvider>
        <App />
      </LangProvider>
    )}
  </React.StrictMode>,
);
