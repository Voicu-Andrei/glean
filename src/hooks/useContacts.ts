import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listContacts, getIncompleteCount, type ContactFilters, type ContactListItem } from '../db/contacts';

export function useContacts(filters: ContactFilters) {
  const [data, setData] = useState<ContactListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const key = JSON.stringify(filters);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await listContacts(filters));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useFocusEffect(useCallback(() => {
    void reload();
  }, [reload]));

  return { data, loading, reload };
}

export function useIncompleteCount() {
  const [count, setCount] = useState(0);

  const reload = useCallback(async () => {
    setCount(await getIncompleteCount());
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useFocusEffect(useCallback(() => {
    void reload();
  }, [reload]));

  return { count, reload };
}
