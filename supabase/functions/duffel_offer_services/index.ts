import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DUFFEL_API_KEY = Deno.env.get('DUFFEL_API_KEY');
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*';

console.log('🚀 duffel_offer_services function started');

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { offer_id } = await req.json();

    if (!offer_id) {
      console.error('❌ No offer_id provided');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'offer_id is required' 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          },
        }
      );
    }

    if (!DUFFEL_API_KEY) {
      console.error('❌ DUFFEL_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error' 
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          },
        }
      );
    }

    console.log('🔍 Fetching offer services for:', offer_id);

    // CRITICAL FIX: Add return_available_services=true parameter
    // This tells Duffel to include baggage and seat services in the response
    const offerResponse = await fetch(
      `https://api.duffel.com/air/offers/${offer_id}?return_available_services=true`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Duffel-Version': 'v1',
          'Authorization': `Bearer ${DUFFEL_API_KEY}`,
        },
      }
    );

    if (!offerResponse.ok) {
      const errorText = await offerResponse.text();
      console.error('❌ Duffel API error:', offerResponse.status, errorText);
      
      // Handle specific error cases
      if (offerResponse.status === 404) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Offer not found or expired',
            status: 404
          }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            },
          }
        );
      }

      if (offerResponse.status === 422) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Offer is no longer available',
            status: 422
          }),
          {
            status: 422,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            },
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch offer services',
          details: errorText
        }),
        {
          status: offerResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          },
        }
      );
    }

    const offerData = await offerResponse.json();
    const offer = offerData.data;

    console.log('✅ Offer fetched successfully');
    console.log('📦 Available services:', {
      baggage: offer.available_services?.baggage?.length || 0,
      seats: offer.available_services?.seat?.length || 0,
    });

    // Extract relevant data
    const baggageServices = (offer.available_services?.baggage || []).map((service: any) => {
      const price = service.price ?? service.total_amount ?? service.amount ?? null;
      const currency = service.currency ?? service.total_currency ?? offer.total_currency ?? offer.currency ?? 'USD';

      return {
        ...service,
        price,
        currency,
        total_amount: service.total_amount ?? price,
        amount: service.amount ?? price,
        total_currency: service.total_currency ?? currency,
      };
    });

    const seatServices = (offer.available_services?.seat || []).map((service: any) => {
      const price = service.price ?? service.total_amount ?? service.amount ?? null;
      const currency = service.currency ?? service.total_currency ?? offer.total_currency ?? offer.currency ?? 'USD';

      return {
        ...service,
        price,
        currency,
        total_amount: service.total_amount ?? price,
        amount: service.amount ?? price,
        total_currency: service.total_currency ?? currency,
      };
    });

    const response = {
      success: true,
      offer_id: offer.id,
      passengers: offer.passengers || [],
      slices: offer.slices || [],
      available_services: {
        baggage: baggageServices,
        seat: seatServices,
      },
      // Include baggage allowances (free baggage included with ticket)
      included_baggage: [],
    };

    // Extract included baggage from slices
    if (offer.slices) {
      offer.slices.forEach((slice: any) => {
        if (slice.segments) {
          slice.segments.forEach((segment: any) => {
            if (segment.passengers) {
              segment.passengers.forEach((passenger: any) => {
                if (passenger.baggages) {
                  passenger.baggages.forEach((baggage: any) => {
                    response.included_baggage.push({
                      passenger_id: passenger.passenger_id,
                      type: baggage.type,
                      quantity: baggage.quantity,
                    });
                  });
                }
              });
            }
          });
        }
      });
    }

    console.log('✅ Response prepared:', {
      passengers: response.passengers.length,
      slices: response.slices.length,
      baggage_services: response.available_services.baggage.length,
      seat_services: response.available_services.seat.length,
      included_baggage: response.included_baggage.length,
    });

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        },
      }
    );

  } catch (error) {
    console.error('❌ Error in duffel_offer_services:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        },
      }
    );
  }
});

