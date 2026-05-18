import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getDb } from '../db';

type CsvRow = {
  company_name: string;
  contact_name: string | null;
  role: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  what_they_sell: string | null;
  notes: string | null;
  interest_level: string | null;
  event_name: string | null;
  date_met: string;
  tag_names: string | null;
  follow_up_date: string | null;
  follow_up_done: number;
};

const HEADERS = [
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
  'Follow-up Done',
];

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowToCsv(r: CsvRow): string {
  const tags = (r.tag_names ?? '').split('|').filter(Boolean).join(';');
  return [
    r.company_name,
    r.contact_name,
    r.role,
    r.phone,
    r.email,
    r.website,
    r.what_they_sell,
    r.notes,
    r.interest_level,
    r.event_name,
    r.date_met,
    tags,
    r.follow_up_date,
    r.follow_up_done ? 'Yes' : 'No',
  ].map(escapeCsv).join(',');
}

async function fetchRows(eventId: number | null): Promise<CsvRow[]> {
  const db = await getDb();
  const where = eventId !== null ? 'WHERE c.event_id = ?' : '';
  const params = eventId !== null ? [eventId] : [];
  return db.getAllAsync<CsvRow>(
    `SELECT c.company_name, c.contact_name, c.role, c.phone, c.email, c.website,
            c.what_they_sell, c.notes, c.interest_level, c.date_met,
            c.follow_up_date, c.follow_up_done,
            e.name AS event_name,
            (SELECT GROUP_CONCAT(t.name, '|') FROM contact_tags ct
             JOIN tags t ON t.id = ct.tag_id WHERE ct.contact_id = c.id) AS tag_names
     FROM contacts c LEFT JOIN events e ON e.id = c.event_id
     ${where}
     ORDER BY c.date_met DESC, c.id DESC;`,
    ...params,
  );
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9-_]+/g, '_').slice(0, 40) || 'glean';
}

export async function exportContactsCsv(opts: { eventId?: number | null; eventName?: string }): Promise<void> {
  const eventId = opts.eventId ?? null;
  const rows = await fetchRows(eventId);
  if (rows.length === 0) {
    throw new Error('No contacts to export.');
  }
  const csv = [HEADERS.join(','), ...rows.map(rowToCsv)].join('\n');
  const base = opts.eventName ? sanitizeFilename(opts.eventName) : 'all_contacts';
  const stamp = new Date().toISOString().slice(0, 10);
  const fileUri = `${FileSystem.cacheDirectory}glean_${base}_${stamp}.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csv);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Glean contacts',
    UTI: 'public.comma-separated-values-text',
  });
}
