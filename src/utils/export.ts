import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';
import { getDb } from '../db';

type CsvRow = {
  id: number;
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
  follow_up_notes: string | null;
  follow_up_done: number;
  marked_complete: number;
  created_at: string;
  updated_at: string;
};

type PhotoExport = { id: number; contact_id: number; photo_type: string; file_path: string; label: string | null };

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
  'Follow-up Notes',
  'Follow-up Done',
  'Marked Complete',
  'Photos',
  'Created At',
  'Updated At',
];

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowToCsv(r: CsvRow, photoCount: number): string {
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
    r.follow_up_notes,
    r.follow_up_done ? 'Yes' : 'No',
    r.marked_complete ? 'Yes' : 'No',
    photoCount,
    r.created_at,
    r.updated_at,
  ].map(escapeCsv).join(',');
}

async function fetchRows(eventId: number | null): Promise<CsvRow[]> {
  const db = await getDb();
  const where = eventId !== null ? 'WHERE c.event_id = ?' : '';
  const params = eventId !== null ? [eventId] : [];
  return db.getAllAsync<CsvRow>(
    `SELECT c.id, c.company_name, c.contact_name, c.role, c.phone, c.email, c.website,
            c.what_they_sell, c.notes, c.interest_level, c.date_met,
            c.follow_up_date, c.follow_up_notes, c.follow_up_done, c.marked_complete,
            c.created_at, c.updated_at,
            e.name AS event_name,
            (SELECT GROUP_CONCAT(t.name, '|') FROM contact_tags ct
             JOIN tags t ON t.id = ct.tag_id WHERE ct.contact_id = c.id) AS tag_names
     FROM contacts c LEFT JOIN events e ON e.id = c.event_id
     ${where}
     ORDER BY c.date_met DESC, c.id DESC;`,
    ...params,
  );
}

async function fetchPhotos(contactIds: number[]): Promise<PhotoExport[]> {
  if (contactIds.length === 0) return [];
  const db = await getDb();
  const placeholders = contactIds.map(() => '?').join(',');
  return db.getAllAsync<PhotoExport>(
    `SELECT id, contact_id, photo_type, file_path, label
       FROM photos WHERE contact_id IN (${placeholders})
       ORDER BY contact_id, photo_type, sort_order;`,
    ...contactIds,
  );
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9-_]+/g, '_').slice(0, 40) || 'glean';
}

function fullPathFor(rel: string): string {
  if (rel.startsWith('file://') || rel.startsWith('/')) return rel;
  return `${FileSystem.documentDirectory}${rel}`;
}

async function checkSharing(): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
}

/** CSV-only export (lightweight). */
export async function exportContactsCsv(opts: { eventId?: number | null; eventName?: string }): Promise<void> {
  const eventId = opts.eventId ?? null;
  const rows = await fetchRows(eventId);
  if (rows.length === 0) throw new Error('No contacts to export.');
  const photos = await fetchPhotos(rows.map((r) => r.id));
  const photoCount = new Map<number, number>();
  photos.forEach((p) => photoCount.set(p.contact_id, (photoCount.get(p.contact_id) ?? 0) + 1));

  // RFC 4180 line endings + UTF-8 BOM so non-ASCII (German umlauts etc) opens
  // correctly in Excel on Windows.
  const csv = '﻿' + [HEADERS.join(','), ...rows.map((r) => rowToCsv(r, photoCount.get(r.id) ?? 0))].join('\r\n');
  const base = opts.eventName ? sanitizeFilename(opts.eventName) : 'all_contacts';
  const stamp = new Date().toISOString().slice(0, 10);
  const fileUri = `${FileSystem.cacheDirectory}glean_${base}_${stamp}.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csv);
  await checkSharing();
  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Glean contacts (CSV)',
    UTI: 'public.comma-separated-values-text',
  });
}

/**
 * Full archive export: a zip containing:
 *   - contacts.csv (all fields)
 *   - photos/<id>_<type>_<idx>.<ext> for every attached photo
 *   - photo_index.csv mapping each photo to its contact
 */
export async function exportContactsZip(opts: { eventId?: number | null; eventName?: string }): Promise<void> {
  const eventId = opts.eventId ?? null;
  const rows = await fetchRows(eventId);
  if (rows.length === 0) throw new Error('No contacts to export.');
  const photos = await fetchPhotos(rows.map((r) => r.id));
  const photoCount = new Map<number, number>();
  photos.forEach((p) => photoCount.set(p.contact_id, (photoCount.get(p.contact_id) ?? 0) + 1));

  // Estimate total photo bytes BEFORE base64-encoding anything. base64 is
  // ~1.33x the raw size and JSZip holds the whole archive in memory before
  // we write it out. Anything north of 40 MB raw is likely to OOM the app.
  let totalBytes = 0;
  for (const p of photos) {
    try {
      const info = await FileSystem.getInfoAsync(fullPathFor(p.file_path));
      if (info.exists && 'size' in info && typeof info.size === 'number') totalBytes += info.size;
    } catch {
      // skip unreadable
    }
  }
  const MAX_ZIP_BYTES = 40 * 1024 * 1024; // 40 MB
  if (totalBytes > MAX_ZIP_BYTES) {
    const mb = Math.round(totalBytes / 1024 / 1024);
    throw new Error(
      `Archive too large (~${mb} MB of photos). Export per-event instead, or use 'CSV only' to skip photos.`,
    );
  }

  const zip = new JSZip();
  // RFC 4180 line endings + UTF-8 BOM so non-ASCII (German umlauts etc) opens
  // correctly in Excel on Windows.
  const csv = '﻿' + [HEADERS.join(','), ...rows.map((r) => rowToCsv(r, photoCount.get(r.id) ?? 0))].join('\r\n');
  zip.file('contacts.csv', csv);

  const photoIndex: string[] = ['Filename,Contact ID,Company,Contact Name,Type,Label'];
  const photosFolder = zip.folder('photos');

  for (const p of photos) {
    const abs = fullPathFor(p.file_path);
    try {
      const info = await FileSystem.getInfoAsync(abs);
      if (!info.exists) continue;
      const ext = p.file_path.split('.').pop()?.toLowerCase() || 'jpg';
      const safeExt = /^[a-z0-9]{1,5}$/.test(ext) ? ext : 'jpg';
      const fname = `${p.contact_id}_${p.photo_type}_${p.id}.${safeExt}`;
      const b64 = await FileSystem.readAsStringAsync(abs, { encoding: FileSystem.EncodingType.Base64 });
      photosFolder?.file(fname, b64, { base64: true });
      const c = rows.find((r) => r.id === p.contact_id);
      photoIndex.push(
        [
          fname,
          p.contact_id,
          c?.company_name ?? '',
          c?.contact_name ?? '',
          p.photo_type,
          p.label ?? '',
        ].map(escapeCsv).join(','),
      );
    } catch {
      // skip unreadable files
    }
  }

  if (photoIndex.length > 1) zip.file('photo_index.csv', photoIndex.join('\n'));

  const zipB64 = await zip.generateAsync({ type: 'base64', compression: 'DEFLATE' });
  const base = opts.eventName ? sanitizeFilename(opts.eventName) : 'all_contacts';
  const stamp = new Date().toISOString().slice(0, 10);
  const zipUri = `${FileSystem.cacheDirectory}glean_${base}_${stamp}.zip`;
  await FileSystem.writeAsStringAsync(zipUri, zipB64, { encoding: FileSystem.EncodingType.Base64 });

  await checkSharing();
  await Sharing.shareAsync(zipUri, {
    mimeType: 'application/zip',
    dialogTitle: 'Export Glean archive (CSV + photos)',
    UTI: 'public.zip-archive',
  });
}
