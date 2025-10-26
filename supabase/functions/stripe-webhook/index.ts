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
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature!,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')!
      );
    } catch (err: any) {
      console.error('[stripe-webhook] Signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[stripe-webhook] Event received:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('[stripe-webhook] Payment successful:', session.id);
      console.log('[stripe-webhook] Amount:', (session.amount_total || 0) / 100, session.currency);

      try {
        const { offerId, passengers, services } = session.metadata || {};
        
        if (!offerId || !passengers) {
          throw new Error('Missing booking data in session metadata');
        }

        const parsedPassengers = JSON.parse(passengers);
        const parsedServices = services ? JSON.parse(services) : [];
        
        console.log('[stripe-webhook] Passengers:', parsedPassengers.length);
        console.log('[stripe-webhook] Services from metadata:', JSON.stringify(parsedServices, null, 2));

        console.log('[stripe-webhook] Creating Duffel order for offer:', offerId);

        const duffelPassengers = parsedPassengers.map((p: any) => {
          const passenger: any = {
            id: p.id,
            title: p.title,
            given_name: p.givenName,
            family_name: p.familyName,
            gender: p.gender,
            born_on: p.bornOn,
            email: p.email,
            phone_number: p.phoneNumber,
          };

          if (p.identityDocuments?.length > 0 && p.identityDocuments[0].uniqueIdentifier) {
            passenger.identity_documents = p.identityDocuments.map((doc: any) => ({
              unique_identifier: doc.uniqueIdentifier,
              type: doc.type || 'passport',
              issuing_country_code: doc.issuingCountryCode,
              expires_on: doc.expiresOn,
            }));
          }

          if (p.loyaltyProgrammeAccounts?.length > 0 && p.loyaltyProgrammeAccounts[0].accountNumber) {
            passenger.loyalty_programme_accounts = p.loyaltyProgrammeAccounts.map((loy: any) => ({
              airline_iata_code: loy.airlineIataCode,
              account_number: loy.accountNumber,
            }));
          }

          return passenger;
        });

        const duffelResponse = await fetch('https://api.duffel.com/air/orders', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Duffel-Version': 'v2',
            'Authorization': `Bearer ${Deno.env.get('DUFFEL_API_KEY')}`,
          },
          body: JSON.stringify({
            data: {
              selected_offers: [offerId],
              passengers: duffelPassengers,
              type: 'instant',
              payments: [
                {
                  type: 'balance',
                  amount: ((session.amount_total || 0) / 100).toString(),
                  currency: (session.currency || 'usd').toUpperCase(),
                },
              ],
              ...(parsedServices.length > 0 && {
                services: parsedServices.map((s: any) => ({
                  id: s.id,
                  quantity: s.quantity || 1,
                })),
              }),
            },
          }),
        });

        if (!duffelResponse.ok) {
          const errorData = await duffelResponse.json();
          console.error('[stripe-webhook] Duffel error:', errorData);
          throw new Error(`Duffel booking failed: ${errorData.errors?.[0]?.message || 'Unknown error'}`);
        }

        const duffelData = await duffelResponse.json();
        const order = duffelData.data;

        console.log('[stripe-webhook] Duffel order created:', order.id);
        console.log('[stripe-webhook] Booking reference:', order.booking_reference);
        console.log('[stripe-webhook] Order amount:', order.total_amount, order.total_currency);
        console.log('[stripe-webhook] Order creation successful!');

        // Parse offer data from metadata
        const offerData = session.metadata?.offerData ? JSON.parse(session.metadata.offerData) : null;

        // Enrich services data with descriptions and prices from original services
        const enrichedServices = parsedServices.map((service: any) => ({
          id: service.id,
          type: service.type,
          quantity: service.quantity || 1,
          description: service.description || `${service.type} service`,
          // Try to get amount from service, fall back to 0
          amount: service.amount || service.price || 0,
          currency: service.currency || (session.currency || 'usd').toUpperCase()
        }));

        // Store complete booking status in Deno KV for polling
        const kv = await Deno.openKv();
        await kv.set(['booking_status', session.id], {
          status: 'confirmed',
          booking_reference: order.booking_reference,
          duffel_order_id: order.id,
          amount: parseFloat(order.total_amount),  // Use Duffel order amount
          currency: order.total_currency.toUpperCase(),  // Use Duffel currency
          offer_data: offerData,
          passengers_data: duffelPassengers,  // Use snake_case passengers (not parsedPassengers!)
          services_data: enrichedServices,  // Use enriched services with full details
          primary_email: duffelPassengers[0]?.email || '',
          timestamp: new Date().toISOString()
        });
        console.log('[stripe-webhook] Complete booking data stored for session:', session.id);

      } catch (error: any) {
        console.error('[stripe-webhook] Error processing payment:', error);
        
        // Store failure status in Deno KV for polling
        try {
          const kv = await Deno.openKv();
          await kv.set(['booking_status', session.id], {
            status: 'failed',
            error: error.message || 'Booking creation failed',
            timestamp: new Date().toISOString()
          });
          console.log('[stripe-webhook] Failure status stored for session:', session.id);
        } catch (kvError) {
          console.error('[stripe-webhook] Failed to store failure status:', kvError);
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[stripe-webhook] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
