import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listEvents, type EventWithCount } from '../db/events';

export function useEvents() {
  const [data, setData] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await listEvents());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useFocusEffect(useCallback(() => {
    void reload();
  }, [reload]));

  return { data, loading, reload };
}
