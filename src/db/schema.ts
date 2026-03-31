import { pool } from './pool'

export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS cards (
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
    rank        VARCHAR(2) NOT NULL,    -- A 2..10 J Q K
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

  CREATE TABLE IF NOT EXISTS tapes (
    id          TEXT PRIMARY KEY,
    duration    INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS artists (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    url         TEXT,
    cover_id    TEXT,
    cover_url   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS sides (
    id          SERIAL PRIMARY KEY,
    tape_id     TEXT NOT NULL REFERENCES tapes(id) ON DELETE CASCADE,
    side        CHAR(1) NOT NULL,
    duration    INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tape_id, side)
  );

  CREATE TABLE IF NOT EXISTS tarots (
    id          SERIAL PRIMARY KEY,
    esid        TEXT NOT NULL UNIQUE,
    tape_id     TEXT NOT NULL REFERENCES tapes(id) ON DELETE CASCADE,
    side        CHAR(1) NOT NULL,
    track_order INTEGER NOT NULL,
    title       TEXT NOT NULL,
    artist_id   INTEGER NOT NULL REFERENCES artists(id),
    start       NUMERIC NOT NULL,
    link        TEXT,
    url_audio   TEXT NOT NULL,
    url_image   TEXT,
    url_tarot   TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tape_id, side, track_order)
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS cards_date ON cards (year, month, day, hour);
  CREATE INDEX IF NOT EXISTS cards_suit_rank ON cards (suit, rank);
  CREATE INDEX IF NOT EXISTS cards_slug ON cards (slug);
  CREATE INDEX IF NOT EXISTS cards_stem ON cards (stem);
  CREATE INDEX IF NOT EXISTS cards_esid ON cards (esid);
  CREATE INDEX IF NOT EXISTS tarots_tape_side_order ON tarots (tape_id, side, track_order);
  CREATE INDEX IF NOT EXISTS tarots_artist_id ON tarots (artist_id);
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
