import { createContext, useContext, useEffect, useMemo, useState } from 'react';

// ============================================================
//  SAYTDAGI UMUMIY MATNLAR (o'zbekcha / ruscha)
// ============================================================

export const ui = {
  nav: {
    home: { uz: 'Bosh sahifa', ru: 'Главная' },
    branches: { uz: 'Manzillar', ru: 'Адреса' },
    prices: { uz: 'Narxlar', ru: 'Цены' },
    vaccination: { uz: 'Emlash', ru: 'Вакцинация' },
    ai: { uz: 'AI yordamchi', ru: 'AI-помощник' },
    aiShort: { uz: 'AI Bot', ru: 'AI Бот' },
    contact: { uz: 'Aloqa', ru: 'Контакты' },
    call: { uz: 'Qoʻngʻiroq qilish:', ru: 'Позвонить:' },
    menu: { uz: 'Menyu', ru: 'Меню' },
  },
  brandSub: { uz: 'Tibbiy Laboratoriya', ru: 'Медицинская лаборатория' },
  hero: {
    title1: { uz: 'Aniq tahlil —', ru: 'Точный анализ —' },
    title2: { uz: 'toʻgʻri tashxis', ru: 'верный диагноз' },
    text: {
      uz: 'Zamonaviy uskunalar, tez natijalar va ishonchli xizmat. Sirdaryo viloyatidagi 4 ta filial.',
      ru: 'Современное оборудование, быстрые результаты и надёжный сервис. 4 филиала в Сырдарьинской области.',
    },
    ctaBranches: { uz: 'Manzillarni koʻrish', ru: 'Смотреть адреса' },
    stats: [
      {
        value: { uz: '{year}-yildan', ru: 'С {year} года' },
        title: { uz: 'Tajriba va ishonch', ru: 'Опыт и доверие' },
        sub: { uz: 'Sifatli tibbiy xizmat', ru: 'Качественный медицинский сервис' },
        color: 'primary',
      },
      {
        value: { uz: '4 ta filial', ru: '4 филиала' },
        title: { uz: 'Guliston va tumanlarda', ru: 'В Гулистане и районах' },
        sub: { uz: 'Aholiga qulay joylashuv', ru: 'Удобное расположение' },
        color: 'secondary',
      },
      {
        value: { uz: '2–24 soat', ru: '2–24 часа' },
        title: { uz: 'Tez va aniq natijalar', ru: 'Быстрые и точные результаты' },
        sub: { uz: 'Kun davomida tayyor', ru: 'Готовность в течение дня' },
        color: 'primary',
      },
    ],
  },
  adv: {
    eyebrow: { uz: 'Nega aynan biz?', ru: 'Почему мы?' },
    title: { uz: 'Bizning afzalliklarimiz', ru: 'Наши преимущества' },
    text: {
      uz: 'Sizning va oilangiz salomatligi uchun laboratoriya diagnostikasining eng yuqori standartlarini taqdim etamiz.',
      ru: 'Мы предлагаем высокие стандарты лабораторной диагностики для вашего здоровья и здоровья вашей семьи.',
    },
    items: [
      {
        icon: 'precision_manufacturing',
        tone: 'primary',
        title: { uz: 'Zamonaviy uskunalar', ru: 'Современное оборудование' },
        text: {
          uz: 'Toʻliq avtomatlashtirilgan biokimyoviy va immunoxemilyuminessent analizatorlar (Snibe Maglumi X3) hamda PZR laboratoriyasi.',
          ru: 'Полностью автоматизированные биохимические и иммунохемилюминесцентные анализаторы (Snibe Maglumi X3) и ПЦР-лаборатория.',
        },
      },
      {
        icon: 'biotech',
        tone: 'secondary',
        title: { uz: 'Keng qamrovli tahlillar', ru: 'Широкий спектр анализов' },
        text: {
          uz: 'Biokimyo, gormonlar, PZR, onkomarkerlar, allergopanellar va 500+ turdagi ixtisoslashgan laboratoriya tekshiruvlari.',
          ru: 'Биохимия, гормоны, ПЦР, онкомаркеры, аллергопанели и более 500 видов специализированных исследований.',
        },
      },
      {
        icon: 'timer',
        tone: 'primary',
        title: { uz: 'Natijalar tez tayyor boʻladi', ru: 'Быстрые результаты' },
        text: {
          uz: 'Shoshilinch (CITO) tahlillar 2 soat ichida, standart tahlillar esa topshirilgan kunning oʻzidayoq taqdim qilinadi.',
          ru: 'Срочные (CITO) анализы — за 2 часа, стандартные — в день сдачи.',
        },
      },
      {
        icon: 'send',
        tone: 'secondary',
        title: { uz: 'Telegram orqali olish', ru: 'Результаты в Telegram' },
        text: {
          uz: 'Klinikaga qayta kelmasdan shaxsiy QR-kod yoki rasmiy Telegram botimiz orqali PDF shaklda qulay yuklab oling.',
          ru: 'Получайте результаты в PDF по личному QR-коду или через наш Telegram-бот — без повторного визита.',
        },
      },
    ],
  },
  branches: {
    eyebrow: { uz: 'Filiallar tarmogʻi', ru: 'Сеть филиалов' },
    title: { uz: 'Bizning manzillarimiz', ru: 'Наши адреса' },
    text: {
      uz: 'Sirdaryo viloyatidagi bosh ofis va tumanlardagi qulay qabul punktlari',
      ru: 'Головной офис и удобные пункты приёма в районах Сырдарьинской области',
    },
    mainBadge: { uz: 'Asosiy ofis', ru: 'Главный офис' },
    parking: { uz: 'Avtoturargoh mavjud', ru: 'Есть парковка' },
    onMap: { uz: 'Xaritada koʻrish', ru: 'На карте' },
    route: { uz: 'Yoʻnalish olish', ru: 'Маршрут' },
    mapTitle: { uz: 'Sirdaryo viloyati boʻyicha filiallar', ru: 'Филиалы по Сырдарьинской области' },
    selected: { uz: 'tanlandi', ru: 'выбран' },
    call: { uz: 'Qoʻngʻiroq', ru: 'Позвонить' },
    landmark: { uz: 'Moʻljal', ru: 'Ориентир' },
  },
  prices: {
    eyebrow: { uz: 'Laboratoriya katalogi', ru: 'Каталог лаборатории' },
    title: { uz: 'Xizmatlar narxlari', ru: 'Цены на услуги' },
    text: {
      uz: 'Shaffof narxlar, yuqori sifatli reaktivlar va sertifikatlangan natijalar',
      ru: 'Прозрачные цены, качественные реагенты и сертифицированные результаты',
    },
    search: {
      uz: 'Tahlil nomini qidiring... (masalan: HbA1c, TSH, Ferritin)',
      ru: 'Поиск анализа... (например: HbA1c, ТТГ, ферритин)',
    },
    colName: { uz: 'Tahlil nomi va tavsifi', ru: 'Название и описание' },
    colTime: { uz: 'Natija muddati', ru: 'Срок' },
    colPrice: { uz: 'Narxi (soʻmda)', ru: 'Цена (сум)' },
    colAction: { uz: 'Harakat', ru: 'Действие' },
    day: { uz: 'kun', ru: 'дн.' },
    select: { uz: 'Tanlash', ru: 'Выбрать' },
    selected: { uz: 'Tanlandi', ru: 'Выбрано' },
    empty: { uz: 'Hech narsa topilmadi. Boshqa nom bilan qidirib koʻring yoki bizga qoʻngʻiroq qiling.', ru: 'Ничего не найдено. Попробуйте другое название или позвоните нам.' },
    notice: {
      uz: 'Eslatma: Narxlar oʻzgarishi mumkin. Aniq narx va shoshilinch tekshiruvlar uchun eng yaqin filialga murojaat qiling.',
      ru: 'Примечание: цены могут меняться. Точную стоимость и срочные исследования уточняйте в ближайшем филиале.',
    },
    pkgEyebrow: { uz: 'Chegirmali toʻplamlar', ru: 'Пакеты со скидкой' },
    pkgTitle: { uz: 'Check-up kompleks profilaktik paketlar', ru: 'Комплексные check-up пакеты' },
    pkgPrice: { uz: 'Kompleks narxi:', ru: 'Стоимость пакета:' },
    order: { uz: 'Buyurtma berish', ru: 'Заказать' },
    cartCount: { uz: '{n} ta tanlandi', ru: 'Выбрано: {n}' },
    cartTotal: { uz: 'Jami', ru: 'Итого' },
    cartGo: { uz: 'Buyurtmani rasmiylashtirish', ru: 'Оформить заявку' },
    cartClear: { uz: 'Tozalash', ru: 'Очистить' },
  },
  vacc: {
    eyebrow: { uz: 'Xavfsiz profilaktika', ru: 'Безопасная профилактика' },
    title: { uz: 'Emlash xizmati', ru: 'Вакцинация' },
    text: {
      uz: 'Oilangiz salomatligi uchun xavfsiz va ishonchli emlash. Sertifikatlangan xalqaro vaksinalar.',
      ru: 'Безопасная и надёжная вакцинация для всей семьи. Сертифицированные международные вакцины.',
    },
    from: { uz: 'dan', ru: 'от' },
    rulesTitle: { uz: 'Emlashdan oldin nimalarni bilish kerak:', ru: 'Что важно знать перед прививкой:' },
    formTitle: { uz: 'Emlashga yozilish', ru: 'Запись на прививку' },
    formSub: { uz: 'Navbatsiz va qulay vaqtda qabul', ru: 'Без очереди в удобное время' },
    name: { uz: 'Toʻliq ismingiz', ru: 'Ваше полное имя' },
    namePh: { uz: 'Masalan: Sardor Aliyev', ru: 'Например: Сардор Алиев' },
    phone: { uz: 'Telefon raqamingiz', ru: 'Номер телефона' },
    type: { uz: 'Vaksina turini tanlang', ru: 'Выберите вакцину' },
    time: { uz: 'Qulay sana va vaqt', ru: 'Удобные дата и время' },
    branch: { uz: 'Qaysi filial sizga qulay?', ru: 'Какой филиал вам удобен?' },
    submit: { uz: 'Yozilishni tasdiqlash', ru: 'Подтвердить запись' },
    success: {
      uz: 'Rahmat! Arizangiz qabul qilindi. Tez orada operatorimiz siz bilan bogʻlanadi.',
      ru: 'Спасибо! Заявка принята. Наш оператор скоро свяжется с вами.',
    },
    again: { uz: 'Yana ariza yuborish', ru: 'Отправить ещё' },
  },
  ai: {
    badge: { uz: 'Hayot Plus AI Assistent', ru: 'Hayot Plus AI-ассистент' },
    title: { uz: 'AI yordamchi — savollaringizga javob beradi', ru: 'AI-помощник ответит на ваши вопросы' },
    text: {
      uz: 'Tahlillarga tayyorgarlik, narxlar va filiallar haqida darhol aniq maʼlumot oling.',
      ru: 'Мгновенно узнайте о подготовке к анализам, ценах и филиалах.',
    },
    botName: { uz: 'Hayot Plus Med AI Konsultant', ru: 'AI-консультант Hayot Plus Med' },
    online: { uz: 'Onlayn 24/7', ru: 'Онлайн 24/7' },
    fast: { uz: 'Tezkor AI', ru: 'Быстрый AI' },
    welcome: {
      uz: 'Assalomu alaykum! Men Hayot Plus laboratoriyasining sunʼiy intellekt yordamchisiman. Tahlillarga toʻgʻri tayyorgarlik koʻrish, narxlar yoki filiallarimiz boʻyicha qanday savolingiz bor?',
      ru: 'Здравствуйте! Я AI-помощник лаборатории Hayot Plus. Есть вопросы о подготовке к анализам, ценах или наших филиалах?',
    },
    placeholder: { uz: 'Savolingizni yozing...', ru: 'Напишите ваш вопрос...' },
    send: { uz: 'Yuborish', ru: 'Отправить' },
    disclaimer: {
      uz: 'Bu yordamchi sunʼiy intellekt boʻlib, rasmiy tibbiy tashxis qoʻymaydi. Aniq tavsiyalar va davolash uchun davolovchi shifokorga murojaat qiling.',
      ru: 'Помощник работает на основе ИИ и не ставит медицинских диагнозов. За рекомендациями и лечением обращайтесь к лечащему врачу.',
    },
  },
  contact: {
    eyebrow: { uz: 'Aloqa va qoʻllab-quvvatlash', ru: 'Связь и поддержка' },
    title: { uz: 'Biz bilan bogʻlaning', ru: 'Свяжитесь с нами' },
    text: {
      uz: 'Mutaxassislarimiz barcha savollaringizga batafsil javob berishga doim tayyor',
      ru: 'Наши специалисты всегда готовы подробно ответить на ваши вопросы',
    },
    infoTitle: { uz: 'Bogʻlanish maʼlumotlari', ru: 'Контактная информация' },
    phones: { uz: 'Telefon raqamlar', ru: 'Телефоны' },
    hours: { uz: 'Ish tartibi', ru: 'Режим работы' },
    address: { uz: 'Asosiy ofis manzili', ru: 'Адрес головного офиса' },
    social: { uz: 'Ijtimoiy tarmoqlar:', ru: 'Соцсети:' },
    formTitle: { uz: 'Savol yoki murojaat yuborish', ru: 'Отправить вопрос или заявку' },
    formSub: {
      uz: 'Maʼlumotlaringizni qoldiring, mutaxassisimiz 15 daqiqada sizga qayta qoʻngʻiroq qiladi.',
      ru: 'Оставьте контакты — специалист перезвонит в течение 15 минут.',
    },
    name: { uz: 'Ism va familiyangiz', ru: 'Имя и фамилия' },
    namePh: { uz: 'Masalan: Nodirbek Karimov', ru: 'Например: Нодирбек Каримов' },
    phone: { uz: 'Telefon raqamingiz', ru: 'Номер телефона' },
    msg: { uz: 'Xabar yoki savolingiz', ru: 'Сообщение или вопрос' },
    msgPh: {
      uz: 'Qaysi tahlil haqida maʼlumot kerak yoki qaysi filialimizga kelmoqchisiz?',
      ru: 'Какой анализ вас интересует или в какой филиал хотите прийти?',
    },
    selectedTests: { uz: 'Tanlangan tahlillar', ru: 'Выбранные анализы' },
    submit: { uz: 'Yuborish', ru: 'Отправить' },
    telegram: { uz: 'Telegram orqali yozish', ru: 'Написать в Telegram' },
    success: {
      uz: 'Murojaatingiz muvaffaqiyatli qabul qilindi. Tez orada operatorimiz siz bilan bogʻlanadi!',
      ru: 'Ваша заявка принята. Оператор скоро свяжется с вами!',
    },
  },
  form: {
    sending: { uz: 'Yuborilmoqda...', ru: 'Отправка...' },
    error: {
      uz: 'Arizani yuborib boʻlmadi. Iltimos, bizga qoʻngʻiroq qiling: {phone}',
      ru: 'Не удалось отправить заявку. Пожалуйста, позвоните нам: {phone}',
    },
    phoneInvalid: { uz: 'Telefon raqamini toʻliq kiriting', ru: 'Введите номер телефона полностью' },
  },
  footer: {
    about: {
      uz: 'Sirdaryo viloyati boʻylab zamonaviy diagnostika va yuqori aniqlikdagi laboratoriya xizmatlari tarmogʻi.',
      ru: 'Сеть современной диагностики и высокоточных лабораторных услуг по всей Сырдарьинской области.',
    },
    region: { uz: 'Sirdaryo viloyati', ru: 'Сырдарьинская область' },
    branchesTitle: { uz: 'Filiallarimiz', ru: 'Наши филиалы' },
    quickTitle: { uz: 'Tezkor boʻlimlar', ru: 'Быстрые ссылки' },
    contactTitle: { uz: 'Bogʻlanish va ish vaqti', ru: 'Контакты и режим работы' },
    license: { uz: 'Litsenziya', ru: 'Лицензия' },
    rights: { uz: 'Barcha huquqlar himoyalangan.', ru: 'Все права защищены.' },
    quick: [
      { href: '#narxlar', label: { uz: 'Umumiy qon va biokimyo tahlillari', ru: 'Общие и биохимические анализы' } },
      { href: '#narxlar', label: { uz: 'Gormonlar va check-up paketlar', ru: 'Гормоны и check-up пакеты' } },
      { href: '#emlash', label: { uz: 'Emlash xizmatlari', ru: 'Вакцинация' } },
      { href: '#ai-yordamchi', label: { uz: 'AI yordamchi', ru: 'AI-помощник' } },
      { href: '#manzillar', label: { uz: 'Filiallar xaritasi', ru: 'Карта филиалов' } },
    ],
  },
};

// ------------------------------------------------------------

const LangContext = createContext(null);
const STORAGE_KEY = 'hayot-lang';

function readSavedLang() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'ru' || v === 'uz' ? v : 'uz';
  } catch {
    return 'uz';
  }
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(readSavedLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* brauzer xotirasi yopiq bo'lsa — e'tiborsiz */
    }
  }, [lang]);

  const value = useMemo(() => {
    // t({uz, ru}, {n: 3}) → tanlangan tildagi matn, {n} o'rniga 3
    const t = (obj, vars) => {
      let s = obj && typeof obj === 'object' ? obj[lang] ?? obj.uz : obj ?? '';
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
      return s;
    };
    return { lang, setLang, t };
  }, [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
