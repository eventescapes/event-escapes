import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertBookingSchema, insertBookingItemSchema } from "@shared/schema";
import { getSupabaseConfig } from "./supabase-config";
import { z } from "zod";
import { ServerEnv, assertSecretsReady } from "./env";

// Initialize Stripe only if the secret key is available
let stripe: Stripe | null = null;
assertSecretsReady(["STRIPE_SECRET_KEY"]);
if (ServerEnv.STRIPE_SECRET_KEY) {
  stripe = new Stripe(ServerEnv.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
  });
  console.log("✓ Stripe integration enabled");
} else {
  console.log("⚠ Stripe integration disabled - payment routes will be unavailable");
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Supabase configuration endpoint
  app.get("/api/config/supabase", (req, res) => {
    try {
      const config = getSupabaseConfig();
      res.json({
        url: config.url,
        anonKey: config.anonKey,
        isConfigured: config.isConfigured
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error getting Supabase config: " + error.message });
    }
  });

  // Events
  app.get("/api/events", async (req, res) => {
    try {
      const { city, category, startDate, endDate, limit } = req.query;
      
      const filters: any = {};
      if (city) filters.city = city as string;
      if (category) filters.category = category as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (limit) filters.limit = parseInt(limit as string);
      
      const events = await storage.getEvents(filters);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching events: " + error.message });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching event: " + error.message });
    }
  });

  // Duffel Seat Map API
  app.get("/api/seat-maps/:offerId", async (req, res) => {
    try {
      const { offerId } = req.params;
      
      if (!offerId) {
        return res.status(400).json({ message: "Offer ID is required" });
      }
      
      assertSecretsReady(["DUFFEL_API_KEY"]);
      if (!ServerEnv.DUFFEL_API_KEY) {
        return res.status(500).json({ message: "Duffel API key not configured" });
      }
      
      const response = await fetch(`https://api.duffel.com/air/seat_maps?offer_id=${offerId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${ServerEnv.DUFFEL_API_KEY}`,
          "Duffel-Version": "v2",
          "Content-Type": "application/json",
          "Accept-Encoding": "gzip"
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Duffel API error:', response.status, errorText);
        return res.status(response.status).json({ 
          message: "Failed to fetch seat map from Duffel API",
          error: errorText 
        });
      }
      
      const seatMapData = await response.json();
      res.json(seatMapData);
      
    } catch (error: any) {
      console.error('Seat map fetch error:', error);
      res.status(500).json({ message: "Error fetching seat map: " + error.message });
    }
  });

  // Hotels search (mock for now - would integrate with RateHawk/WebBeds)
  app.get("/api/hotels/search", async (req, res) => {
    try {
      const { eventId, checkIn, checkOut, guests } = req.query;
      
      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
      }

      const event = await storage.getEvent(eventId as string);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Mock hotel data with distance calculations
      const mockHotels = [
        {
          id: "hotel-1",
          name: "The Plaza Hotel",
          address: "768 5th Ave, New York, NY 10019",
          rating: 5,
          pricePerNight: 299,
          distanceFromVenue: 350,
          amenities: ["Free WiFi", "Spa", "Restaurant", "Fitness Center"],
          imageUrl: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
          freeCancellation: true,
        },
        {
          id: "hotel-2",
          name: "Pod Hotels Midtown",
          address: "247 W 46th St, New York, NY 10036",
          rating: 4,
          pricePerNight: 149,
          distanceFromVenue: 800,
          amenities: ["Free WiFi", "Rooftop Bar", "24/7 Front Desk"],
          imageUrl: "https://images.unsplash.com/photo-1568495248636-6432b97bd949?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
          freeCancellation: true,
        },
        {
          id: "hotel-3",
          name: "HI New York City Hostel",
          address: "891 Amsterdam Ave, New York, NY 10025",
          rating: 3,
          pricePerNight: 79,
          distanceFromVenue: 1200,
          amenities: ["Free WiFi", "Shared Kitchen", "Laundry"],
          imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
          freeCancellation: false,
        },
      ];

      // Sort by distance from venue
      const sortedHotels = mockHotels.sort((a, b) => a.distanceFromVenue - b.distanceFromVenue);
      
      res.json({
        hotels: sortedHotels,
        eventDetails: {
          name: event.title,
          venue: event.venue,
          latitude: event.latitude,
          longitude: event.longitude,
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error searching hotels: " + error.message });
    }
  });

  // Flights search (would integrate with existing Supabase Edge Functions)
  app.get("/api/flights/search", async (req, res) => {
    try {
      const { from, to, departureDate, returnDate, passengers } = req.query;
      
      // Mock flight data - in production this would call Supabase Edge Functions
      const mockFlights = {
        outbound: [
          {
            id: "flight-out-1",
            airline: "American Airlines",
            flightNumber: "AA1234",
            departure: { airport: "LAX", time: "08:00", city: "Los Angeles" },
            arrival: { airport: "JFK", time: "16:30", city: "New York" },
            duration: "5h 30m",
            stops: 0,
            price: 299,
            class: "Economy",
            amenities: ["Personal item included", "Carry-on bag included", "Seat selection available"]
          },
          {
            id: "flight-out-2",
            airline: "Delta Airlines",
            flightNumber: "DL5678",
            departure: { airport: "LAX", time: "11:15", city: "Los Angeles" },
            arrival: { airport: "LGA", time: "22:00", city: "New York" },
            duration: "7h 45m",
            stops: 1,
            price: 249,
            class: "Economy",
            amenities: ["Personal item included", "Carry-on bag included", "Free snacks & drinks"]
          }
        ],
        return: [
          {
            id: "flight-ret-1",
            airline: "American Airlines",
            flightNumber: "AA4321",
            departure: { airport: "JFK", time: "19:00", city: "New York" },
            arrival: { airport: "LAX", time: "22:15", city: "Los Angeles" },
            duration: "6h 15m",
            stops: 0,
            price: 329,
            class: "Economy",
            amenities: ["Personal item included", "Carry-on bag included", "Seat selection available"]
          }
        ]
      };

      res.json(mockFlights);
    } catch (error: any) {
      res.status(500).json({ message: "Error searching flights: " + error.message });
    }
  });

  // Bookings
  app.post("/api/bookings", async (req, res) => {
    try {
      // Parse basic booking data and separate flight/seat data
      const { flightData, selectedSeats, ...bookingInfo } = req.body;
      const bookingData = insertBookingSchema.parse(bookingInfo);
      
      // Create the main booking record
      const booking = await storage.createBooking(bookingData);
      console.log(`[Booking] Created booking ${booking.id} for ${booking.guestEmail}`);
      
      // If flight data is provided, create booking items for flights
      if (flightData && flightData.offerId) {
        console.log(`[Booking] Adding flight item with offer_id: ${flightData.offerId}`);
        
        // Create flight booking item with Duffel offer data
        const flightBookingItem = {
          bookingId: booking.id,
          type: "flight",
          itemId: flightData.offerId, // Store Duffel offer_id
          details: {
            offerId: flightData.offerId,
            slices: flightData.slices || [],
            currency: flightData.currency,
            passengers: flightData.passengers,
            selectedSeats: selectedSeats || {},
            tripType: flightData.tripType,
            searchParams: flightData.searchParams
          },
          quantity: 1,
          unitPrice: flightData.totalPrice || 0,
          totalPrice: flightData.totalPrice || 0
        };
        
        await storage.createBookingItem(flightBookingItem);
        console.log(`[Booking] Added flight booking item for offer ${flightData.offerId}`);
      }
      
      res.json(booking);
    } catch (error: any) {
      console.error("[Booking] Error creating booking:", error);
      res.status(400).json({ message: "Error creating booking: " + error.message });
    }
  });

  app.post("/api/bookings/:id/items", async (req, res) => {
    try {
      const itemData = insertBookingItemSchema.parse({
        ...req.body,
        bookingId: req.params.id
      });
      const item = await storage.createBookingItem(itemData);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: "Error adding booking item: " + error.message });
    }
  });

  app.get("/api/bookings/search", async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const bookings = await storage.getBookingsByEmail(email as string);
      
      // Get booking items for each booking
      const bookingsWithItems = await Promise.all(
        bookings.map(async (booking) => {
          const items = await storage.getBookingItems(booking.id);
          return { ...booking, items };
        })
      );
      
      res.json(bookingsWithItems);
    } catch (error: any) {
      res.status(500).json({ message: "Error searching bookings: " + error.message });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const items = await storage.getBookingItems(booking.id);
      res.json({ ...booking, items });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching booking: " + error.message });
    }
  });

  // Stripe payment route for one-time payments
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          message: "Payment processing is currently unavailable. Stripe integration is disabled." 
        });
      }

      const { amount, bookingId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: bookingId ? { bookingId } : {},
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Webhook for payment confirmation
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      if (!stripe) {
        console.log("Stripe webhook received but Stripe integration is disabled");
        return res.status(200).send("OK");
      }

      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = ServerEnv.STRIPE_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.log("Webhook secret not configured, skipping verification");
        return res.status(200).send("OK");
      }
      
      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.log(`Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.bookingId;
        
        if (bookingId) {
          await storage.updateBookingStatus(bookingId, "confirmed", paymentIntent.id);
        }
      }
      
      res.status(200).send("OK");
    } catch (error: any) {
      res.status(500).json({ message: "Webhook error: " + error.message });
    }
  });

  // Cart Session API (for flight offer persistence)
  app.post("/api/cart/select", async (req, res) => {
    try {
      const { session_id, offer } = req.body || {};
      if (!session_id || !offer?.id) {
        return res.status(400).json({ error: 'session_id and offer.id required' });
      }

      const expires_at = new Date(Date.now() + 25 * 60 * 1000);
      await storage.upsertCartSession({
        sessionId: session_id,
        duffelOfferId: offer.id,
        offerJson: offer,
        currency: offer.total_currency ?? 'AUD',
        expiresAt: expires_at,
      });

      return res.json({ ok: true, session_id, expires_at: expires_at.toISOString() });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/cart/:sid", async (req, res) => {
    try {
      const cart = await storage.getCartSession(req.params.sid);
      if (!cart) {
        return res.status(404).json({ error: 'Cart session not found' });
      }
      return res.json({ cart });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/cart/:sid/expire", async (req, res) => {
    try {
      const { minutes = 25 } = req.body || {};
      const expires_at = new Date(Date.now() + minutes * 60 * 1000);
      await storage.updateCartSessionExpiry(req.params.sid, expires_at);
      return res.json({ ok: true, expires_at: expires_at.toISOString() });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/cart/:sid", async (req, res) => {
    try {
      await storage.deleteCartSession(req.params.sid);
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
