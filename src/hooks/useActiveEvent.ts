import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getActiveEvent, type EventRow } from '../db/events';

export function useActiveEvent() {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setEvent(await getActiveEvent());
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

  return { event, loading, reload };
}
