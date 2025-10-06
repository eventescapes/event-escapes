import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Service {
  id: string;
  type: 'seat' | 'baggage';
  quantity?: number;
  passenger_id: string;
}

interface RequestBody {
  sessionId: string;
  services: Service[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sessionId, services }: RequestBody = await req.json();
    
    console.log('💺 Setting booking services for session:', sessionId);
    console.log('💺 Services:', JSON.stringify(services, null, 2));

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'sessionId is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Store services in Deno KV (persistent key-value store)
    const kv = await Deno.openKv();
    await kv.set(['booking_services', sessionId], {
      services: services || [],
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Services saved successfully for session:', sessionId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sessionId,
        servicesCount: services?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error setting booking services:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
