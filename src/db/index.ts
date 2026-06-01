import * as SQLite from 'expo-sqlite';
import { COMPLETENESS_VIEW_SQL, SCHEMA_SQL, SEED_TAGS } from './schema';

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
  // 1) Ensure new columns exist on older DBs before any view references them.
  const cols = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info('contacts');",
  );
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has('marked_complete')) {
    await db.execAsync(
      `ALTER TABLE contacts ADD COLUMN marked_complete INTEGER NOT NULL DEFAULT 0;`,
    );
  }

  // 2) Ensure the app_settings table exists (added in v3).
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT);`,
  );

  // 3) Always (re)create the completeness view AFTER columns are guaranteed.
  //    Cheap (views hold no rows), and avoids the v1→v3 footgun where
  //    the view body referenced a column that didn't exist yet.
  await db.execAsync(COMPLETENESS_VIEW_SQL);
}

async function seedTagsIfEmpty(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM tags;');
  if (row && row.n > 0) return;
  for (const t of SEED_TAGS) {
    await db.runAsync('INSERT OR IGNORE INTO tags (name, color) VALUES (?, ?);', t.name, t.color);
  }
}
