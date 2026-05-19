import { getDb } from './index';

export type EventRow = {
  id: number;
  name: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type EventWithCount = EventRow & { contact_count: number };

export type NewEventInput = {
  name: string;
  location?: string | null;
  start_date: string;
  end_date?: string | null;
  notes?: string | null;
  set_active?: boolean;
};

export async function listEvents(): Promise<EventWithCount[]> {
  const db = await getDb();
  return db.getAllAsync<EventWithCount>(`
    SELECT e.*,
      (SELECT COUNT(*) FROM contacts c WHERE c.event_id = e.id) AS contact_count
    FROM events e
    ORDER BY e.is_active DESC, e.start_date DESC
  `);
}

export async function getEvent(id: number): Promise<EventRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<EventRow>('SELECT * FROM events WHERE id = ?;', id);
  return row ?? null;
}

export async function getActiveEvent(): Promise<EventRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<EventRow>('SELECT * FROM events WHERE is_active = 1 LIMIT 1;');
  return row ?? null;
}

export async function createEvent(input: NewEventInput): Promise<number> {
  const db = await getDb();
  let newId = 0;
  await db.withTransactionAsync(async () => {
    if (input.set_active) {
      await db.runAsync('UPDATE events SET is_active = 0 WHERE is_active = 1;');
    }
    const res = await db.runAsync(
      `INSERT INTO events (name, location, start_date, end_date, notes, is_active)
       VALUES (?, ?, ?, ?, ?, ?);`,
      input.name,
      input.location ?? null,
      input.start_date,
      input.end_date ?? null,
      input.notes ?? null,
      input.set_active ? 1 : 0,
    );
    newId = res.lastInsertRowId as number;
  });
  return newId;
}

export async function updateEvent(id: number, patch: Partial<NewEventInput>): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  if (patch.name !== undefined) { fields.push('name = ?'); values.push(patch.name); }
  if (patch.location !== undefined) { fields.push('location = ?'); values.push(patch.location ?? null); }
  if (patch.start_date !== undefined) { fields.push('start_date = ?'); values.push(patch.start_date); }
  if (patch.end_date !== undefined) { fields.push('end_date = ?'); values.push(patch.end_date ?? null); }
  if (patch.notes !== undefined) { fields.push('notes = ?'); values.push(patch.notes ?? null); }
  fields.push("updated_at = datetime('now')");
  if (fields.length === 1) return;
  values.push(id);
  await db.runAsync(`UPDATE events SET ${fields.join(', ')} WHERE id = ?;`, ...values);
}

export async function setActiveEvent(id: number | null): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE events SET is_active = 0 WHERE is_active = 1;');
    if (id !== null) {
      await db.runAsync('UPDATE events SET is_active = 1 WHERE id = ?;', id);
    }
  });
}

export async function deleteEvent(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM events WHERE id = ?;', id);
}
