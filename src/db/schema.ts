export const SCHEMA_VERSION = 3;

export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    location    TEXT,
    start_date  TEXT NOT NULL,
    end_date    TEXT,
    notes       TEXT,
    is_active   INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_event
    ON events(is_active) WHERE is_active = 1;

CREATE TABLE IF NOT EXISTS contacts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id        INTEGER REFERENCES events(id) ON DELETE SET NULL,
    company_name    TEXT NOT NULL,
    contact_name    TEXT,
    role            TEXT,
    phone           TEXT,
    email           TEXT,
    website         TEXT,
    what_they_sell  TEXT,
    notes           TEXT,
    interest_level  TEXT CHECK(interest_level IN ('hot','warm','cold')) DEFAULT 'warm',
    date_met        TEXT NOT NULL DEFAULT (date('now')),
    follow_up_date  TEXT,
    follow_up_notes TEXT,
    follow_up_done  INTEGER NOT NULL DEFAULT 0,
    marked_complete INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS photos (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id   INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    photo_type   TEXT NOT NULL CHECK(photo_type IN ('business_card','booth','additional')),
    file_path    TEXT NOT NULL,
    label        TEXT,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tags (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL UNIQUE COLLATE NOCASE,
    color TEXT NOT NULL DEFAULT '#6B7280'
);

CREATE TABLE IF NOT EXISTS contact_tags (
    contact_id  INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id      INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (contact_id, tag_id)
);

CREATE TABLE IF NOT EXISTS app_settings (
    key   TEXT PRIMARY KEY,
    value TEXT
);

CREATE INDEX IF NOT EXISTS idx_contacts_event_id ON contacts(event_id);
CREATE INDEX IF NOT EXISTS idx_contacts_interest_level ON contacts(interest_level);
CREATE INDEX IF NOT EXISTS idx_contact_tags_tag_id ON contact_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_photos_contact_id ON photos(contact_id);
`;

/**
 * View body kept separate so migrate() can drop+recreate it AFTER the
 * required columns are guaranteed to exist on older DBs.
 */
export const COMPLETENESS_VIEW_SQL = `
DROP VIEW IF EXISTS contacts_with_completeness;
CREATE VIEW contacts_with_completeness AS
SELECT c.*,
  CASE WHEN
       c.marked_complete = 1
       OR (
         c.company_name IS NOT NULL AND length(trim(c.company_name)) > 0
         AND c.contact_name IS NOT NULL AND length(trim(c.contact_name)) > 0
         AND ((c.email IS NOT NULL AND length(trim(c.email)) > 0)
              OR (c.phone IS NOT NULL AND length(trim(c.phone)) > 0))
         AND c.interest_level IS NOT NULL
       )
       THEN 1 ELSE 0 END AS is_complete
FROM contacts c;
`;

export const SEED_TAGS: Array<{ name: string; color: string }> = [
  { name: 'Supplier', color: '#1A6B6B' },
  { name: 'Partner', color: '#5B7FA6' },
  { name: 'Client', color: '#2E7D32' },
  { name: 'Investor', color: '#6A1B9A' },
  { name: 'Competitor', color: '#C73E1D' },
  { name: 'Service Provider', color: '#6B7280' },
];
