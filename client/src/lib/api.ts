import { HotelsResponse } from '@/types/hotels';

export const EDGE = import.meta.env.VITE_EDGE_URL;

export async function fetchHotels(params: Record<string, string | number>): Promise<HotelsResponse> {
  const q = new URLSearchParams(params as any).toString();
  const res = await fetch(`${EDGE}/hotelbeds-hotels?${q}`);
  if (!res.ok) throw new Error(`HB ${res.status}`);
  return res.json();
}
