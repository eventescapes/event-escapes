import { useState } from 'react';
import { fetchHotels } from '@/lib/api';
import type { HotelsResponse } from '@/types/hotels';

export function useHotelSearch() {
  const [data, setData] = useState<HotelsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(params: Record<string, string | number>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchHotels(params);
      setData(res);
    } catch (e: any) {
      setError(e.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, search };
}
