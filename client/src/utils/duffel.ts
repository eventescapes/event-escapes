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
  arrival_time?: {
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

// NEW: Edge Function Request Types
export interface EdgeFunctionSearchRequest {
  tripType: 'one-way' | 'return' | 'multi-city';
  slices: Array<{
    origin: string;
    destination: string;
    departureDate: string;
    departureTime?: { from?: string; to?: string };
    arrivalTime?: { from?: string; to?: string };
  }>;
  passengers: {
    adults: number;
    children?: number;
    infants?: number;
  };
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
  maxConnections?: 0 | 1 | 2;
  directOnly?: boolean;
  after?: string; // Pagination cursor
}

// NEW: Edge Function Response Types
export interface EdgeFunctionSearchResponse {
  success: boolean;
  trip_type: string;
  offers: Array<{
    id: string;
    slices: Array<{
      slice_index: number;
      origin: string;
      destination: string;
      departure_time: string;
      arrival_time: string;
      duration: string;
      segments: Array<{
        airline: string;
        airline_code: string;
        flight_number: string;
        aircraft: string;
        origin: string;
        destination: string;
        departing_at: string;
        arriving_at: string;
        duration: string;
      }>;
      stops: number;
    }>;
    total_amount: number;
    total_currency: string;
    expires_at: string;
    cabin_class: string;
    available_services: any[];
    passengers?: any[];
    passenger_identity_documents_required?: boolean;
    owner?: any;
    conditions?: any;
  }>;
  after?: string; // Pagination cursor
  total_offers: number;
  search_params: {
    cabin_class: string;
    max_connections: number;
    passengers: {
      adults: number;
      children?: number;
      infants?: number;
    };
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

// UPDATED: Flight Search - Routes through Supabase Edge Function with NEW format
export async function searchFlights(request: DuffelOfferRequest): Promise<EdgeFunctionSearchResponse> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  const url = `${supabaseUrl}/functions/v1/flights-search`;
  const started = Date.now();

  console.log("[Supabase] POST", url);
  console.log("[Supabase] Flight search request (old format):", JSON.stringify(request, null, 2));

  // Determine trip type based on number of slices
  let tripType: 'one-way' | 'return' | 'multi-city';
  if (request.slices.length === 1) {
    tripType = 'one-way';
  } else if (request.slices.length === 2) {
    // Check if it's a proper return trip (destination matches origin)
    const isReturn = 
      request.slices[0].destination === request.slices[1].origin &&
      request.slices[0].origin === request.slices[1].destination;
    tripType = isReturn ? 'return' : 'multi-city';
  } else {
    tripType = 'multi-city';
  }

  // Count passenger types
  const adults = request.passengers.filter(p => p.type === 'adult').length;
  const children = request.passengers.filter(p => p.type === 'child').length;
  const infants = request.passengers.filter(p => p.type === 'infant_without_seat').length;

  // Transform to NEW Edge Function format
  const payload: EdgeFunctionSearchRequest = {
    tripType,
    slices: request.slices.map(slice => ({
      origin: slice.origin,
      destination: slice.destination,
      departureDate: slice.departure_date,
      ...(slice.departure_time && { departureTime: slice.departure_time }),
      ...(slice.arrival_time && { arrivalTime: slice.arrival_time })
    })),
    passengers: {
      adults,
      ...(children > 0 && { children }),
      ...(infants > 0 && { infants })
    },
    cabinClass: request.cabin_class || 'economy',
    maxConnections: Math.min(Math.max(request.max_connections ?? 1, 0), 2) as 0 | 1 | 2
  };

  console.log("[Supabase] Transformed payload (NEW format):", JSON.stringify(payload, null, 2));

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

  const json: EdgeFunctionSearchResponse = await res.json();

  console.log("[Supabase] Flight search response (NEW format):", {
    success: json.success,
    tripType: json.trip_type,
    totalOffers: json.total_offers,
    offersCount: json.offers?.length || 0
  });

  return json;
}

// Helper functions for creating flight search requests (UNCHANGED - still work)
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
    max_connections: 1
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
    max_connections: 1
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
    max_connections: 1
  };
}