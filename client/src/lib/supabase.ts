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
  // Transform Duffel API flight object to match our FlightSearchResult interface
  return {
    id: duffelFlight.id || `flight-${Math.random().toString(36).substr(2, 9)}`,
    airline: duffelFlight.segments?.[0]?.marketing_carrier?.name || 
             duffelFlight.airline || 
             duffelFlight.operating_carrier?.name || 
             "Unknown Airline",
    flightNumber: duffelFlight.segments?.[0]?.marketing_carrier_flight_number || 
                  duffelFlight.flight_number ||
                  duffelFlight.segments?.[0]?.operating_carrier_flight_number ||
                  "N/A",
    departure: {
      airport: duffelFlight.segments?.[0]?.origin?.iata_code || 
               duffelFlight.departure?.airport || 
               duffelFlight.origin?.iata_code ||
               "Unknown",
      time: duffelFlight.segments?.[0]?.departing_at ? 
            new Date(duffelFlight.segments[0].departing_at).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: false 
            }) :
            duffelFlight.departure?.time || "00:00",
      city: duffelFlight.segments?.[0]?.origin?.city_name || 
            duffelFlight.departure?.city ||
            "Unknown City"
    },
    arrival: {
      airport: duffelFlight.segments?.slice(-1)[0]?.destination?.iata_code || 
               duffelFlight.arrival?.airport ||
               duffelFlight.destination?.iata_code ||
               "Unknown",
      time: duffelFlight.segments?.slice(-1)[0]?.arriving_at ?
            new Date(duffelFlight.segments.slice(-1)[0].arriving_at).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: false 
            }) :
            duffelFlight.arrival?.time || "00:00",
      city: duffelFlight.segments?.slice(-1)[0]?.destination?.city_name || 
            duffelFlight.arrival?.city ||
            "Unknown City"
    },
    duration: duffelFlight.total_duration || 
              duffelFlight.duration || 
              "N/A",
    stops: (duffelFlight.segments?.length || 1) - 1,
    price: parseFloat(duffelFlight.total_amount || duffelFlight.price || duffelFlight.base_amount || 0),
    class: duffelFlight.cabin_class || 
           duffelFlight.segments?.[0]?.passengers?.[0]?.cabin_class ||
           "economy",
    amenities: duffelFlight.amenities || 
               (duffelFlight.segments?.[0]?.aircraft?.name ? [`Aircraft: ${duffelFlight.segments[0].aircraft.name}`] : []) ||
               ["Standard Service"]
  };
};

const transformDuffelResponseToExpectedFormat = (duffelResponse: any) => {
  console.log('🔄 Transforming Duffel response:', duffelResponse);
  
  // Handle different possible response structures
  let outbound = [];
  let returnFlights = [];
  
  if (duffelResponse.outbound) {
    outbound = Array.isArray(duffelResponse.outbound) ? 
      duffelResponse.outbound.map(transformDuffelFlightToExpectedFormat) : 
      [];
  } else if (duffelResponse.data?.slices?.[0]?.offers) {
    // Alternative Duffel structure
    outbound = duffelResponse.data.slices[0].offers.map(transformDuffelFlightToExpectedFormat);
  } else if (duffelResponse.offers) {
    // Direct offers array
    outbound = duffelResponse.offers.map(transformDuffelFlightToExpectedFormat);
  } else if (Array.isArray(duffelResponse)) {
    // Direct array of flights
    outbound = duffelResponse.map(transformDuffelFlightToExpectedFormat);
  }
  
  if (duffelResponse.return) {
    returnFlights = Array.isArray(duffelResponse.return) ? 
      duffelResponse.return.map(transformDuffelFlightToExpectedFormat) : 
      [];
  } else if (duffelResponse.data?.slices?.[1]?.offers) {
    returnFlights = duffelResponse.data.slices[1].offers.map(transformDuffelFlightToExpectedFormat);
  }
  
  const result = {
    outbound: outbound,
    return: returnFlights
  };
  
  console.log('✅ Transformed result:', {
    outbound: result.outbound.length,
    return: result.return.length,
    sampleOutbound: result.outbound[0]
  });
  
  return result;
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
      throw new Error(`Flight search failed: ${error.message}`);
    }

    console.log('✅ Flight search response from Duffel API:', data);
    console.log('📊 Response type:', typeof data);
    console.log('📊 Response structure:', Object.keys(data || {}));
    
    // Transform the Duffel API response to match our expected format
    const transformedData = transformDuffelResponseToExpectedFormat(data);
    
    console.log('📊 Transformed flights:', { 
      outbound: transformedData?.outbound?.length || 0, 
      return: transformedData?.return?.length || 0 
    });
    
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