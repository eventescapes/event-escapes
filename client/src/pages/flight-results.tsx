import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plane, Clock, DollarSign, Filter, ArrowUpDown } from "lucide-react";

interface Offer {
  id: string;
  price: {
    amount: number | string;
    currency: string;
  };
  slices: Slice[];
  passengers?: Array<{
    id: string;
    type: string;
  }>;
  total_amount?: string;
  total_currency?: string;
}

interface Slice {
  id: string;
  airline: string;
  flight_number?: string;
  origin: string;
  destination: string;
  departure_datetime?: string;
  arrival_datetime?: string;
  duration: string;
  segments?: Segment[];
}

interface FlightOption {
  offer_id: string;
  offer: Offer;
  slice: Slice;
  price: number;
  currency: string;
  legNumber: number;
}

interface Segment {
  id: string;
  origin: {
    iata_code: string;
    city_name?: string;
  };
  destination: {
    iata_code: string;
    city_name?: string;
  };
  departing_at: string;
  arriving_at: string;
  marketing_carrier: {
    name: string;
    iata_code: string;
  };
  marketing_carrier_flight_number?: string;
  flight_number?: string;
  aircraft?: {
    name?: string;
    iata_code?: string;
  };
}

interface Filters {
  minPrice: number;
  maxPrice: number;
  departureTime: string; // "morning" | "afternoon" | "evening" | "night" | "all"
  airlines: string[];
}

type SortOption = "price-low" | "price-high" | "duration" | "departure-time";

export default function FlightResults() {
  const [locationPath, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<any>(null);
  
  // Filters
  const [filters, setFilters] = useState<Filters>({
    minPrice: 0,
    maxPrice: 10000,
    departureTime: "all",
    airlines: [],
  });
  
  // Sort
  const [sortBy, setSortBy] = useState<SortOption>("price-low");
  const [showFilters, setShowFilters] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayCount, setDisplayCount] = useState(15);

  // Debug logging for offer data
  useEffect(() => {
    if (offers.length > 0) {
      console.log("=== RAW OFFER DATA ===");
      console.log("First offer:", JSON.stringify(offers[0], null, 2));
      console.log("Price:", offers[0].price);
      console.log("Price amount:", offers[0].price?.amount, typeof offers[0].price?.amount);
      console.log("Price currency:", offers[0].price?.currency);
      console.log("First slice:", offers[0].slices?.[0]);
      console.log("Slice airline:", offers[0].slices?.[0]?.airline);
      console.log("Slice origin:", offers[0].slices?.[0]?.origin);
      console.log("Slice destination:", offers[0].slices?.[0]?.destination);
    }
  }, [offers]);

  const [booking, setBooking] = useState<any>({ outbound: null, return: null });
  const [selectedOutbound, setSelectedOutbound] = useState<FlightOption | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<FlightOption | null>(null);

  useEffect(() => {
    let searchString = "";
    if (locationPath && locationPath.includes("?")) {
      searchString = locationPath.split("?")[1];
    } else if (typeof window !== "undefined" && window.location.search) {
      searchString = window.location.search.startsWith("?")
        ? window.location.search.substring(1)
        : window.location.search;
    }
    const params = new URLSearchParams(searchString);
    
    console.log("🔵 === READING URL PARAMETERS (DYNAMIC) ===");
    console.log("🔵 Raw URL:", window.location.href);
    console.log("🔵 from:", params.get("from"));
    console.log("🔵 to:", params.get("to"));
    console.log("🔵 departDate:", params.get("departDate"));
    console.log("🔵 step:", params.get("step"));
    console.log("🔵 tripType:", params.get("tripType"));
    
    const tripType = params.get("tripType") || "return";
    const rawStep = params.get("step");
    // CRITICAL: Don't default stepValue for round-trip! Keep it undefined if not in URL
    const stepValue = tripType === "multi_city" ? (rawStep || "1") : rawStep;
    const stepNumber = parseInt(stepValue || "1", 10) || 1;
    const totalLegs = parseInt(params.get("totalLegs") || (tripType === "multi_city" ? "2" : "2"), 10);
    
    console.log("🔵 Step detection:", { rawStep, stepValue, willUseSinglePage: !stepValue && tripType === "return" });

    const legs: Array<{ from: string; to: string; departDate?: string }> = [];
    if (tripType === "multi_city" && totalLegs > 0) {
      for (let i = 1; i <= totalLegs; i++) {
        legs.push({
          from: params.get(`leg${i}_from`) || "",
          to: params.get(`leg${i}_to`) || "",
          departDate:
            params.get(`leg${i}_departDate`) ||
            params.get(`leg${i}_date`) ||
            params.get(`leg${i}_depart`) ||
            "",
        });
      }
    }

    const currentLeg = tripType === "multi_city" ? legs[stepNumber - 1] ?? { from: "", to: "" } : null;

    const origin =
      tripType === "multi_city"
        ? currentLeg?.from || ""
        : params.get("from") || params.get("origin") || "";
    const destination =
      tripType === "multi_city"
        ? currentLeg?.to || ""
        : params.get("to") || params.get("destination") || "";
    
    const searchData = {
      step: stepValue,
      stepNumber,
      totalLegs,
      tripType,
      passengers: parseInt(params.get("passengers") || "1"),
      cabinClass: params.get("cabinClass") || "economy",
      from: params.get("from") || "",
      to: params.get("to") || "",
      departDate: params.get("departDate") || "",
      returnDate: params.get("returnDate") || null,
      origin,
      destination,
      legs,
    };

    console.log("🔵 === COMPUTED SEARCH DATA (DYNAMIC) ===");
    console.log("🔵 Will search:", origin, "→", destination);
    console.log("🔵 Full search data:", searchData);
    setSearchParams(searchData);
    
    loadSelectionsFromStorage();
    
    searchFlights(searchData);
  }, [locationPath]);

  const loadSelectionsFromStorage = () => {
    if (typeof window === "undefined") return;
    try {
      const outbound = JSON.parse(localStorage.getItem("selected_outbound") || "null");
      const returnFlight = JSON.parse(localStorage.getItem("selected_return") || "null");
      setBooking({
        outbound: outbound || null,
        return: returnFlight || null,
      });
      if (outbound) setSelectedOutbound(outbound);
      if (returnFlight) setSelectedReturn(returnFlight);
    } catch (err) {
      console.error("❌ Failed to load selections from localStorage:", err);
    }
  };

  const handleSelectOutbound = (flight: FlightOption) => {
    console.log('✅ Selected outbound flight:', flight.slice.airline, flight.slice.origin, '→', flight.slice.destination);
    console.log('🔍 RAW FLIGHT:', flight);
    
    // Get dates from FIRST segment (departure) and LAST segment (arrival)
    const segments = flight.slice.segments || [];
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    
    console.log('🔍 First segment:', firstSegment);
    console.log('🔍 Last segment:', lastSegment);
    console.log('🔍 Departure date:', firstSegment?.departing_at);
    console.log('🔍 Arrival date:', lastSegment?.arriving_at);
    
    // Save to localStorage with dates from segments
    try {
      const outboundData = {
        offerId: flight.offer.id,
        sliceId: flight.slice.id,
        airline: flight.slice.airline,
        flight_number: flight.slice.flight_number,
        origin: flight.slice.origin,
        destination: flight.slice.destination,
        // ✅ Get dates from segments
        departure_datetime: firstSegment?.departing_at,
        arrival_datetime: lastSegment?.arriving_at,
        duration: flight.slice.duration,
        price: flight.price,
        currency: flight.currency,
        // ✅ CRITICAL: Include passengers array from offer
        passengers: flight.offer.passengers || [],
        // Also save the full offer ID for later use
        id: flight.offer.id,
        total_amount: flight.offer.total_amount,
        total_currency: flight.offer.total_currency
      };
      
      console.log('💾 SAVING OUTBOUND TO LOCALSTORAGE:');
      console.log('Offer ID:', outboundData.offerId);
      console.log('Passengers:', outboundData.passengers?.length || 0);
      console.log('Passenger IDs:', outboundData.passengers?.map((p: { id: string; type: string }) => p.id));
      console.log('Full data:', outboundData);
      
      setSelectedOutbound(flight);
      localStorage.setItem('selected_outbound', JSON.stringify(outboundData));
      
      // Verify it was saved
      const saved = localStorage.getItem('selected_outbound');
      console.log('✅ Verification - data saved:', !!saved);
      console.log('✅ Saved outbound to localStorage');
    } catch (err) {
      console.error('❌ Failed to save outbound:', err);
    }
    
    // Scroll to return section
    setTimeout(() => {
      const returnSection = document.getElementById('return-section');
      if (returnSection) {
        returnSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  };

  const handleSelectReturn = (flight: FlightOption) => {
    console.log('✅ Selected return flight:', flight.slice.airline, flight.slice.origin, '→', flight.slice.destination);
    console.log('🔍 RAW RETURN FLIGHT:', flight);
    
    // Get dates from FIRST segment (departure) and LAST segment (arrival)
    const segments = flight.slice.segments || [];
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    
    console.log('🔍 Return first segment:', firstSegment);
    console.log('🔍 Return last segment:', lastSegment);
    console.log('🔍 Return departure date:', firstSegment?.departing_at);
    console.log('🔍 Return arrival date:', lastSegment?.arriving_at);
    
    // Save to localStorage with dates from segments
    try {
      const returnData = {
        offerId: flight.offer.id,
        sliceId: flight.slice.id,
        airline: flight.slice.airline,
        flight_number: flight.slice.flight_number,
        origin: flight.slice.origin,
        destination: flight.slice.destination,
        // ✅ Get dates from segments
        departure_datetime: firstSegment?.departing_at,
        arrival_datetime: lastSegment?.arriving_at,
        duration: flight.slice.duration,
        price: flight.price,
        currency: flight.currency,
        // ✅ Include passengers array from offer (same as outbound)
        passengers: flight.offer.passengers || [],
        id: flight.offer.id,
        total_amount: flight.offer.total_amount,
        total_currency: flight.offer.total_currency
      };
      
      console.log('💾 SAVING RETURN (with dates from segments):', returnData);
      console.log('Passengers:', returnData.passengers?.length || 0);
      
      // Save to state and localStorage
      setSelectedReturn(flight);
      localStorage.setItem('selected_return', JSON.stringify(returnData));
      console.log('✅ Both flights selected! User can now continue.');
      
      // Scroll to trip summary so user can review
      setTimeout(() => {
        const sidebar = document.querySelector('.trip-summary-sidebar');
        if (sidebar) {
          sidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    } catch (err) {
      console.error('❌ Failed to save return:', err);
    }
  };

  useEffect(() => {
    // If we already have offers, don't search again!
    if (offers && offers.length > 0) {
      console.log('✅ Already have', offers.length, 'offers - skipping search');
      setLoading(false);
      return;
    }
    
    // Try localStorage first (for return page)
    try {
      const stored = localStorage.getItem('round_trip_offers');
      if (stored) {
        const storedOffers = JSON.parse(stored);
        console.log('📦 Loading', storedOffers.length, 'offers from localStorage');
        if (storedOffers.length > 0) {
          console.log('📦 First offer has', storedOffers[0]?.slices?.length, 'slices');
        }
        setOffers(storedOffers);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('❌ Failed to load from localStorage:', err);
    }
    
    // No offers and no storage? Search!
    if (searchParams && searchParams.origin && searchParams.destination && searchParams.departDate) {
      console.log('🔍 No offers found - searching...');
      searchFlights(searchParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchFlights = async (params: any) => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔵 searchFlights called with params:", params);

      // Convert tripType to trip_type (snake_case) and ensure correct format
      let trip_type = "one-way";
      if (params.tripType === "return" || params.tripType === "round_trip") {
        trip_type = "return";
      } else if (params.tripType === "multi_city") {
        trip_type = "multi-city";
      }

      // Build request body with correct parameter names (snake_case)
      const requestBody: any = {
        cabin: params.cabinClass,
        adults: params.passengers,
        children: 0,
        infants: 0,
        trip_type: trip_type,
      };

      if (trip_type === "multi-city" && Array.isArray(params.legs) && params.legs.length > 0) {
        requestBody.slices = params.legs
          .filter((leg: any) => leg?.from && leg?.to)
          .map((leg: any) => ({
            origin: leg.from,
            destination: leg.to,
            departure_date: leg.departDate,
          }));
        if (requestBody.slices.length > 0) {
          requestBody.origin = requestBody.slices[0].origin;
          requestBody.destination = requestBody.slices[requestBody.slices.length - 1].destination;
        }
      } else {
        // Use origin/destination if available, otherwise fall back to from/to
        requestBody.origin = params.origin || params.from;
        requestBody.destination = params.destination || params.to;
        requestBody.departure_date = params.departDate;
      }

      // Include return_date only when trip_type is "return"
      if (trip_type === "return" && params.returnDate) {
        requestBody.return_date = params.returnDate;
      }

      console.log("🔵 Sending search request with:", requestBody);
      console.log("🔵 Searching for:", requestBody.origin, "→", requestBody.destination);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/duffel_search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();
      console.log("✅ Backend response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      const allOffers = data.offers || [];
      console.log(`📦 Found ${allOffers.length} offers`);
      
      setOffers(allOffers);
      
      // Store round-trip offers for return page
      if (trip_type === "return" && allOffers.length > 0) {
        try {
          localStorage.setItem('round_trip_offers', JSON.stringify(allOffers));
          console.log('✅ Stored', allOffers.length, 'round-trip offers for return page');
        } catch (err) {
          console.error('❌ Failed to store offers:', err);
        }
      }
      
      const legDivisor =
        trip_type === "return"
          ? 2
          : trip_type === "multi-city"
          ? Math.max(requestBody.slices?.length || params.totalLegs || 1, 1)
          : 1;

      // Initialize max price filter based on actual offers
      if (allOffers.length > 0) {
        const prices = allOffers.map((offer: Offer) => {
          const amount = offer.price?.amount;
          if (typeof amount === "number") return amount;
          if (typeof amount === "string") {
            const parsed = parseFloat(amount);
            return isNaN(parsed) ? 0 : parsed;
          }
          return 0;
        }).map((amount: number) => amount / legDivisor);
        const maxPrice = Math.max(...prices);
        setFilters(prev => ({ ...prev, maxPrice: Math.ceil(maxPrice * 1.1) }));
      }
      
      if (allOffers.length === 0) {
        setError("No flights found. Please try different search criteria.");
      }

    } catch (err: any) {
      console.error("❌ Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatDuration = (duration: string): string => {
    if (!duration) return "N/A";
    // Handle ISO 8601 duration (PT9H12M) or similar formats
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return duration;
    const hours = match[1] || "0";
    const mins = match[2] || "0";
    return `${hours}h ${mins}m`;
  };

  const getSliceOrigin = (slice: Slice): string => {
    return slice.origin || "?";
  };

  const getSliceDestination = (slice: Slice): string => {
    return slice.destination || "?";
  };

  const getAirlineName = (offer: Offer, sliceIndex: number = 0): string => {
    return offer.slices?.[sliceIndex]?.airline || "Airline";
  };

  const getOfferPrice = (offer: Offer): number => {
    const amount = offer.price?.amount;
    if (typeof amount === "number") {
      return amount;
    }
    if (typeof amount === "string") {
      const parsed = parseFloat(amount);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const getCurrency = (offer: Offer): string => {
    return offer.price?.currency || "USD";
  };

  const getDepartureHour = (slice: Slice): number => {
    // Try slice.departure_datetime first (normalized structure)
    if (slice.departure_datetime) {
      const date = new Date(slice.departure_datetime);
      return date.getHours();
    }
    // Fallback to segments
    const firstSegment = slice.segments?.[0];
    if (firstSegment?.departing_at) {
      const date = new Date(firstSegment.departing_at);
      return date.getHours();
    }
    return 0;
  };

  const getDepartureTimeCategory = (hour: number): string => {
    if (hour >= 6 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 22) return "evening";
    return "night";
  };

  // Separate outbound and return flight lists for single-page selection
  const outboundFlights = useMemo<FlightOption[]>(() => {
    if (!searchParams || !offers.length) return [];
    
    const origin = searchParams.origin || searchParams.from || "";
    const destination = searchParams.destination || searchParams.to || "";
    
    const flights = offers
      .filter((offer) => offer.slices && offer.slices.length >= 2)
      .map<FlightOption | null>((offer) => {
        const outboundSlice = offer.slices![0];
        const matches =
          outboundSlice.origin === origin &&
          outboundSlice.destination === destination;
        
        if (!matches) return null;

        const totalPrice = getOfferPrice(offer);
        const perLegPrice = totalPrice / 2;

        return {
          offer_id: offer.id,
          offer,
          slice: outboundSlice,
          price: perLegPrice,
          currency: getCurrency(offer),
          legNumber: 1,
        };
      })
      .filter(Boolean) as FlightOption[];
    
    // Apply filters
    let filtered = flights.filter(
      (flight) => flight.price >= filters.minPrice && flight.price <= filters.maxPrice
    );

    if (filters.departureTime !== "all") {
      filtered = filtered.filter((flight) => {
        const hour = getDepartureHour(flight.slice);
        const category = getDepartureTimeCategory(hour);
        return category === filters.departureTime;
      });
    }

    if (filters.airlines.length > 0) {
      filtered = filtered.filter((flight) => filters.airlines.includes(flight.slice?.airline));
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "duration":
          return (a.slice?.duration || "").localeCompare(b.slice?.duration || "");
        case "departure-time":
          return getDepartureHour(a.slice) - getDepartureHour(b.slice);
        default:
          return 0;
      }
    });

    return filtered;
  }, [offers, filters, sortBy, searchParams]);

  const returnFlights = useMemo<FlightOption[]>(() => {
    if (!searchParams || !offers.length) return [];
    
    const origin = searchParams.origin || searchParams.from || "";
    const destination = searchParams.destination || searchParams.to || "";
    
    const flights = offers
      .filter((offer) => offer.slices && offer.slices.length >= 2)
      .map<FlightOption | null>((offer) => {
        const returnSlice = offer.slices![1];
        const matches =
          returnSlice.origin === destination &&
          returnSlice.destination === origin;
        
        if (!matches) return null;

        const totalPrice = getOfferPrice(offer);
        const perLegPrice = totalPrice / 2;

        return {
          offer_id: offer.id,
          offer,
          slice: returnSlice,
          price: perLegPrice,
          currency: getCurrency(offer),
          legNumber: 2,
        };
      })
      .filter(Boolean) as FlightOption[];
    
    // Apply filters
    let filtered = flights.filter(
      (flight) => flight.price >= filters.minPrice && flight.price <= filters.maxPrice
    );

    if (filters.departureTime !== "all") {
      filtered = filtered.filter((flight) => {
        const hour = getDepartureHour(flight.slice);
        const category = getDepartureTimeCategory(hour);
        return category === filters.departureTime;
      });
    }

    if (filters.airlines.length > 0) {
      filtered = filtered.filter((flight) => filters.airlines.includes(flight.slice?.airline));
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "duration":
          return (a.slice?.duration || "").localeCompare(b.slice?.duration || "");
        case "departure-time":
          return getDepartureHour(a.slice) - getDepartureHour(b.slice);
        default:
          return 0;
      }
    });

    return filtered;
  }, [offers, filters, sortBy, searchParams]);

  // Legacy filtered flights for backward compatibility (use outbound for now)
  const filteredFlights = useMemo<FlightOption[]>(() => {
    if (!searchParams) return [];

    const tripType: string = searchParams.tripType || "return";
    const stepValue: string = searchParams.step || (tripType === "multi_city" ? "1" : "outbound");
    const stepNumber: number = searchParams.stepNumber || parseInt(stepValue, 10) || 1;
    const totalLegs: number =
      searchParams.totalLegs || (tripType === "return" || tripType === "round_trip" ? 2 : 1);
    const legs: Array<{ from: string; to: string; departDate?: string }> = searchParams.legs || [];

    const origin = searchParams.origin || searchParams.from || "";
    const destination = searchParams.destination || searchParams.to || "";

    let flights: FlightOption[] = [];

    if (tripType === "multi_city") {
      const legIndex = Math.max(0, stepNumber - 1);
      const currentLeg = legs[legIndex] || { from: origin, to: destination };

      flights = offers
        .map<FlightOption | null>((offer) => {
          const slice = offer.slices?.[legIndex];
          if (!slice) return null;
          if (slice.origin !== currentLeg.from || slice.destination !== currentLeg.to) return null;

          const totalPrice = getOfferPrice(offer);
          const perLegPrice = totalLegs > 0 ? totalPrice / totalLegs : totalPrice;

          return {
            offer_id: offer.id,
            offer,
            slice,
            price: perLegPrice,
            currency: getCurrency(offer),
            legNumber: legIndex + 1,
          };
        })
        .filter(Boolean) as FlightOption[];
    } else if (tripType === "return" || tripType === "round_trip") {
      if (stepValue === "return") {
        console.log("🔵 === FILTERING RETURN FLIGHTS ===");
        console.log("🔵 Total offers:", offers.length);
        console.log("🔵 Looking for:", origin, "→", destination);
        
        flights = offers
          .filter((offer) => offer.slices && offer.slices.length >= 2)
          .map<FlightOption | null>((offer) => {
            const returnSlice = offer.slices![1];
            const matches =
              returnSlice.origin === origin &&
              returnSlice.destination === destination;
            
            if (offers.indexOf(offer) < 3) {
              console.log(`🔵 Offer ${offers.indexOf(offer) + 1}:`, {
                slice0: `${offer.slices[0].origin}→${offer.slices[0].destination}`,
                slice1: `${returnSlice.origin}→${returnSlice.destination}`,
                lookingFor: `${origin}→${destination}`,
                matches
              });
            }
            
            if (!matches) {
              return null;
            }

            const totalPrice = getOfferPrice(offer);
            const perLegPrice = totalPrice / 2;

            return {
              offer_id: offer.id,
              offer,
              slice: returnSlice,
              price: perLegPrice,
              currency: getCurrency(offer),
              legNumber: 2,
            };
          })
          .filter(Boolean) as FlightOption[];
        
        console.log("✅ Filtered return flights:", flights.length);
      } else {
        flights = offers
          .filter((offer) => offer.slices && offer.slices.length > 0)
          .map<FlightOption | null>((offer) => {
            const outboundSlice = offer.slices![0];
            const matches =
              outboundSlice.origin === origin &&
              outboundSlice.destination === destination;
            if (!matches) {
              return null;
            }

            const totalPrice = getOfferPrice(offer);
            const perLegPrice = totalPrice / 2;

            return {
              offer_id: offer.id,
              offer,
              slice: outboundSlice,
              price: perLegPrice,
              currency: getCurrency(offer),
              legNumber: 1,
            };
          })
          .filter(Boolean) as FlightOption[];
      }
    } else {
      flights = offers
        .map<FlightOption | null>((offer) => {
          const slice = offer.slices?.[0];
          if (!slice) return null;
          if (slice.origin !== origin || slice.destination !== destination) return null;

          return {
            offer_id: offer.id,
            offer,
            slice,
            price: getOfferPrice(offer),
            currency: getCurrency(offer),
            legNumber: 1,
          };
        })
        .filter(Boolean) as FlightOption[];
    }

    let filtered = flights.filter(
      (flight) => flight.price >= filters.minPrice && flight.price <= filters.maxPrice
    );

    if (filters.departureTime !== "all") {
      filtered = filtered.filter((flight) => {
        const hour = getDepartureHour(flight.slice);
        const category = getDepartureTimeCategory(hour);
        return category === filters.departureTime;
      });
    }

    if (filters.airlines.length > 0) {
      filtered = filtered.filter((flight) => filters.airlines.includes(flight.slice?.airline));
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "duration":
          return (a.slice?.duration || "").localeCompare(b.slice?.duration || "");
        case "departure-time":
          return getDepartureHour(a.slice) - getDepartureHour(b.slice);
        default:
          return 0;
      }
    });

    return filtered;
  }, [offers, filters, sortBy, searchParams]);

  // Get unique airlines from filtered offers
  const availableAirlines = useMemo(() => {
    const airlinesSet = new Set<string>();
    filteredFlights.forEach((flight: FlightOption) => {
      const airline = flight.slice?.airline;
      if (airline && airline !== "Airline") {
        airlinesSet.add(airline);
      }
    });
    return Array.from(airlinesSet).sort();
  }, [filteredFlights]);

  const tripType: string = searchParams?.tripType || "return";
  // Don't default stepValue - keep it undefined if not in URL
  const stepValue: string | undefined = searchParams?.step || (tripType === "multi_city" ? "1" : undefined);
  const stepNumber: number =
    searchParams?.stepNumber || (tripType === "multi_city" ? parseInt(stepValue || "1", 10) || 1 : 1);
  const totalLegs: number =
    searchParams?.totalLegs ||
    (tripType === "multi_city"
      ? (searchParams?.legs?.length || 1)
      : tripType === "return" || tripType === "round_trip"
      ? 2
      : 1);
  const legs: Array<{ from: string; to: string; departDate?: string }> = searchParams?.legs || [];
  const safeStepNumber = Math.max(1, Math.min(stepNumber, totalLegs || 1));
  const currentLeg = tripType === "multi_city" ? legs[Math.max(0, safeStepNumber - 1)] : null;
  const currentRoute =
    tripType === "multi_city"
      ? `${currentLeg?.from || ""} → ${currentLeg?.to || ""}`
      : `${searchParams?.origin || searchParams?.from || ""} → ${
          searchParams?.destination || searchParams?.to || ""
        }`;

  // Check if we should use single-page round-trip selection (no step parameter)
  const isRoundTripSinglePage = (tripType === "return" || tripType === "round_trip") && !stepValue;
  
  console.log('🔍 Page mode check:', {
    tripType,
    stepValue,
    isRoundTripSinglePage,
    urlHasStep: !!searchParams?.step
  });
  
  const pageTitle = (() => {
    if (tripType === "one_way" || tripType === "one-way") {
      return "Select Your Flight";
    }
    if (tripType === "return" || tripType === "round_trip") {
      if (isRoundTripSinglePage) {
        return "Select Your Flights";
      }
      // Legacy step-based mode
      return stepValue === "return" ? "Select Return Flight" : "Select Outbound Flight";
    }
    if (tripType === "multi_city") {
      return `Select Flight ${safeStepNumber} of ${totalLegs}`;
    }
    return "Select Your Flight";
  })();

  const bookedOutbound = booking?.outbound;
  const bookedReturn = booking?.return;
  const bookedFlights: any[] = Array.isArray(booking?.flights) ? booking.flights : [];
  const completedFlightsCount = bookedFlights.filter((flight) => !!flight).length;
  const totalMultiCityPrice = bookedFlights.reduce((sum: number, flight: any) => {
    if (!flight) return sum;
    const amount =
      typeof flight.price === "number" ? flight.price : parseFloat(String(flight.price || 0));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  const multiCityCurrency =
    bookedFlights.find((flight: any) => flight?.currency)?.currency || "USD";
  const totalPriceValue =
    tripType === "multi_city"
      ? totalMultiCityPrice
      : (parseFloat(String(bookedOutbound?.price || 0)) || 0) +
        (parseFloat(String(bookedReturn?.price || 0)) || 0);
  const totalCurrencyValue =
    tripType === "multi_city"
      ? multiCityCurrency
      : bookedOutbound?.currency || bookedReturn?.currency || "USD";
  const showSummaryCard =
    tripType === "multi_city"
      ? bookedFlights.length > 0 || legs.length > 0
      : Boolean(bookedOutbound || bookedReturn || stepValue === "return");
  const canContinue =
    tripType === "multi_city"
      ? completedFlightsCount >= totalLegs
      : tripType === "return" || tripType === "round_trip"
      ? Boolean(bookedOutbound && bookedReturn)
      : Boolean(bookedOutbound);
  const formattedTotalPrice = Number.isFinite(totalPriceValue) ? totalPriceValue : 0;
  const continueLabel =
    tripType === "multi_city" ? "Continue to Seat Selection →" : "Continue →";

  const visibleFlights = filteredFlights.slice(0, displayCount);
  const hasMoreFlights = displayCount < filteredFlights.length;
  const remainingFlights = Math.max(filteredFlights.length - displayCount, 0);

  const saveSelection = async (step: string, flightData: any) => {
    try {
      setSaving(true);
      
      // Get or create session ID
      let sessionId = localStorage.getItem('booking_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('booking_session_id', sessionId);
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save_booking_selection`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
            step: step,
            data: flightData,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save selection');
      }

      const data = await response.json();
      console.log('✅ Selection saved:', data);
      if (data) {
        setBooking(data);
      }
      return data;
    } catch (err: any) {
      console.error('❌ Error saving selection:', err);
      alert(`Failed to save selection: ${err.message}`);
      throw err;
    } finally {
      setSaving(false);
    }
  };


  const handleSelectMultiCityFlight = async (flight: FlightOption) => {
    const total = Math.max(totalLegs, legs.length, 1);
    const currentStep = flight.legNumber || safeStepNumber;
    const legIndex = Math.max(0, currentStep - 1);
    const existingFlights = Array.isArray(booking?.flights)
      ? [...booking.flights]
      : Array(total).fill(null);
    while (existingFlights.length < total) {
      existingFlights.push(null);
    }

    existingFlights[legIndex] = {
      offerId: flight.offer_id,
      sliceId: flight.slice.id || `slice_${Date.now()}`,
      airline: flight.slice.airline,
      flight_number: flight.slice.flight_number,
      origin: flight.slice.origin,
      destination: flight.slice.destination,
      departure_time: flight.slice.departure_datetime,
      arrival_time: flight.slice.arrival_datetime,
      duration: flight.slice.duration,
      price: flight.price,
      currency: flight.currency,
      legNumber: flight.legNumber,
    };

    const totalPrice = existingFlights.reduce(
      (sum: number, leg: any) => sum + (leg?.price || 0),
      0
    );

    const payload = {
      flights: existingFlights,
      base_price: totalPrice,
      total_price: totalPrice,
      trip_type: 'multi_city',
    };

    try {
      const data = await saveSelection(`flight_${currentStep}_selection`, payload);
      if (!data?.flights) {
        setBooking({
          ...(booking || {}),
          trip_type: 'multi_city',
          flights: existingFlights,
          total_price: totalPrice,
          base_price: totalPrice,
        });
      }

      if (currentStep < total) {
        const nextStep = currentStep + 1;
        const params = new URLSearchParams(window.location.search);
        params.set("step", String(nextStep));
        params.set("totalLegs", String(total));

        const nextLeg = legs[nextStep - 1];
        if (nextLeg) {
          params.set("from", nextLeg.from || "");
          params.set("to", nextLeg.to || "");
          params.set("origin", nextLeg.from || "");
          params.set("destination", nextLeg.to || "");
        }

        setLocation(`/flights?${params.toString()}`);
      } else {
        setLocation("/seat-selection");
      }
    } catch (error) {
      // Error already handled inside saveSelection
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching flights...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="p-8 text-center">
            <p className="text-red-600 text-lg font-semibold mb-4">❌ {error}</p>
            <Button onClick={() => setLocation("/flights")}>Back to Search</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.removeItem("selected_outbound");
                localStorage.removeItem("selected_return");
                window.location.href = "/";
              }
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            ← Back to Search
          </Button>
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-2xl font-bold">
                {pageTitle}
              </h1>
              <p className="text-gray-600 mt-2">
                {currentRoute}
              </p>
              <p className="text-gray-500 mt-1 text-sm">
                Showing {visibleFlights.length} of {filteredFlights.length} flight options
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="departure-time">Departure Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Progress Indicator for Multi-City trips */}
        {tripType === "multi_city" && totalLegs > 1 && (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {Array.from({ length: totalLegs }, (_, i) => i + 1).map((legNum) => (
                <div key={legNum} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                      legNum < safeStepNumber
                        ? "bg-green-500 text-white"
                        : legNum === safeStepNumber
                        ? "bg-blue-600 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {legNum < safeStepNumber ? "✓" : legNum}
                  </div>
                  {legNum < totalLegs && (
                    <div
                      className={`w-12 h-1 ${
                        legNum < safeStepNumber ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-2 text-sm text-gray-600">
              Step {safeStepNumber} of {totalLegs}
            </div>
          </div>
        )}

        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Booking Summary Sidebar */}
          {showSummaryCard && (
            <Card className="w-full lg:w-80 p-4 h-fit sticky top-4">
              <h3 className="font-semibold mb-4">Trip Summary</h3>
              
              <div className="space-y-4">
                {tripType === "multi_city" ? (
                  <>
                    {legs.map((leg, idx) => {
                      const flight = bookedFlights[idx];
                      return (
                        <div key={idx} className="pb-4 border-b last:border-b-0">
                          <div className="text-sm text-gray-600 mb-1">
                            Flight {idx + 1}
                          </div>
                          <div className="font-medium">
                            {(leg?.from || flight?.origin || "???")} →{" "}
                            {(leg?.to || flight?.destination || "???")}
                          </div>
                          {flight ? (
                            <>
                              <div className="text-sm text-gray-600">
                                {flight.airline} {flight.flight_number || ""}
                              </div>
                              {flight.departure_time && (
                                <div className="text-xs text-gray-500">
                                  {new Date(flight.departure_time).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              )}
                              <div className="text-sm font-semibold text-green-600">
                                ${parseFloat(String(flight.price || 0)).toFixed(2)}{" "}
                                {flight.currency || multiCityCurrency}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">Pending selection</div>
                          )}
                        </div>
                      );
                    })}

                    <div className="pt-3">
                      <div className="text-sm text-blue-600 font-semibold">Currently selecting</div>
                      <div className="text-lg font-bold">
                        Flight {safeStepNumber} of {totalLegs}: {currentRoute}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {bookedOutbound && (
                      <div className="pb-4 border-b">
                        <div className="text-sm text-gray-600 mb-2">Outbound (Selected)</div>
                        <div className="space-y-2">
                          <div className="font-medium">
                            {bookedOutbound.origin} → {bookedOutbound.destination}
                          </div>
                          <div className="text-sm text-gray-600">
                            {bookedOutbound.airline} {bookedOutbound.flight_number || ""}
                          </div>
                          {bookedOutbound.departure_time && (
                            <div className="text-xs text-gray-500">
                              {new Date(bookedOutbound.departure_time).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                          <div className="text-sm font-semibold text-green-600">
                            ${parseFloat(String(bookedOutbound.price || 0)).toFixed(2)}{" "}
                            {bookedOutbound.currency || "USD"}
                          </div>
                        </div>
                      </div>
                    )}

                    {bookedReturn && (
                      <div className="pb-4 border-b">
                        <div className="text-sm text-gray-600 mb-2">Return (Selected)</div>
                        <div className="space-y-2">
                          <div className="font-medium">
                            {bookedReturn.origin} → {bookedReturn.destination}
                          </div>
                          <div className="text-sm text-gray-600">
                            {bookedReturn.airline} {bookedReturn.flight_number || ""}
                          </div>
                          {bookedReturn.departure_time && (
                            <div className="text-xs text-gray-500">
                              {new Date(bookedReturn.departure_time).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                          <div className="text-sm font-semibold text-green-600">
                            ${parseFloat(String(bookedReturn.price || 0)).toFixed(2)}{" "}
                            {bookedReturn.currency || "USD"}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Total Price */}
                {(tripType === "multi_city"
                  ? completedFlightsCount > 0
                  : bookedOutbound || bookedReturn) && (
                  <div className="pt-3 border-t">
                    <div className="text-sm text-gray-500 mb-1">Total Price</div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-2xl font-bold">
                        {formattedTotalPrice.toFixed(2)}
                      </span>
                      <span className="text-gray-500">{totalCurrencyValue}</span>
                    </div>
                  </div>
                )}

                {/* Continue Button */}
                {canContinue && (
                  <Button
                    onClick={() => setLocation("/seat-selection")}
                    className="w-full mt-4"
                    size="lg"
                  >
                    {continueLabel}
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Filters Sidebar */}
          {showFilters && (
            <Card className="w-full lg:w-64 p-4 h-fit sticky top-4">
              <h3 className="font-semibold mb-4">Filters</h3>
              
              {/* Price Range */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Price Range</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) =>
                      setFilters({ ...filters, minPrice: parseInt(e.target.value) || 0 })
                    }
                    className="w-24"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      setFilters({ ...filters, maxPrice: parseInt(e.target.value) || 10000 })
                    }
                    className="w-24"
                  />
                </div>
              </div>

              {/* Departure Time */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Departure Time</label>
                <Select
                  value={filters.departureTime}
                  onValueChange={(value) =>
                    setFilters({ ...filters, departureTime: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Times</SelectItem>
                    <SelectItem value="morning">Morning (6AM - 12PM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                    <SelectItem value="evening">Evening (5PM - 10PM)</SelectItem>
                    <SelectItem value="night">Night (10PM - 6AM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Airlines */}
              {availableAirlines.length > 0 && (
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Airlines</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableAirlines.map((airline) => (
                      <label key={airline} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filters.airlines.includes(airline)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({
                                ...filters,
                                airlines: [...filters.airlines, airline],
                              });
                            } else {
                              setFilters({
                                ...filters,
                                airlines: filters.airlines.filter((a) => a !== airline),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span>{airline}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Offers List */}
          <div className="flex-1 space-y-4">
            {/* Show Locked Outbound Flight on Return Step */}
            {stepValue === "return" && bookedOutbound && (
              <Card className="p-6 bg-blue-50 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-blue-600">Locked Outbound Flight</span>
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-lg">
                        {bookedOutbound.origin} → {bookedOutbound.destination}
                      </div>
                      <div className="text-sm text-gray-600">
                        {bookedOutbound.airline} {bookedOutbound.flight_number || ""}
                      </div>
                      {bookedOutbound.departure_time && (
                        <div className="text-xs text-gray-500">
                          {new Date(bookedOutbound.departure_time).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Price</div>
                    <div className="font-semibold text-green-600">
                      ${parseFloat(String(bookedOutbound.price || 0)).toFixed(2)} {bookedOutbound.currency || "USD"}
                    </div>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Single-Page Round-Trip Selection */}
            {isRoundTripSinglePage ? (
              <div className="flex gap-8">
                {/* Main Content */}
                <div className="flex-1 space-y-8">
                  {/* Outbound Section */}
                  <div>
                    <h2 className="text-2xl font-bold mb-4">
                      {selectedOutbound ? '✅ Outbound Flight Selected' : '1. Select Outbound Flight'}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {searchParams?.origin || searchParams?.from} → {searchParams?.destination || searchParams?.to}
                    </p>
                    
                    {selectedOutbound ? (
                      <Card className="bg-green-50 border-2 border-green-500 p-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-lg">{selectedOutbound.slice.airline}</div>
                            <div className="text-gray-700">
                              {selectedOutbound.slice.origin} → {selectedOutbound.slice.destination}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {selectedOutbound.slice.departure_datetime && 
                                new Date(selectedOutbound.slice.departure_datetime).toLocaleString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              }
                            </div>
                          </div>
                          <div className="text-right">
                            {/* Per Person Price - Expedia Style */}
                            <div className="text-3xl font-bold text-gray-900">
                              {selectedOutbound.currency}${Math.round(selectedOutbound.price / (selectedOutbound.offer?.passengers?.length || 1))}
                            </div>
                            
                            {/* "per traveller" label - FIXED: Show correct leg type */}
                            <div className="text-sm text-gray-500 mt-1">
                              {(searchParams?.tripType === 'return' || searchParams?.returnDate) ? 'Outbound per traveller' : 'One-way per traveller'}
                            </div>
                            
                            <button 
                              onClick={() => setSelectedOutbound(null)}
                              className="text-sm text-blue-600 hover:underline mt-3"
                            >
                              Change Flight
                            </button>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {outboundFlights.slice(0, displayCount).map((flight, index) => {
                          const slice = flight.slice;
                          // Get times from slice or fallback to first segment
                          const departureTime = slice.departure_datetime || slice.segments?.[0]?.departing_at;
                          const arrivalTime = slice.arrival_datetime || slice.segments?.[slice.segments.length - 1]?.arriving_at;
                          const aircraft = slice.segments?.[0]?.aircraft?.name || slice.segments?.[0]?.aircraft?.iata_code;
                          
                          // Debug log for first flight
                          if (index === 0) {
                            console.log('🔍 Flight data:', {
                              airline: slice.airline,
                              flight_number: slice.flight_number,
                              segments: slice.segments,
                              aircraft: aircraft,
                              hasSegments: !!slice.segments,
                              segmentCount: slice.segments?.length
                            });
                          }
                          
                          return (
                            <Card key={flight.offer_id || index} className="p-6 hover:shadow-lg transition-shadow">
                              <div className="flex justify-between items-start gap-6">
                                <div className="flex-1">
                                  {/* Airline & Flight Number */}
                                  <div className="flex items-center gap-3 mb-3">
                                    <span className="text-blue-600 text-2xl">✈️</span>
                                    <div>
                                      <div className="font-semibold text-lg">{slice.airline}</div>
                                      <div className="text-sm text-gray-600">
                                        {slice.flight_number && `Flight ${slice.flight_number}`}
                                        {aircraft && (
                                          <span className="ml-2 text-gray-500">• {aircraft}</span>
                                        )}
                                        {!aircraft && slice.segments?.length && (
                                          <span className="ml-2 text-gray-400">• Aircraft TBD</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Route */}
                                  <div className="text-xl font-bold mb-3">
                                    {slice.origin} → {slice.destination}
                                  </div>
                                  
                                  {/* Time & Duration */}
                                  <div className="flex gap-6 text-sm text-gray-700">
                                    <div>
                                      <div className="text-xs text-gray-500 mb-1">Departure</div>
                                      <div className="font-semibold">
                                        {departureTime && new Date(departureTime).toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {departureTime && new Date(departureTime).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-center justify-center">
                                      <div className="text-xs text-gray-500 mb-1">Duration</div>
                                      <div className="text-sm font-semibold text-blue-600">
                                        {slice.duration && slice.duration.replace('PT', '').replace('H', 'h ').replace('M', 'm')}
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <div className="text-xs text-gray-500 mb-1">Arrival</div>
                                      <div className="font-semibold">
                                        {arrivalTime && new Date(arrivalTime).toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {arrivalTime && new Date(arrivalTime).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Price & Button - Expedia Style (Per Person) */}
                                <div className="text-right ml-6">
                                  {/* Per Person Price - Clean Expedia Style */}
                                  <div className="text-3xl font-bold text-gray-900">
                                    {flight.currency}${Math.round(flight.price / (flight.offer?.passengers?.length || 1))}
                                  </div>
                                  
                                  {/* "per traveller" label - FIXED: Show correct label based on context */}
                                  <div className="text-sm text-gray-500 mt-1">
                                    {(searchParams?.tripType === 'return' || searchParams?.returnDate) ? 'Outbound per traveller' : 'One-way per traveller'}
                                  </div>
                                  
                                  <button
                                    onClick={() => handleSelectOutbound(flight)}
                                    className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition font-semibold mt-4"
                                  >
                                    Select →
                                  </button>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                        {outboundFlights.length > displayCount && (
                          <Button
                            variant="outline"
                            onClick={() => setDisplayCount(displayCount + 15)}
                            className="w-full"
                          >
                            Load More ({outboundFlights.length - displayCount} remaining)
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Return Section - Only show if outbound selected */}
                  {selectedOutbound && (
                    <div id="return-section" className="scroll-mt-8">
                      <h2 className="text-2xl font-bold mb-4">
                        {selectedReturn ? '✅ Return Flight Selected' : '2. Select Return Flight'}
                      </h2>
                      <p className="text-gray-600 mb-4">
                        {searchParams?.destination || searchParams?.to} → {searchParams?.origin || searchParams?.from}
                      </p>
                      
                      {selectedReturn ? (
                        <Card className="bg-green-50 border-2 border-green-500 p-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-lg">{selectedReturn.slice.airline}</div>
                              <div className="text-gray-700">
                                {selectedReturn.slice.origin} → {selectedReturn.slice.destination}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {selectedReturn.slice.departure_datetime && 
                                  new Date(selectedReturn.slice.departure_datetime).toLocaleString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                }
                              </div>
                            </div>
                            <div className="text-right">
                              {/* Per Person Price - Expedia Style */}
                              <div className="text-3xl font-bold text-gray-900">
                                {selectedReturn.currency}${Math.round(selectedReturn.price / (selectedReturn.offer?.passengers?.length || 1))}
                              </div>
                              
                              {/* "per traveller" label - Clean and simple */}
                              <div className="text-sm text-gray-500 mt-1">
                                Return per traveller
                              </div>
                              
                              <button 
                                onClick={() => setSelectedReturn(null)}
                                className="text-sm text-blue-600 hover:underline mt-3"
                              >
                                Change Flight
                              </button>
                            </div>
                          </div>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {returnFlights.slice(0, displayCount).map((flight, index) => {
                            const slice = flight.slice;
                            // Get times from slice or fallback to first segment
                            const departureTime = slice.departure_datetime || slice.segments?.[0]?.departing_at;
                            const arrivalTime = slice.arrival_datetime || slice.segments?.[slice.segments.length - 1]?.arriving_at;
                            const aircraft = slice.segments?.[0]?.aircraft?.name || slice.segments?.[0]?.aircraft?.iata_code;
                            
                            return (
                              <Card key={flight.offer_id || index} className="p-6 hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start gap-6">
                                  <div className="flex-1">
                                    {/* Airline & Flight Number */}
                                    <div className="flex items-center gap-3 mb-3">
                                      <span className="text-blue-600 text-2xl">✈️</span>
                                      <div>
                                        <div className="font-semibold text-lg">{slice.airline}</div>
                                        <div className="text-sm text-gray-600">
                                          {slice.flight_number && `Flight ${slice.flight_number}`}
                                          {aircraft && (
                                            <span className="ml-2 text-gray-500">• {aircraft}</span>
                                          )}
                                          {!aircraft && slice.segments?.length && (
                                            <span className="ml-2 text-gray-400">• Aircraft TBD</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Route */}
                                    <div className="text-xl font-bold mb-3">
                                      {slice.origin} → {slice.destination}
                                    </div>
                                    
                                    {/* Time & Duration */}
                                    <div className="flex gap-6 text-sm text-gray-700">
                                      <div>
                                        <div className="text-xs text-gray-500 mb-1">Departure</div>
                                        <div className="font-semibold">
                                          {departureTime && new Date(departureTime).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {departureTime && new Date(departureTime).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric'
                                          })}
                                        </div>
                                      </div>
                                      
                                      <div className="flex flex-col items-center justify-center">
                                        <div className="text-xs text-gray-500 mb-1">Duration</div>
                                        <div className="text-sm font-semibold text-blue-600">
                                          {slice.duration && slice.duration.replace('PT', '').replace('H', 'h ').replace('M', 'm')}
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <div className="text-xs text-gray-500 mb-1">Arrival</div>
                                        <div className="font-semibold">
                                          {arrivalTime && new Date(arrivalTime).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {arrivalTime && new Date(arrivalTime).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric'
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Price & Button - Expedia Style (Per Person) */}
                                  <div className="text-right ml-6">
                                    {/* Per Person Price - Clean Expedia Style */}
                                    <div className="text-3xl font-bold text-gray-900">
                                      {flight.currency}${Math.round(flight.price / (flight.offer?.passengers?.length || 1))}
                                    </div>
                                    
                                    {/* "per traveller" label - Simple */}
                                    <div className="text-sm text-gray-500 mt-1">
                                      Return per traveller
                                    </div>
                                    
                                    <button
                                      onClick={() => handleSelectReturn(flight)}
                                      className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition font-semibold mt-4"
                                    >
                                      Select →
                                    </button>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                          {returnFlights.length > displayCount && (
                            <Button
                              variant="outline"
                              onClick={() => setDisplayCount(displayCount + 15)}
                              className="w-full"
                            >
                              Load More ({returnFlights.length - displayCount} remaining)
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Trip Summary Sidebar */}
                <div className="w-96 sticky top-4 h-fit trip-summary-sidebar">
                  <div className="border rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white shadow-lg">
                    <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                      <span>🧳</span>
                      Your Trip Summary
                    </h3>
                    
                    {/* Outbound Flight */}
                    {selectedOutbound && (() => {
                      const segments = selectedOutbound.slice.segments || [];
                      const firstSegment = segments[0];
                      const lastSegment = segments[segments.length - 1];
                      const departureTime = firstSegment?.departing_at;
                      const arrivalTime = lastSegment?.arriving_at;
                      
                      return (
                        <div className="mb-6 pb-6 border-b">
                          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                            Outbound Flight
                          </div>
                          
                          {/* Airline & Flight Number */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-lg">{selectedOutbound.slice.airline}</span>
                            {selectedOutbound.slice.flight_number && (
                              <span className="text-sm text-gray-600">#{selectedOutbound.slice.flight_number}</span>
                            )}
                          </div>
                          
                          {/* Route */}
                          <div className="text-sm text-gray-700 mb-3">
                            {selectedOutbound.slice.origin} → {selectedOutbound.slice.destination}
                          </div>
                          
                          {/* Date & Times */}
                          {departureTime && arrivalTime && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {/* Departure */}
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Departure</div>
                                  <div className="font-semibold">
                                    {new Date(departureTime).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {new Date(departureTime).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                </div>
                                
                                {/* Arrival */}
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Arrival</div>
                                  <div className="font-semibold">
                                    {new Date(arrivalTime).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {new Date(arrivalTime).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Duration */}
                              {selectedOutbound.slice.duration && (
                                <div className="mt-2 pt-2 border-t border-gray-200 text-center">
                                  <span className="text-xs text-gray-500">Duration: </span>
                                  <span className="text-sm font-semibold text-blue-600">
                                    {selectedOutbound.slice.duration.replace('PT', '').replace('H', 'h ').replace('M', 'm')}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Price */}
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Flight Price</span>
                            <span className="font-bold text-lg">${selectedOutbound.price.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Return Flight */}
                    {selectedReturn && (() => {
                      const segments = selectedReturn.slice.segments || [];
                      const firstSegment = segments[0];
                      const lastSegment = segments[segments.length - 1];
                      const departureTime = firstSegment?.departing_at;
                      const arrivalTime = lastSegment?.arriving_at;
                      
                      return (
                        <div className="mb-6 pb-6 border-b">
                          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                            Return Flight
                          </div>
                          
                          {/* Airline & Flight Number */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-lg">{selectedReturn.slice.airline}</span>
                            {selectedReturn.slice.flight_number && (
                              <span className="text-sm text-gray-600">#{selectedReturn.slice.flight_number}</span>
                            )}
                          </div>
                          
                          {/* Route */}
                          <div className="text-sm text-gray-700 mb-3">
                            {selectedReturn.slice.origin} → {selectedReturn.slice.destination}
                          </div>
                          
                          {/* Date & Times */}
                          {departureTime && arrivalTime && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {/* Departure */}
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Departure</div>
                                  <div className="font-semibold">
                                    {new Date(departureTime).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {new Date(departureTime).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                </div>
                                
                                {/* Arrival */}
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Arrival</div>
                                  <div className="font-semibold">
                                    {new Date(arrivalTime).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {new Date(arrivalTime).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Duration */}
                              {selectedReturn.slice.duration && (
                                <div className="mt-2 pt-2 border-t border-gray-200 text-center">
                                  <span className="text-xs text-gray-500">Duration: </span>
                                  <span className="text-sm font-semibold text-blue-600">
                                    {selectedReturn.slice.duration.replace('PT', '').replace('H', 'h ').replace('M', 'm')}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Price */}
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Flight Price</span>
                            <span className="font-bold text-lg">${selectedReturn.price.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Total */}
                    {selectedOutbound && (
                      <>
                        <div className="flex justify-between items-center text-xl font-bold mb-6">
                          <span>Total Price</span>
                          <span className="text-green-600">
                            ${(selectedOutbound.price + (selectedReturn?.price || 0)).toFixed(2)} {selectedOutbound.currency || 'AUD'}
                          </span>
                        </div>
                        
                        {selectedOutbound && selectedReturn && (
                          <button
                            onClick={() => window.location.href = '/seat-selection'}
                            className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold text-lg"
                          >
                            Continue to Seats & Bags →
                          </button>
                        )}
                        
                        {selectedOutbound && !selectedReturn && (
                          <div className="text-center">
                            <div className="text-sm text-gray-500 bg-gray-50 rounded-lg py-8 px-4">
                              👇 Select a return flight to continue
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    
                    {!selectedOutbound && (
                      <div className="text-center py-12 text-gray-400">
                        <div className="text-4xl mb-3">✈️</div>
                        <div className="text-sm">
                          Select your flights to see trip summary
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : filteredFlights.length === 0 ? (
              <div className="p-8 text-center border rounded-lg">
                <p className="text-lg text-gray-600">No flights match your filters.</p>
                <div className="flex flex-col items-center gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setFilters({
                        minPrice: 0,
                        maxPrice: 10000,
                        departureTime: "all",
                        airlines: [],
                      })
                    }
                  >
                    Clear Filters
                  </Button>
                  {searchParams && (
                    <button
                      onClick={() => searchFlights(searchParams)}
                      className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            ) : (
              visibleFlights.map((flight, index) => {
                const slice = flight.slice;
                const origin = getSliceOrigin(slice);
                const destination = getSliceDestination(slice);
                
                // Use normalized datetime fields first, fallback to segments
                const departureTime = slice.departure_datetime
                  ? new Date(slice.departure_datetime)
                  : slice.segments?.[0]?.departing_at
                  ? new Date(slice.segments[0].departing_at)
                  : null;
                const arrivalTime = slice.arrival_datetime
                  ? new Date(slice.arrival_datetime)
                  : slice.segments?.[slice.segments?.length - 1]?.arriving_at
                  ? new Date(slice.segments[slice.segments.length - 1].arriving_at)
                  : null;
                const stops = slice.segments?.length
                  ? slice.segments.length - 1
                  : 0;

                const flightLegNumber = flight.legNumber || safeStepNumber;
                const legIndex = Math.max(0, flightLegNumber - 1);
                let isSelected = false;
                if (tripType === "multi_city") {
                  isSelected = bookedFlights?.[legIndex]?.sliceId === slice.id;
                } else if (tripType === "return" || tripType === "round_trip") {
                  isSelected =
                    (stepValue === "return" && bookedReturn?.sliceId === slice.id) ||
                    (stepValue !== "return" && bookedOutbound?.sliceId === slice.id);
                } else {
                  isSelected = bookedOutbound?.sliceId === slice.id;
                }

                const handleClick = () => {
                  if (tripType === "multi_city") {
                    handleSelectMultiCityFlight(flight);
                  } else if (tripType === "return" || tripType === "round_trip") {
                    if (stepValue === "return") {
                      handleSelectReturn(flight);
                    } else {
                      handleSelectOutbound(flight);
                    }
                  } else {
                    handleSelectOutbound(flight);
                  }
                };

                return (
                  <Card key={flight.offer_id || index} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between gap-6">
                      {/* Flight Info */}
                      <div className="flex-1">
                        {/* Airline */}
                        <div className="flex items-center gap-4 mb-4">
                          <Plane className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-lg">{slice.airline}</span>
                          {stops > 0 && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {stops} stop{stops > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        {/* Route and Flight Details */}
                        <div className="space-y-2 ml-9">
                          {/* Route */}
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-lg">
                              {origin} → {destination}
                            </span>
                          </div>

                          {/* Time and Duration */}
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            {departureTime && (
                              <div>
                                <span className="font-medium">Depart:</span>{" "}
                                {departureTime.toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            )}
                            {arrivalTime && (
                              <div>
                                <span className="font-medium">Arrive:</span>{" "}
                                {arrivalTime.toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>{formatDuration(slice.duration)}</span>
                            </div>
                          </div>

                          {/* Flight Details */}
                          <div className="text-xs text-gray-500">
                            {slice.airline} {slice.flight_number || ""}
                          </div>
                        </div>
                      </div>

                      {/* Price & Select */}
                      <div className="text-right min-w-[160px]">
                        <div className="mb-4">
                          <div className="text-sm text-gray-500 mb-1">Price</div>
                          <div className="flex items-center justify-end gap-1">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <span className="text-3xl font-bold">
                              {parseFloat(String(flight.price)).toFixed(2)}
                            </span>
                            <span className="text-gray-500 text-lg">{flight.currency}</span>
                          </div>
                        </div>

                        {tripType === "multi_city" ? (
                          <Button
                            onClick={handleClick}
                            className="w-full"
                            size="lg"
                            disabled={saving || isSelected}
                          >
                            {saving ? "Saving..." : isSelected ? "Selected ✓" : `Select Flight ${flightLegNumber} of ${totalLegs} →`}
                          </Button>
                        ) : tripType === "return" || tripType === "round_trip" ? (
                          stepValue === "return" ? (
                            <Button
                              onClick={handleClick}
                              className="w-full"
                              size="lg"
                              disabled={saving || isSelected}
                            >
                              {saving ? "Saving..." : isSelected ? "Selected ✓" : "Select Return Flight →"}
                            </Button>
                          ) : (
                            <button
                              onClick={() => handleSelectOutbound(flight)}
                              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 w-full"
                            >
                              Select Outbound Flight →
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => handleSelectOutbound(flight)}
                            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 w-full"
                          >
                            Select Outbound Flight →
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}

            {hasMoreFlights && (
              <div className="mt-8 flex flex-col items-center gap-3">
                <button
                  onClick={() => setDisplayCount((prev) => prev + 15)}
                  className="px-8 py-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition font-semibold text-gray-700"
                >
                  Show 15 More Flights ({remainingFlights} remaining)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
