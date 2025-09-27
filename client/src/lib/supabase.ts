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
    console.log('📊 Found flights:', { 
      outbound: data?.outbound?.length || 0, 
      return: data?.return?.length || 0 
    });
    
    return data;
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