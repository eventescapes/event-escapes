import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import type { FlightSearchParams, TripType, SelectedSeat } from '@/types/flights';
import { searchFlights as duffelSearchFlights, createOneWaySearch, createReturnSearch, createMultiCitySearch, type DuffelOffer } from '@/utils/duffel';
import { useBooking } from '@/contexts/BookingContext';
import TripSummary from '@/components/TripSummary';
import FloatingCheckout from '@/components/FloatingCheckout';
import SeatSelectionModal from '@/components/SeatSelectionModal';
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

  // Multi-city state
  const [multiCitySlices, setMultiCitySlices] = useState<MultiCitySlice[]>([
    { id: '1', origin: '', destination: '', departure_date: '' },
    { id: '2', origin: '', destination: '', departure_date: '' }
  ]);

  // Booking context
  const { 
    updateSelectedOutboundFlight,
    updateSelectedReturnFlight,
    updateSelectedSeats
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
        
        // Store REAL offers - NO MOCK DATA
        setOffers(data.offers); // Real Duffel offers
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

  // Process offers for display - properly separate outbound and return slices
  const processOffersForDisplay = (offers: EdgeFunctionOffer[]) => {
    const sliceGroups: { [sliceIndex: number]: any[] } = {};
    
    offers.forEach(offer => {
      offer.slices.forEach((slice, sliceIndex) => {
        if (!sliceGroups[sliceIndex]) {
          sliceGroups[sliceIndex] = [];
        }
        
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

  // Auto search on page load
  useEffect(() => {
    if (searchParams.from && searchParams.to && searchParams.departDate) {
      searchFlights();
    }
  }, []);

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

            {/* Trip Summary */}
            <div className="lg:col-span-1">
              <TripSummary
                outbound={{
                  price: selectedOffers[0] ? { 
                    amount: selectedOffers[0].price, 
                    currency: selectedOffers[0].currency 
                  } : undefined,
                  carrier: selectedOffers[0]?.flight?.airline,
                }}
                inbound={{
                  price: selectedOffers[1] ? { 
                    amount: selectedOffers[1].price, 
                    currency: selectedOffers[1].currency 
                  } : undefined,
                  carrier: selectedOffers[1]?.flight?.airline,
                }}
                passengers={searchParams.passengers}
                selectedSeats={{ 
                  outbound: selectedSeats[0] || [], 
                  return: selectedSeats[1] || [] 
                }}
                onContinue={() => {
                  if (areAllSlicesSelected()) {
                    // Start seat selection with first slice
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
                }}
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
      <SeatSelectionModal
        isOpen={showSeatSelection && !!currentSeatSelection}
        onClose={() => setShowSeatSelection(false)}
        offerId={currentSeatSelection?.offerId || ""}
        origin={currentSeatSelection?.sliceOrigin || ""}
        destination={currentSeatSelection?.sliceDestination || ""}
        passengerIds={Array.from({ length: searchParams.passengers }, (_, i) => `passenger_${i + 1}`)}
        onContinueWithoutSeats={() => {
          setShowSeatSelection(false);
          setCurrentSeatSelection(null);
          // Navigate to checkout
          navigate('/checkout');
        }}
        onSeatChosen={(serviceId, passengerId) => {
          console.log('Seat chosen:', { serviceId, passengerId, offerId: currentSeatSelection?.offerId });
          // TODO: Handle individual seat selection
        }}
      />
    </div>
  );
};

export default FlightResults;