// Edge Function API Wrappers
// This file contains wrappers for all Supabase Edge Functions

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Type definitions
export interface SeatMap {
  segment_id: string;
  slice_id: string;
  cabins: Array<{
    aisles: number;
    cabin_class?: string;
    rows: Array<{
      sections: Array<{
        elements: Array<{
          type: string;
          designator?: string;
          available: boolean;
          disclosures?: string[];
          services?: Array<{
            id: string;
            passenger_id: string;
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
  passenger_id: string;
  type: string;
  maximum_quantity: number;
  price: string;
  currency: string;
  metadata: {
    type: 'checked' | 'carry_on';
    maximum_weight_kg?: number;
    maximum_depth_cm?: number;
    maximum_height_cm?: number;
    maximum_length_cm?: number;
  };
}

export interface CheckoutRequest {
  offerId: string;
  passengers: Array<{
    id?: string;
    type: string;
    title?: string;
    given_name: string;
    family_name: string;
    gender?: string;
    born_on: string;
    email?: string;
    phone_number?: string;
  }>;
  services: Array<{
    id: string;
    type: 'seat' | 'baggage';
    quantity: number;
    passenger_id: string;
    amount: string;
    currency: string;
    description?: string;
  }>;
  offerData: any;
}

export interface Passenger {
  id?: string;
  type: string;
  title?: string;
  given_name: string;
  family_name: string;
  gender?: string;
  born_on: string;
  email?: string;
  phone_number?: string;
}

export interface Service {
  id: string;
  type: 'seat' | 'baggage';
  quantity: number;
  passenger_id: string;
  amount: string;
  currency: string;
  description?: string;
}

// Helper function to call Edge Functions
async function callEdgeFunction(
  functionName: string,
  body: any
): Promise<any> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration missing');
  }

  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Edge Function ${functionName} error:`, errorText);
    throw new Error(`${functionName} failed: ${response.status}`);
  }

  return await response.json();
}

// Get seat maps for an offer
export async function getSeatMaps(offerId: string): Promise<{
  success: boolean;
  seat_maps?: SeatMap[];
  error?: string;
}> {
  try {
    console.log('🎫 Fetching seat maps for offer:', offerId);
    
    // Call the Duffel offer endpoint to get available services
    const url = `${SUPABASE_URL}/functions/v1/get-offer-lite`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ offerId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch offer: ${response.status}`);
    }

    const data = await response.json();
    
    // For seat maps, we need to call Duffel's seat maps API
    // This is a placeholder - the actual implementation would need the seat maps endpoint
    return {
      success: true,
      seat_maps: data.seat_maps || [],
    };
  } catch (error) {
    console.error('Error fetching seat maps:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get baggage services for an offer
export async function getBaggageServices(offerId: string): Promise<{
  success: boolean;
  available_services?: {
    baggage: BaggageService[];
  };
  included_baggage?: any[];
  error?: string;
}> {
  try {
    console.log('🧳 Fetching baggage services for offer:', offerId);
    
    const data = await callEdgeFunction('get-offer-lite', { offerId });
    
    // Parse the response to extract baggage services
    return {
      success: true,
      available_services: {
        baggage: data.available_services?.baggage || [],
      },
      included_baggage: data.included_baggage || [],
    };
  } catch (error) {
    console.error('Error fetching baggage services:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Save ancillaries (seats and baggage) to session
export async function saveAncillaries(params: {
  offerId: string;
  passengers: any[];
  seats: any[];
  baggage: any[];
  totalAmount: string;
}): Promise<{
  success: boolean;
  sessionId?: string;
  error?: string;
}> {
  try {
    console.log('💾 Saving ancillaries:', params);
    
    // This would typically save to a session or temporary storage
    // For now, we'll use the set-booking-services function
    // Note: This requires a sessionId, which we'll generate client-side
    const sessionId = `temp-${Date.now()}`;
    
    const services = [
      ...params.seats.map((seat: any) => ({
        id: seat.serviceId,
        type: 'seat' as const,
        passenger_id: seat.passengerId,
      })),
      ...params.baggage.map((bag: any) => ({
        id: bag.serviceId,
        type: 'baggage' as const,
        passenger_id: bag.passengerId,
        quantity: bag.quantity,
      })),
    ];
    
    await callEdgeFunction('set-booking-services', { sessionId, services });
    
    return {
      success: true,
      sessionId,
    };
  } catch (error) {
    console.error('Error saving ancillaries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Create checkout session
export async function createCheckout(request: CheckoutRequest): Promise<{
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
}> {
  try {
    console.log('💳 Creating checkout session:', request);
    
    const data = await callEdgeFunction('create-checkout-session', request);
    
    return {
      success: true,
      url: data.url,
      sessionId: data.sessionId,
    };
  } catch (error) {
    console.error('Error creating checkout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get booking status
export async function getBookingStatus(sessionId: string): Promise<{
  status: 'processing' | 'confirmed' | 'failed';
  booking_reference?: string;
  duffel_order_id?: string;
  error?: string;
  timestamp?: string;
}> {
  try {
    console.log('🔍 Checking booking status for session:', sessionId);
    
    const data = await callEdgeFunction('check-booking-status', { sessionId });
    
    return data;
  } catch (error) {
    console.error('Error checking booking status:', error);
    return {
      status: 'processing',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Query rewards (placeholder - implement if rewards API exists)
export async function queryRewards(userId: string): Promise<{
  success: boolean;
  points?: number;
  tier?: string;
  error?: string;
}> {
  try {
    console.log('🎁 Querying rewards for user:', userId);
    
    // This would call a rewards Edge Function if it exists
    // For now, return a placeholder
    return {
      success: true,
      points: 0,
      tier: 'member',
    };
  } catch (error) {
    console.error('Error querying rewards:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Re-export FlightSearchRequest and related types for compatibility
export interface FlightSearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabin?: string;
}

export interface EdgeFunctionOffer {
  id: string;
  total_amount: string;
  total_currency: string;
  slices: EdgeFunctionSlice[];
}

export interface EdgeFunctionSlice {
  id: string;
  segments: EdgeFunctionSegment[];
  duration: string;
}

export interface EdgeFunctionSegment {
  id: string;
  origin: {
    iata_code: string;
    city_name: string;
  };
  destination: {
    iata_code: string;
    city_name: string;
  };
  departing_at: string;
  arriving_at: string;
  marketing_carrier: {
    name: string;
    iata_code: string;
  };
  marketing_carrier_flight_number: string;
}

// Search flights - delegate to supabase.ts
export { searchFlights } from './supabase';
