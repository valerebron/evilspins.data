import { pool } from './pool'

export const SCHEMA_SQL = `
  DROP TABLE IF EXISTS cards CASCADE;

  CREATE TABLE cards (
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
    -- File paths relative to CARDS_DIR
    url_audio   TEXT NOT NULL,
    url_image   TEXT NOT NULL,
    blurhash    TEXT,                   -- Blurhash of the image for placeholder
    -- Watcher metadata: used to detect changes without full re-scan
    file_mtime  BIGINT NOT NULL,        -- mtime of the audio file in ms
    file_size   BIGINT NOT NULL,        -- audio file size in bytes
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- Indexes for performance
  CREATE INDEX cards_date ON cards (year, month, day, hour);
  CREATE INDEX cards_suit_rank ON cards (suit, rank);
  CREATE INDEX cards_slug ON cards (slug);
  CREATE INDEX cards_stem ON cards (stem);
  CREATE INDEX cards_esid ON cards (esid);
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
