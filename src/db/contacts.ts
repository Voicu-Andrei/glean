import { getDb } from './index';
import { deletePhotoFilesForContact } from './photos';
import type { InterestLevel } from '../theme';

export type ContactRow = {
  id: number;
  event_id: number | null;
  company_name: string;
  contact_name: string | null;
  role: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  what_they_sell: string | null;
  notes: string | null;
  interest_level: InterestLevel | null;
  date_met: string;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  follow_up_done: number;
  marked_complete: number;
  created_at: string;
  updated_at: string;
  is_complete: number;
};

export type ContactListItem = ContactRow & {
  event_name: string | null;
  tag_names: string | null;
};

export type NewContactInput = {
  event_id: number | null;
  company_name: string;
  contact_name?: string | null;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  what_they_sell?: string | null;
  notes?: string | null;
  interest_level?: InterestLevel;
  date_met?: string;
  follow_up_date?: string | null;
  follow_up_notes?: string | null;
};

export type ContactFilters = {
  search?: string;
  event_id?: number | null;
  interest?: InterestLevel | null;
  tag_ids?: number[];
  only_incomplete?: boolean;
  sort?: 'date_met_desc' | 'company_asc' | 'interest';
};

export async function listContacts(filters: ContactFilters = {}): Promise<ContactListItem[]> {
  const db = await getDb();
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (filters.search && filters.search.trim().length > 0) {
    // Escape SQL LIKE wildcards (% and _) and the escape char itself so a
    // user typing "50%" or "snake_case" doesn't match everything.
    const raw = filters.search.trim().toLowerCase();
    const escaped = raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    const q = `%${escaped}%`;
    where.push(`(
      lower(c.company_name) LIKE ? ESCAPE '\\'
      OR lower(coalesce(c.contact_name, '')) LIKE ? ESCAPE '\\'
      OR lower(coalesce(c.role, '')) LIKE ? ESCAPE '\\'
      OR lower(coalesce(c.email, '')) LIKE ? ESCAPE '\\'
      OR lower(coalesce(c.phone, '')) LIKE ? ESCAPE '\\'
      OR lower(coalesce(c.notes, '')) LIKE ? ESCAPE '\\'
      OR lower(coalesce(c.what_they_sell, '')) LIKE ? ESCAPE '\\'
      OR EXISTS (
        SELECT 1 FROM contact_tags ct
        JOIN tags t ON t.id = ct.tag_id
        WHERE ct.contact_id = c.id AND lower(t.name) LIKE ? ESCAPE '\\'
      )
    )`);
    params.push(q, q, q, q, q, q, q, q);
  }
  if (filters.event_id != null) {
    where.push('c.event_id = ?');
    params.push(filters.event_id);
  }
  if (filters.interest) {
    where.push('c.interest_level = ?');
    params.push(filters.interest);
  }
  if (filters.only_incomplete) {
    where.push('c.is_complete = 0');
  }
  if (filters.tag_ids && filters.tag_ids.length > 0) {
    const placeholders = filters.tag_ids.map(() => '?').join(',');
    where.push(`c.id IN (
      SELECT contact_id FROM contact_tags WHERE tag_id IN (${placeholders})
      GROUP BY contact_id HAVING COUNT(DISTINCT tag_id) = ?
    )`);
    params.push(...filters.tag_ids, filters.tag_ids.length);
  }

  const orderBy =
    filters.sort === 'company_asc' ? 'c.company_name COLLATE NOCASE ASC'
    : filters.sort === 'interest'   ? `CASE c.interest_level WHEN 'hot' THEN 0 WHEN 'warm' THEN 1 WHEN 'cold' THEN 2 ELSE 3 END, c.date_met DESC`
    :                                 'c.date_met DESC, c.id DESC';

  const sql = `
    SELECT c.*,
      e.name AS event_name,
      (SELECT GROUP_CONCAT(t.name, '|')
       FROM contact_tags ct JOIN tags t ON t.id = ct.tag_id
       WHERE ct.contact_id = c.id) AS tag_names
    FROM contacts_with_completeness c
    LEFT JOIN events e ON e.id = c.event_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY ${orderBy};
  `;
  return db.getAllAsync<ContactListItem>(sql, ...params);
}

export async function getContact(id: number): Promise<ContactRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ContactRow>(
    'SELECT * FROM contacts_with_completeness WHERE id = ?;',
    id,
  );
  return row ?? null;
}

export async function getIncompleteCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM contacts_with_completeness WHERE is_complete = 0;',
  );
  return row?.n ?? 0;
}

export async function createContact(input: NewContactInput): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    `INSERT INTO contacts (
      event_id, company_name, contact_name, role, phone, email,
      website, what_they_sell, notes, interest_level, date_met,
      follow_up_date, follow_up_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, date('now')), ?, ?);`,
    input.event_id,
    input.company_name.trim(),
    input.contact_name ?? null,
    input.role ?? null,
    input.phone ?? null,
    input.email ?? null,
    input.website ?? null,
    input.what_they_sell ?? null,
    input.notes ?? null,
    input.interest_level ?? 'warm',
    input.date_met ?? null,
    input.follow_up_date ?? null,
    input.follow_up_notes ?? null,
  );
  return res.lastInsertRowId as number;
}

export async function updateContact(id: number, patch: Partial<NewContactInput>): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  const setIf = (key: keyof NewContactInput, col: string) => {
    if (patch[key] !== undefined) {
      fields.push(`${col} = ?`);
      const v = patch[key];
      values.push(v === undefined ? null : (v as string | number | null));
    }
  };
  setIf('event_id', 'event_id');
  if (patch.company_name !== undefined) { fields.push('company_name = ?'); values.push(patch.company_name.trim()); }
  setIf('contact_name', 'contact_name');
  setIf('role', 'role');
  setIf('phone', 'phone');
  setIf('email', 'email');
  setIf('website', 'website');
  setIf('what_they_sell', 'what_they_sell');
  setIf('notes', 'notes');
  setIf('interest_level', 'interest_level');
  setIf('date_met', 'date_met');
  setIf('follow_up_date', 'follow_up_date');
  setIf('follow_up_notes', 'follow_up_notes');
  fields.push("updated_at = datetime('now')");
  if (fields.length === 1) return;
  values.push(id);
  await db.runAsync(`UPDATE contacts SET ${fields.join(', ')} WHERE id = ?;`, ...values);
}


export async function markComplete(id: number, value: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE contacts SET marked_complete = ?, updated_at = datetime('now') WHERE id = ?;",
    value ? 1 : 0,
    id,
  );
}

export type FollowUpRow = {
  id: number;
  company_name: string;
  contact_name: string | null;
  role: string | null;
  follow_up_date: string;
  follow_up_notes: string | null;
  follow_up_done: number;
  event_name: string | null;
};

export async function listFollowUps(): Promise<FollowUpRow[]> {
  const db = await getDb();
  return db.getAllAsync<FollowUpRow>(
    `SELECT c.id, c.company_name, c.contact_name, c.role,
            c.follow_up_date, c.follow_up_notes, c.follow_up_done,
            e.name AS event_name
       FROM contacts c
       LEFT JOIN events e ON e.id = c.event_id
       WHERE c.follow_up_date IS NOT NULL
       ORDER BY c.follow_up_done ASC, c.follow_up_date ASC;`,
  );
}

export async function setFollowUpDone(id: number, done: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE contacts SET follow_up_done = ?, updated_at = datetime('now') WHERE id = ?;",
    done ? 1 : 0,
    id,
  );
}

export async function deleteContact(id: number): Promise<void> {
  await deletePhotoFilesForContact(id);
  const db = await getDb();
  await db.runAsync('DELETE FROM contacts WHERE id = ?;', id);
}

export function missingFields(c: Pick<ContactRow, 'contact_name' | 'email' | 'phone' | 'interest_level'>): string[] {
  const missing: string[] = [];
  if (!c.contact_name || c.contact_name.trim() === '') missing.push('name');
  if ((!c.email || c.email.trim() === '') && (!c.phone || c.phone.trim() === '')) missing.push('email or phone');
  if (!c.interest_level) missing.push('interest');
  return missing;
}
