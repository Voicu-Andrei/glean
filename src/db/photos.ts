import * as FileSystem from 'expo-file-system/legacy';
import { getDb } from './index';

export type PhotoType = 'business_card' | 'booth' | 'additional';

export type PhotoRow = {
  id: number;
  contact_id: number;
  photo_type: PhotoType;
  file_path: string;
  label: string | null;
  sort_order: number;
  created_at: string;
};

const PHOTOS_SUBDIR = 'photos';

function photosDir(): string {
  return `${FileSystem.documentDirectory}${PHOTOS_SUBDIR}`;
}

async function ensurePhotosDir(): Promise<void> {
  const dir = photosDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

export function fullPathFor(relativeFilePath: string): string {
  if (relativeFilePath.startsWith('file://') || relativeFilePath.startsWith('/')) {
    return relativeFilePath;
  }
  return `${FileSystem.documentDirectory}${relativeFilePath}`;
}

export async function listPhotos(contactId: number): Promise<PhotoRow[]> {
  const db = await getDb();
  return db.getAllAsync<PhotoRow>(
    'SELECT * FROM photos WHERE contact_id = ? ORDER BY photo_type, sort_order, id;',
    contactId,
  );
}

export async function addPhoto(
  contactId: number,
  type: PhotoType,
  sourceUri: string,
  label: string | null = null,
): Promise<PhotoRow> {
  await ensurePhotosDir();
  const ext = sourceUri.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = /^[a-z0-9]{1,5}$/.test(ext) ? ext : 'jpg';
  const filename = `${contactId}_${type}_${Date.now()}.${safeExt}`;
  const relPath = `${PHOTOS_SUBDIR}/${filename}`;
  const absPath = `${FileSystem.documentDirectory}${relPath}`;
  await FileSystem.copyAsync({ from: sourceUri, to: absPath });

  const db = await getDb();
  const res = await db.runAsync(
    `INSERT INTO photos (contact_id, photo_type, file_path, label, sort_order)
     VALUES (?, ?, ?, ?, COALESCE((SELECT MAX(sort_order) + 1 FROM photos WHERE contact_id = ? AND photo_type = ?), 0));`,
    contactId,
    type,
    relPath,
    label,
    contactId,
    type,
  );
  return {
    id: res.lastInsertRowId as number,
    contact_id: contactId,
    photo_type: type,
    file_path: relPath,
    label,
    sort_order: 0,
    created_at: new Date().toISOString(),
  };
}

export async function updatePhotoLabel(id: number, label: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE photos SET label = ? WHERE id = ?;', label, id);
}

export async function deletePhoto(id: number): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ file_path: string }>(
    'SELECT file_path FROM photos WHERE id = ?;',
    id,
  );
  if (row) {
    await FileSystem.deleteAsync(fullPathFor(row.file_path), { idempotent: true });
  }
  await db.runAsync('DELETE FROM photos WHERE id = ?;', id);
}

export async function deletePhotoFilesForContact(contactId: number): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ file_path: string }>(
    'SELECT file_path FROM photos WHERE contact_id = ?;',
    contactId,
  );
  for (const r of rows) {
    await FileSystem.deleteAsync(fullPathFor(r.file_path), { idempotent: true });
  }
}
