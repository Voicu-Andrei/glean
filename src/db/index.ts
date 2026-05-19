import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL, SEED_TAGS } from './schema';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('glean.db');
      await db.execAsync(SCHEMA_SQL);
      await migrate(db);
      await seedTagsIfEmpty(db);
      return db;
    })();
  }
  return dbPromise;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const cols = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info('contacts');",
  );
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has('marked_complete')) {
    await db.execAsync(
      `ALTER TABLE contacts ADD COLUMN marked_complete INTEGER NOT NULL DEFAULT 0;
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
       FROM contacts c;`,
    );
  }
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT);`,
  );
}

async function seedTagsIfEmpty(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM tags;');
  if (row && row.n > 0) return;
  for (const t of SEED_TAGS) {
    await db.runAsync('INSERT OR IGNORE INTO tags (name, color) VALUES (?, ?);', t.name, t.color);
  }
}
