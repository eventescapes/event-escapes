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
  after?: string; // Pagination cursor
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✈️ [flights-search] CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  console.log(`✈️ [flights-search] ${req.method} request from origin: ${req.headers.get('origin')}`)

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const DUFFEL_API_KEY = Deno.env.get('DUFFEL_API_KEY')
    if (!DUFFEL_API_KEY) {
      throw new Error('DUFFEL_API_KEY not configured')
    }

    const body = await req.text()
    console.log(`📦 [flights-search] Payload size: ${body.length} bytes`)
    
    const requestData: EdgeFunctionSearchRequest = JSON.parse(body)
    console.log('🔍 [flights-search] Request data:', JSON.stringify(requestData, null, 2))

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

    // STEP 1: Create offer request (or use existing one if we have an 'after' cursor)
    let offerRequestId = requestData.after ? null : null; // We'll need to track this differently
    
    // For pagination, we need to store the offer_request_id somewhere or pass it
    // For now, we'll always create a new offer request and fetch the first page
    // In production, you'd want to cache the offer_request_id
    
    if (!requestData.after) {
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

      console.log('🚀 [flights-search] Creating Duffel offer request:', JSON.stringify(duffelRequest, null, 2))

      // STEP 1: Create offer request
      const createRequestResponse = await fetch('https://api.duffel.com/air/offer_requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DUFFEL_API_KEY}`,
          'Duffel-Version': 'v2',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(duffelRequest),
      })

      if (!createRequestResponse.ok) {
        const errorText = await createRequestResponse.text()
        console.error('❌ [flights-search] Duffel offer request creation error:', errorText)
        throw new Error(`Duffel API returned ${createRequestResponse.status}: ${errorText}`)
      }

      const createRequestData = await createRequestResponse.json()
      offerRequestId = createRequestData.data.id
      console.log(`✅ [flights-search] Created offer request: ${offerRequestId}`)
    }

    // For pagination to work properly, we need to pass the offer_request_id
    // Since we can't easily do this without state, let's include it in the 'after' parameter
    // Format: "offer_request_id:cursor" or just the offer_request_id for first page
    
    let actualOfferId = offerRequestId;
    let cursorToken = null;
    
    if (requestData.after) {
      // Parse the combined token
      const parts = requestData.after.split(':');
      if (parts.length === 2) {
        actualOfferId = parts[0];
        cursorToken = parts[1];
      } else {
        actualOfferId = requestData.after;
      }
    }

    // STEP 2: Fetch offers from the offer request with pagination
    const offersUrl = new URL(`https://api.duffel.com/air/offer_requests/${actualOfferId}/offers`);
    offersUrl.searchParams.set('limit', '50');
    offersUrl.searchParams.set('sort', 'total_amount'); // Cheapest first
    if (cursorToken) {
      offersUrl.searchParams.set('after', cursorToken);
    }

    console.log(`🔎 [flights-search] Fetching offers: ${offersUrl.toString()}`)

    const offersResponse = await fetch(offersUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DUFFEL_API_KEY}`,
        'Duffel-Version': 'v2',
        'Accept': 'application/json',
      },
    })

    if (!offersResponse.ok) {
      const errorText = await offersResponse.text()
      console.error('❌ [flights-search] Duffel offers fetch error:', errorText)
      throw new Error(`Duffel offers API returned ${offersResponse.status}: ${errorText}`)
    }

    const offersData = await offersResponse.json()
    console.log('📊 [flights-search] Duffel offers response:', {
      offersCount: offersData.data?.length || 0,
      hasMore: !!offersData.meta?.after,
      after: offersData.meta?.after
    })

    // Transform Duffel response to our format
    const offers = (offersData.data || []).map((offer: any) => ({
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

    console.log(`✅ [flights-search] Fetched ${offers.length} offers from Duffel`)

    // Build the next cursor token
    let nextAfter = null;
    if (offersData.meta?.after) {
      // Combine offer_request_id with cursor for pagination
      nextAfter = `${actualOfferId}:${offersData.meta.after}`;
    }

    const responseData = {
      success: true,
      trip_type: requestData.tripType,
      offers,
      after: nextAfter, // Pagination cursor
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
    console.error('❌ [flights-search] Error:', error)
    
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
