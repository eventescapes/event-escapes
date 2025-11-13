import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DUFFEL_API_KEY = Deno.env.get('DUFFEL_API_KEY');
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    const { offer_id } = await req.json();

    if (!offer_id) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing offer_id parameter' 
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN
          } 
        }
      );
    }

    console.log(`🔍 Fetching fresh offer from Duffel: ${offer_id}`);

    // Fetch current offer from Duffel
    const response = await fetch(
      `https://api.duffel.com/air/offers/${offer_id}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${DUFFEL_API_KEY}`,
          'Duffel-Version': 'v2'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Duffel API error:', errorData);
      
      // Handle specific error codes
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'offer_expired',
            message: 'This offer has expired. Please search again.'
          }),
          { 
            status: 404, 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': ALLOWED_ORIGIN
            } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'offer_unavailable',
          message: 'Unable to retrieve offer. Please try again.'
        }),
        { 
          status: response.status, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN
          } 
        }
      );
    }

    const result = await response.json();
    const offer = result.data;

    console.log('✅ Fresh offer retrieved successfully');
    console.log(`   Price: ${offer.total_amount} ${offer.total_currency}`);
    console.log(`   Expires: ${offer.expires_at}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        offer: offer
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN
        } 
      }
    );

  } catch (error) {
    console.error('❌ Error in duffel_get_offer:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'internal_error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN
        } 
      }
    );
  }
});

