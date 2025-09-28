// utils/duffel.ts
import { Env, assertSecretsReady } from "@/config/env";

assertSecretsReady(["DUFFEL_API_KEY"]);

export type SeatMapsResponse = any;

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