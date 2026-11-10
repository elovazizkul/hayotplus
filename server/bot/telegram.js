// Telegram Bot API bilan ishlash — kutubxonasiz, oddiy fetch orqali.
// Token xato xabarlariga va loglarga tushmasin: xatoda faqat metod nomi va Telegram izohi.

export class TelegramError extends Error {
  constructor(method, code, description) {
    super(`Telegram ${method}: ${code} ${description || ''}`.trim());
    this.code = code;
  }
}

export function createTelegram(token) {
  const call = async (method, body = {}, { timeoutMs = 30000 } = {}) => {
    const form = body instanceof FormData;
    let r;
    try {
      r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: form ? undefined : { 'content-type': 'application/json' },
        body: form ? body : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      throw new TelegramError(method, 0, err.name === 'TimeoutError' ? 'timeout' : 'network');
    }
    const data = await r.json().catch(() => null);
    if (!data?.ok) throw new TelegramError(method, data?.error_code || r.status, data?.description);
    return data.result;
  };

  return {
    call,
    getMe: () => call('getMe'),
    getUpdates: (offset) =>
      call('getUpdates', { offset, timeout: 50, allowed_updates: ['message', 'callback_query'] }, { timeoutMs: 65000 }),
    send: (chatId, text, buttons) =>
      call('sendMessage', {
        chat_id: chatId,
        text,
        link_preview_options: { is_disabled: true },
        ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
      }),
    answer: (callbackId, text) => call('answerCallbackQuery', { callback_query_id: callbackId, ...(text ? { text } : {}) }).catch(() => {}),
    removeButtons: (chatId, messageId) =>
      call('editMessageReplyMarkup', { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } }).catch(() => {}),
    sendPdf: (chatId, buffer, filename, caption, buttons) => {
      const form = new FormData();
      form.append('chat_id', String(chatId));
      form.append('caption', caption);
      if (buttons) form.append('reply_markup', JSON.stringify({ inline_keyboard: buttons }));
      form.append('document', new Blob([buffer], { type: 'application/pdf' }), filename);
      return call('sendDocument', form, { timeoutMs: 60000 });
    },
    typing: (chatId, action = 'upload_document') => call('sendChatAction', { chat_id: chatId, action }).catch(() => {}),
  };
}
