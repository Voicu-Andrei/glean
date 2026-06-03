import * as FileSystem from 'expo-file-system/legacy';
import { getDb } from '../db';
import { createContact } from '../db/contacts';
import type { InterestLevel } from '../theme';

export type ImportResult = {
  contacts: number;
  events: number;
  tags: number;
  skipped: number;
  errors: string[];
};

const KNOWN_HEADERS = [
  'Company',
  'Contact Name',
  'Role',
  'Phone',
  'Email',
  'Website',
  'Products/Services',
  'Notes',
  'Interest',
  'Event',
  'Date Met',
  'Tags',
  'Follow-up Date',
  'Follow-up Notes',
  'Follow-up Done',
  'Marked Complete',
  'Photos',
  'Created At',
  'Updated At',
] as const;

/**
 * Parse a CSV string into rows of values. Handles:
 *  - UTF-8 BOM at start
 *  - Excel sep=, directive on the first line
 *  - Quoted fields with embedded commas / newlines
 *  - Escaped quotes ("")
 *  - CRLF or LF line endings
 */
function parseCsv(text: string): string[][] {
  // Strip BOM
  let s = text.replace(/^﻿/, '');

  // Skip Excel sep= directive line if present.
  if (/^sep\s*=\s*,/i.test(s)) {
    const nl = s.indexOf('\n');
    s = nl >= 0 ? s.slice(nl + 1) : '';
  }

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field); field = '';
      } else if (ch === '\r') {
        // ignore — handled by \n
      } else if (ch === '\n') {
        row.push(field); field = '';
        rows.push(row); row = [];
      } else {
        field += ch;
      }
    }
  }
  // Trailing field
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Drop blank trailing rows
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

function parseInterest(raw: string | undefined): InterestLevel | undefined {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === 'hot' || v === 'warm' || v === 'cold') return v;
  return undefined;
}

function parseYesNo(raw: string | undefined): boolean {
  const v = (raw ?? '').trim().toLowerCase();
  return v === 'yes' || v === 'true' || v === '1';
}

function parseDate(raw: string | undefined): string | undefined {
  const v = (raw ?? '').trim();
  if (!v) return undefined;
  // Accept ISO 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM[:SS]'
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/.test(v)) return v;
  // Fallback: Date.parse → re-emit ISO date
  const d = new Date(v);
  if (!isNaN(d.getTime())) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  return undefined;
}

async function getOrCreateEvent(name: string): Promise<number | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM events WHERE name = ? COLLATE NOCASE LIMIT 1;',
    trimmed,
  );
  if (existing) return existing.id;
  const today = new Date().toISOString().slice(0, 10);
  const res = await db.runAsync(
    `INSERT INTO events (name, start_date) VALUES (?, ?);`,
    trimmed,
    today,
  );
  return res.lastInsertRowId as number;
}

async function getOrCreateTag(name: string): Promise<number | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM tags WHERE name = ? COLLATE NOCASE LIMIT 1;',
    trimmed,
  );
  if (existing) return existing.id;
  const res = await db.runAsync(
    'INSERT INTO tags (name) VALUES (?);',
    trimmed,
  );
  return res.lastInsertRowId as number;
}

async function attachTagsToContact(contactId: number, tagIds: number[]): Promise<void> {
  const db = await getDb();
  for (const tagId of tagIds) {
    await db.runAsync(
      'INSERT OR IGNORE INTO contact_tags (contact_id, tag_id) VALUES (?, ?);',
      contactId,
      tagId,
    );
  }
}

export async function importContactsCsv(fileUri: string): Promise<ImportResult> {
  const result: ImportResult = { contacts: 0, events: 0, tags: 0, skipped: 0, errors: [] };

  const raw = await FileSystem.readAsStringAsync(fileUri);
  const rows = parseCsv(raw);
  if (rows.length < 2) {
    throw new Error('CSV is empty or has no data rows.');
  }
  const headers = rows[0].map((h) => h.trim());
  const idx = (name: string) => headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());

  // Tolerate a CSV that's missing some columns — only Company is required.
  const iCompany = idx('Company');
  if (iCompany < 0) {
    throw new Error("CSV is missing the 'Company' column.");
  }
  const iContact = idx('Contact Name');
  const iRole = idx('Role');
  const iPhone = idx('Phone');
  const iEmail = idx('Email');
  const iWebsite = idx('Website');
  const iWhatSell = idx('Products/Services');
  const iNotes = idx('Notes');
  const iInterest = idx('Interest');
  const iEvent = idx('Event');
  const iDateMet = idx('Date Met');
  const iTags = idx('Tags');
  const iFollowUpDate = idx('Follow-up Date');
  const iFollowUpNotes = idx('Follow-up Notes');
  const iFollowUpDone = idx('Follow-up Done');

  const eventCache = new Map<string, number | null>();
  const tagCache = new Map<string, number | null>();
  const eventsCreated = new Set<string>();
  const tagsCreated = new Set<string>();

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const cell = (i: number): string | undefined => (i >= 0 ? cells[i] : undefined);
    const company = (cell(iCompany) ?? '').trim();
    if (!company) {
      result.skipped++;
      continue;
    }

    try {
      let eventId: number | null = null;
      const eventName = (cell(iEvent) ?? '').trim();
      if (eventName) {
        if (eventCache.has(eventName.toLowerCase())) {
          eventId = eventCache.get(eventName.toLowerCase())!;
        } else {
          const before = eventsCreated.size;
          // Check existence first so we count only newly created events
          const db = await getDb();
          const existing = await db.getFirstAsync<{ id: number }>(
            'SELECT id FROM events WHERE name = ? COLLATE NOCASE LIMIT 1;',
            eventName,
          );
          if (existing) {
            eventId = existing.id;
          } else {
            eventId = await getOrCreateEvent(eventName);
            eventsCreated.add(eventName.toLowerCase());
            if (eventsCreated.size > before) result.events++;
          }
          eventCache.set(eventName.toLowerCase(), eventId);
        }
      }

      const newId = await createContact({
        event_id: eventId,
        company_name: company,
        contact_name: (cell(iContact) ?? '').trim() || null,
        role: (cell(iRole) ?? '').trim() || null,
        phone: (cell(iPhone) ?? '').trim() || null,
        email: (cell(iEmail) ?? '').trim() || null,
        website: (cell(iWebsite) ?? '').trim() || null,
        what_they_sell: (cell(iWhatSell) ?? '').trim() || null,
        notes: (cell(iNotes) ?? '').trim() || null,
        interest_level: parseInterest(cell(iInterest)),
        date_met: parseDate(cell(iDateMet)),
        follow_up_date: parseDate(cell(iFollowUpDate)) ?? null,
        follow_up_notes: (cell(iFollowUpNotes) ?? '').trim() || null,
      });

      // Apply follow_up_done after createContact (no field on input).
      if (parseYesNo(cell(iFollowUpDone))) {
        const db = await getDb();
        await db.runAsync(
          "UPDATE contacts SET follow_up_done = 1, updated_at = datetime('now') WHERE id = ?;",
          newId,
        );
      }

      // Tags: split on ';' (Glean export format).
      const tagStr = (cell(iTags) ?? '').trim();
      if (tagStr) {
        const names = tagStr.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
        const tagIds: number[] = [];
        for (const name of names) {
          const key = name.toLowerCase();
          let tid = tagCache.get(key);
          if (tid === undefined) {
            const db = await getDb();
            const existing = await db.getFirstAsync<{ id: number }>(
              'SELECT id FROM tags WHERE name = ? COLLATE NOCASE LIMIT 1;',
              name,
            );
            if (existing) {
              tid = existing.id;
            } else {
              tid = await getOrCreateTag(name);
              tagsCreated.add(key);
              result.tags++;
            }
            tagCache.set(key, tid);
          }
          if (tid != null) tagIds.push(tid);
        }
        if (tagIds.length > 0) await attachTagsToContact(newId, tagIds);
      }

      result.contacts++;
    } catch (e) {
      result.skipped++;
      const msg = e instanceof Error ? e.message : String(e);
      if (result.errors.length < 5) result.errors.push(`Row ${r + 1} (${company}): ${msg}`);
    }
  }

  return result;
}

export const SUPPORTED_HEADERS = KNOWN_HEADERS;
