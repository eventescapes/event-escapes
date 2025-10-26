import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.0.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature!,
        Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      );
    } catch (err: any) {
      console.error(
        "[stripe-webhook] Signature verification failed:",
        err.message,
      );
      return new Response(
        JSON.stringify({ error: "Webhook signature verification failed" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("[stripe-webhook] Event received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("[stripe-webhook] Payment successful:", session.id);
      console.log(
        "[stripe-webhook] Amount:",
        (session.amount_total || 0) / 100,
        session.currency,
      );

      try {
        const { offerId, passengers, services } = session.metadata || {};

        if (!offerId || !passengers) {
          throw new Error("Missing booking data in session metadata");
        }

        const parsedPassengers = JSON.parse(passengers);
        const parsedServices = services ? JSON.parse(services) : [];

        console.log("[stripe-webhook] Passengers:", parsedPassengers.length);
        console.log(
          "[stripe-webhook] Services:",
          JSON.stringify(parsedServices),
        );

        const duffelPassengers = parsedPassengers.map((p: any) => {
          const passenger: any = {
            id: p.id,
            title: p.title,
            given_name: p.given_name,
            family_name: p.family_name,
            gender: p.gender,
            born_on: p.born_on,
            email: p.email,
            phone_number: p.phone_number,
          };

          if (p.identity_documents?.length > 0) {
            passenger.identity_documents = p.identity_documents;
          }

          if (p.loyalty_programme_accounts?.length > 0) {
            passenger.loyalty_programme_accounts = p.loyalty_programme_accounts;
          }

          return passenger;
        });

        console.log("[stripe-webhook] Creating Duffel order...");

        const duffelResponse = await fetch(
          "https://api.duffel.com/air/orders",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "Duffel-Version": "v2",
              Authorization: `Bearer ${Deno.env.get("DUFFEL_ACCESS_TOKEN")}`,
            },
            body: JSON.stringify({
              data: {
                selected_offers: [offerId],
                passengers: duffelPassengers,
                type: "instant",
                payments: [
                  {
                    type: "balance",
                    amount: ((session.amount_total || 0) / 100).toString(),
                    currency: (session.currency || "usd").toUpperCase(),
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
          },
        );

        if (!duffelResponse.ok) {
          const errorData = await duffelResponse.json();
          console.error("[stripe-webhook] Duffel error:", errorData);
          throw new Error(
            `Duffel booking failed: ${errorData.errors?.[0]?.message || "Unknown error"}`,
          );
        }

        const duffelData = await duffelResponse.json();
        const order = duffelData.data;

        console.log("[stripe-webhook] Order created:", order.id);
        console.log(
          "[stripe-webhook] Booking reference:",
          order.booking_reference,
        );

        const enrichedServices = parsedServices.map((service: any) => ({
          id: service.id,
          type: service.type,
          quantity: service.quantity || 1,
          amount: service.amount || 0,
          designator: service.designator || null,
        }));

        const kv = await Deno.openKv();
        await kv.set(["booking_status", session.id], {
          status: "confirmed",
          booking_reference: order.booking_reference,
          duffel_order_id: order.id,
          amount: parseFloat(order.total_amount),
          currency: order.total_currency.toUpperCase(),
          passengers_data: duffelPassengers,
          services_data: enrichedServices,
          primary_email: duffelPassengers[0]?.email || "",
          timestamp: new Date().toISOString(),
        });

        console.log("[stripe-webhook] Success!");
      } catch (error: any) {
        console.error("[stripe-webhook] Error:", error);

        try {
          const kv = await Deno.openKv();
          await kv.set(["booking_status", session.id], {
            status: "failed",
            error: error.message || "Booking creation failed",
            timestamp: new Date().toISOString(),
          });
        } catch (kvError) {
          console.error("[stripe-webhook] KV error:", kvError);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[stripe-webhook] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
