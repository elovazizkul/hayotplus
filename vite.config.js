import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// Saytda ishlatilgan Material Symbols ikonkalarini avtomatik topib,
// Google Fonts'dan faqat shularni yuklaydi (sayt tezroq ochiladi).
// Qo'lda hech narsa yozish shart emas.
function materialIconsSubset() {
  const collect = () => {
    const names = new Set();
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
          const src = fs.readFileSync(p, 'utf8');
          // <Icon name="call" />
          for (const m of src.matchAll(/<Icon\b[^>]*?\bname="([a-z0-9_]+)"/g)) names.add(m[1]);
          // <Icon name={ok ? 'check' : 'add'} />
          for (const m of src.matchAll(/<Icon\b[^>]*?\bname=\{([^}]*)\}/g))
            for (const q of m[1].matchAll(/'([a-z0-9_]+)'/g)) names.add(q[1]);
          // ma'lumot fayllarida: icon: 'vaccines'
          for (const m of src.matchAll(/\bicon:\s*'([a-z0-9_]+)'/g)) names.add(m[1]);
        }
      }
    };
    walk(path.resolve(__dirname, 'src'));
    return [...names].sort();
  };
  return {
    name: 'material-icons-subset',
    transformIndexHtml(html) {
      return html.replace('__ICONS__', collect().join(','));
    },
  };
}

export default defineConfig({
  plugins: [react(), materialIconsSubset()],
  server: {
    proxy: { '/api': 'http://localhost:3000', '/mcp': 'http://localhost:3000' },
  },
  build: {
    chunkSizeWarningLimit: 800,
  },
});
