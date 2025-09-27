import { createClient } from '@supabase/supabase-js';

// Environment variable configuration for Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client if environment variables are available
let supabase: any = null;
let isSupabaseConfigured = false;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  isSupabaseConfigured = true;
  console.log('✓ Supabase client initialized successfully');
} else {
  console.warn('⚠ Supabase environment variables not found. Using demo mode.');
  console.info('To connect to your Supabase Edge Functions, add these secrets to your Replit:');
  console.info('- VITE_SUPABASE_URL (your Supabase project URL)');
  console.info('- VITE_SUPABASE_ANON_KEY (your Supabase anon key)');
}

export { supabase, isSupabaseConfigured };

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
  if (!isSupabaseConfigured || !supabase) {
    console.log('🔄 Supabase not configured, using demo flight data for testing');
    
    // Demo flight data to test the UI while Supabase is being configured
    return {
      outbound: [
        {
          id: "demo-out-1",
          airline: "American Airlines",
          flightNumber: "AA123",
          departure: { airport: params.origin, time: "08:00", city: "Los Angeles" },
          arrival: { airport: params.destination, time: "16:30", city: "New York" },
          duration: "5h 30m",
          stops: 0,
          price: 450,
          class: "Economy",
          amenities: ["WiFi", "Entertainment", "Refreshments"]
        },
        {
          id: "demo-out-2", 
          airline: "Delta Airlines",
          flightNumber: "DL456",
          departure: { airport: params.origin, time: "14:00", city: "Los Angeles" },
          arrival: { airport: params.destination, time: "22:30", city: "New York" },
          duration: "5h 30m",
          stops: 0,
          price: 520,
          class: "Economy",
          amenities: ["WiFi", "Entertainment", "Premium Snacks"]
        }
      ],
      return: [
        {
          id: "demo-ret-1",
          airline: "United Airlines", 
          flightNumber: "UA789",
          departure: { airport: params.destination, time: "09:00", city: "New York" },
          arrival: { airport: params.origin, time: "12:30", city: "Los Angeles" },
          duration: "5h 30m",
          stops: 0,
          price: 480,
          class: "Economy",
          amenities: ["WiFi", "Entertainment", "Light Meal"]
        }
      ]
    };
  }

  try {
    console.log('🛫 Calling Supabase Edge Function: flights-search');
    console.log('Search params:', params);
    
    const { data, error } = await supabase.functions.invoke('flights-search', {
      body: params
    });

    if (error) {
      console.error('Flight search error:', error);
      throw new Error(`Flight search failed: ${error.message}`);
    }

    console.log('✅ Flight search response:', data);
    return data;
  } catch (error) {
    console.error('❌ Error calling flights-search:', error);
    throw error;
  }
};

export const bookFlight = async (params: FlightBookingParams) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('🔄 Supabase not configured, simulating flight booking');
    
    // Demo booking response
    return {
      success: true,
      bookingId: "demo-booking-" + Date.now(),
      message: "Demo booking successful! Configure Supabase for real bookings.",
      confirmationNumber: "DEMO" + Math.random().toString(36).substr(2, 6).toUpperCase()
    };
  }

  try {
    console.log('✈️ Calling Supabase Edge Function: flights-book');
    console.log('Booking params:', params);
    
    const { data, error } = await supabase.functions.invoke('flights-book', {
      body: params
    });

    if (error) {
      console.error('Flight booking error:', error);
      throw new Error(`Flight booking failed: ${error.message}`);
    }

    console.log('✅ Flight booking response:', data);
    return data;
  } catch (error) {
    console.error('❌ Error calling flights-book:', error);
    throw error;
  }
};