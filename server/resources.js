// ============================================================
//  BO'LIMLAR TAVSIFI — admin panel ham, MCP ham shu yerdan ishlaydi
// ============================================================
//  Har bir bo'lim (tahlillar, vaksinalar...) uchun maydonlar shu yerda
//  yoziladi: forma, jadval, filtr, tekshiruv va MCP avtomatik quriladi.
//
//  Maydon turlari: text, textarea, int, number, bool, select, ref,
//                  tags, json, datetime
//  list: true   — jadvalda ko'rinadi
//  filter: true — filtr sifatida ishlaydi (raqam/sana uchun oraliq)
//  readOnly     — faqat o'qiladi
// ============================================================

const lang = (name, label, opts = {}) => [
  { name: `${name}_uz`, label: `${label} (oʻzbekcha)`, type: 'text', ...opts },
  { name: `${name}_ru`, label: `${label} (ruscha)`, type: 'text', ...opts, required: false, list: false },
];

const common = [
  { name: 'sort_order', label: 'Tartib raqami', type: 'int', default: 0, list: true },
  { name: 'active', label: 'Saytda koʻrinadi', type: 'bool', default: true, list: true, filter: true },
];
const stamps = [
  { name: 'created_at', label: 'Yaratilgan', type: 'datetime', readOnly: true },
  { name: 'updated_at', label: 'Oʻzgartirilgan', type: 'datetime', readOnly: true, list: true },
];

const colorOptions = [
  { value: 'primary', label: 'Koʻk' },
  { value: 'secondary', label: 'Yashil' },
];
const badgeOptions = [...colorOptions, { value: 'neutral', label: 'Kulrang' }];

const CRUD = ['list', 'get', 'create', 'update', 'delete'];

export const resources = {
  tests: {
    label: 'Tahlillar',
    idFrom: 'name_uz',
    ops: CRUD,
    public: true,
    sort: 'sort_order',
    search: ['id', 'name_uz', 'name_ru', 'desc_uz', 'keywords'],
    fields: [
      { name: 'category_id', label: 'Toifa', type: 'ref', ref: 'categories', refLabel: 'label_uz', required: true, list: true, filter: true },
      ...lang('name', 'Nomi', { required: true, list: true }),
      { name: 'price', label: 'Narx (soʻm)', type: 'int', required: true, min: 0, list: true, filter: true },
      { name: 'days', label: 'Natija muddati (kun)', type: 'int', default: 1, min: 0, list: true, filter: true },
      { name: 'desc_uz', label: 'Tavsif (oʻzbekcha)', type: 'textarea' },
      { name: 'desc_ru', label: 'Tavsif (ruscha)', type: 'textarea' },
      ...lang('sample', 'Namuna turi'),
      { name: 'keywords', label: 'Qidiruv soʻzlari', type: 'text' },
      { name: 'accent', label: 'Rang urgʻusi', type: 'select', options: [{ value: '', label: 'Oddiy' }, { value: 'secondary', label: 'Yashil' }] },
      ...common,
      ...stamps,
    ],
  },

  categories: {
    label: 'Toifalar',
    idFrom: 'label_uz',
    ops: CRUD,
    public: true,
    sort: 'sort_order',
    search: ['id', 'label_uz', 'label_ru'],
    fields: [...lang('label', 'Nomi', { required: true, list: true }), ...common, ...stamps],
  },

  packages: {
    label: 'Check-up paketlar',
    idFrom: 'name_uz',
    ops: CRUD,
    public: true,
    sort: 'sort_order',
    search: ['id', 'name_uz', 'name_ru', 'desc_uz'],
    fields: [
      ...lang('name', 'Nomi', { required: true, list: true }),
      { name: 'price', label: 'Narx (soʻm)', type: 'int', required: true, min: 0, list: true, filter: true },
      { name: 'desc_uz', label: 'Tarkibi (oʻzbekcha)', type: 'textarea' },
      { name: 'desc_ru', label: 'Tarkibi (ruscha)', type: 'textarea' },
      ...lang('badge', 'Belgi matni'),
      { name: 'badge_style', label: 'Belgi rangi', type: 'select', options: badgeOptions, default: 'primary' },
      { name: 'icon', label: 'Ikonka nomi', type: 'text', default: 'health_and_safety' },
      { name: 'icon_color', label: 'Ikonka rangi', type: 'select', options: colorOptions, default: 'primary' },
      ...common,
      ...stamps,
    ],
  },

  vaccines: {
    label: 'Vaksinalar',
    idFrom: 'name_uz',
    ops: CRUD,
    public: true,
    sort: 'sort_order',
    search: ['id', 'name_uz', 'name_ru', 'desc_uz'],
    fields: [
      ...lang('name', 'Nomi', { required: true, list: true }),
      { name: 'price', label: 'Narx (soʻm)', type: 'int', required: true, min: 0, list: true, filter: true },
      { name: 'price_from', label: 'Narx oldiga “...dan” qoʻshilsin', type: 'bool', default: false },
      { name: 'desc_uz', label: 'Tavsif (oʻzbekcha)', type: 'textarea' },
      { name: 'desc_ru', label: 'Tavsif (ruscha)', type: 'textarea' },
      ...lang('tag', 'Yorliq'),
      ...lang('note', 'Izoh'),
      { name: 'icon', label: 'Ikonka nomi', type: 'text', default: 'vaccines' },
      { name: 'icon_color', label: 'Ikonka rangi', type: 'select', options: colorOptions, default: 'primary' },
      ...common,
      ...stamps,
    ],
  },

  vaccine_rules: {
    label: 'Emlash qoidalari',
    idFrom: 'title_uz',
    ops: CRUD,
    public: true,
    sort: 'sort_order',
    search: ['id', 'title_uz', 'title_ru', 'text_uz'],
    fields: [
      ...lang('title', 'Sarlavha', { required: true, list: true }),
      { name: 'text_uz', label: 'Matn (oʻzbekcha)', type: 'textarea' },
      { name: 'text_ru', label: 'Matn (ruscha)', type: 'textarea' },
      ...common,
      ...stamps,
    ],
  },

  branches: {
    label: 'Filiallar',
    idFrom: 'name_uz',
    ops: CRUD,
    public: true,
    sort: 'sort_order',
    search: ['id', 'name_uz', 'name_ru', 'address_uz', 'city_uz', 'phone'],
    fields: [
      ...lang('name', 'Toʻliq nomi', { required: true, list: true }),
      ...lang('short', 'Qisqa nomi'),
      ...lang('city', 'Shahar', { list: true }),
      ...lang('address', 'Manzil'),
      ...lang('landmark', 'Moʻljal'),
      { name: 'phone', label: 'Telefon', type: 'text', list: true },
      { name: 'hours', label: 'Ish vaqti', type: 'text', list: true },
      { name: 'lat', label: 'Kenglik (lat)', type: 'number', required: true },
      { name: 'lng', label: 'Uzunlik (lng)', type: 'number', required: true },
      { name: 'is_main', label: 'Markaziy laboratoriya', type: 'bool', default: false },
      { name: 'icon', label: 'Ikonka nomi', type: 'text', default: 'location_on' },
      ...common,
      ...stamps,
    ],
  },

  faq: {
    label: 'Tayyor javoblar (FAQ)',
    idFrom: 'question_uz',
    ops: CRUD,
    public: true,
    sort: 'sort_order',
    search: ['id', 'question_uz', 'question_ru', 'answer_uz'],
    fields: [
      ...lang('question', 'Savol', { required: true, list: true }),
      { name: 'answer_uz', label: 'Javob (oʻzbekcha)', type: 'textarea', required: true },
      { name: 'answer_ru', label: 'Javob (ruscha)', type: 'textarea' },
      { name: 'keywords', label: 'Kalit soʻzlar', type: 'tags' },
      ...common,
      ...stamps,
    ],
  },

  leads: {
    label: 'Arizalar',
    ops: ['list', 'get', 'update', 'delete'],
    numericId: true,
    private: true, // bemorlarning shaxsiy ma'lumotlari
    sort: 'created_at',
    dir: 'desc',
    search: ['name', 'phone', 'vaccine', 'branch', 'message'],
    fields: [
      { name: 'id', label: '№', type: 'int', readOnly: true, list: true },
      {
        name: 'status',
        label: 'Holat',
        type: 'select',
        list: true,
        filter: true,
        options: [
          { value: 'new', label: 'Yangi' },
          { value: 'contacted', label: 'Bogʻlanildi' },
          { value: 'done', label: 'Bajarildi' },
          { value: 'cancelled', label: 'Bekor qilindi' },
        ],
      },
      {
        name: 'type',
        label: 'Turi',
        type: 'select',
        readOnly: true,
        list: true,
        filter: true,
        options: [
          { value: 'vaccine', label: 'Emlash' },
          { value: 'contact', label: 'Murojaat' },
        ],
      },
      { name: 'name', label: 'Ism', type: 'text', readOnly: true, list: true },
      { name: 'phone', label: 'Telefon', type: 'text', readOnly: true, list: true },
      { name: 'vaccine', label: 'Vaksina', type: 'text', readOnly: true },
      { name: 'preferred_time', label: 'Qulay vaqt', type: 'text', readOnly: true },
      { name: 'branch', label: 'Filial', type: 'text', readOnly: true, list: true },
      { name: 'message', label: 'Xabar', type: 'textarea', readOnly: true },
      { name: 'tests', label: 'Tanlangan tahlillar', type: 'json', readOnly: true },
      { name: 'total', label: 'Jami (soʻm)', type: 'int', readOnly: true, list: true },
      { name: 'lang', label: 'Til', type: 'text', readOnly: true },
      { name: 'delivered', label: 'Telegramga yetdi', type: 'bool', readOnly: true, filter: true },
      { name: 'note', label: 'Xodim izohi', type: 'textarea' },
      { name: 'created_at', label: 'Sana', type: 'datetime', readOnly: true, list: true, filter: true },
    ],
  },

  audit: {
    label: 'Oʻzgarishlar tarixi',
    table: 'audit_log',
    ops: ['list', 'get'],
    numericId: true,
    sort: 'created_at',
    dir: 'desc',
    search: ['actor', 'entity', 'entity_id'],
    fields: [
      { name: 'created_at', label: 'Vaqt', type: 'datetime', readOnly: true, list: true, filter: true },
      { name: 'actor', label: 'Kim', type: 'text', readOnly: true, list: true },
      {
        name: 'action',
        label: 'Amal',
        type: 'select',
        readOnly: true,
        list: true,
        filter: true,
        options: [
          { value: 'create', label: 'Yaratish' },
          { value: 'update', label: 'Oʻzgartirish' },
          { value: 'delete', label: 'Oʻchirish' },
          { value: 'settings', label: 'Sozlama' },
        ],
      },
      { name: 'entity', label: 'Boʻlim', type: 'text', readOnly: true, list: true, filter: true },
      { name: 'entity_id', label: 'Yozuv', type: 'text', readOnly: true, list: true },
      { name: 'before', label: 'Avvalgi holat', type: 'json', readOnly: true },
      { name: 'after', label: 'Yangi holat', type: 'json', readOnly: true },
    ],
  },
};

export const tableOf = (name) => resources[name].table || name;
