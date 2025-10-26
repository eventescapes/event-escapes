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
    const { offerId, passengers, services, servicesWithDetails, flightPrice, seatsTotal, baggageTotal, totalAmount, currency, offerData } = await req.json();

    if (!offerId || !passengers || !totalAmount || !currency) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const origin = offerData?.slices?.[0]?.origin?.iata_code || 'Origin';
    const destination = offerData?.slices?.[offerData.slices.length - 1]?.destination?.iata_code || 'Destination';
    const passengerCount = passengers.length;

    // Build line items with separate entries for flight, seats, and baggage
    const lineItems = [];
    
    // Flight line item
    const flightAmount = parseFloat(flightPrice || totalAmount);
    lineItems.push({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: `Flight: ${origin} → ${destination}`,
          description: `${passengerCount} passenger${passengerCount > 1 ? 's' : ''}`,
        },
        unit_amount: Math.round(flightAmount * 100),
      },
      quantity: 1,
    });

    // Seats line item
    const seatsCost = parseFloat(seatsTotal || '0');
    if (seatsCost > 0) {
      lineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: 'Seat Selection',
            description: 'Selected seats for your flight',
          },
          unit_amount: Math.round(seatsCost * 100),
        },
        quantity: 1,
      });
    }

    // Baggage line item
    const baggageCost = parseFloat(baggageTotal || '0');
    if (baggageCost > 0) {
      lineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: 'Checked Baggage',
            description: 'Additional checked baggage',
          },
          unit_amount: Math.round(baggageCost * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/passenger-details?canceled=true`,
      metadata: {
        offerId,
        passengers: JSON.stringify(passengers),
        services: JSON.stringify(servicesWithDetails || services || []),
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
