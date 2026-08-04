import { pool } from './pool'

export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS card (
    id          SERIAL PRIMARY KEY,
    -- Parsed from filename: YYYYMMDDHH__artist__title.ext
    esid        TEXT NOT NULL UNIQUE,
    year        SMALLINT NOT NULL,
    month       SMALLINT NOT NULL,
    day         SMALLINT NOT NULL,
    hour        SMALLINT NOT NULL,
    artist      TEXT NOT NULL,
    title       TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    stem        TEXT,
    suit        CHAR(1) NOT NULL,
    rank        VARCHAR(2) NOT NULL,
    ext_audio   TEXT NOT NULL,
    ext_image   TEXT NOT NULL,
    blurhash    TEXT,
    file_mtime  BIGINT NOT NULL,
    file_size   BIGINT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS box (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    artists      JSONB NOT NULL DEFAULT '{}'::jsonb,
    color        JSONB NOT NULL DEFAULT '{}'::jsonb,
    quote        JSONB NOT NULL DEFAULT '{}'::jsonb,
    cover_front  TEXT,
    cover_back   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  ALTER TABLE box ADD COLUMN IF NOT EXISTS color JSONB NOT NULL DEFAULT '{}'::jsonb;
  ALTER TABLE box ADD COLUMN IF NOT EXISTS quote JSONB NOT NULL DEFAULT '{}'::jsonb;

  CREATE TABLE IF NOT EXISTS box_card (
    box_id       TEXT NOT NULL REFERENCES box(id) ON DELETE CASCADE,
    card_esid    TEXT NOT NULL REFERENCES card(esid) ON DELETE CASCADE,
    position     SMALLINT NOT NULL,
    side         CHAR(1),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (box_id, card_esid)
  );

  ALTER TABLE box_card DROP CONSTRAINT IF EXISTS box_card_box_id_position_side_key;

  CREATE INDEX IF NOT EXISTS card_date ON card (year, month, day, hour);
  CREATE INDEX IF NOT EXISTS card_suit_rank ON card (suit, rank);
  CREATE INDEX IF NOT EXISTS card_slug ON card (slug);
  CREATE INDEX IF NOT EXISTS card_stem ON card (stem);
  CREATE INDEX IF NOT EXISTS card_esid ON card (esid);
  CREATE INDEX IF NOT EXISTS box_card_box_position ON box_card (box_id, position, side);
  CREATE INDEX IF NOT EXISTS box_card_card_esid ON box_card (card_esid);
`

export async function createSchema(): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query(SCHEMA_SQL)
    console.log('✅ Database schema created successfully')
  } finally {
    client.release()
  }
}
