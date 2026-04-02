import { pool } from './pool'

export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS card (
    id          SERIAL PRIMARY KEY,
    -- Parsed from filename: YYYYMMDDHH__artist__title.ext
    esid        TEXT NOT NULL UNIQUE,   -- MD5 hash of date+artist+title
    year        SMALLINT NOT NULL,
    month       SMALLINT NOT NULL,
    day         SMALLINT NOT NULL,
    hour        SMALLINT NOT NULL,
    artist      TEXT NOT NULL,
    title       TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,    -- URL-friendly slug from artist+title
    stem        TEXT,                    -- Original filename stem
    -- Playing card assigned from date
    suit        CHAR(1) NOT NULL,       -- ♠ ♣ ♦ ♥
    rank        VARCHAR(2) NOT NULL,    -- A 2..10 V D R
    -- File paths relative to MEDIA_DIR
    url_audio   TEXT NOT NULL,
    url_image   TEXT NOT NULL,
    blurhash    TEXT,                   -- Blurhash of the image for placeholder
    -- Watcher metadata: used to detect changes without full re-scan
    file_mtime  BIGINT NOT NULL,        -- mtime of the audio file in ms
    file_size   BIGINT NOT NULL,        -- audio file size in bytes
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS tape (
    id          TEXT PRIMARY KEY,
    duration    INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS artist (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    url         TEXT,
    cover_id    TEXT,
    cover_url   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS side (
    id          SERIAL PRIMARY KEY,
    tape_id     TEXT NOT NULL REFERENCES tape(id) ON DELETE CASCADE,
    side        CHAR(1) NOT NULL,
    duration    INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tape_id, side)
  );

  CREATE TABLE IF NOT EXISTS tarot (
    id          SERIAL PRIMARY KEY,
    esid        TEXT NOT NULL UNIQUE,
    tape_id     TEXT NOT NULL REFERENCES tape(id) ON DELETE CASCADE,
    side        CHAR(1) NOT NULL,
    suit        INTEGER NOT NULL,
    rank        INTEGER NOT NULL,
    title       TEXT NOT NULL,
    artist_id   INTEGER NOT NULL REFERENCES artist(id),
    start       NUMERIC NOT NULL,
    link        TEXT,
    url_audio   TEXT NOT NULL,
    url_image   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tape_id, side, rank)
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS card_date ON card (year, month, day, hour);
  CREATE INDEX IF NOT EXISTS card_suit_rank ON card (suit, rank);
  CREATE INDEX IF NOT EXISTS card_slug ON card (slug);
  CREATE INDEX IF NOT EXISTS card_stem ON card (stem);
  CREATE INDEX IF NOT EXISTS card_esid ON card (esid);
  CREATE INDEX IF NOT EXISTS tarot_tape_side_rank ON tarot (tape_id, side, rank);
  CREATE INDEX IF NOT EXISTS tarot_artist_id ON tarot (artist_id);
`

export async function createSchema() {
  const client = await pool.connect()
  try {
    await client.query(SCHEMA_SQL)
    console.log('✅ Database schema created successfully')
  } finally {
    client.release()
  }
}
