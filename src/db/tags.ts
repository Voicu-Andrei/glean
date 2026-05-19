import { getDb } from './index';

export const MAX_TAGS_PER_CONTACT = 10;

export const TAG_COLORS = [
  '#1A6B6B', // teal (primary)
  '#5B7FA6', // slate-blue
  '#2E7D32', // green
  '#D4820A', // amber
  '#C73E1D', // red
  '#6A1B9A', // purple
  '#E91E63', // pink
  '#0277BD', // blue
  '#6B7280', // gray
  '#1C1C1E', // near-black
] as const;

export type TagRow = {
  id: number;
  name: string;
  color: string;
};

export type TagWithCount = TagRow & { contact_count: number };

export async function listTags(): Promise<TagRow[]> {
  const db = await getDb();
  return db.getAllAsync<TagRow>('SELECT * FROM tags ORDER BY name COLLATE NOCASE ASC;');
}

export async function listTagsWithCount(): Promise<TagWithCount[]> {
  const db = await getDb();
  return db.getAllAsync<TagWithCount>(`
    SELECT t.*, (SELECT COUNT(*) FROM contact_tags ct WHERE ct.tag_id = t.id) AS contact_count
    FROM tags t
    ORDER BY t.name COLLATE NOCASE ASC;
  `);
}

export async function createTag(name: string, color = '#6B7280'): Promise<number> {
  const db = await getDb();
  const trimmed = name.trim();
  if (trimmed.length === 0) throw new Error('Tag name required');
  const res = await db.runAsync(
    'INSERT INTO tags (name, color) VALUES (?, ?);',
    trimmed,
    color,
  );
  return res.lastInsertRowId as number;
}

export async function renameTag(id: number, name: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE tags SET name = ? WHERE id = ?;', name.trim(), id);
}

export async function setTagColor(id: number, color: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE tags SET color = ? WHERE id = ?;', color, id);
}

export async function deleteTag(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM tags WHERE id = ?;', id);
}

export async function tagsForContact(contactId: number): Promise<TagRow[]> {
  const db = await getDb();
  return db.getAllAsync<TagRow>(
    `SELECT t.* FROM tags t
     JOIN contact_tags ct ON ct.tag_id = t.id
     WHERE ct.contact_id = ?
     ORDER BY t.name COLLATE NOCASE ASC;`,
    contactId,
  );
}

export async function setContactTags(contactId: number, tagIds: number[]): Promise<void> {
  const unique = Array.from(new Set(tagIds));
  if (unique.length > MAX_TAGS_PER_CONTACT) {
    throw new Error(`A contact can have at most ${MAX_TAGS_PER_CONTACT} tags.`);
  }
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM contact_tags WHERE contact_id = ?;', contactId);
    for (const tid of unique) {
      await db.runAsync(
        'INSERT OR IGNORE INTO contact_tags (contact_id, tag_id) VALUES (?, ?);',
        contactId,
        tid,
      );
    }
  });
}

export async function attachTag(contactId: number, tagId: number): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM contact_tags WHERE contact_id = ?;',
    contactId,
  );
  if ((row?.n ?? 0) >= MAX_TAGS_PER_CONTACT) {
    throw new Error(`A contact can have at most ${MAX_TAGS_PER_CONTACT} tags.`);
  }
  await db.runAsync(
    'INSERT OR IGNORE INTO contact_tags (contact_id, tag_id) VALUES (?, ?);',
    contactId,
    tagId,
  );
}

export async function detachTag(contactId: number, tagId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'DELETE FROM contact_tags WHERE contact_id = ? AND tag_id = ?;',
    contactId,
    tagId,
  );
}
