typescript; // client/src/lib/supabaseApi.ts
// Central API layer for all Supabase Edge Function calls

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ==========================================
// CORE API HELPER
// ==========================================

async function callEdgeFunction(functionName: string, payload: any) {
  console.log(`📡 Calling Edge Function: ${functionName}`, payload);

  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  console.log(`📡 URL: ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });

  console.log(`📡 Response status: ${response.status}`);

  const responseText = await response.text();
  console.log(`📡 Response body:`, responseText);

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      errorMessage = responseText || errorMessage;
    }
    console.error(`❌ Edge Function Error:`, errorMessage);
    throw new Error(errorMessage);
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error(`❌ Failed to parse response:`, responseText);
    throw new Error("Invalid response from server");
  }
}

// ==========================================
// FLIGHT SEARCH
// ==========================================

export async function searchFlights(params: any) {
  console.log("🔍 API: Searching flights...", params);

  try {
    const result = await callEdgeFunction("duffel_search", params);
    console.log("✅ API: Search complete", result);
    return result;
  } catch (error) {
    console.error("❌ API: Search failed", error);
    throw error;
  }
}

// ==========================================
// SEAT MAPS
// ==========================================

export async function getSeatMaps(offerId: string) {
  console.log("💺 API: Getting seat maps for", offerId);

  try {
    const result = await callEdgeFunction("duffel_seat_maps", {
      offer_id: offerId,
    });
    console.log("✅ API: Seat maps retrieved");
    return result;
  } catch (error) {
    console.error("❌ API: Seat maps failed", error);
    throw error;
  }
}

// ==========================================
// BAGGAGE SERVICES
// ==========================================

export async function getBaggageServices(offerId: string) {
  console.log("🧳 API: Getting baggage services for", offerId);

  try {
    const result = await callEdgeFunction("duffel_offer_services", {
      offer_id: offerId,
    });
    console.log("✅ API: Baggage services retrieved");
    return result;
  } catch (error) {
    console.error("❌ API: Baggage services failed", error);
    throw error;
  }
}

// ==========================================
// SAVE ANCILLARIES
// ==========================================

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
}) {
  console.log("💾 API: Saving ancillaries for", offerId);

  try {
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
  } catch (error) {
    console.error("❌ API: Save ancillaries failed", error);
    throw error;
  }
}

// ==========================================
// CHECKOUT
// ==========================================

export async function createCheckout(data: any) {
  console.log("💳 API: Creating checkout session...", data);

  try {
    const result = await callEdgeFunction("create-checkout-session", data);
    console.log("✅ API: Checkout session created", result);
    return result;
  } catch (error) {
    console.error("❌ API: Checkout failed", error);
    throw error;
  }
}

// ==========================================
// BOOKING STATUS
// ==========================================

export async function getBookingStatus(offerId: string) {
  console.log("📊 API: Getting booking status for", offerId);

  try {
    const result = await callEdgeFunction("get-booking-status", {
      offer_id: offerId,
    });
    console.log("✅ API: Booking status retrieved");
    return result;
  } catch (error) {
    console.error("❌ API: Booking status failed", error);
    throw error;
  }
}

// ==========================================
// REWARDS
// ==========================================

export async function queryRewards(email: string) {
  console.log("💎 API: Querying rewards for", email);

  try {
    const result = await callEdgeFunction("supabase-rewards:query_rewards", {
      email,
    });
    console.log("✅ API: Rewards retrieved");
    return result;
  } catch (error) {
    console.error("❌ API: Rewards failed", error);
    throw error;
  }
}

export async function queryTransactions(email: string, limit: number = 10) {
  console.log("📜 API: Querying transactions for", email);

  try {
    const result = await callEdgeFunction(
      "supabase-rewards:query_transactions",
      { email, limit },
    );
    console.log("✅ API: Transactions retrieved");
    return result;
  } catch (error) {
    console.error("❌ API: Transactions failed", error);
    throw error;
  }
}

export async function checkRewardsConfig() {
  console.log("⚙️ API: Checking rewards config");

  try {
    const result = await callEdgeFunction("supabase-rewards:check_config", {});
    console.log("✅ API: Config retrieved");
    return result;
  } catch (error) {
    console.error("❌ API: Config check failed", error);
    throw error;
  }
}

// ==========================================
// TYPES (for TypeScript)
// ==========================================

export interface SeatMap {
  id: string;
  slice_id: string;
  segment_id: string;
  cabins: Array<{
    cabin_class?: string;
    rows: any[];
  }>;
}

export interface BaggageService {
  id: string;
  price: string;
  currency: string;
  passenger_id: string;
  maximum_quantity: number;
  metadata: {
    type: string;
    maximum_weight_kg?: number;
  };
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
  searchFlights,
  getSeatMaps,
  getBaggageServices,
  createCheckout,
  saveAncillaries,
  getBookingStatus,
  queryRewards,
  queryTransactions,
  checkRewardsConfig,
};
