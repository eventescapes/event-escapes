import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'Pragma': 'no-cache',
};

interface RequestBody {
  sessionId: string;
}

interface BookingStatus {
  status: 'processing' | 'confirmed' | 'failed';
  booking_reference?: string;
  duffel_order_id?: string;
  error?: string;
  timestamp?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sessionId }: RequestBody = await req.json();
    
    console.log('🔍 Checking booking status for session:', sessionId);

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'sessionId is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Retrieve booking status from Deno KV
    const kv = await Deno.openKv();
    const result = await kv.get<BookingStatus>(['booking_status', sessionId]);
    
    if (!result.value) {
      console.log('⏳ Booking status not found, returning processing');
      return new Response(
        JSON.stringify({ 
          status: 'processing',
          message: 'Booking is being processed'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const bookingStatus = result.value;
    console.log('✅ Booking status:', bookingStatus);

    return new Response(
      JSON.stringify(bookingStatus),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error checking booking status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
