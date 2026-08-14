-- Schema do MW Tech. É aplicado automaticamente na inicialização (CREATE TABLE IF NOT EXISTS).
CREATE TABLE IF NOT EXISTS games (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  author      TEXT,
  description TEXT,
  slug        TEXT UNIQUE NOT NULL,
  entry_file  TEXT NOT NULL DEFAULT 'index.html',
  kind        TEXT NOT NULL DEFAULT 'zip',          -- 'zip' ou 'single'
  storage_path TEXT NOT NULL,
  cover_path  TEXT,
  plays       INTEGER NOT NULL DEFAULT 0,
  ip_hash     TEXT,
  hidden      BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_games_created ON games (created_at DESC);
-- Idempotente: adiciona a coluna em bancos já existentes sem quebrar nada
ALTER TABLE games ADD COLUMN IF NOT EXISTS plays INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS photos (
  id          BIGSERIAL PRIMARY KEY,
  caption     TEXT,
  author      TEXT,
  filename    TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime        TEXT NOT NULL,
  ip_hash     TEXT,
  hidden      BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_photos_created ON photos (created_at DESC);
