const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FlightSearchRequest {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers?: number  // Total count for backward compatibility
  adults: number
  children?: number
  infants?: number  // Combined lap + seat infants
  cabin?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[flights-search] CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  console.log(`[flights-search] ${req.method} request from origin: ${req.headers.get('origin')}`)

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const body = await req.text()
    console.log(`[flights-search] Payload size: ${body.length} bytes`)
    
    const requestData: FlightSearchRequest = JSON.parse(body)
    console.log('[flights-search] Request data:', requestData)
    
    // Log passenger breakdown for Duffel API format
    console.log('[flights-search] Passenger breakdown:', {
      adults: requestData.adults || 0,
      children: requestData.children || 0,
      infants: requestData.infants || 0,
      total: (requestData.adults || 0) + (requestData.children || 0) + (requestData.infants || 0)
    })

    // Mock flight data for testing
    const mockOutboundFlights = [
      {
        id: 'mock-outbound-1',
        airline: 'American Airlines',
        flightNumber: 'AA123',
        departure: {
          airport: requestData.origin,
          time: '08:00',
          city: 'Origin City'
        },
        arrival: {
          airport: requestData.destination,
          time: '12:00',
          city: 'Destination City'
        },
        duration: '4h 0m',
        stops: 0,
        price: 350,
        class: requestData.cabin || 'economy',
        amenities: ['WiFi', 'In-flight Entertainment']
      },
      {
        id: 'mock-outbound-2', 
        airline: 'Delta Airlines',
        flightNumber: 'DL456',
        departure: {
          airport: requestData.origin,
          time: '14:30',
          city: 'Origin City'
        },
        arrival: {
          airport: requestData.destination,
          time: '18:45',
          city: 'Destination City'
        },
        duration: '4h 15m',
        stops: 0,
        price: 425,
        class: requestData.cabin || 'economy',
        amenities: ['WiFi', 'Meals', 'Entertainment']
      }
    ]

    const mockReturnFlights = requestData.returnDate ? [
      {
        id: 'mock-return-1',
        airline: 'American Airlines',
        flightNumber: 'AA124',
        departure: {
          airport: requestData.destination,
          time: '10:00',
          city: 'Destination City'
        },
        arrival: {
          airport: requestData.origin,
          time: '14:15',
          city: 'Origin City'
        },
        duration: '4h 15m',
        stops: 0,
        price: 375,
        class: requestData.cabin || 'economy',
        amenities: ['WiFi', 'In-flight Entertainment']
      },
      {
        id: 'mock-return-2',
        airline: 'Delta Airlines', 
        flightNumber: 'DL457',
        departure: {
          airport: requestData.destination,
          time: '16:20',
          city: 'Destination City'
        },
        arrival: {
          airport: requestData.origin,
          time: '20:50',
          city: 'Origin City'
        },
        duration: '4h 30m',
        stops: 0,
        price: 450,
        class: requestData.cabin || 'economy',
        amenities: ['WiFi', 'Meals', 'Entertainment']
      }
    ] : []

    const responseData = {
      outbound: mockOutboundFlights,
      return: mockReturnFlights
    }

    console.log('[flights-search] Returning mock flight data:', {
      outboundCount: responseData.outbound.length,
      returnCount: responseData.return.length
    })

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('[flights-search] Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Flight search failed', 
        message: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})