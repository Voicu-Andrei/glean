import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getDb } from '../db';
import type { EventRow } from '../db/events';
import { getActiveEvent } from '../db/events';
import type { ContactListItem } from '../db/contacts';

export type DashboardStats = {
  totalContacts: number;
  hotCount: number;
  warmCount: number;
  coldCount: number;
  thisWeek: number;
  draftCount: number;
  activeEvent: EventRow | null;
  activeEventContacts: number;
  nextFollowUp: {
    id: number;
    company_name: string;
    contact_name: string | null;
    follow_up_date: string;
    follow_up_notes: string | null;
  } | null;
  recent: ContactListItem[];
};

const EMPTY: DashboardStats = {
  totalContacts: 0,
  hotCount: 0,
  warmCount: 0,
  coldCount: 0,
  thisWeek: 0,
  draftCount: 0,
  activeEvent: null,
  activeEventContacts: 0,
  nextFollowUp: null,
  recent: [],
};

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDb();
      const totals = await db.getFirstAsync<{
        total: number; hot: number; warm: number; cold: number; this_week: number; drafts: number;
      }>(
        `SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN interest_level='hot' THEN 1 ELSE 0 END) AS hot,
          SUM(CASE WHEN interest_level='warm' THEN 1 ELSE 0 END) AS warm,
          SUM(CASE WHEN interest_level='cold' THEN 1 ELSE 0 END) AS cold,
          SUM(CASE WHEN date(date_met) >= date('now', '-7 days') THEN 1 ELSE 0 END) AS this_week,
          SUM(CASE WHEN is_complete = 0 THEN 1 ELSE 0 END) AS drafts
         FROM contacts_with_completeness;`
      );

      const activeEvent = await getActiveEvent();
      const activeEventContacts = activeEvent
        ? (await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM contacts WHERE event_id = ?;', activeEvent.id))?.n ?? 0
        : 0;

      const nextFollowUp = await db.getFirstAsync<{
        id: number; company_name: string; contact_name: string | null;
        follow_up_date: string; follow_up_notes: string | null;
      }>(
        `SELECT id, company_name, contact_name, follow_up_date, follow_up_notes
         FROM contacts
         WHERE follow_up_date IS NOT NULL
           AND follow_up_done = 0
           AND date(follow_up_date) >= date('now')
         ORDER BY follow_up_date ASC LIMIT 1;`,
      );

      const recent = await db.getAllAsync<ContactListItem>(
        `SELECT c.*, e.name AS event_name,
          (SELECT GROUP_CONCAT(t.name, '|') FROM contact_tags ct
           JOIN tags t ON t.id = ct.tag_id WHERE ct.contact_id = c.id) AS tag_names
         FROM contacts_with_completeness c
         LEFT JOIN events e ON e.id = c.event_id
         ORDER BY c.created_at DESC LIMIT 3;`,
      );

      setStats({
        totalContacts: totals?.total ?? 0,
        hotCount: totals?.hot ?? 0,
        warmCount: totals?.warm ?? 0,
        coldCount: totals?.cold ?? 0,
        thisWeek: totals?.this_week ?? 0,
        draftCount: totals?.drafts ?? 0,
        activeEvent,
        activeEventContacts,
        nextFollowUp: nextFollowUp ?? null,
        recent,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  return { stats, loading, reload };
}
