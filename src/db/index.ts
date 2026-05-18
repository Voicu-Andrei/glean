import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL, SEED_TAGS } from './schema';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('glean.db');
      await db.execAsync(SCHEMA_SQL);
      await seedTagsIfEmpty(db);
      return db;
    })();
  }
  return dbPromise;
}

async function seedTagsIfEmpty(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM tags;');
  if (row && row.n > 0) return;
  for (const t of SEED_TAGS) {
    await db.runAsync('INSERT OR IGNORE INTO tags (name, color) VALUES (?, ?);', t.name, t.color);
  }
}
