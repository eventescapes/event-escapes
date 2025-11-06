// src/lib/supabaseApi.ts
// Central API layer for all Supabase Edge Function calls

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ==========================================
// CORE API HELPER
// ==========================================

/**
 * Universal Edge Function caller
 * Handles authentication, headers, and error parsing
 */
async function callEdgeFunction(functionName: string, payload: any) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      // If can't parse, use status code
    }
    throw new Error(errorMessage);
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    throw new Error("Invalid response from server");
  }
}

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface FlightSearchRequest {
  tripType: "one-way" | "return" | "multi-city";
  slices: Array<{
    origin: string;
    destination: string;
    departureDate: string;
  }>;
  passengers: {
    adults: number;
    children?: number;
    infants?: number;
  };
  cabinClass: "economy" | "premium_economy" | "business" | "first";
}

export interface FlightSearchResponse {
  success: boolean;
  trip_type: "one-way" | "return" | "multi-city";
  total_offers: number;
  offers: EdgeFunctionOffer[];
  error?: string;
}

export interface EdgeFunctionOffer {
  id: string;
  total_amount: number;
  total_currency: string;
  expires_at: string;
  slices: EdgeFunctionSlice[];
  passengers?: Array<{ id: string; type: string }>;
}

export interface EdgeFunctionSlice {
  slice_index: number;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  segments: EdgeFunctionSegment[];
  stops: number;
}

export interface EdgeFunctionSegment {
  airline: string;
  airline_code: string;
  flight_number: string;
  aircraft: string;
  origin: string;
  destination: string;
  departing_at: string;
  arriving_at: string;
  duration: string;
}

export interface Passenger {
  id: string;
  type: "adult" | "child" | "infant_without_seat";
  title?: string;
  given_name?: string;
  family_name?: string;
  gender?: "m" | "f";
  born_on?: string;
  email?: string;
  phone_number?: string;
}

export interface Service {
  id: string;
  type: "seat" | "baggage";
  amount: number;
  quantity: number;
}

export interface CheckoutRequest {
  offerId: string;
  passengers: Passenger[];
  services: Service[];
  totalAmount: number;
  currency: string;
}

export interface SeatMap {
  id: string;
  slice_id: string;
  segment_id: string;
  cabins: Array<{
    cabin_class: string;
    rows: Array<{
      sections: Array<{
        elements: Array<{
          type: "seat" | "bassinet" | "empty" | "exit_row" | "lavatory";
          id?: string;
          designator?: string;
          available?: boolean;
          services?: Array<{
            id: string;
            total_amount: string;
            total_currency: string;
          }>;
        }>;
      }>;
    }>;
  }>;
}

export interface BaggageService {
  id: string;
  type: "baggage";
  price: string;
  currency: string;
  maximum_quantity: number;
  passenger_id: string;
  metadata: {
    type: "checked" | "carry_on";
    maximum_weight_kg?: number;
  };
}

// ==========================================
// FLIGHT SEARCH API
// ==========================================

/**
 * Search for flights across all trip types
 *
 * @param params - Search parameters including trip type, slices, passengers, cabin
 * @returns Search results with offers
 *
 * @example
 * const results = await searchFlights({
 *   tripType: 'return',
 *   slices: [
 *     { origin: 'LAX', destination: 'JFK', departureDate: '2026-06-15' },
 *     { origin: 'JFK', destination: 'LAX', departureDate: '2026-06-20' }
 *   ],
 *   passengers: { adults: 2, children: 0, infants: 0 },
 *   cabinClass: 'economy'
 * });
 */
export async function searchFlights(
  params: FlightSearchRequest,
): Promise<FlightSearchResponse> {
  console.log("🔍 API: Searching flights...", params);
  const result = await callEdgeFunction("flights-search", params);
  console.log("✅ API: Search complete", result.total_offers, "offers");
  return result;
}

// ==========================================
// SEAT MAPS API
// ==========================================

/**
 * Get seat maps for an offer
 *
 * @param offerId - Duffel offer ID
 * @returns Seat maps for all slices in the offer
 *
 * @example
 * const seatMaps = await getSeatMaps('off_0000AztZNx1J63zdBhNcN2');
 */
export async function getSeatMaps(offerId: string): Promise<{
  success: boolean;
  offer_id: string;
  seat_maps: SeatMap[];
}> {
  console.log("💺 API: Getting seat maps for", offerId);
  const result = await callEdgeFunction("duffel_seat_maps", {
    offer_id: offerId,
  });
  console.log(
    "✅ API: Seat maps retrieved",
    result.seat_maps?.length || 0,
    "maps",
  );
  return result;
}

// ==========================================
// BAGGAGE SERVICES API
// ==========================================

/**
 * Get available baggage services for an offer
 *
 * @param offerId - Duffel offer ID
 * @returns Available baggage services and included baggage
 *
 * @example
 * const services = await getBaggageServices('off_0000AztZNx1J63zdBhNcN2');
 */
export async function getBaggageServices(offerId: string): Promise<{
  success: boolean;
  offer_id: string;
  available_services: {
    baggage: BaggageService[];
    seats: number;
  };
  included_baggage: Array<{
    type: string;
    quantity: number;
    passenger_id: string;
  }>;
}> {
  console.log("🧳 API: Getting baggage services for", offerId);
  const result = await callEdgeFunction("duffel_offer_services", {
    offer_id: offerId,
  });
  console.log("✅ API: Baggage services retrieved");
  return result;
}

// ==========================================
// CHECKOUT API
// ==========================================

/**
 * Create a Stripe checkout session
 *
 * @param data - Checkout data including offer, passengers, services, total
 * @returns Stripe checkout session URL
 *
 * @example
 * const checkout = await createCheckout({
 *   offerId: 'off_0000xxx',
 *   passengers: [...],
 *   services: [...],
 *   totalAmount: 551.91,
 *   currency: 'AUD'
 * });
 */
export async function createCheckout(data: CheckoutRequest): Promise<{
  success: boolean;
  sessionId: string;
  url: string;
}> {
  console.log("💳 API: Creating checkout session...", data.offerId);
  const result = await callEdgeFunction("create-checkout-session", data);
  console.log("✅ API: Checkout session created", result.sessionId);
  return result;
}

// ==========================================
// ANCILLARIES API
// ==========================================

/**
 * Save ancillary selections (seats + baggage)
 *
 * @param data - Ancillary data to save
 * @returns Confirmation of save
 */
export async function saveAncillaries({
  offerId,
  passengers,
  seats,
  baggage,
  totalAmount,
  currency = "AUD",
}: {
  offerId: string;
  passengers: any[];
  seats: any[];
  baggage: any[];
  totalAmount: number;
  currency?: string;
}): Promise<{
  success: boolean;
  message: string;
}> {
  console.log("💾 API: Saving ancillaries for", offerId);
  const result = await callEdgeFunction("save-ancillaries", {
    offer_id: offerId,
    passengers,
    seats,
    baggage,
    total_amount: totalAmount,
    currency,
  });
  console.log("✅ API: Ancillaries saved");
  return result;
}

/**
 * Get booking status
 *
 * @param offerId - Duffel offer ID
 * @returns Current booking status
 */
export async function getBookingStatus({
  offerId,
}: {
  offerId: string;
}): Promise<{
  success: boolean;
  status: string;
  booking_reference?: string;
  order_id?: string;
}> {
  console.log("📊 API: Getting booking status for", offerId);
  const result = await callEdgeFunction("get-booking-status", {
    offer_id: offerId,
  });
  console.log("✅ API: Booking status retrieved", result.status);
  return result;
}

// ==========================================
// REWARDS API
// ==========================================

/**
 * Query customer rewards balance
 */
export async function queryRewards(email: string) {
  console.log("💎 API: Querying rewards for", email);
  const result = await callEdgeFunction("supabase-rewards:query_rewards", {
    email,
  });
  console.log("✅ API: Rewards retrieved");
  return result;
}

/**
 * Query rewards transactions
 */
export async function queryTransactions(email: string, limit: number = 10) {
  console.log("📜 API: Querying transactions for", email);
  const result = await callEdgeFunction("supabase-rewards:query_transactions", {
    email,
    limit,
  });
  console.log("✅ API: Transactions retrieved");
  return result;
}

/**
 * Check rewards configuration
 */
export async function checkRewardsConfig() {
  console.log("⚙️ API: Checking rewards config");
  const result = await callEdgeFunction("supabase-rewards:check_config", {});
  console.log("✅ API: Config retrieved");
  return result;
}

// ==========================================
// EXPORTS
// ==========================================

export default {
  // Flight operations
  searchFlights,
  getSeatMaps,
  getBaggageServices,
  createCheckout,
  saveAncillaries,
  getBookingStatus,

  // Rewards operations
  queryRewards,
  queryTransactions,
  checkRewardsConfig,
};
