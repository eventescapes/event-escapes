import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DUFFEL_API_KEY = Deno.env.get('DUFFEL_API_KEY');

interface RequestBody {
  offerId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { offerId }: RequestBody = await req.json();
    
    console.log('🎫 Fetching offer lite for:', offerId);

    if (!offerId) {
      return new Response(
        JSON.stringify({ error: 'offerId is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!DUFFEL_API_KEY) {
      throw new Error('DUFFEL_API_KEY not configured');
    }

    // Fetch offer from Duffel API
    const response = await fetch(`https://api.duffel.com/air/offers/${offerId}`, {
      headers: {
        'Authorization': `Bearer ${DUFFEL_API_KEY}`,
        'Duffel-Version': 'v2',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Duffel API error:', errorData);
      throw new Error(`Duffel API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Offer fetched successfully');

    // Extract just the passenger IDs and types
    const passengers = data.data?.passengers?.map((p: any) => ({
      id: p.id,
      type: p.type,
      given_name: p.given_name,
      family_name: p.family_name
    })) || [];

    console.log('🎫 Passengers:', JSON.stringify(passengers, null, 2));

    return new Response(
      JSON.stringify({ 
        passengers,
        offerId: data.data?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error fetching offer lite:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
