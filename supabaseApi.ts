// client/src/lib/supabaseApi.ts
// Central API layer for all Supabase Edge Function calls

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ==========================================
// CORE API HELPER
// ==========================================

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
// FLIGHT SEARCH
// ==========================================

export async function searchFlights(params: any) {
  console.log("🔍 API: Searching flights...", params);
  const result = await callEdgeFunction("duffel_search", params);
  console.log("✅ API: Search complete");
  return result;
}

// ==========================================
// SEAT MAPS
// ==========================================

export async function getSeatMaps(offerId: string) {
  console.log("💺 API: Getting seat maps for", offerId);
  const result = await callEdgeFunction("duffel_seat_maps", {
    offer_id: offerId,
  });
  console.log("✅ API: Seat maps retrieved");
  return result;
}

// ==========================================
// BAGGAGE SERVICES
// ==========================================

export async function getBaggageServices(offerId: string) {
  console.log("🧳 API: Getting baggage services for", offerId);
  const result = await callEdgeFunction("duffel_offer_services", {
    offer_id: offerId,
  });
  console.log("✅ API: Baggage services retrieved");
  return result;
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

// ==========================================
// CHECKOUT
// ==========================================

export async function createCheckout(data: any) {
  console.log("💳 API: Creating checkout session...", data.offerId);
  const result = await callEdgeFunction("create-checkout-session", data);
  console.log("✅ API: Checkout session created", result.sessionId);
  return result;
}

// ==========================================
// BOOKING STATUS
// ==========================================

export async function getBookingStatus(offerId: string) {
  console.log("📊 API: Getting booking status for", offerId);
  const result = await callEdgeFunction("get-booking-status", {
    offer_id: offerId,
  });
  console.log("✅ API: Booking status retrieved");
  return result;
}

// ==========================================
// REWARDS
// ==========================================

export async function queryRewards(email: string) {
  console.log("💎 API: Querying rewards for", email);
  const result = await callEdgeFunction("supabase-rewards:query_rewards", {
    email,
  });
  console.log("✅ API: Rewards retrieved");
  return result;
}

export async function queryTransactions(email: string, limit: number = 10) {
  console.log("📜 API: Querying transactions for", email);
  const result = await callEdgeFunction("supabase-rewards:query_transactions", {
    email,
    limit,
  });
  console.log("✅ API: Transactions retrieved");
  return result;
}

export async function checkRewardsConfig() {
  console.log("⚙️ API: Checking rewards config");
  const result = await callEdgeFunction("supabase-rewards:check_config", {});
  console.log("✅ API: Config retrieved");
  return result;
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
