const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EdgeFunctionSearchRequest {
  tripType: 'one-way' | 'return' | 'multi-city';
  slices: Array<{
    origin: string;
    destination: string;
    departureDate: string;
    departureTime?: { from?: string; to?: string };
    arrivalTime?: { from?: string; to?: string };
  }>;
  passengers: {
    adults: number;
    children?: number;
    infants?: number;
  };
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
  maxConnections?: 0 | 1 | 2;
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

    const DUFFEL_API_KEY = Deno.env.get('DUFFEL_API_KEY')
    if (!DUFFEL_API_KEY) {
      throw new Error('DUFFEL_API_KEY not configured')
    }

    const body = await req.text()
    console.log(`[flights-search] Payload size: ${body.length} bytes`)
    
    const requestData: EdgeFunctionSearchRequest = JSON.parse(body)
    console.log('[flights-search] Request data:', JSON.stringify(requestData, null, 2))

    // Build passengers array for Duffel
    const passengers: Array<{ type: string }> = []
    for (let i = 0; i < requestData.passengers.adults; i++) {
      passengers.push({ type: 'adult' })
    }
    if (requestData.passengers.children) {
      for (let i = 0; i < requestData.passengers.children; i++) {
        passengers.push({ type: 'child' })
      }
    }
    if (requestData.passengers.infants) {
      for (let i = 0; i < requestData.passengers.infants; i++) {
        passengers.push({ type: 'infant_without_seat' })
      }
    }

    // Build Duffel offer request
    const duffelRequest = {
      data: {
        slices: requestData.slices.map(slice => ({
          origin: slice.origin,
          destination: slice.destination,
          departure_date: slice.departureDate,
        })),
        passengers,
        cabin_class: requestData.cabinClass || 'economy',
        max_connections: requestData.maxConnections ?? 1,
      }
    }

    console.log('[flights-search] Calling Duffel API with:', JSON.stringify(duffelRequest, null, 2))

    // Call Duffel API
    const duffelResponse = await fetch('https://api.duffel.com/air/offer_requests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DUFFEL_API_KEY}`,
        'Duffel-Version': 'v2',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(duffelRequest),
    })

    if (!duffelResponse.ok) {
      const errorText = await duffelResponse.text()
      console.error('[flights-search] Duffel API error:', errorText)
      throw new Error(`Duffel API returned ${duffelResponse.status}: ${errorText}`)
    }

    const duffelData = await duffelResponse.json()
    console.log('[flights-search] Duffel response:', {
      offersCount: duffelData.data?.offers?.length || 0,
      requestId: duffelData.data?.id
    })

    // Transform Duffel response to our format
    const offers = (duffelData.data?.offers || []).map((offer: any) => ({
      id: offer.id,
      slices: offer.slices.map((slice: any, index: number) => ({
        slice_index: index,
        origin: slice.origin.iata_code,
        destination: slice.destination.iata_code,
        departure_time: slice.segments[0]?.departing_at,
        arrival_time: slice.segments[slice.segments.length - 1]?.arriving_at,
        duration: slice.duration,
        segments: slice.segments.map((seg: any) => ({
          airline: seg.marketing_carrier.name,
          airline_code: seg.marketing_carrier.iata_code,
          flight_number: seg.marketing_carrier_flight_number,
          aircraft: seg.aircraft?.name || 'Unknown',
          origin: seg.origin.iata_code,
          destination: seg.destination.iata_code,
          departing_at: seg.departing_at,
          arriving_at: seg.arriving_at,
          duration: seg.duration,
          origin_terminal: seg.origin_terminal,
          destination_terminal: seg.destination_terminal,
        })),
        stops: slice.segments.length - 1,
      })),
      total_amount: parseFloat(offer.total_amount),
      total_currency: offer.total_currency,
      expires_at: offer.expires_at,
      cabin_class: offer.cabin_class || requestData.cabinClass || 'economy',
      available_services: offer.available_services || [],
      passengers: offer.passengers,
      passenger_identity_documents_required: offer.passenger_identity_documents_required,
      owner: offer.owner,
      conditions: offer.conditions,
    }))

    console.log(`[flights-search] ✅ Fetched ${offers.length} offers from Duffel`)

    const responseData = {
      success: true,
      trip_type: requestData.tripType,
      offers,
      total_offers: offers.length,
      search_params: {
        cabin_class: requestData.cabinClass || 'economy',
        max_connections: requestData.maxConnections ?? 1,
        passengers: requestData.passengers,
      },
    }

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
        success: false,
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
