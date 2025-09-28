// utils/duffel.ts
import { Env, assertSecretsReady } from "@/config/env";

assertSecretsReady(["DUFFEL_API_KEY"]);

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

// Legacy API route through backend (keep for now)
export async function fetchSeatMap(offerId: string) {
  const response = await fetch(`/api/seat-maps/${offerId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to fetch seat map" }));
    throw new Error(errorData.message || "Failed to fetch seat map");
  }
  return await response.json();
}

// New direct Duffel API call with logging
export async function fetchSeatMaps(offerId: string): Promise<SeatMapsResponse> {
  const url = `https://api.duffel.com/air/seat_maps?offer_id=${encodeURIComponent(offerId)}`;
  const started = Date.now();
  console.log("[Duffel] GET", url);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${Env.DUFFEL_API_KEY}`,
      "Duffel-Version": "v2",
      "Content-Type": "application/json",
    },
  });

  const dur = Date.now() - started;
  console.log("[Duffel] Seat maps status:", res.status, res.statusText, `(${dur}ms)`);

  if (!res.ok) {
    const text = await res.text();
    console.warn("[Duffel] Seat maps error body:", text.slice(0, 600));
    throw new Error(`Seat maps failed: ${res.status}`);
  }

  const json = await res.json();
  console.log("[Duffel] Seat maps payload keys:", Object.keys(json || {}));
  return json;
}

// New Duffel flight search function
export async function searchFlights(request: DuffelOfferRequest): Promise<DuffelOfferRequestResponse> {
  const url = "https://api.duffel.com/air/offer_requests";
  const started = Date.now();
  console.log("[Duffel] POST", url);
  console.log("[Duffel] Flight search request:", JSON.stringify(request, null, 2));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Env.DUFFEL_API_KEY}`,
      "Duffel-Version": "v2",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const dur = Date.now() - started;
  console.log("[Duffel] Flight search status:", res.status, res.statusText, `(${dur}ms)`);

  if (!res.ok) {
    const text = await res.text();
    console.error("[Duffel] Flight search error body:", text);
    throw new Error(`Flight search failed: ${res.status} - ${text}`);
  }

  const json = await res.json();
  console.log("[Duffel] Flight search response structure:", {
    hasData: !!json.data,
    offersCount: json.data?.offers?.length || 0,
    slicesCount: json.data?.slices?.length || 0,
    passengerCount: json.data?.passengers?.length || 0
  });
  
  if (json.data?.offers?.length > 0) {
    console.log("[Duffel] Sample offer:", {
      id: json.data.offers[0].id,
      total_amount: json.data.offers[0].total_amount,
      total_currency: json.data.offers[0].total_currency,
      slices_count: json.data.offers[0].slices?.length || 0
    });
  }
  
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