export type FlightOffer = Record<string, any>;

export interface FlightSearchResponseRaw {
  outbound?: FlightOffer[];
  inbound?: FlightOffer[];
  // Some providers send `return` – keep it as an index access only.
  [key: string]: any;
}

export interface FlightSearchResponse {
  outbound: FlightOffer[];
  inbound: FlightOffer[];
  total_offers?: number;
}