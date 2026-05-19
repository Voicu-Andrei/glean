import { getDb } from './index';

export type MyCard = {
  name: string;
  role: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  notes: string;
  photo_path: string | null;
};

const KEY = 'my_card';

const EMPTY: MyCard = {
  name: '',
  role: '',
  company: '',
  phone: '',
  email: '',
  website: '',
  notes: '',
  photo_path: null,
};

export async function getMyCard(): Promise<MyCard> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?;',
    KEY,
  );
  if (!row?.value) return EMPTY;
  try {
    const parsed = JSON.parse(row.value);
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

export async function saveMyCard(card: MyCard): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
    KEY,
    JSON.stringify(card),
  );
}

export function isMyCardFilled(card: MyCard): boolean {
  return Boolean(card.name.trim() || card.email.trim() || card.phone.trim());
}

/** vCard 3.0 format — universally importable into iOS Contacts. */
export function toVCard(card: MyCard): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  if (card.name.trim()) lines.push(`FN:${escapeVCard(card.name)}`);
  if (card.role.trim()) lines.push(`TITLE:${escapeVCard(card.role)}`);
  if (card.company.trim()) lines.push(`ORG:${escapeVCard(card.company)}`);
  if (card.email.trim()) lines.push(`EMAIL:${escapeVCard(card.email)}`);
  if (card.phone.trim()) lines.push(`TEL:${escapeVCard(card.phone)}`);
  if (card.website.trim()) lines.push(`URL:${escapeVCard(card.website)}`);
  if (card.notes.trim()) lines.push(`NOTE:${escapeVCard(card.notes)}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

function escapeVCard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

/** Loose parser for the same vCard format produced above. */
export function fromVCard(vcard: string): Partial<MyCard> {
  const out: Partial<MyCard> = {};
  for (const raw of vcard.split(/\r?\n/)) {
    const line = unescapeVCard(raw.trim());
    if (!line || line.startsWith('BEGIN:') || line.startsWith('VERSION:') || line.startsWith('END:')) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const field = line.slice(0, idx).split(';')[0].toUpperCase();
    const value = line.slice(idx + 1);
    if (field === 'FN') out.name = value;
    else if (field === 'TITLE') out.role = value;
    else if (field === 'ORG') out.company = value;
    else if (field === 'EMAIL') out.email = value;
    else if (field === 'TEL') out.phone = value;
    else if (field === 'URL') out.website = value;
    else if (field === 'NOTE') out.notes = value;
  }
  return out;
}

function unescapeVCard(s: string): string {
  return s.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}
