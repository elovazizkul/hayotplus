import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { ui, useLang } from '../i18n.jsx';
import { faq, fallbackAnswer, matchFaq } from '../data/faq.js';
import { site } from '../data/site.js';
import { askAi } from '../lib/api.js';

const timeNow = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

function Bubble({ role, content, time }) {
  if (role === 'user') {
    return (
      <div className="flex items-start justify-end gap-3">
        <div className="flex max-w-[85%] flex-col gap-1 rounded-2xl rounded-tr-sm bg-primary p-3.5 text-body-sm text-on-primary shadow-sm md:max-w-xl md:p-4">
          <p className="whitespace-pre-line break-words">{content}</p>
          <span className="text-right font-ui text-label-xs text-primary-fixed">{time}</span>
        </div>
        <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary sm:flex">
          <Icon name="person" size={18} />
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3">
      <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary sm:flex">
        <Icon name="smart_toy" size={18} />
      </div>
      <div className="flex max-w-[85%] flex-col gap-2 rounded-2xl rounded-tl-sm bg-surface-container-lowest p-3.5 text-body-sm text-on-surface shadow-sm md:max-w-xl md:p-4">
        <p className="whitespace-pre-line break-words">{content}</p>
        {time && <span className="text-right font-ui text-label-xs text-on-surface-variant">{time}</span>}
      </div>
    </div>
  );
}

export default function AiChat() {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);

  // Ichki ro'yxatni pastga aylantirish (sahifaning o'zini emas)
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const push = (m) => setMessages((prev) => [...prev, { ...m, time: timeNow() }]);

  const ask = async (text, faqItem) => {
    const q = text.trim();
    if (!q || busy) return;
    const history = [...messages, { role: 'user', content: q }];
    push({ role: 'user', content: q });

    // 1) Tezkor savol tugmasi — tayyor javob, darhol
    if (faqItem) {
      setBusy(true);
      setTimeout(() => {
        push({ role: 'assistant', content: t(faqItem.answer) });
        setBusy(false);
      }, 400);
      return;
    }

    // 2) Erkin savol — Claude AI; ishlamasa — kalit so'z bo'yicha tayyor javob
    setBusy(true);
    try {
      const reply = await askAi(
        history.map(({ role, content }) => ({ role, content })),
        lang,
      );
      push({ role: 'assistant', content: reply });
    } catch {
      const m = matchFaq(q);
      push({ role: 'assistant', content: m ? t(m.answer) : t(fallbackAnswer, { phone: site.phone }) });
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    ask(input);
    setInput('');
  };

  return (
    <section id="ai-yordamchi" className="bg-surface-container-low/50 py-space-xl md:py-16">
      <div className="container-page">
        <div className="mx-auto mb-space-md flex max-w-3xl flex-col gap-2 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 font-ui text-label-xs font-bold text-primary">
            <Icon name="smart_toy" size={16} />
            <span>{t(ui.ai.badge)}</span>
          </div>
          <h2 className="font-display text-headline-lg-mobile text-on-surface md:text-headline-lg">{t(ui.ai.title)}</h2>
          <p className="text-body-md text-on-surface-variant">{t(ui.ai.text)}</p>
        </div>

        <div className="mx-auto flex max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-xl">
          <div className="flex items-center justify-between bg-primary p-4 text-on-primary">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow">
                <Icon name="neurology" size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-title-md font-bold">{t(ui.ai.botName)}</span>
                <span className="flex items-center gap-1.5 font-ui text-label-xs text-primary-fixed">
                  <span className="h-2 w-2 rounded-full bg-secondary-fixed" /> {t(ui.ai.online)}
                </span>
              </div>
            </div>
            <span className="hidden rounded-full bg-primary-container px-2.5 py-1 font-ui text-label-xs text-on-primary sm:inline">
              {t(ui.ai.fast)}
            </span>
          </div>

          <div
            ref={listRef}
            className="flex h-[400px] flex-col gap-4 overflow-y-auto bg-surface-container-low/30 p-4 md:h-[420px] md:p-6"
            aria-live="polite"
          >
            <Bubble role="assistant" content={t(ui.ai.welcome)} />
            {messages.map((m, i) => (
              <Bubble key={i} {...m} />
            ))}
            {busy && (
              <div className="flex items-start gap-3">
                <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary sm:flex">
                  <Icon name="smart_toy" size={18} />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-surface-container-lowest px-4 py-4 shadow-sm">
                  <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-surface-container bg-surface-container-low p-3">
            {faq.map((f) => (
              <button
                key={f.id}
                type="button"
                disabled={busy}
                onClick={() => ask(t(f.question), f)}
                className="rounded-full bg-surface-container-lowest px-3 py-1.5 font-ui text-label-xs text-on-surface shadow-sm transition-colors hover:bg-primary-fixed disabled:opacity-50"
              >
                {t(f.question)}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="flex items-center gap-2 bg-surface-container-lowest p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              placeholder={t(ui.ai.placeholder)}
              aria-label={t(ui.ai.placeholder)}
              className="field h-11 flex-1 px-4"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-on-primary shadow-md transition-colors hover:bg-primary-container disabled:opacity-50"
              aria-label={t(ui.ai.send)}
            >
              <Icon name="send" />
            </button>
          </form>

          <div className="bg-surface-container px-4 py-2.5 text-center font-ui text-label-xs text-on-surface-variant">
            {t(ui.ai.disclaimer)}
          </div>
        </div>
      </div>
    </section>
  );
}
