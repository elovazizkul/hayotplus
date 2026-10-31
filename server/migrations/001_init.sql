-- Hayot Plus — boshlang'ich baza tuzilmasi

CREATE TABLE categories (
  id          text PRIMARY KEY,
  label_uz    text NOT NULL,
  label_ru    text NOT NULL DEFAULT '',
  sort_order  integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tests (
  id          text PRIMARY KEY,
  category_id text NOT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  name_uz     text NOT NULL,
  name_ru     text NOT NULL DEFAULT '',
  desc_uz     text NOT NULL DEFAULT '',
  desc_ru     text NOT NULL DEFAULT '',
  sample_uz   text NOT NULL DEFAULT '',
  sample_ru   text NOT NULL DEFAULT '',
  days        integer NOT NULL DEFAULT 1 CHECK (days >= 0),
  price       integer NOT NULL CHECK (price >= 0),
  keywords    text NOT NULL DEFAULT '',
  accent      text NOT NULL DEFAULT '',
  sort_order  integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tests_category_idx ON tests (category_id);
CREATE INDEX tests_price_idx ON tests (price);

CREATE TABLE packages (
  id          text PRIMARY KEY,
  icon        text NOT NULL DEFAULT 'health_and_safety',
  icon_color  text NOT NULL DEFAULT 'primary',
  badge_uz    text NOT NULL DEFAULT '',
  badge_ru    text NOT NULL DEFAULT '',
  badge_style text NOT NULL DEFAULT 'primary',
  name_uz     text NOT NULL,
  name_ru     text NOT NULL DEFAULT '',
  desc_uz     text NOT NULL DEFAULT '',
  desc_ru     text NOT NULL DEFAULT '',
  price       integer NOT NULL CHECK (price >= 0),
  sort_order  integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vaccines (
  id          text PRIMARY KEY,
  icon        text NOT NULL DEFAULT 'vaccines',
  icon_color  text NOT NULL DEFAULT 'primary',
  tag_uz      text NOT NULL DEFAULT '',
  tag_ru      text NOT NULL DEFAULT '',
  name_uz     text NOT NULL,
  name_ru     text NOT NULL DEFAULT '',
  desc_uz     text NOT NULL DEFAULT '',
  desc_ru     text NOT NULL DEFAULT '',
  note_uz     text NOT NULL DEFAULT '',
  note_ru     text NOT NULL DEFAULT '',
  price       integer NOT NULL CHECK (price >= 0),
  price_from  boolean NOT NULL DEFAULT false,
  sort_order  integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vaccine_rules (
  id          text PRIMARY KEY,
  title_uz    text NOT NULL,
  title_ru    text NOT NULL DEFAULT '',
  text_uz     text NOT NULL DEFAULT '',
  text_ru     text NOT NULL DEFAULT '',
  sort_order  integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE branches (
  id          text PRIMARY KEY,
  is_main     boolean NOT NULL DEFAULT false,
  icon        text NOT NULL DEFAULT 'location_on',
  name_uz     text NOT NULL,
  name_ru     text NOT NULL DEFAULT '',
  short_uz    text NOT NULL DEFAULT '',
  short_ru    text NOT NULL DEFAULT '',
  city_uz     text NOT NULL DEFAULT '',
  city_ru     text NOT NULL DEFAULT '',
  address_uz  text NOT NULL DEFAULT '',
  address_ru  text NOT NULL DEFAULT '',
  landmark_uz text NOT NULL DEFAULT '',
  landmark_ru text NOT NULL DEFAULT '',
  hours       text NOT NULL DEFAULT '',
  phone       text NOT NULL DEFAULT '',
  lat         double precision NOT NULL,
  lng         double precision NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE faq (
  id          text PRIMARY KEY,
  question_uz text NOT NULL,
  question_ru text NOT NULL DEFAULT '',
  answer_uz   text NOT NULL,
  answer_ru   text NOT NULL DEFAULT '',
  keywords    text[] NOT NULL DEFAULT '{}',
  sort_order  integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE leads (
  id          bigserial PRIMARY KEY,
  type        text NOT NULL DEFAULT 'contact',
  status      text NOT NULL DEFAULT 'new',
  name        text NOT NULL,
  phone       text NOT NULL,
  lang        text NOT NULL DEFAULT 'uz',
  vaccine     text NOT NULL DEFAULT '',
  preferred_time text NOT NULL DEFAULT '',
  branch      text NOT NULL DEFAULT '',
  message     text NOT NULL DEFAULT '',
  tests       jsonb NOT NULL DEFAULT '[]',
  total       integer NOT NULL DEFAULT 0,
  delivered   boolean NOT NULL DEFAULT false,
  note        text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leads_status_idx ON leads (status, created_at DESC);

CREATE TABLE settings (
  key         text PRIMARY KEY,
  value       text NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  token_hash  text PRIMARY KEY,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE mcp_tokens (
  id             bigserial PRIMARY KEY,
  name           text NOT NULL,
  token_hash     text NOT NULL UNIQUE,
  prefix         text NOT NULL,
  can_write      boolean NOT NULL DEFAULT false,
  can_read_leads boolean NOT NULL DEFAULT false,
  last_used_at   timestamptz,
  revoked_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id          bigserial PRIMARY KEY,
  actor       text NOT NULL,
  action      text NOT NULL,
  entity      text NOT NULL,
  entity_id   text NOT NULL DEFAULT '',
  before      jsonb,
  after       jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_created_idx ON audit_log (created_at DESC);
