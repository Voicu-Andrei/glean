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
  // Single atomic write so we can't race the partial unique index even if
  // autoBalanceActiveEvent is firing concurrently from a useFocusEffect.
  if (id === null) {
    await db.runAsync(
      "UPDATE events SET is_active = 0, updated_at = datetime('now') WHERE is_active = 1;",
    );
    return;
  }
  await db.runAsync(
    `UPDATE events
       SET is_active = CASE WHEN id = ? THEN 1 ELSE 0 END,
           updated_at = datetime('now')
     WHERE is_active = 1 OR id = ?;`,
    id, id,
  );
}

export async function deleteEvent(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM events WHERE id = ?;', id);
}

/**
 * Auto-balance the active-event flag based on the wall clock:
 *  - if the currently active event's end_date has passed, deactivate it
 *  - if no event is active and an event is currently in progress (start <= now <= end),
 *    activate it (most recently started one wins on overlap)
 * Returns whether anything changed.
 */
export async function autoBalanceActiveEvent(): Promise<boolean> {
  const db = await getDb();
  let changed = false;

  const result = await db.runAsync(
    `UPDATE events
       SET is_active = 0, updated_at = datetime('now')
       WHERE is_active = 1
         AND end_date IS NOT NULL
         AND datetime(end_date) < datetime('now');`,
  );
  if ((result.changes ?? 0) > 0) changed = true;

  const hasActive = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM events WHERE is_active = 1;',
  );
  if (hasActive && hasActive.n === 0) {
    const candidate = await db.getFirstAsync<{ id: number }>(
      `SELECT id FROM events
         WHERE datetime(start_date) <= datetime('now')
           AND (end_date IS NULL OR datetime(end_date) >= datetime('now'))
         ORDER BY start_date DESC
         LIMIT 1;`,
    );
    if (candidate) {
      await db.runAsync('UPDATE events SET is_active = 1, updated_at = datetime(\'now\') WHERE id = ?;', candidate.id);
      changed = true;
    }
  }
  return changed;
}
