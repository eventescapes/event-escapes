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

// Date conversion helper
const convertDateFormat = (dateStr: string): string => {
  // Convert dd/mm/yyyy to yyyy-mm-dd
  if (dateStr && dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr; // Return as-is if already in correct format
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
  selectedSeats?: {
    outbound: Array<{
      serviceId: string;
      seatId: string;
      designator: string;
      passengerId: string;
      price: number;
      currency: string;
    }>;
    return: Array<{
      serviceId: string;
      seatId: string;
      designator: string;
      passengerId: string;
      price: number;
      currency: string;
    }>;
  };
}

// Fallback mock data for when API is unavailable
const generateMockFlightData = (params: FlightSearchParams) => {
  const generateFlight = (index: number, isReturn = false) => {
    const airlines = ['American Airlines', 'Delta Airlines', 'United Airlines', 'Southwest Airlines', 'JetBlue Airways'];
    const airline = airlines[index % airlines.length];
    const basePrice = 250 + (index * 50) + Math.floor(Math.random() * 200);
    
    const departureHour = 6 + (index * 2) % 18;
    const arrivalHour = departureHour + 3 + Math.floor(Math.random() * 4);
    
    return {
      id: `mock-flight-${index}-${isReturn ? 'return' : 'outbound'}`,
      airline,
      flightNumber: `${airline.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 9999)}`,
      departure: {
        airport: isReturn ? params.destination : params.origin,
        time: `${departureHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        city: isReturn ? 'Destination City' : 'Origin City'
      },
      arrival: {
        airport: isReturn ? params.origin : params.destination,
        time: `${arrivalHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        city: isReturn ? 'Origin City' : 'Destination City'
      },
      duration: `${3 + Math.floor(Math.random() * 4)}h ${Math.floor(Math.random() * 60)}m`,
      stops: Math.floor(Math.random() * 3),
      price: basePrice,
      class: params.cabin || 'economy',
      amenities: ['WiFi', 'In-flight Entertainment', 'Snacks'].slice(0, 1 + Math.floor(Math.random() * 3))
    };
  };

  return {
    outbound: Array.from({ length: 5 }, (_, i) => generateFlight(i, false)),
    return: Array.from({ length: 4 }, (_, i) => generateFlight(i, true))
  };
};

export const searchFlights = async (params: FlightSearchParams) => {
  console.log('🔍 Searching flights with params:', params);
  
  const functionUrl = import.meta.env.VITE_SUPABASE_FUNCTION_URL;
  const anon_key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('Environment Check:', {
    hasSupabaseUrl: !!functionUrl,
    hasSupabaseKey: !!anon_key,
    supabaseUrlPreview: functionUrl ? functionUrl.substring(0, 30) + '...' : 'missing',
    keyPreview: anon_key ? anon_key.substring(0, 20) + '...' : 'missing',
    fullEndpoint: functionUrl ? `${functionUrl}/flights-search` : 'undefined'
  });
  
  if (!functionUrl || !anon_key) {
    console.warn('⚠️ Supabase environment variables missing, using mock data');
    return generateMockFlightData(params);
  }
  
  try {

    // Call Edge Function directly
    try {
      const endpoint = `${functionUrl}/flights-search`;
      
      // Convert dates from dd/mm/yyyy to yyyy-mm-dd format
      const processedParams = {
        ...params,
        departureDate: convertDateFormat(params.departureDate),
        returnDate: params.returnDate ? convertDateFormat(params.returnDate) : undefined
      };
      
      console.log('[Flight Search] Endpoint:', functionUrl);
      console.log('[Flight Search] Method: POST');
      console.log('[Flight Search] Payload:', processedParams);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anon_key}`,
          'apikey': anon_key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(processedParams)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Flight Search] Headers sent:', {
          'Authorization': `Bearer ${anon_key ? anon_key.substring(0, 20) + '...' : 'missing'}`,
          'apikey': anon_key ? anon_key.substring(0, 20) + '...' : 'missing',
          'Content-Type': 'application/json'
        });
        console.warn(`⚠️ API error ${response.status}: ${errorText}`);
        
        // For development, try to parse and surface error, but fall back to mock data
        if (response.status === 401 || response.status === 403) {
          console.error('Authentication failed - check your Supabase keys');
        }
        
        // Always fall back to mock data in case of API failure
        console.log('Falling back to mock data due to API error');
        return generateMockFlightData(params);
      }
      
      const data = await response.json();
      const transformedData = transformDuffelResponseToExpectedFormat(data);
      console.log('✅ Real flight data received:', transformedData);
      return transformedData;
      
    } catch (fetchError) {
      console.warn('⚠️ Fetch failed, using mock data:', fetchError);
      return generateMockFlightData(params);
    }
  } catch (error) {
    console.warn('⚠️ Flight search error, using mock data:', error);
    return generateMockFlightData(params);
  }
};

// Transform selected seats to Duffel services format
const transformSeatsToServices = (selectedSeats?: FlightBookingParams['selectedSeats']) => {
  if (!selectedSeats) return [];
  
  const services: Array<{ id: string; quantity: number; passenger_ids: string[] }> = [];
  
  // Process outbound seats
  selectedSeats.outbound.forEach(seat => {
    services.push({
      id: seat.serviceId,
      quantity: 1,
      passenger_ids: [seat.passengerId]
    });
  });
  
  // Process return seats
  selectedSeats.return.forEach(seat => {
    services.push({
      id: seat.serviceId,
      quantity: 1,
      passenger_ids: [seat.passengerId]
    });
  });
  
  return services;
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
      email: params.passengerDetails.email,
      hasSeats: !!params.selectedSeats && (params.selectedSeats.outbound.length > 0 || params.selectedSeats.return.length > 0)
    });
    
    // Generate passengers array dynamically based on seat selections
    const generatePassengers = () => {
      if (params.selectedSeats) {
        // Extract unique passenger IDs from selected seats
        const allSeats = [...params.selectedSeats.outbound, ...params.selectedSeats.return];
        const uniquePassengerIds = Array.from(new Set(allSeats.map(seat => seat.passengerId)));
        
        return uniquePassengerIds.map((passengerId, index) => ({
          id: passengerId,
          given_name: index === 0 ? params.passengerDetails.firstName : `Passenger ${index + 1}`,
          family_name: index === 0 ? params.passengerDetails.lastName : 'Guest',
          email: index === 0 ? params.passengerDetails.email : `passenger${index + 1}@example.com`,
          phone_number: index === 0 ? params.passengerDetails.phone : ''
        }));
      } else {
        // Default to single passenger if no seats selected
        return [{
          id: 'passenger_1',
          given_name: params.passengerDetails.firstName,
          family_name: params.passengerDetails.lastName,
          email: params.passengerDetails.email,
          phone_number: params.passengerDetails.phone
        }];
      }
    };

    // Transform booking params to include Duffel order format
    const duffelOrderPayload = {
      selected_offers: [params.flightId],
      services: transformSeatsToServices(params.selectedSeats),
      passengers: generatePassengers()
    };
    
    console.log('🎫 Duffel order payload with seats:', {
      offers: duffelOrderPayload.selected_offers,
      serviceCount: duffelOrderPayload.services.length,
      services: duffelOrderPayload.services
    });
    
    const { data, error } = await supabase.functions.invoke('flights-book', {
      body: {
        ...params,
        duffelOrderPayload
      },
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