// Legacy types (keep for backward compatibility during migration)
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

// New Duffel-based types
export type TripType = 'one-way' | 'return' | 'multi-city';

export interface FlightSearchParams {
  tripType: TripType;
  from: string;
  to: string;
  departDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass?: 'first' | 'business' | 'premium_economy' | 'economy';
  multiCitySlices?: Array<{
    origin: string;
    destination: string;
    departure_date: string;
  }>;
}

// Simplified flight representation for UI display
export interface FlightDisplay {
  offerId: string;
  sliceId: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  departureAirport: string;
  arrivalAirport: string;
  duration: string;
  stops: number;
  stopDetails?: string[];
  price: number;
  currency: string;
  segments: Array<{
    airline: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    aircraft?: string;
  }>;
}

// Selected flights state for different trip types
export interface SelectedFlights {
  offers: Array<{
    offerId: string;
    sliceIndex: number;
    totalAmount: string;
    totalCurrency: string;
    display: FlightDisplay;
  }>;
  totalPrice: number;
  currency: string;
  isComplete: boolean; // true when all required slices are selected
}

// Duffel Seat Map API Types
export interface SeatMapService {
  id: string;
  total_amount: string;
  total_currency: string;
  type: string;
}

export interface SeatElement {
  id: string;
  type: 'seat' | 'exit_row' | 'aisle' | 'lavatory' | 'walkway';
  designator?: string; // e.g., "12A"
  name?: string;
  available_services: SeatMapService[];
  disclosures?: string[];
  characteristics?: string[]; // e.g., ["window", "extra_legroom"]
}

export interface SeatMapSection {
  elements: SeatElement[];
}

export interface SeatMapRow {
  sections: SeatMapSection[];
}

export interface SeatMapCabin {
  cabin_class: string;
  rows: SeatMapRow[];
  wings?: {
    first_row_index: number;
    last_row_index: number;
  };
}

export interface SeatMap {
  id: string;
  cabins: SeatMapCabin[];
  slice_index: number;
  segment_index: number;
}

export interface SeatMapResponse {
  data: SeatMap[];
}

export interface SelectedSeat {
  seatId: string;
  designator: string;
  serviceId: string;
  price: number;
  currency: string;
  passengerId: string;
  characteristics?: string[];
}