import { useState, useEffect, useRef } from 'react';
import type { FlightSearchResponseRaw, FlightSearchResponse, SelectedSeat, TripType, FlightSearchParams } from '@/types/flights';
import { baseCard, brandSelected, selectedCard } from '@/components/SelectedCardStyles';
import TripSummary from '@/components/TripSummary';
import FloatingCheckout from '@/components/FloatingCheckout';
import SeatMap from '@/components/SeatMap';
import SeatSelectionModal from '@/components/SeatSelectionModal';
import { useBooking } from '@/contexts/BookingContext';
import { searchFlights as duffelSearchFlights, createOneWaySearch, createReturnSearch, createMultiCitySearch, type DuffelOffer, type DuffelOfferRequestResponse } from '@/utils/duffel';

interface Flight {
  id: string;
  airline: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  stops: string;
  price: number;
  currency: string;
}

const FlightSearch = () => {
  const [searchParams, setSearchParams] = useState<FlightSearchParams>({
    tripType: 'return' as TripType,
    from: 'LAX',
    to: 'JFK',
    departDate: '2025-10-05',
    returnDate: '2025-10-12',
    passengers: 1,
    cabinClass: 'economy',
    multiCitySlices: []
  });

  const [flights, setFlights] = useState<{ outbound: any[]; inbound: any[] }>({ outbound: [], inbound: [] });
  const [selectedFlights, setSelectedFlights] = useState<{
    outbound: Flight | null;
    return: Flight | null;
  }>({
    outbound: null,
    return: null
  });

  // New Duffel-based selected flights state
  const [selectedOffers, setSelectedOffers] = useState<{
    [sliceIndex: number]: {
      offerId: string;
      sliceId: string;
      flight: any;
      price: number;
      currency: string;
    };
  }>({});

  // Check if all required slices are selected
  const areAllSlicesSelected = () => {
    const displayData = getFlightDisplayData();
    if (!displayData.hasResults) return false;
    
    return displayData.sliceGroups.every((_, sliceIndex) => 
      selectedOffers[sliceIndex] !== undefined
    );
  };

  // Calculate total price for selected Duffel offers
  const getOffersTotalPrice = () => {
    const selectedOffersList = Object.values(selectedOffers);
    if (selectedOffersList.length === 0) return { amount: 0, currency: 'USD' };
    
    const total = selectedOffersList.reduce((sum, offer) => sum + offer.price, 0);
    const currency = selectedOffersList[0]?.currency || 'USD';
    return { amount: total, currency };
  };
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [currentSeatSelection, setCurrentSeatSelection] = useState<{ sliceIndex: number; offerId: string; sliceOrigin: string; sliceDestination: string } | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Record<number, SelectedSeat[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const returnRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);

  // Environment validation on component mount
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const debug = {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined',
      keyPreview: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'undefined',
      fullEndpoint: supabaseUrl ? `${supabaseUrl}/functions/v1/flights-search` : 'Cannot construct - URL missing'
    };
    
    setDebugInfo(debug);
    console.log('Environment Check:', debug);
    
    if (!supabaseUrl || !supabaseKey) {
      setError('Missing environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Replit Secrets.');
    }
  }, []);

  // Auto-trigger seat selection when all slices are selected (but not if seats already completed)
  useEffect(() => {
    const hasAnySeatData = Object.keys(selectedSeats).length > 0;
    if (areAllSlicesSelected() && !showSeatSelection && !currentSeatSelection && !hasAnySeatData) {
      console.log('[SeatSelection] All slices selected, auto-triggering seat selection');
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

  const handleInputChange = (field: string, value: string | number) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const { updateSelectedSeats, updateSelectedOutboundFlight, updateSelectedReturnFlight } = useBooking();

  // Helper function to convert Duffel offers to display format grouped by slice
  const processOffersForDisplay = (offers: DuffelOffer[]) => {
    if (!offers || offers.length === 0) return [];

    // Group offers by slice - each slice represents a leg of the journey (outbound, return, etc.)
    const sliceGroups: { [sliceIndex: number]: any[] } = {};

    offers.forEach(offer => {
      offer.slices.forEach((slice, sliceIndex) => {
        if (!sliceGroups[sliceIndex]) {
          sliceGroups[sliceIndex] = [];
        }

        // Convert slice to display format
        const displayFlight = {
          id: offer.id,
          offerId: offer.id,
          sliceId: slice.id,
          sliceIndex,
          airline: slice.segments[0]?.marketing_carrier?.name || slice.segments[0]?.operating_carrier?.name || 'Unknown',
          airlineCode: slice.segments[0]?.marketing_carrier?.iata_code || slice.segments[0]?.operating_carrier?.iata_code || '',
          flight_number: slice.segments[0]?.flight_number || '',
          departure_time: slice.segments[0]?.departing_at || '',
          arrival_time: slice.segments[slice.segments.length - 1]?.arriving_at || '',
          departureAirport: slice.origin.iata_code,
          arrivalAirport: slice.destination.iata_code,
          duration: slice.duration,
          stops: slice.segments.length - 1,
          price: sliceIndex === 0 ? parseFloat(offer.total_amount) : 0, // Only first slice gets the full price to avoid double counting
          currency: offer.total_currency,
          segments: slice.segments.map(segment => ({
            airline: segment.marketing_carrier?.name || segment.operating_carrier?.name || 'Unknown',
            flightNumber: segment.flight_number,
            departureTime: segment.departing_at,
            arrivalTime: segment.arriving_at,
            duration: segment.duration,
            aircraft: segment.aircraft?.name
          }))
        };

        sliceGroups[sliceIndex].push(displayFlight);
      });
    });

    return sliceGroups;
  };

  // Get processed flight data for display
  const getFlightDisplayData = () => {
    if (!flights.outbound || flights.outbound.length === 0) {
      return { sliceGroups: [], hasResults: false };
    }

    const sliceGroups = processOffersForDisplay(flights.outbound);
    return { 
      sliceGroups: Object.entries(sliceGroups).map(([index, flights]) => ({
        sliceIndex: parseInt(index),
        flights,
        title: getSliceTitle(parseInt(index))
      })),
      hasResults: Object.keys(sliceGroups).length > 0
    };
  };

  // Get title for slice based on trip type and slice index
  const getSliceTitle = (sliceIndex: number): string => {
    switch (searchParams.tripType) {
      case 'one-way':
        return `${searchParams.from} → ${searchParams.to}`;
      case 'return':
        return sliceIndex === 0 
          ? `Outbound: ${searchParams.from} → ${searchParams.to}`
          : `Return: ${searchParams.to} → ${searchParams.from}`;
      case 'multi-city':
        if (searchParams.multiCitySlices && searchParams.multiCitySlices[sliceIndex]) {
          const slice = searchParams.multiCitySlices[sliceIndex];
          return `${slice.origin} → ${slice.destination}`;
        }
        return `Slice ${sliceIndex + 1}`;
      default:
        return `Slice ${sliceIndex + 1}`;
    }
  };

  const handleSeatsSelected = (seats: SelectedSeat[]) => {
    if (currentSeatSelection) {
      const updatedSeats = {
        ...selectedSeats,
        [currentSeatSelection.sliceIndex]: seats
      };
      setSelectedSeats(updatedSeats);
      
      console.log(`[SeatSelection] Selected seats for slice ${currentSeatSelection.sliceIndex}:`, seats);
      
      // Find next slice that needs seat selection
      const displayData = getFlightDisplayData();
      const nextSliceIndex = currentSeatSelection.sliceIndex + 1;
      
      if (nextSliceIndex < displayData.sliceGroups.length && selectedOffers[nextSliceIndex]) {
        // Move to next slice seat selection
        const nextOffer = selectedOffers[nextSliceIndex];
        const nextFlight = nextOffer.flight;
        
        setCurrentSeatSelection({
          sliceIndex: nextSliceIndex,
          offerId: nextOffer.offerId,
          sliceOrigin: nextFlight.departureAirport,
          sliceDestination: nextFlight.arrivalAirport
        });
      } else {
        // All seat selection complete, proceed to payment
        setShowSeatSelection(false);
        setCurrentSeatSelection(null);
        
        // Store seats in booking context (convert to old format for now)
        const finalSeats = {
          outbound: updatedSeats[0] || [],
          return: updatedSeats[1] || []
        };
        
        // Log warning if multi-city seats beyond slice 1 exist
        const totalSlices = Object.keys(updatedSeats).length;
        if (totalSlices > 2) {
          console.warn('[SeatSelection] Multi-city trip detected with', totalSlices, 'slices. Only first 2 slices will be stored in booking context. Full seat data:', updatedSeats);
        }
        
        updateSelectedSeats(finalSeats);
        
        // Store flights in booking context using selectedOffers data
        const offers = Object.values(selectedOffers);
        if (offers.length > 0) {
          // Store first offer as outbound
          const outboundOffer = offers[0];
          updateSelectedOutboundFlight({
            id: outboundOffer.offerId,
            airline: outboundOffer.flight.airline,
            departure: outboundOffer.flight.departure_time,
            arrival: outboundOffer.flight.arrival_time,
            duration: outboundOffer.flight.duration,
            price: outboundOffer.price,
            stops: outboundOffer.flight.stops || 0
          });
        }
        
        if (offers.length > 1) {
          // Store second offer as return
          const returnOffer = offers[1];
          updateSelectedReturnFlight({
            id: returnOffer.offerId,
            airline: returnOffer.flight.airline,
            departure: returnOffer.flight.departure_time,
            arrival: returnOffer.flight.arrival_time,
            duration: returnOffer.flight.duration,
            price: returnOffer.price,
            stops: returnOffer.flight.stops || 0
          });
        }
        
        console.log('[SeatSelection] Complete! Final seats:', updatedSeats);
        // TODO: Navigate to checkout/payment page
      }
    }
  };

  const handleCloseSeatSelection = () => {
    setShowSeatSelection(false);
    setCurrentSeatSelection(null);
    
    // Update selectedSeats to prevent auto-trigger loop
    setSelectedSeats({ 0: [], 1: [] });
    
    // Store empty seats in booking context
    updateSelectedSeats({ outbound: [], return: [] });
    
    // Store flights in booking context even if skipping seats (using selectedOffers)
    if (selectedOffers[0]) {
      const outboundOffer = selectedOffers[0];
      updateSelectedOutboundFlight({
        id: outboundOffer.offerId,
        airline: outboundOffer.flight.airline,
        departure: outboundOffer.flight.departure_time,
        arrival: outboundOffer.flight.arrival_time,
        duration: outboundOffer.flight.duration,
        price: outboundOffer.price,
        stops: outboundOffer.flight.stops || 0
      });
    }
    
    if (selectedOffers[1]) {
      const returnOffer = selectedOffers[1];
      updateSelectedReturnFlight({
        id: returnOffer.offerId,
        airline: returnOffer.flight.airline,
        departure: returnOffer.flight.departure_time,
        arrival: returnOffer.flight.arrival_time,
        duration: returnOffer.flight.duration,
        price: returnOffer.price,
        stops: returnOffer.flight.stops || 0
      });
    }
    
    console.log('Seat selection skipped, proceed to payment without seats');
    // TODO: Navigate to checkout/payment page
  };

  const searchFlights = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('=== DUFFEL FLIGHT SEARCH STARTING ===');
    console.log('Search params:', searchParams);
    
    setLoading(true);
    setError(null);
    setSelectedFlights({ outbound: null, return: null });
    
    try {
      let searchRequest;
      
      // Create search request based on trip type
      switch (searchParams.tripType) {
        case 'one-way':
          searchRequest = createOneWaySearch(
            searchParams.from,
            searchParams.to,
            searchParams.departDate,
            searchParams.passengers,
            searchParams.cabinClass
          );
          break;
          
        case 'return':
          if (!searchParams.returnDate) {
            throw new Error('Return date is required for return trips');
          }
          searchRequest = createReturnSearch(
            searchParams.from,
            searchParams.to,
            searchParams.departDate,
            searchParams.returnDate,
            searchParams.passengers,
            searchParams.cabinClass
          );
          break;
          
        case 'multi-city':
          if (!searchParams.multiCitySlices || searchParams.multiCitySlices.length < 2) {
            throw new Error('Multi-city trips require at least 2 slices');
          }
          searchRequest = createMultiCitySearch(
            searchParams.multiCitySlices,
            searchParams.passengers,
            searchParams.cabinClass
          );
          break;
          
        default:
          throw new Error('Invalid trip type selected');
      }
      
      console.log('[Duffel] Search request created:', searchRequest);
      
      // Call Duffel API
      const response: DuffelOfferRequestResponse = await duffelSearchFlights(searchRequest);
      
      if (!response.data || !response.data.offers) {
        throw new Error('No flight data received from Duffel API');
      }
      
      console.log(`[Duffel] Received ${response.data.offers.length} offers`);
      
      // Store the raw offers data for new display logic
      setFlights({ 
        outbound: response.data.offers, // Store all offers, we'll process them in display
        inbound: [] // Legacy structure - we'll update display logic next
      });
      
    } catch (err) {
      console.error('Duffel flight search error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Flight search failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFlightSelect = (flight: Flight, type: 'outbound' | 'return') => {
    console.log(`Selecting ${type} flight:`, flight);
    setSelectedFlights(prev => ({
      ...prev,
      [type]: flight
    }));
    
    // Auto-scroll to Return section after selecting outbound flight
    if (type === 'outbound') {
      setTimeout(() => {
        returnRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
    
    // Auto-scroll to Trip Summary after selecting return flight (desktop only)
    if (type === 'return') {
      // only on desktop (matches md breakpoint)
      if (window.matchMedia("(min-width: 768px)").matches) {
        setTimeout(() => {
          summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
      }
    }
  };

  // New handler for Duffel offers
  const handleOfferSelect = (flight: any, sliceIndex: number) => {
    console.log(`[Duffel] Selecting flight for slice ${sliceIndex}:`, {
      offerId: flight.offerId,
      sliceId: flight.sliceId,
      airline: flight.airline,
      price: flight.price
    });
    
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

    // Auto-scroll to next slice or trip summary
    const displayData = getFlightDisplayData();
    const nextSliceIndex = sliceIndex + 1;
    
    if (nextSliceIndex < displayData.sliceGroups.length) {
      // Scroll to next slice
      setTimeout(() => {
        const nextSliceElement = document.querySelector(`[data-testid="section-slice-${nextSliceIndex}"]`);
        nextSliceElement?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } else {
      // All slices selected, scroll to trip summary (desktop only)
      if (window.matchMedia("(min-width: 768px)").matches) {
        setTimeout(() => {
          summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 150);
      }
    }

    // Auto-trigger logic moved to useEffect to avoid stale state
  };

  const getTotalPrice = () => {
    const offerTotal = getOffersTotalPrice();
    return offerTotal.amount; // Duffel already includes all passengers in total_amount
  };

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      <div className="md:grid md:grid-cols-[1fr_320px] md:gap-6">
        <div className="pb-28">
      {/* Environment Status */}
      {debugInfo && (
        <div className={`border rounded-lg p-4 mb-6 ${debugInfo.hasSupabaseUrl && debugInfo.hasSupabaseKey ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`} data-testid="environment-status">
          <h3 className="font-medium mb-2" data-testid="text-environment-title">Environment Status</h3>
          <div className="text-sm space-y-1">
            <div data-testid="text-supabase-url-status">Supabase URL: {debugInfo.hasSupabaseUrl ? '✓ Connected' : '✗ Missing'}</div>
            <div data-testid="text-supabase-key-status">Supabase Key: {debugInfo.hasSupabaseKey ? '✓ Available' : '✗ Missing'}</div>
            <div className="text-xs text-gray-600" data-testid="text-endpoint">Endpoint: {debugInfo.fullEndpoint}</div>
          </div>
        </div>
      )}

      {/* Search Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8" data-testid="form-flight-search">
        <h2 className="text-2xl font-bold mb-6 text-center" data-testid="text-search-title">Search Real Flights</h2>
        
        {/* Trip Type Selector */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 rounded-lg p-1 inline-flex" data-testid="trip-type-selector">
            {(['one-way', 'return', 'multi-city'] as TripType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleInputChange('tripType', type)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  searchParams.tripType === type
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                data-testid={`button-trip-type-${type}`}
              >
                {type === 'one-way' ? 'One Way' : type === 'return' ? 'Return' : 'Multi-City'}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">From</label>
            <input
              type="text"
              value={searchParams.from}
              onChange={(e) => handleInputChange('from', e.target.value.toUpperCase())}
              placeholder="LAX"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              maxLength={3}
              data-testid="input-from"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">To</label>
            <input
              type="text"
              value={searchParams.to}
              onChange={(e) => handleInputChange('to', e.target.value.toUpperCase())}
              placeholder="JFK"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              maxLength={3}
              data-testid="input-to"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Depart</label>
            <input
              type="date"
              value={searchParams.departDate}
              onChange={(e) => handleInputChange('departDate', e.target.value)}
              min="2025-09-29"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="input-departure"
            />
          </div>

          {searchParams.tripType === 'return' && (
            <div>
              <label className="block text-sm font-medium mb-2">Return</label>
              <input
                type="date"
                value={searchParams.returnDate || ''}
                onChange={(e) => handleInputChange('returnDate', e.target.value)}
                min={searchParams.departDate}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="input-return"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Passengers</label>
            <select
              value={searchParams.passengers}
              onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="select-passengers"
            >
              {[1,2,3,4,5,6].map(num => (
                <option key={num} value={num}>{num} passenger{num > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Class</label>
            <select
              value={searchParams.cabinClass}
              onChange={(e) => handleInputChange('cabinClass', e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="select-cabin-class"
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={searchFlights}
              disabled={loading || !debugInfo?.hasSupabaseUrl || !debugInfo?.hasSupabaseKey}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-medium"
              data-testid="button-search-flights"
            >
              {loading ? 'Searching...' : 'Search Flights'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" data-testid="error-display">
          <div className="flex items-start">
            <span className="text-red-500 text-xl mr-3">⚠️</span>
            <div className="flex-1">
              <h4 className="text-red-800 font-medium" data-testid="text-error-title">Search Error</h4>
              <p className="text-red-700 text-sm mt-1" data-testid="text-error-message">{error}</p>
              <details className="mt-2">
                <summary className="text-xs text-red-600 cursor-pointer" data-testid="button-debug-info">Debug Info</summary>
                <pre className="text-xs mt-1 p-2 bg-red-100 rounded overflow-x-auto" data-testid="text-debug-info">
{debugInfo ? JSON.stringify(debugInfo, null, 2) : 'No debug info available'}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Flight Results */}
      {(() => {
        const displayData = getFlightDisplayData();
        return displayData.hasResults && (
          <div className="space-y-8" data-testid="results-container">
            {/* Results Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4" data-testid="results-summary">
              <h3 className="font-medium text-green-800" data-testid="text-results-title">Search Results</h3>
              <p className="text-sm text-green-700" data-testid="text-results-count">
                Found {displayData.sliceGroups.reduce((total, group) => total + group.flights.length, 0)} flight options across {displayData.sliceGroups.length} slice(s).
              </p>
            </div>

            {/* Display flight slices */}
            {displayData.sliceGroups.map((sliceGroup, sliceIndex) => (
              <div key={`slice-${sliceIndex}`} data-testid={`section-slice-${sliceIndex}`}>
                <h3 className="text-xl font-bold mb-4 flex items-center" data-testid={`text-slice-title-${sliceIndex}`}>
                  <span className={`px-3 py-1 rounded-full text-sm mr-3 ${
                    sliceIndex === 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {sliceGroup.title}
                  </span>
                </h3>
                
                <div className="space-y-4">
                  {sliceGroup.flights.map((flight, flightIndex) => (
                    <div 
                      key={`${flight.offerId}-${sliceIndex}-${flightIndex}`}
                      className={`p-6 ${baseCard} ${
                        selectedOffers[sliceIndex]?.offerId === flight.offerId 
                          ? `${selectedCard} ${brandSelected}` 
                          : 'border-gray-200 bg-white'
                      }`}
                      data-testid={`card-flight-${sliceIndex}-${flightIndex}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-medium" data-testid={`text-airline-${sliceIndex}-${flightIndex}`}>
                              {flight.airline || 'Airline'}
                            </span>
                            <span className="ml-3 text-gray-600 text-sm" data-testid={`text-flight-number-${sliceIndex}-${flightIndex}`}>
                              {flight.flight_number || `Flight ${flightIndex + 1}`}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <div className="font-bold text-xl" data-testid={`text-departure-time-${sliceIndex}-${flightIndex}`}>
                                {flight.departure_time ? new Date(flight.departure_time).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                }) : 'N/A'}
                              </div>
                              <div className="text-gray-600 text-sm" data-testid={`text-departure-airport-${sliceIndex}-${flightIndex}`}>
                                {flight.departureAirport}
                              </div>
                            </div>
                            
                            <div className="flex-1 text-center">
                              <div className="text-sm text-gray-600" data-testid={`text-duration-${sliceIndex}-${flightIndex}`}>
                                {flight.duration || 'N/A'}
                              </div>
                              <div className="border-t border-gray-300 my-2 relative">
                                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-white px-2">✈️</div>
                              </div>
                              <div className="text-xs text-gray-500" data-testid={`text-stops-${sliceIndex}-${flightIndex}`}>
                                {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <div className="font-bold text-xl" data-testid={`text-arrival-time-${sliceIndex}-${flightIndex}`}>
                                {flight.arrival_time ? new Date(flight.arrival_time).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                }) : 'N/A'}
                              </div>
                              <div className="text-gray-600 text-sm" data-testid={`text-arrival-airport-${sliceIndex}-${flightIndex}`}>
                                {flight.arrivalAirport}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-8 text-right">
                          <div className="text-3xl font-bold text-green-600 mb-1" data-testid={`text-price-${sliceIndex}-${flightIndex}`}>
                            ${flight.price ? Math.round(flight.price) : 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600 mb-3" data-testid={`text-currency-${sliceIndex}-${flightIndex}`}>
                            {flight.currency || 'USD'}
                          </div>
                          <button
                            onClick={() => handleOfferSelect(flight, sliceIndex)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${
                              selectedOffers[sliceIndex]?.offerId === flight.offerId
                                ? 'bg-green-600 text-white shadow'
                                : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                            }`}
                            data-testid={`button-select-flight-${sliceIndex}-${flightIndex}`}
                          >
                            {selectedOffers[sliceIndex]?.offerId === flight.offerId ? 'Selected ✓' : 'Select Flight'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16" data-testid="loading-container">
          <div className="inline-flex items-center px-6 py-4 font-semibold leading-6 text-lg shadow-lg rounded-lg text-white bg-gradient-to-r from-blue-500 to-purple-500" data-testid="loading-indicator">
            <svg className="animate-spin -ml-1 mr-4 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Searching flights via Duffel API...
          </div>
          <p className="text-gray-600 mt-4" data-testid="text-loading-description">Connecting to your working backend</p>
        </div>
      )}

      {/* No Results */}
      {(!flights.outbound || flights.outbound.length === 0) && !loading && (
        <div className="text-center py-16" data-testid="no-results-container">
          <div className="text-6xl mb-4">✈️</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2" data-testid="text-no-results-title">No flights found</h3>
          <p className="text-gray-600 mb-6" data-testid="text-no-results-message">
            No flights available for this route and date combination
          </p>
          <button
            onClick={() => setFlights({ outbound: [], inbound: [] })}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            data-testid="button-try-new-search"
          >
            Try New Search
          </button>
        </div>
      )}

      {/* Seat Selection Modal */}
      <SeatSelectionModal
        isOpen={showSeatSelection && !!currentSeatSelection}
        onClose={() => setShowSeatSelection(false)}
        offerId={currentSeatSelection?.offerId || ""}
        origin={currentSeatSelection?.sliceOrigin || ""}
        destination={currentSeatSelection?.sliceDestination || ""}
        passengerIds={Array.from({ length: searchParams.passengers }, (_, i) => `passenger_${i + 1}`)}
        onContinueWithoutSeats={handleCloseSeatSelection}
        onSeatChosen={(serviceId, passengerId) => {
          console.log('[SeatSelection] Seat chosen:', { serviceId, passengerId, offerId: currentSeatSelection?.offerId });
          // TODO: Handle individual seat selection
        }}
      />
        </div>

        <div ref={summaryRef}>
          <TripSummary
            outbound={{
              price: selectedOffers[0] ? { amount: selectedOffers[0].price, currency: selectedOffers[0].currency } : undefined,
              carrier: selectedOffers[0]?.flight?.airline,
            }}
            inbound={{
              price: selectedOffers[1] ? { amount: selectedOffers[1].price, currency: selectedOffers[1].currency } : undefined,
              carrier: selectedOffers[1]?.flight?.airline,
            }}
            passengers={searchParams.passengers}
            selectedSeats={{ outbound: selectedSeats[0] || [], return: selectedSeats[1] || [] }}
            onContinue={() => {
              console.log('[SeatSelection] Starting seat selection flow from TripSummary');
              if (areAllSlicesSelected()) {
                // Start seat selection with first slice
                const firstOffer = selectedOffers[0];
                if (firstOffer) {
                  console.log('[SeatSelection] Triggering modal for first slice:', { offerId: firstOffer.offerId });
                  setCurrentSeatSelection({ 
                    sliceIndex: 0, 
                    offerId: firstOffer.offerId,
                    sliceOrigin: firstOffer.flight.departureAirport,
                    sliceDestination: firstOffer.flight.arrivalAirport
                  });
                  setShowSeatSelection(true);
                }
              } else {
                console.warn('[SeatSelection] Not all slices selected');
              }
            }}
          />
        </div>
      </div>

      <FloatingCheckout
        outbound={{
          price: selectedOffers[0] ? {
            amount: selectedOffers[0].price,
            currency: selectedOffers[0].currency
          } : undefined
        }}
        inbound={{
          price: selectedOffers[1] ? {
            amount: selectedOffers[1].price,
            currency: selectedOffers[1].currency
          } : undefined
        }}
        passengers={searchParams.passengers}
        selectedSeats={{ outbound: selectedSeats[0] || [], return: selectedSeats[1] || [] }}
        onContinue={() => {
          console.log('[SeatSelection] Starting seat selection flow from FloatingCheckout');
          if (areAllSlicesSelected()) {
            // Start seat selection with first slice
            const firstOffer = selectedOffers[0];
            if (firstOffer) {
              console.log('[SeatSelection] Triggering modal for first slice:', { offerId: firstOffer.offerId });
              setCurrentSeatSelection({ 
                sliceIndex: 0, 
                offerId: firstOffer.offerId,
                sliceOrigin: firstOffer.flight.departureAirport,
                sliceDestination: firstOffer.flight.arrivalAirport
              });
              setShowSeatSelection(true);
            }
          } else {
            console.warn('[SeatSelection] Not all slices selected');
          }
        }}
      />
    </div>
  );
};

export default FlightSearch;