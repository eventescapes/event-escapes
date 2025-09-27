import { createClient } from '@supabase/supabase-js';

// Global Supabase client state
let supabase: any = null;
let isSupabaseConfigured = false;
let configPromise: Promise<void> | null = null;

// Initialize Supabase client by fetching config from server
const initializeSupabase = async () => {
  try {
    console.log('🔄 Fetching Supabase configuration from server...');
    const response = await fetch('/api/config/supabase');
    
    if (!response.ok) {
      throw new Error(`Config fetch failed: ${response.status}`);
    }
    
    const config = await response.json();
    console.log('📋 Supabase config received:', { 
      hasUrl: !!config.url, 
      hasKey: !!config.anonKey, 
      isConfigured: config.isConfigured 
    });
    
    if (config.isConfigured && config.url && config.anonKey) {
      supabase = createClient(config.url, config.anonKey);
      isSupabaseConfigured = true;
      console.log('✅ Supabase client initialized successfully with server config');
    } else {
      console.error('❌ Supabase configuration missing on server');
      throw new Error('Supabase not configured');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
    isSupabaseConfigured = false;
    throw error;
  }
};

// Ensure Supabase is initialized before use
const ensureSupabaseInit = async () => {
  if (!configPromise) {
    configPromise = initializeSupabase();
  }
  await configPromise;
  return { supabase, isSupabaseConfigured };
};

export { supabase, isSupabaseConfigured, ensureSupabaseInit };

// Data transformation functions
const transformDuffelFlightToExpectedFormat = (duffelFlight: any) => {
  // Transform flight object to match our FlightSearchResult interface
  // Handle the actual Supabase Edge Function response format
  return {
    id: duffelFlight.id || `flight-${Math.random().toString(36).substr(2, 9)}`,
    airline: duffelFlight.airline?.name || 
             duffelFlight.airline || 
             duffelFlight.segments?.[0]?.marketing_carrier?.name || 
             duffelFlight.operating_carrier?.name || 
             "Unknown Airline",
    flightNumber: duffelFlight.flightNumber ||
                  duffelFlight.flight_number ||
                  duffelFlight.segments?.[0]?.marketing_carrier_flight_number || 
                  duffelFlight.segments?.[0]?.operating_carrier_flight_number ||
                  "N/A",
    departure: {
      airport: duffelFlight.departure?.airport || 
               duffelFlight.segments?.[0]?.origin?.iata_code || 
               duffelFlight.origin?.iata_code ||
               "Unknown",
      time: duffelFlight.departure?.time || 
            (duffelFlight.segments?.[0]?.departing_at ? 
              new Date(duffelFlight.segments[0].departing_at).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
              }) : "00:00"),
      city: duffelFlight.departure?.city ||
            duffelFlight.segments?.[0]?.origin?.city_name || 
            "Unknown City"
    },
    arrival: {
      airport: duffelFlight.arrival?.airport ||
               duffelFlight.segments?.slice(-1)[0]?.destination?.iata_code || 
               duffelFlight.destination?.iata_code ||
               "Unknown",
      time: duffelFlight.arrival?.time ||
            (duffelFlight.segments?.slice(-1)[0]?.arriving_at ?
              new Date(duffelFlight.segments.slice(-1)[0].arriving_at).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
              }) : "00:00"),
      city: duffelFlight.arrival?.city ||
            duffelFlight.segments?.slice(-1)[0]?.destination?.city_name || 
            "Unknown City"
    },
    duration: duffelFlight.duration || 
              duffelFlight.total_duration || 
              "N/A",
    stops: duffelFlight.stops !== undefined ? duffelFlight.stops : 
           ((duffelFlight.segments?.length || 1) - 1),
    price: parseFloat(duffelFlight.price?.amount || 
                     duffelFlight.price || 
                     duffelFlight.total_amount || 
                     duffelFlight.base_amount || 0),
    class: duffelFlight.class ||
           duffelFlight.cabin_class || 
           duffelFlight.segments?.[0]?.passengers?.[0]?.cabin_class ||
           "economy",
    amenities: duffelFlight.amenities || 
               (duffelFlight.segments?.[0]?.aircraft?.name ? [`Aircraft: ${duffelFlight.segments[0].aircraft.name}`] : []) ||
               ["Standard Service"]
  };
};

const transformDuffelResponseToExpectedFormat = (duffelResponse: any) => {
  // Handle the exact Supabase Edge Function response format
  let outbound = [];
  let returnFlights = [];
  
  // Primary format: direct outbound/return arrays
  if (duffelResponse.outbound && Array.isArray(duffelResponse.outbound)) {
    outbound = duffelResponse.outbound.map(transformDuffelFlightToExpectedFormat);
  }
  
  if (duffelResponse.return && Array.isArray(duffelResponse.return)) {
    returnFlights = duffelResponse.return.map(transformDuffelFlightToExpectedFormat);
  }
  
  return {
    outbound: outbound,
    return: returnFlights
  };
};

// Flight search and booking functions using Edge Functions
export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabin?: string;
}

export interface FlightBookingParams {
  flightId: string;
  passengerDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  paymentDetails?: any;
}

export const searchFlights = async (params: FlightSearchParams) => {
  try {
    // Ensure Supabase is initialized
    await ensureSupabaseInit();
    
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client not configured');
    }

    console.log('🛫 Calling Supabase Edge Function: flights-search');
    console.log('🔍 Search params:', {
      origin: params.origin,
      destination: params.destination, 
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      passengers: params.passengers,
      cabin: params.cabin
    });
    
    const { data, error } = await supabase.functions.invoke('flights-search', {
      body: params,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (error) {
      console.error('❌ Flight search error:', error);
      console.error('❌ Full error details:', JSON.stringify(error, null, 2));
      throw new Error(`Flight search failed: ${error.message || 'Unknown error'}`);
    }

    console.log('✅ Raw API response received:', data);
    console.log('📊 Response structure:', Object.keys(data || {}));

    // Transform the Duffel API response to match our expected format
    const transformedData = transformDuffelResponseToExpectedFormat(data);
    
    return transformedData;
  } catch (error) {
    console.error('❌ Error calling flights-search Edge Function:', error);
    throw error;
  }
};

export const bookFlight = async (params: FlightBookingParams) => {
  try {
    // Ensure Supabase is initialized
    await ensureSupabaseInit();
    
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client not configured');
    }

    console.log('✈️ Calling Supabase Edge Function: flights-book');
    console.log('📝 Booking params:', {
      flightId: params.flightId,
      passenger: params.passengerDetails.firstName + ' ' + params.passengerDetails.lastName,
      email: params.passengerDetails.email
    });
    
    const { data, error } = await supabase.functions.invoke('flights-book', {
      body: params,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (error) {
      console.error('❌ Flight booking error:', error);
      throw new Error(`Flight booking failed: ${error.message}`);
    }

    console.log('✅ Flight booking response from Duffel API:', data);
    return data;
  } catch (error) {
    console.error('❌ Error calling flights-book Edge Function:', error);
    throw error;
  }
};