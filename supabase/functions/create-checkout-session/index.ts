import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.0.0';

const stripe = new Stripe(Deno.env.get('TESTING_STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { offerId, passengers, totalAmount, currency, offerData } = await req.json();

    console.log('[create-checkout] Creating session for offer:', offerId);
    console.log('[create-checkout] Amount:', totalAmount, currency);
    console.log('[create-checkout] Passengers:', passengers.length);
    console.log('[create-checkout] Note: Services will be saved separately via set-booking-services');

    if (!offerId || !passengers || !totalAmount || !currency) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const origin = offerData?.slices?.[0]?.origin?.iata_code || 'Origin';
    const destination = offerData?.slices?.[offerData.slices.length - 1]?.destination?.iata_code || 'Destination';
    const passengerCount = passengers.length;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Flight: ${origin} → ${destination}`,
              description: `${passengerCount} passenger${passengerCount > 1 ? 's' : ''}`,
            },
            unit_amount: Math.round(parseFloat(totalAmount) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/passenger-details?canceled=true`,
      metadata: {
        offerId,
        passengers: JSON.stringify(passengers),
        offerData: JSON.stringify(offerData),
      },
    });

    console.log('[create-checkout] Session created:', session.id);

    return new Response(
      JSON.stringify({ 
        sessionId: session.id, 
        url: session.url 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[create-checkout] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
