export const HOTELS_URL = import.meta.env.VITE_HOTELS_URL!;

export type HotelCard = {
  hotelId: number | string;
  name: string;
  stars?: number;
  thumbnail?: string | null;
  locality?: string;
  price: number;
  currency: string;
  board?: string;
  refundable?: boolean;
  paymentType?: string;
  rateKey: string;
};

export type HotelsResponse = { total: number; cards: HotelCard[] };

function qs(params: Record<string, string | number>) {
  return new URLSearchParams(params as any).toString();
}

export async function fetchHotels(params: Record<string, string | number>): Promise<HotelsResponse> {
  const url = `${HOTELS_URL}?${qs(params)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Unexpected response: ${text.slice(0, 120)}`);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Hotelbeds ${res.status}`);
  }
  return res.json();
}
