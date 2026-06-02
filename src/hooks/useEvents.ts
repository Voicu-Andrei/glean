import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listEvents, type EventWithCount } from '../db/events';

export function useEvents() {
  const [data, setData] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const reload = useCallback(async () => {
    if (mountedRef.current) setLoading(true);
    try {
      const next = await listEvents();
      if (mountedRef.current) setData(next);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  return { data, loading, reload };
}
