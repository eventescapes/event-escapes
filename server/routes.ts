import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertBookingSchema, insertBookingItemSchema } from "@shared/schema";
import { getSupabaseConfig } from "./supabase-config";
import { z } from "zod";
import { ServerEnv, assertSecretsReady } from "./env";
import { fetchTicketmasterEvents, fetchTicketmasterEventsMultiRegion, fetchTicketmasterEventsWithClassifications } from "./ticketmaster";

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

  // Ticketmaster Events (LIVE from API) - Must be BEFORE :id route
  app.get("/api/ticketmaster-events/live", async (req, res) => {
    try {
      const { country, startDate, endDate, limit } = req.query;
      
      // Calculate date range (7 days to 6 months from now for more events)
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() + 7);
      
      const defaultEndDate = new Date();
      defaultEndDate.setMonth(defaultEndDate.getMonth() + 6); // Extended to 6 months
      
      // Format dates for Ticketmaster API (YYYY-MM-DDTHH:mm:ssZ without milliseconds)
      const startDateTime = startDate 
        ? new Date(startDate as string).toISOString().split('.')[0] + 'Z'
        : defaultStartDate.toISOString().split('.')[0] + 'Z';
      const endDateTime = endDate 
        ? new Date(endDate as string).toISOString().split('.')[0] + 'Z'
        : defaultEndDate.toISOString().split('.')[0] + 'Z';
      
      // If a specific country is requested, fetch for that country
      if (country) {
        const response = await fetchTicketmasterEvents({
          countryCode: country as string,
          startDateTime,
          endDateTime,
          size: limit ? parseInt(limit as string) : 200 // Increased from 50 to 200
        });
        
        res.json(response.events);
      } else {
        // Otherwise, fetch from all regions with ALL classifications
        // This will make 16 API calls (4 regions × 4 classifications)
        const regions = ['US', 'CA', 'GB', 'AU'];
        
        const events = await fetchTicketmasterEventsWithClassifications(regions, {
          startDateTime,
          endDateTime,
          size: 200 // 200 events per classification per region
        });
        
        res.json(events);
      }
    } catch (error: any) {
      console.error('Error fetching live Ticketmaster events:', error);
      res.status(500).json({ message: "Error fetching live Ticketmaster events: " + error.message });
    }
  });

  // Ticketmaster Events (from database - legacy)
  app.get("/api/ticketmaster-events", async (req, res) => {
    try {
      const { country, segment, isMajorEvent, startDate, endDate, limit } = req.query;
      
      const filters: any = {};
      if (country) filters.country = country as string;
      if (segment) filters.segment = segment as string;
      if (isMajorEvent !== undefined) filters.isMajorEvent = isMajorEvent === 'true';
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (limit) filters.limit = parseInt(limit as string);
      
      const events = await storage.getTicketmasterEvents(filters);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching Ticketmaster events: " + error.message });
    }
  });

  app.get("/api/ticketmaster-events/:id", async (req, res) => {
    try {
      const event = await storage.getTicketmasterEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Ticketmaster event not found" });
      }
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching Ticketmaster event: " + error.message });
    }
  });

  // TEST: Fetch live events from Ticketmaster Discovery API
  app.get("/api/test/ticketmaster-live", async (req, res) => {
    try {
      console.log('\n🧪 TESTING TICKETMASTER API INTEGRATION...\n');
      
      const { region, regions } = req.query;
      
      // Calculate date range (7 days to 4 months from now)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 4);
      
      // Format dates for Ticketmaster API (YYYY-MM-DDTHH:mm:ssZ without milliseconds)
      const startDateTime = startDate.toISOString().split('.')[0] + 'Z';
      const endDateTime = endDate.toISOString().split('.')[0] + 'Z';
      
      let result;
      
      if (regions) {
        // Test multiple regions
        const regionList = (regions as string).split(',');
        console.log('📍 Testing multiple regions:', regionList);
        
        const events = await fetchTicketmasterEventsMultiRegion(regionList, {
          startDateTime,
          endDateTime,
          size: 20
        });
        
        result = {
          success: true,
          totalEvents: events.length,
          events,
          dateRange: { startDateTime, endDateTime }
        };
      } else {
        // Test single region (default US)
        const countryCode = (region as string) || 'US';
        console.log('📍 Testing single region:', countryCode);
        
        const response = await fetchTicketmasterEvents({
          countryCode,
          startDateTime,
          endDateTime,
          size: 20
        });
        
        result = {
          success: true,
          region: countryCode,
          totalEvents: response.totalEvents,
          totalPages: response.totalPages,
          eventsReturned: response.events.length,
          events: response.events,
          dateRange: { startDateTime, endDateTime }
        };
      }
      
      console.log('\n✅ TEST COMPLETED SUCCESSFULLY\n');
      res.json(result);
    } catch (error: any) {
      console.error('\n❌ TEST FAILED:', error.message, '\n');
      res.status(500).json({ 
        success: false,
        error: error.message,
        stack: error.stack
      });
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

  // ==================== FIXIE PROXY & SUPPLIER RELAY ROUTES ====================
  
  // Proxy IP endpoint - shows Fixie outbound IP
  app.get("/api/proxy-ip", async (req, res) => {
    try {
      const { makeProxiedAxios } = await import("./lib/proxyClient");
      const proxyAxios = makeProxiedAxios();
      
      const response = await proxyAxios.get("https://api.ipify.org?format=json");
      res.json({
        ip: response.data.ip,
        source: "ipify via Fixie proxy",
        fixieConfigured: !!process.env.FIXIE_URL
      });
    } catch (error: any) {
      console.error("Error fetching proxy IP:", error.message);
      res.status(500).json({ 
        message: "Error fetching proxy IP: " + error.message,
        fixieConfigured: !!process.env.FIXIE_URL
      });
    }
  });

  // Middleware for relay authentication
  const authenticateRelay = (req: any, res: any, next: any) => {
    const relayKey = req.headers['x-relay-key'];
    const expectedKey = process.env.RELAY_KEY;
    
    if (!expectedKey) {
      return res.status(500).json({ message: "Relay key not configured on server" });
    }
    
    if (relayKey !== expectedKey) {
      return res.status(401).json({ message: "Unauthorized: Invalid relay key" });
    }
    
    next();
  };

  // RateHawk relay endpoint
  app.post("/api/ratehawk/search", authenticateRelay, async (req, res) => {
    const requestId = `rh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      console.log(`[${requestId}] RateHawk search request received`);
      
      // Placeholder response - will be replaced with actual API call
      res.json({
        status: "RateHawk relay active",
        requestId,
        latencyMs: Date.now() - startTime,
        config: {
          appId: process.env.RATEHAWK_APP_ID || "not-configured",
          hasToken: !!process.env.RATEHAWK_TOKEN
        }
      });
      
      console.log(`[${requestId}] RateHawk search completed in ${Date.now() - startTime}ms`);
    } catch (error: any) {
      console.error(`[${requestId}] RateHawk error:`, error.message);
      res.status(500).json({ 
        message: "RateHawk relay error: " + error.message,
        requestId,
        latencyMs: Date.now() - startTime
      });
    }
  });

  // Travellanda relay endpoint
  app.post("/api/travellanda/search", authenticateRelay, async (req, res) => {
    const requestId = `tl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      console.log(`[${requestId}] Travellanda search request received`);
      
      // Placeholder response - will be replaced with actual API call
      res.json({
        status: "Travellanda relay active",
        requestId,
        latencyMs: Date.now() - startTime,
        config: {
          hasKey: !!process.env.TRAVELLANDA_KEY
        }
      });
      
      console.log(`[${requestId}] Travellanda search completed in ${Date.now() - startTime}ms`);
    } catch (error: any) {
      console.error(`[${requestId}] Travellanda error:`, error.message);
      res.status(500).json({ 
        message: "Travellanda relay error: " + error.message,
        requestId,
        latencyMs: Date.now() - startTime
      });
    }
  });

  // TBO relay endpoint
  app.post("/api/tbo/search", authenticateRelay, async (req, res) => {
    const requestId = `tbo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      console.log(`[${requestId}] TBO search request received`);
      
      // Placeholder response - will be replaced with actual API call
      res.json({
        status: "TBO relay active",
        requestId,
        latencyMs: Date.now() - startTime,
        config: {
          hasApiKey: !!process.env.TBO_API_KEY
        }
      });
      
      console.log(`[${requestId}] TBO search completed in ${Date.now() - startTime}ms`);
    } catch (error: any) {
      console.error(`[${requestId}] TBO error:`, error.message);
      res.status(500).json({ 
        message: "TBO relay error: " + error.message,
        requestId,
        latencyMs: Date.now() - startTime
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
