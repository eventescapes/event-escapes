// utils/duffel.ts
import { Env, assertSecretsReady } from "@/config/env";

export type SeatMapsResponse = any;

// Duffel API Flight Search Types
export interface DuffelSlice {
  origin: string;
  destination: string;
  departure_date: string;
  departure_time?: {
    from?: string;
    to?: string;
  };
}

export interface DuffelPassenger {
  type: 'adult' | 'child' | 'infant_without_seat';
  age?: number;
}

export interface DuffelOfferRequest {
  slices: DuffelSlice[];
  passengers: DuffelPassenger[];
  cabin_class?: 'first' | 'business' | 'premium_economy' | 'economy';
  return_offers?: boolean;
  max_connections?: number;
}

export interface DuffelOffer {
  id: string;
  live_mode: boolean;
  total_amount: string;
  total_currency: string;
  tax_amount?: string;
  tax_currency?: string;
  base_amount?: string;
  base_currency?: string;
  slices: DuffelOfferSlice[];
  passengers: any[];
  payment_requirements?: any;
  conditions?: any;
  allowed_passenger_identity_document_types?: string[];
}

export interface DuffelOfferSlice {
  id: string;
  origin: {
    id: string;
    type: 'airport' | 'city';
    name: string;
    iata_code: string;
    city_name?: string;
    country_name?: string;
  };
  destination: {
    id: string;
    type: 'airport' | 'city';
    name: string;
    iata_code: string;
    city_name?: string;
    country_name?: string;
  };
  departure_date: string;
  segments: DuffelSegment[];
  duration: string;
}

export interface DuffelSegment {
  id: string;
  origin: any;
  destination: any;
  departing_at: string;
  arriving_at: string;
  aircraft?: {
    id: string;
    name: string;
    iata_code?: string;
  };
  operating_carrier: {
    id: string;
    name: string;
    iata_code: string;
  };
  marketing_carrier: {
    id: string;
    name: string;
    iata_code: string;
  };
  flight_number: string;
  duration: string;
  distance?: string;
  stops?: any[];
}

export interface DuffelOfferRequestResponse {
  data: {
    id: string;
    live_mode: boolean;
    slices: DuffelSlice[];
    passengers: DuffelPassenger[];
    cabin_class?: string;
    offers: DuffelOffer[];
  };
}

// Get Supabase config from environment
function getSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment variables.');
  }

  return { supabaseUrl, supabaseAnonKey };
}

// Seat Maps - Routes through Supabase Edge Function
export async function fetchSeatMaps(offerId: string): Promise<SeatMapsResponse> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  const url = `${supabaseUrl}/functions/v1/seat-maps`;
  const started = Date.now();

  console.log("[Supabase] POST", url);
  console.log("[Supabase] Fetching seat maps for offer:", offerId);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ offerId }),
  });

  const dur = Date.now() - started;
  console.log("[Supabase] Seat maps status:", res.status, res.statusText, `(${dur}ms)`);

  if (!res.ok) {
    const text = await res.text();
    console.warn("[Supabase] Seat maps error:", text.slice(0, 600));
    throw new Error(`Seat maps failed: ${res.status}`);
  }

  const json = await res.json();
  console.log("[Supabase] Seat maps response keys:", Object.keys(json || {}));
  return json;
}

// Flight Search - Routes through Supabase Edge Function
export async function searchFlights(request: DuffelOfferRequest): Promise<any> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  const url = `${supabaseUrl}/functions/v1/flights-search`;
  const started = Date.now();

  console.log("[Supabase] POST", url);
  console.log("[Supabase] Flight search request:", JSON.stringify(request, null, 2));

  // Transform request to match your Supabase function's expected format
  const payload = {
    origin: request.slices[0].origin,
    destination: request.slices[0].destination,
    departureDate: request.slices[0].departure_date,
    returnDate: request.slices[1]?.departure_date,
    passengers: request.passengers.length,
    cabinClass: request.cabin_class || 'economy',
    maxConnections: request.max_connections || 2,
    returnOffers: request.return_offers !== false,
    departureTimeFrom: request.slices[0].departure_time?.from,
    departureTimeTo: request.slices[0].departure_time?.to
  };

  console.log("[Supabase] Transformed payload:", JSON.stringify(payload, null, 2));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const dur = Date.now() - started;
  console.log("[Supabase] Flight search status:", res.status, res.statusText, `(${dur}ms)`);

  if (!res.ok) {
    const text = await res.text();
    console.error("[Supabase] Flight search error:", text);
    throw new Error(`Flight search failed: ${res.status} - ${text}`);
  }

  const json = await res.json();
  console.log("[Supabase] Flight search response:", {
    outboundCount: json.outbound?.length || 0,
    returnCount: json.return?.length || 0,
    totalOffers: json.total_offers || 0
  });

  return json;
}

// Helper functions for creating flight search requests
export function createOneWaySearch(
  origin: string,
  destination: string,
  departureDate: string,
  passengers: number = 1,
  cabinClass: 'first' | 'business' | 'premium_economy' | 'economy' = 'economy'
): DuffelOfferRequest {
  return {
    slices: [
      {
        origin,
        destination,
        departure_date: departureDate
      }
    ],
    passengers: Array(passengers).fill({ type: 'adult' }),
    cabin_class: cabinClass,
    return_offers: true,
    max_connections: 2
  };
}

export function createReturnSearch(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  passengers: number = 1,
  cabinClass: 'first' | 'business' | 'premium_economy' | 'economy' = 'economy'
): DuffelOfferRequest {
  return {
    slices: [
      {
        origin,
        destination,
        departure_date: departureDate
      },
      {
        origin: destination,
        destination: origin,
        departure_date: returnDate
      }
    ],
    passengers: Array(passengers).fill({ type: 'adult' }),
    cabin_class: cabinClass,
    return_offers: true,
    max_connections: 2
  };
}

export function createMultiCitySearch(
  slices: Array<{ origin: string; destination: string; departure_date: string }>,
  passengers: number = 1,
  cabinClass: 'first' | 'business' | 'premium_economy' | 'economy' = 'economy'
): DuffelOfferRequest {
  return {
    slices,
    passengers: Array(passengers).fill({ type: 'adult' }),
    cabin_class: cabinClass,
    return_offers: true,
    max_connections: 2
  };
}