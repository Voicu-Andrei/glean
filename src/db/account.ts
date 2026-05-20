import { getDb } from './index';

export type AccountStats = {
  events: number;
  contacts: number;
  hot: number;
  tags: number;
};

export async function getAccountStats(): Promise<AccountStats> {
  const db = await getDb();
  const row = await db.getFirstAsync<AccountStats>(
    `SELECT
       (SELECT COUNT(*) FROM events) AS events,
       (SELECT COUNT(*) FROM contacts) AS contacts,
       (SELECT COUNT(*) FROM contacts WHERE interest_level = 'hot') AS hot,
       (SELECT COUNT(*) FROM tags) AS tags;`,
  );
  return row ?? { events: 0, contacts: 0, hot: 0, tags: 0 };
}

export type AccountType = 'customer' | 'business';

export type Account = {
  type: AccountType | null;
  name: string;
  email: string;
  // customer fields
  interests: string[]; // industries/topics they care about
  location: string;    // city / region
  // business fields
  company: string;
  industry: string;
  website: string;
  description: string; // what they sell
  created_at: string | null;
};

const KEY = 'account';

const EMPTY: Account = {
  type: null,
  name: '',
  email: '',
  interests: [],
  location: '',
  company: '',
  industry: '',
  website: '',
  description: '',
  created_at: null,
};

export async function getAccount(): Promise<Account> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?;',
    KEY,
  );
  if (!row?.value) return EMPTY;
  try {
    return { ...EMPTY, ...JSON.parse(row.value) };
  } catch {
    return EMPTY;
  }
}

export async function saveAccount(acct: Account): Promise<void> {
  const db = await getDb();
  const payload: Account = {
    ...acct,
    created_at: acct.created_at ?? new Date().toISOString(),
  };
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
    KEY,
    JSON.stringify(payload),
  );
}

export function isAccountComplete(a: Account): boolean {
  if (!a.type) return false;
  if (!a.name.trim() || !a.email.trim()) return false;
  if (a.type === 'business' && !a.company.trim()) return false;
  return true;
}

export const SUGGESTED_INDUSTRIES = [
  'B2B Software',
  'Hardware',
  'Food & Beverage',
  'Fashion',
  'Manufacturing',
  'Logistics',
  'Healthcare',
  'Finance',
  'Marketing',
  'Energy',
  'Retail',
  'Education',
  'Construction',
  'Hospitality',
] as const;
