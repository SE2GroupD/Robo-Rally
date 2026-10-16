import { useEffect, useState } from 'react';
import { fetchMaps } from '../api/gameApi';
import type { MapLayoutData } from '../types/MapLayout';

export function useMapCatalog() {
  const [maps, setMaps] = useState<MapLayoutData[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(() => ({ fetch: fetchMaps }));

  useEffect(() => {
    const controller = new AbortController();

    void request
      .fetch(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setMaps(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('Could not load maps. Please try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [request]);

  return {
    maps,
    error,
    loading,
    retry: () => {
      setLoading(true);
      setError('');
      setRequest({ fetch: fetchMaps });
    },
  };
}
