import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listContacts, getIncompleteCount, type ContactFilters, type ContactListItem } from '../db/contacts';

export function useContacts(filters: ContactFilters) {
  const [data, setData] = useState<ContactListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const key = JSON.stringify(filters);
  const reload = useCallback(async () => {
    if (mountedRef.current) setLoading(true);
    try {
      const next = await listContacts(filters);
      if (mountedRef.current) setData(next);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { void reload(); }, [reload]);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  return { data, loading, reload };
}

export function useIncompleteCount() {
  const [count, setCount] = useState(0);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const reload = useCallback(async () => {
    const n = await getIncompleteCount();
    if (mountedRef.current) setCount(n);
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  return { count, reload };
}
