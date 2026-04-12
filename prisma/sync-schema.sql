-- Idempotent schema sync — safe to run on every deploy.
-- Brings the production database in line with prisma/schema.prisma.

-- Missing column: users.welcome_email_sent
ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- Missing column: pools.emissions_apr
ALTER TABLE pools ADD COLUMN IF NOT EXISTS emissions_apr DOUBLE PRECISION;

-- Missing unique constraints on users
CREATE UNIQUE INDEX IF NOT EXISTS users_verification_token_key ON users(verification_token);
CREATE UNIQUE INDEX IF NOT EXISTS users_reset_token_key ON users(reset_token);

-- Missing indexes on pools
CREATE INDEX IF NOT EXISTS pools_token0_address_idx ON pools(token0_address);
CREATE INDEX IF NOT EXISTS pools_token1_address_idx ON pools(token1_address);

-- Missing table: wallet_events
CREATE TABLE IF NOT EXISTS wallet_events (
  id              TEXT             NOT NULL PRIMARY KEY,
  wallet_id       TEXT             NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  chain_id        TEXT             NOT NULL,
  tx_hash         TEXT             NOT NULL,
  block_number    BIGINT           NOT NULL,
  event_at        TIMESTAMPTZ      NOT NULL,
  event_type      TEXT             NOT NULL,
  nft_token_id    TEXT,
  pool_address    TEXT,
  protocol        TEXT,
  token0_address  TEXT,
  token0_symbol   TEXT,
  token0_amount   DOUBLE PRECISION,
  token0_price    DOUBLE PRECISION,
  token1_address  TEXT,
  token1_symbol   TEXT,
  token1_amount   DOUBLE PRECISION,
  token1_price    DOUBLE PRECISION,
  value_usd       DOUBLE PRECISION,
  cost_basis_usd  DOUBLE PRECISION,
  pnl_usd         DOUBLE PRECISION,
  pnl_pct         DOUBLE PRECISION,
  raw_data        JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS wallet_events_wallet_id_chain_id_tx_hash_event_type_key
  ON wallet_events(wallet_id, chain_id, tx_hash, event_type);
CREATE INDEX IF NOT EXISTS wallet_events_wallet_id_event_at_idx
  ON wallet_events(wallet_id, event_at DESC);
CREATE INDEX IF NOT EXISTS wallet_events_wallet_id_nft_token_id_idx
  ON wallet_events(wallet_id, nft_token_id);
