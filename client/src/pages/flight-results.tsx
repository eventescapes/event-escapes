import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import type { FlightSearchParams, TripType, SelectedSeat } from '@/types/flights';
import { searchFlights as duffelSearchFlights, createOneWaySearch, createReturnSearch, createMultiCitySearch, type DuffelOffer } from '@/utils/duffel';
import { useBooking } from '@/contexts/BookingContext';
import TripSummary from '@/components/TripSummary';
import FloatingCheckout from '@/components/FloatingCheckout';
import { SeatSelectionModal } from '@/components/SeatSelectionModal';
import { BaggageSelectionModal } from '@/components/ui/BaggageSelectionModal';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plane, Clock, MapPin } from 'lucide-react';

// Backend response types matching Edge Function format
interface EdgeFunctionOffer {
  id: string;
  total_amount: number;
  total_currency: string;
  expires_at: string;
  slices: EdgeFunctionSlice[];
}

interface EdgeFunctionSlice {
  slice_index: number;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  segments: EdgeFunctionSegment[];
  stops: number;
}

interface EdgeFunctionSegment {
  airline: string;
  airline_code: string;
  flight_number: string;
  aircraft: string;
  origin: string;
  destination: string;
  departing_at: string;
  arriving_at: string;
  duration: string;
}

interface EdgeFunctionSearchResponse {
  success: boolean;
  trip_type: 'one-way' | 'return' | 'multi-city';
  total_offers: number;
  offers: EdgeFunctionOffer[];
  error?: string;
}

// Multi-city slice interface (matches FlightSearchParams format)
interface MultiCitySlice {
  id: string;
  origin: string;
  destination: string;
  departure_date: string;
}

const FlightResults = () => {
  const [location, navigate] = useLocation();
  
  // Get search params from URL or default values
  const urlParams = new URLSearchParams(window.location.search);
  const [searchParams, setSearchParams] = useState<FlightSearchParams>({
    tripType: (urlParams.get('tripType') as TripType) || 'return',
    from: urlParams.get('from') || 'LAX',
    to: urlParams.get('to') || 'JFK',
    departDate: urlParams.get('departDate') || '2025-10-05',
    returnDate: urlParams.get('returnDate') || '2025-10-12',
    passengers: parseInt(urlParams.get('passengers') || '1'),
    cabinClass: (urlParams.get('cabinClass') as 'first' | 'business' | 'premium_economy' | 'economy') || 'economy',
    multiCitySlices: [] // Will be populated from URL if multi-city
  });

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<EdgeFunctionOffer[]>([]);
  const [selectedOffers, setSelectedOffers] = useState<{
    [sliceIndex: number]: {
      offerId: string;
      sliceId: string;
      flight: any;
      price: number;
      currency: string;
    };
  }>({});
  const [selectedSeats, setSelectedSeats] = useState<{ [sliceIndex: number]: SelectedSeat[] }>({});
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [currentSeatSelection, setCurrentSeatSelection] = useState<{
    sliceIndex: number;
    offerId: string;
    sliceOrigin: string;
    sliceDestination: string;
  } | null>(null);
  const [showBaggageModal, setShowBaggageModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [cartItemId, setCartItemId] = useState<string | null>(null);

  // Current selection state for Order Summary
  const [currentSelection, setCurrentSelection] = useState<{
    offer: EdgeFunctionOffer | null;
    seats: any[];
    baggage: any[];
  }>({
    offer: null,
    seats: [],
    baggage: []
  });

  // Multi-city state
  const [multiCitySlices, setMultiCitySlices] = useState<MultiCitySlice[]>([
    { id: '1', origin: '', destination: '', departure_date: '' },
    { id: '2', origin: '', destination: '', departure_date: '' }
  ]);

  // Booking context
  const { 
    updateSelectedOutboundFlight,
    updateSelectedReturnFlight,
    updateSelectedSeats,
    addToCart,
    booking
  } = useBooking();

  // Initialize multi-city slices from URL params if needed
  useEffect(() => {
    if (searchParams.tripType === 'multi-city') {
      const slicesParam = urlParams.get('multiCitySlices');
      if (slicesParam) {
        try {
          const parsedSlices = JSON.parse(decodeURIComponent(slicesParam));
          setMultiCitySlices(parsedSlices);
          setSearchParams(prev => ({ ...prev, multiCitySlices: parsedSlices }));
        } catch (e) {
          console.warn('Failed to parse multi-city slices from URL');
        }
      }
    }
  }, []);

  // Build slices helper function based on trip type
  const buildSlicesFromParams = () => {
    switch (searchParams.tripType) {
      case 'one-way':
        return [{
          origin: searchParams.from,
          destination: searchParams.to,
          departureDate: searchParams.departDate
        }];
        
      case 'return':
        return [
          {
            origin: searchParams.from,
            destination: searchParams.to,
            departureDate: searchParams.departDate
          },
          {
            origin: searchParams.to, // CRITICAL: Return origin = outbound destination
            destination: searchParams.from, // Return destination = outbound origin
            departureDate: searchParams.returnDate || searchParams.departDate
          }
        ];
        
      case 'multi-city':
        return searchParams.multiCitySlices?.map(slice => ({
          origin: slice.origin,
          destination: slice.destination,
          departureDate: slice.departure_date
        })) || [];
        
      default:
        return [];
    }
  };

  // Main search function - FIXES Status 422 errors with correct format
  const searchFlights = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('=== BUILDING REQUEST ===');
      
      // Build slices based on trip type - EXACT format backend expects
      let slices: Array<{
        origin: string;
        destination: string;
        departureDate: string;
      }> = [];
      if (searchParams.tripType === 'one-way') {
        slices = [{
          origin: searchParams.from.trim().toUpperCase(),
          destination: searchParams.to.trim().toUpperCase(), 
          departureDate: searchParams.departDate
        }];
      } else if (searchParams.tripType === 'return') {
        if (!searchParams.returnDate) {
          throw new Error('Return date is required');
        }
        slices = [
          {
            origin: searchParams.from.trim().toUpperCase(),
            destination: searchParams.to.trim().toUpperCase(),
            departureDate: searchParams.departDate
          },
          {
            origin: searchParams.to.trim().toUpperCase(), // CRITICAL: Reverse for return
            destination: searchParams.from.trim().toUpperCase(),
            departureDate: searchParams.returnDate
          }
        ];
      } else if (searchParams.tripType === 'multi-city') {
        slices = (searchParams.multiCitySlices || []).map(slice => ({
          origin: slice.origin.trim().toUpperCase(),
          destination: slice.destination.trim().toUpperCase(),
          departureDate: slice.departure_date
        }));
      }

      const requestPayload = {
        tripType: searchParams.tripType,
        slices: slices,
        passengers: {
          adults: parseInt(searchParams.passengers.toString()) || 1,
          children: 0,
          infants: 0
        },
        cabinClass: searchParams.cabinClass || 'economy'
      };

      console.log('=== REQUEST PAYLOAD ===', JSON.stringify(requestPayload, null, 2));

      // Call Supabase Edge Function with correct format
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/flights-search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseKey
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('=== RESPONSE STATUS ===', response.status);

      const responseText = await response.text();
      console.log('=== RAW RESPONSE ===', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        console.error('=== API ERROR ===', data);
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (data.success && data.offers) {
        console.log('=== SUCCESS ===', `${data.offers.length} offers received`);
        
        // FILTER offers to exact airports only - FIX for wrong airport codes
        const filteredOffers = validateAndFilterOffers(
          data.offers, 
          searchParams.from.trim().toUpperCase(),
          searchParams.to.trim().toUpperCase()
        );

        console.log(`✅ Filtered ${data.offers.length} offers to ${filteredOffers.length} exact matches`);

        if (filteredOffers.length === 0) {
          throw new Error(`No flights found for exact route ${searchParams.from.toUpperCase()}→${searchParams.to.toUpperCase()}. API returned flights from other airports.`);
        }

        // Store FILTERED REAL offers - NO MOCK DATA, EXACT AIRPORTS ONLY
        setOffers(filteredOffers);
      } else {
        throw new Error(data.error || 'No flights found');
      }

    } catch (error) {
      console.error('=== SEARCH ERROR ===', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Search failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  // Airport code validation and filtering - CRITICAL FIX
  const validateAndFilterOffers = (offers: EdgeFunctionOffer[], requestedOrigin: string, requestedDestination: string) => {
    console.log(`🛂 Filtering ${offers.length} offers for exact route ${requestedOrigin}→${requestedDestination}`);
    
    return offers.filter(offer => {
      // For each slice, ensure it matches the requested airports exactly
      return offer.slices.every((slice, sliceIndex) => {
        if (searchParams.tripType === 'return') {
          if (sliceIndex === 0) {
            // Outbound: should match requested origin → destination
            const isValidOutbound = slice.origin === requestedOrigin && slice.destination === requestedDestination;
            if (!isValidOutbound) {
              console.log(`❌ Outbound slice ${slice.origin}→${slice.destination} doesn't match ${requestedOrigin}→${requestedDestination}`);
            }
            return isValidOutbound;
          } else {
            // Return: should match requested destination → origin  
            const isValidReturn = slice.origin === requestedDestination && slice.destination === requestedOrigin;
            if (!isValidReturn) {
              console.log(`❌ Return slice ${slice.origin}→${slice.destination} doesn't match ${requestedDestination}→${requestedOrigin}`);
            }
            return isValidReturn;
          }
        } else {
          // One-way: should match exactly
          const isValidOneWay = slice.origin === requestedOrigin && slice.destination === requestedDestination;
          if (!isValidOneWay) {
            console.log(`❌ One-way slice ${slice.origin}→${slice.destination} doesn't match ${requestedOrigin}→${requestedDestination}`);
          }
          return isValidOneWay;
        }
      });
    });
  };

  // Get proper slice title for display
  const getSliceTitle = (sliceIndex: number): string => {
    switch (searchParams.tripType) {
      case 'return':
        return sliceIndex === 0 
          ? `Outbound (${searchParams.from} → ${searchParams.to})`
          : `Return (${searchParams.to} → ${searchParams.from})`;
      case 'one-way':
        return `${searchParams.from} → ${searchParams.to}`;
      case 'multi-city':
        if (searchParams.multiCitySlices?.[sliceIndex]) {
          const slice = searchParams.multiCitySlices[sliceIndex];
          return `${slice.origin} → ${slice.destination}`;
        }
        return `Flight ${sliceIndex + 1}`;
      default:
        return `Flight ${sliceIndex + 1}`;
    }
  };

  // Process offers for display - properly separate outbound and return slices with airport validation
  const processOffersForDisplay = (offers: EdgeFunctionOffer[]) => {
    const sliceGroups: { [sliceIndex: number]: any[] } = {};
    
    offers.forEach(offer => {
      offer.slices.forEach((slice, sliceIndex) => {
        if (!sliceGroups[sliceIndex]) {
          sliceGroups[sliceIndex] = [];
        }
        
        // Only include slice if it matches the expected route
        let shouldInclude = true;
        
        if (searchParams.tripType === 'return') {
          if (sliceIndex === 0) {
            // Outbound slice: origin should match departure city
            shouldInclude = slice.origin === searchParams.from.toUpperCase();
          } else {
            // Return slice: origin should match destination city (return leg)
            shouldInclude = slice.origin === searchParams.to.toUpperCase();
          }
        } else if (searchParams.tripType === 'one-way') {
          // One-way: should match exact route
          shouldInclude = slice.origin === searchParams.from.toUpperCase() && 
                         slice.destination === searchParams.to.toUpperCase();
        }
        
        if (shouldInclude) {
          const displayFlight = {
            id: `${offer.id}-slice-${sliceIndex}`,
            offerId: offer.id,
            sliceId: slice.slice_index.toString(),
            sliceIndex,
            airline: slice.segments[0]?.airline,
            flight_number: slice.segments[0]?.flight_number,
            departure_time: slice.segments[0]?.departing_at || slice.departure_time,
            arrival_time: slice.segments[slice.segments.length - 1]?.arriving_at || slice.arrival_time,
            departureAirport: slice.origin,
            arrivalAirport: slice.destination,
            duration: slice.duration,
            stops: slice.segments.length - 1,
            price: sliceIndex === 0 ? parseFloat(offer.total_amount.toString()) : 0,
            currency: offer.total_currency,
            segments: slice.segments
          };
          
          sliceGroups[sliceIndex].push(displayFlight);
        }
      });
    });
    
    return sliceGroups;
  };


  // Multi-city helpers
  const addCity = () => {
    if (multiCitySlices.length < 6) {
      setMultiCitySlices([
        ...multiCitySlices,
        { id: Date.now().toString(), origin: '', destination: '', departure_date: '' }
      ]);
    }
  };

  const removeCity = (id: string) => {
    if (multiCitySlices.length > 2) {
      setMultiCitySlices(multiCitySlices.filter(slice => slice.id !== id));
    }
  };

  // Flight selection handler
  const handleFlightSelect = (sliceIndex: number, flight: any) => {
    console.log('✈️ Flight selected:', flight);
    
    setSelectedOffers(prev => ({
      ...prev,
      [sliceIndex]: {
        offerId: flight.offerId,
        sliceId: flight.sliceId,
        flight: flight,
        price: flight.price,
        currency: flight.currency
      }
    }));
    
    // Update current selection for Order Summary
    const fullOffer = offers.find(o => o.id === flight.offerId);
    if (fullOffer && sliceIndex === 0) {
      console.log('✈️ Setting current selection offer:', fullOffer);
      setCurrentSelection({
        offer: fullOffer,
        seats: [],
        baggage: []
      });
    }
  };

  // Check if all required slices are selected
  const areAllSlicesSelected = () => {
    const requiredSlices = searchParams.tripType === 'one-way' ? 1 :
                          searchParams.tripType === 'return' ? 2 :
                          searchParams.multiCitySlices?.length || 0;
    
    for (let i = 0; i < requiredSlices; i++) {
      if (!selectedOffers[i]) {
        return false;
      }
    }
    return true;
  };

  // Build cart item from current selection
  const buildCartItem = (selection: typeof currentSelection) => {
    if (!selection.offer) return null;
    
    const flightBase = parseFloat(selection.offer.total_amount?.toString() || '0');
    const seatsCost = selection.seats.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
    const baggageCost = selection.baggage.reduce((sum, b) => sum + (parseFloat(b.amount || '0') * (b.quantity || 1)), 0);

    return {
      type: 'flight',
      offerId: selection.offer.id,
      addedAt: new Date().toISOString(),
      flight: {
        origin: selection.offer.slices[0]?.origin || searchParams.from,
        destination: selection.offer.slices[0]?.destination || searchParams.to,
        departureDate: selection.offer.slices[0]?.departure_time || searchParams.departDate,
        returnDate: selection.offer.slices[1]?.departure_time || null,
        airline: selection.offer.slices[0]?.segments[0]?.airline || 'Unknown',
        totalAmount: selection.offer.total_amount?.toString() || '0',
        totalCurrency: selection.offer.total_currency || 'AUD',
      },
      selectedSeats: selection.seats.map(s => ({
        serviceId: s.serviceId || s.id || '',
        designator: s.designator || '',
        passengerId: s.passengerId || '',
        segmentId: s.segmentId || '',
        amount: s.amount || '0'
      })),
      selectedBaggage: selection.baggage,
      passengers: Array.from({ length: searchParams.passengers }, (_, i) => ({
        id: `passenger_${i + 1}`,
        type: 'adult'
      })),
      pricing: {
        flightBase,
        seats: seatsCost,
        baggage: baggageCost,
        total: flightBase + seatsCost + baggageCost,
        currency: selection.offer.total_currency || 'AUD',
      }
    };
  };

  // Handle Book Now - direct checkout
  const handleBookNow = () => {
    console.log('🛒 === BOOK NOW CLICKED ===');
    
    if (!currentSelection.offer) {
      console.error('❌ No offer selected');
      return;
    }
    
    // Build complete checkout data with all necessary fields
    const checkoutData = {
      offer: {
        ...currentSelection.offer,
        // Ensure passengers array exists for payment processing
        passengers: currentSelection.offer.passengers || Array.from(
          { length: searchParams.passengers },
          (_, i) => ({ id: `passenger_${i + 1}`, type: 'adult' })
        )
      },
      selectedSeats: currentSelection.seats || [],
      selectedBaggage: currentSelection.baggage || [],
    };
    
    console.log('🛒 Saving checkout data to sessionStorage:');
    console.log('🛒 - Offer ID:', checkoutData.offer.id);
    console.log('🛒 - Total Amount:', checkoutData.offer.total_amount, checkoutData.offer.total_currency);
    console.log('🛒 - Passengers:', checkoutData.offer.passengers?.length || 0);
    console.log('🛒 - Selected Seats:', checkoutData.selectedSeats.length);
    console.log('🛒 - Selected Baggage:', checkoutData.selectedBaggage.length);
    console.log('🛒 Complete data:', checkoutData);
    
    sessionStorage.setItem('checkout_item', JSON.stringify(checkoutData));
    console.log('✅ Saved to sessionStorage successfully!');
    console.log('🛒 Navigating to /passenger-details...');
    navigate('/passenger-details');
  };

  // Handle Add to Cart - save to localStorage
  const handleAddToCartFromSummary = () => {
    console.log('🛒 === ADD TO CART FROM SUMMARY ===');
    const item = buildCartItem(currentSelection);
    if (!item) {
      console.error('❌ No selection to add to cart');
      return;
    }
    
    console.log('🛒 Cart item:', item);
    
    try {
      const cart = JSON.parse(localStorage.getItem('eventescapes_cart') || '[]');
      cart.push(item);
      localStorage.setItem('eventescapes_cart', JSON.stringify(cart));
      console.log('✅ Added to cart:', item);
      
      // Show success message
      setShowSuccessMessage(true);
      
      // Clear selection
      setCurrentSelection({ offer: null, seats: [], baggage: [] });
      setSelectedOffers({});
      setSelectedSeats({});
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
    }
  };

  // Handle Baggage Selection Complete
  const handleBaggageComplete = (baggage: any[]) => {
    console.log('🧳 === BAGGAGE SELECTION COMPLETE ===');
    console.log('🧳 Baggage selected:', baggage);
    
    // Update currentSelection for Order Summary
    setCurrentSelection(prev => {
      const newSelection = { ...prev, baggage };
      console.log('🧳 Updated currentSelection:', newSelection);
      return newSelection;
    });
    
    // Close baggage modal - user can now Book Now or Add to Cart
    setShowBaggageModal(false);
  };

  // Handle adding to cart with direct localStorage save (legacy - keeping for compatibility)
  const handleAddToCart = () => {
    console.log('🛒 === ADD TO CART CALLED ===');
    console.log('Selected Offers:', selectedOffers);
    console.log('Selected Seats:', selectedSeats);
    
    // Extract flight information
    const outboundOffer = selectedOffers[0];
    const returnOffer = selectedOffers[1];
    
    if (!outboundOffer) {
      console.error('❌ No outbound offer selected');
      return;
    }

    console.log('✅ Outbound Offer:', outboundOffer);
    if (returnOffer) {
      console.log('✅ Return Offer:', returnOffer);
    }
    
    // Calculate pricing
    const flightBase = outboundOffer.price + (returnOffer?.price || 0);
    const seatsTotal = Object.values(selectedSeats).flat().reduce((sum: number, seat: any) => {
      return sum + (parseFloat(seat.amount || '0'));
    }, 0);
    const baggageTotal = 0; // No baggage in current implementation
    
    const totalPrice = flightBase + seatsTotal + baggageTotal;
    
    console.log('💰 Pricing Calculation:');
    console.log('  Flight Base:', flightBase);
    console.log('  Seats Total:', seatsTotal);
    console.log('  Baggage Total:', baggageTotal);
    console.log('  Total Price:', totalPrice);
    
    // Build cart item matching spec structure
    const cartItem = {
      type: 'flight',
      offerId: outboundOffer.offerId,
      addedAt: new Date().toISOString(),
      flight: {
        origin: outboundOffer.flight.departureAirport || searchParams.from,
        destination: outboundOffer.flight.arrivalAirport || searchParams.to,
        departureDate: searchParams.departDate,
        returnDate: searchParams.returnDate || null,
        airline: outboundOffer.flight.airline,
        totalAmount: totalPrice.toString(),
        totalCurrency: outboundOffer.currency || 'AUD'
      },
      selectedSeats: Object.values(selectedSeats).flat().map((seat: any) => ({
        serviceId: seat.serviceId || seat.id || '',
        designator: seat.designator || '',
        passengerId: seat.passengerId || '',
        segmentId: seat.segmentId || '',
        amount: seat.amount || '0'
      })),
      selectedBaggage: [], // Empty for now
      passengers: Array.from({ length: searchParams.passengers }, (_, i) => ({
        id: `passenger_${i + 1}`,
        type: 'adult'
      })),
      pricing: {
        flightBase: flightBase,
        seats: seatsTotal,
        baggage: baggageTotal,
        total: totalPrice,
        currency: outboundOffer.currency || 'AUD'
      }
    };
    
    console.log('📦 Cart Item Built:', JSON.stringify(cartItem, null, 2));
    
    // CRITICAL: Save to localStorage BEFORE showing success modal
    try {
      const existingCartData = localStorage.getItem('eventescapes_cart');
      console.log('📂 Existing cart data:', existingCartData);
      
      const cart = existingCartData ? JSON.parse(existingCartData) : [];
      console.log('📂 Parsed cart:', cart);
      
      cart.push(cartItem);
      console.log('📂 Cart after push:', cart);
      
      localStorage.setItem('eventescapes_cart', JSON.stringify(cart));
      console.log('✅ Cart saved to localStorage');
      
      // Verify save
      const savedCart = localStorage.getItem('eventescapes_cart');
      console.log('✅ Verification - localStorage after save:', savedCart);
      
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
    }
    
    // Clear current selection state
    setSelectedOffers({});
    setSelectedSeats({});
    setShowSeatSelection(false);
    setCurrentSeatSelection(null);
    
    // NOW show success message (after localStorage save)
    console.log('✅ Showing success modal');
    setShowSuccessMessage(true);
  };

  // Auto search on page load
  useEffect(() => {
    if (searchParams.from && searchParams.to && searchParams.departDate) {
      searchFlights();
    }
  }, []);

  // Automatic seat selection trigger when all flights are selected
  useEffect(() => {
    const hasAnySeatData = Object.keys(selectedSeats).length > 0;
    
    // Only trigger seat selection if:
    // 1. All slices are selected
    // 2. Not already in seat selection
    // 3. No previous seat data
    // 4. Not already completed seat selection flow
    if (areAllSlicesSelected() && !showSeatSelection && !currentSeatSelection && !hasAnySeatData) {
      console.log('🎯 All flights selected - triggering seat selection');
      
      const firstOffer = selectedOffers[0];
      if (firstOffer) {
        setCurrentSeatSelection({
          sliceIndex: 0,
          offerId: firstOffer.offerId,
          sliceOrigin: firstOffer.flight.departureAirport,
          sliceDestination: firstOffer.flight.arrivalAirport
        });
        setShowSeatSelection(true);
      }
    }
  }, [selectedOffers, showSeatSelection, currentSeatSelection, selectedSeats]);

  // Display data processing
  const getFlightDisplayData = () => {
    if (offers.length === 0) {
      return { hasResults: false, sliceGroups: {} };
    }

    const sliceGroups = processOffersForDisplay(offers);
    return {
      hasResults: Object.keys(sliceGroups).length > 0,
      sliceGroups
    };
  };

  const displayData = getFlightDisplayData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
              data-testid="button-back-to-search"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              Flight Results
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12" data-testid="loading-flights">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Searching for flights...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" data-testid="error-message">
            <p className="text-red-800">{error}</p>
            <Button
              onClick={() => searchFlights()}
              className="mt-3"
              data-testid="button-retry-search"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && displayData.hasResults && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Flight Results */}
            <div className="lg:col-span-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-medium" data-testid="text-results-count">
                  Found {offers.length} flight options across {Object.keys(displayData.sliceGroups).length} slice(s).
                </p>
              </div>

              {/* Render flight slices */}
              {Object.entries(displayData.sliceGroups).map(([sliceIndexStr, flights]) => {
                const sliceIndex = parseInt(sliceIndexStr);
                return (
                  <div key={sliceIndex} className="mb-8">
                    <h2 className="text-xl font-bold text-blue-900 mb-4" data-testid={`text-slice-title-${sliceIndex}`}>
                      {getSliceTitle(sliceIndex)}
                    </h2>
                    
                    <div className="space-y-4">
                      {flights.map((flight, flightIndex) => (
                        <div 
                          key={flight.id} 
                          className={`bg-white rounded-lg border shadow-sm p-4 cursor-pointer transition-colors hover:shadow-md ${
                            selectedOffers[sliceIndex]?.offerId === flight.offerId 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200'
                          }`}
                          data-testid={`card-flight-${sliceIndex}-${flightIndex}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <div className="text-sm font-medium text-blue-600">
                                  {flight.airline}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Flight {flight.flight_number}
                                </div>
                              </div>

                              <div className="grid grid-cols-3 items-center gap-4">
                                <div className="text-center">
                                  <div className="text-xl font-bold text-gray-900">
                                    {new Date(flight.departure_time).toLocaleTimeString('en-US', { 
                                      hour: '2-digit', 
                                      minute: '2-digit', 
                                      hour12: false 
                                    })}
                                  </div>
                                  <div className="text-sm text-gray-600">{flight.departureAirport}</div>
                                </div>

                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">{flight.duration}</span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                                  </div>
                                </div>

                                <div className="text-center">
                                  <div className="text-xl font-bold text-gray-900">
                                    {new Date(flight.arrival_time).toLocaleTimeString('en-US', { 
                                      hour: '2-digit', 
                                      minute: '2-digit', 
                                      hour12: false 
                                    })}
                                  </div>
                                  <div className="text-sm text-gray-600">{flight.arrivalAirport}</div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                              {flight.price > 0 && (
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-gray-900">
                                    ${flight.price}
                                  </div>
                                  <div className="text-sm text-gray-600">{flight.currency}</div>
                                </div>
                              )}

                              <Button
                                onClick={() => handleFlightSelect(sliceIndex, flight)}
                                variant={selectedOffers[sliceIndex]?.offerId === flight.offerId ? "default" : "outline"}
                                data-testid={`button-select-flight-${sliceIndex}-${flightIndex}`}
                              >
                                {selectedOffers[sliceIndex]?.offerId === flight.offerId ? 'Selected' : 'Select Flight'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <TripSummary
                currentSelection={currentSelection}
                onBookNow={handleBookNow}
                onAddToCart={handleAddToCartFromSummary}
              />
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && !displayData.hasResults && offers.length === 0 && (
          <div className="text-center py-12" data-testid="no-results">
            <Plane className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No flights found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or dates
            </p>
            <Button onClick={() => navigate('/')} data-testid="button-new-search">
              New Search
            </Button>
          </div>
        )}
      </div>

      {/* Seat Selection Modal */}
      {showSeatSelection && currentSeatSelection && (
        <SeatSelectionModal
          offerId={currentSeatSelection.offerId}
          passengers={Array.from({ length: searchParams.passengers }, (_, i) => ({
            id: `passenger_${i + 1}`,
            type: 'adult'
          }))}
          onSeatsSelected={(seats: any[]) => {
            console.log('💺 === SEATS SELECTED CALLBACK ===');
            console.log('💺 Seats received:', seats);
            console.log('💺 Current slice index:', currentSeatSelection.sliceIndex);
            
            // Verify each seat has amount
            seats.forEach(seat => {
              if (!seat.amount || seat.amount === '0' || seat.amount === '0.00') {
                console.error('❌ SEAT MISSING AMOUNT:', seat);
              } else {
                console.log(`✅ Seat ${seat.designator}: amount = ${seat.amount}`);
              }
            });
            
            // Update currentSelection for Order Summary
            setCurrentSelection(prev => {
              const newSelection = { ...prev, seats };
              console.log('💺 Updated currentSelection:', newSelection);
              return newSelection;
            });
            
            // Update the selected seats for this slice
            setSelectedSeats(prev => {
              const newSeats = {
                ...prev,
                [currentSeatSelection.sliceIndex]: seats
              };
              console.log('💺 Updated selectedSeats state:', newSeats);
              return newSeats;
            });
            
            // Move to next slice or close
            const nextSliceIndex = currentSeatSelection.sliceIndex + 1;
            const nextOffer = selectedOffers[nextSliceIndex];
            
            console.log('💺 Next slice index:', nextSliceIndex);
            console.log('💺 Next offer exists:', !!nextOffer);
            console.log('💺 Trip type:', searchParams.tripType);
            
            if (nextOffer && searchParams.tripType === 'return' && nextSliceIndex === 1) {
              // Go to return flight seat selection
              console.log('💺 Moving to return flight seat selection');
              setCurrentSeatSelection({
                sliceIndex: nextSliceIndex,
                offerId: nextOffer.offerId,
                sliceOrigin: nextOffer.flight.departureAirport,
                sliceDestination: nextOffer.flight.arrivalAirport
              });
            } else {
              // All seats selected - open baggage modal
              console.log('💺 All seats selected - opening baggage modal');
              setShowSeatSelection(false);
              setCurrentSeatSelection(null);
              setShowBaggageModal(true);
            }
          }}
          onClose={() => {
            setShowSeatSelection(false);
            setCurrentSeatSelection(null);
          }}
          onSkip={() => {
            // Skip seat selection for this slice
            const nextSliceIndex = currentSeatSelection.sliceIndex + 1;
            const nextOffer = selectedOffers[nextSliceIndex];
            
            if (nextOffer && searchParams.tripType === 'return' && nextSliceIndex === 1) {
              // Go to return flight seat selection
              setCurrentSeatSelection({
                sliceIndex: nextSliceIndex,
                offerId: nextOffer.offerId,
                sliceOrigin: nextOffer.flight.departureAirport,
                sliceDestination: nextOffer.flight.arrivalAirport
              });
            } else {
              // Skip all seat selection and add to cart
              handleAddToCart();
            }
          }}
        />
      )}

      {/* Baggage Selection Modal */}
      {showBaggageModal && currentSelection.offer && (
        <BaggageSelectionModal
          isOpen={showBaggageModal}
          onClose={() => setShowBaggageModal(false)}
          offerId={currentSelection.offer.id}
          passengers={Array.from({ length: searchParams.passengers }, (_, i) => ({
            id: `passenger_${i + 1}`,
            type: 'adult'
          }))}
          onComplete={handleBaggageComplete}
        />
      )}

      {/* Success Message Modal */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="success-modal">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Flight Added to Cart!</h3>
              <p className="text-gray-600 mb-6">
                Your flight selection has been successfully added to your cart. You can continue shopping or review your cart.
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowSuccessMessage(false);
                    navigate('/');
                  }}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-continue-planning"
                >
                  Continue Planning Your Trip
                </Button>
                <Button
                  onClick={() => {
                    setShowSuccessMessage(false);
                    navigate('/cart');
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  data-testid="button-view-cart"
                >
                  View Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightResults;