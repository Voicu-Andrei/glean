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
  /** 1-indexed day of the active event (null if no event or before start). */
  dayOfEvent: number | null;
  /** Inclusive day count of the active event. 1 if same-day. */
  totalDays: number | null;
  /** Captures grouped by hour for the active event's current day. 24 entries. */
  hourlyCaptures: number[];
  nextFollowUp: {
    id: number;
    company_name: string;
    contact_name: string | null;
    follow_up_date: string;
    follow_up_notes: string | null;
  } | null;
  recent: ContactListItem[];
  /** Top hot contacts (most recently captured) for the editorial "hot leads" rail. */
  topHot: ContactListItem[];
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
  dayOfEvent: null,
  totalDays: null,
  hourlyCaptures: new Array(24).fill(0),
  nextFollowUp: null,
  recent: [],
  topHot: [],
};

function diffDaysInclusive(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1);
}

function dayIndex(start: string): number | null {
  const s = new Date(start);
  const now = new Date();
  s.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((now.getTime() - s.getTime()) / 86_400_000);
  if (diff < 0) return null;
  return diff + 1;
}

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

      const totalDays = activeEvent && activeEvent.start_date
        ? diffDaysInclusive(activeEvent.start_date, activeEvent.end_date ?? activeEvent.start_date)
        : null;
      const dayOfEvent = activeEvent && activeEvent.start_date
        ? Math.min(totalDays ?? 1, dayIndex(activeEvent.start_date) ?? 1)
        : null;

      const hourlyCaptures = new Array(24).fill(0);
      if (activeEvent) {
        const rows = await db.getAllAsync<{ hr: number; n: number }>(
          `SELECT CAST(strftime('%H', date_met) AS INTEGER) AS hr, COUNT(*) AS n
           FROM contacts
           WHERE event_id = ?
             AND date(date_met) = date('now', 'localtime')
           GROUP BY hr;`,
          activeEvent.id,
        );
        rows.forEach((r) => { if (r.hr >= 0 && r.hr < 24) hourlyCaptures[r.hr] = r.n; });
      }

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

      const topHot = await db.getAllAsync<ContactListItem>(
        `SELECT c.*, e.name AS event_name,
          (SELECT GROUP_CONCAT(t.name, '|') FROM contact_tags ct
           JOIN tags t ON t.id = ct.tag_id WHERE ct.contact_id = c.id) AS tag_names
         FROM contacts_with_completeness c
         LEFT JOIN events e ON e.id = c.event_id
         WHERE c.interest_level = 'hot'
         ORDER BY c.created_at DESC LIMIT 5;`,
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
        dayOfEvent,
        totalDays,
        hourlyCaptures,
        nextFollowUp: nextFollowUp ?? null,
        recent,
        topHot,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  return { stats, loading, reload };
}
