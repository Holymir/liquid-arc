-- Migration: add_api_keys
-- LP Analytics public API — issue #50
-- Run via: psql $DATABASE_URL -f prisma/migrations/add_api_keys/migration.sql

CREATE TABLE IF NOT EXISTS api_keys (
  id            TEXT        NOT NULL PRIMARY KEY,
  user_id       TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash      TEXT        NOT NULL UNIQUE,   -- SHA-256 hex of the raw key
  key_prefix    TEXT        NOT NULL,           -- first 8 chars (shown in UI)
  name          TEXT        NOT NULL DEFAULT 'Default',
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  last_used_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys(user_id);
