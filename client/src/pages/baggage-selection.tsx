import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Passenger {
  id: string;
  type: 'adult' | 'child' | 'infant_without_seat' | 'infant_with_seat';
}

interface FlightData {
  offerId: string;
  sliceId: string;
  airline: string;
  flight_number?: string;
  origin: string;
  destination: string;
  departure_datetime?: string;
  arrival_datetime?: string;
  duration: string;
  price: number;
  currency: string;
  passengers?: Passenger[];
}

interface BaggageService {
  id: string;
  passenger_id: string;
  type: string;
  price?: string;
  currency?: string;
  total_amount?: string;
  amount?: string;
  total_currency?: string;
  maximum_quantity?: number;
  segment_ids?: string[];
  metadata?: {
    type?: string;
    maximum_weight_kg?: number;
    maximum_length_cm?: number;
    slice_id?: string;
    segment_id?: string;
  };
}

interface IncludedBaggage {
  passenger_id: string;
  quantity: number;
  type?: string;
}

interface Slice {
  id: string;
  origin: { iata_code?: string; city_name?: string };
  destination: { iata_code?: string; city_name?: string };
  departure_datetime?: string;
  segments?: Array<{ id: string }>;
}

export default function BaggageSelection() {
  const [, setLocation] = useLocation();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outbound, setOutbound] = useState<FlightData | null>(null);
  const [returnFlight, setReturnFlight] = useState<FlightData | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [baggageServices, setBaggageServices] = useState<BaggageService[]>([]);
  const [includedBaggage, setIncludedBaggage] = useState<IncludedBaggage[]>([]);
  // Track selected bags by passenger (bags cover entire trip)
  // Key = passenger ID, Value = the selected bag for that passenger
  const [selectedBaggage, setSelectedBaggage] = useState<{
    [passengerId: string]: BaggageService
  }>({});
  const [slices, setSlices] = useState<Slice[]>([]);
  const [storedOffer, setStoredOffer] = useState<any | null>(null);
  const baggageCardsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const offerData = sessionStorage.getItem('flightOfferData');
      if (offerData) {
        try {
          const parsed = JSON.parse(offerData);
          setStoredOffer(parsed);
          console.log('📦 Loaded stored flight offer data:', parsed);
        } catch (error) {
          console.error('⚠️ Failed to parse stored flight offer data:', error);
        }
      }
    }
  }, []);


  // Load data on mount
  useEffect(() => {
    loadFlightData();
    loadBaggageServices();
  }, []);

  const loadFlightData = () => {
    try {
      const outboundData = localStorage.getItem('selected_outbound');
      const returnData = localStorage.getItem('selected_return');

      if (!outboundData) {
        setError('No flight selected. Please select a flight first.');
        setLoading(false);
        return;
      }

      const outboundFlight = JSON.parse(outboundData);
      const returnFlightData = returnData ? JSON.parse(returnData) : null;

      setOutbound(outboundFlight);
      setReturnFlight(returnFlightData);

      // Load passengers from offer
      const passengersData = outboundFlight.passengers || [];
      setPassengers(passengersData);

      console.log('📋 Flight data loaded:', {
        outbound: outboundFlight.offerId,
        return: returnFlightData?.offerId || 'N/A',
        passengers: passengersData.length
      });
    } catch (err) {
      console.error('❌ Error loading flight data:', err);
      setError('Failed to load flight data');
      setLoading(false);
    }
  };

  const loadBaggageServices = async () => {
    try {
      const outboundData = localStorage.getItem('selected_outbound');
      if (!outboundData) {
        setError('No offer ID found');
        setLoading(false);
        return;
      }

      const outbound = JSON.parse(outboundData);
      const offerId = outbound.offerId || outbound.id;

      if (!offerId) {
        setError('Invalid offer ID');
        setLoading(false);
        return;
      }

      console.log('🧳 Fetching baggage for offer:', offerId);

      const response = await fetch(
        'https://jxrrhsqffnzeljszbecg.supabase.co/functions/v1/duffel_offer_services',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4cnJoc3FmZm56ZWxqc3piZWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzIxMjgsImV4cCI6MjA3MDkwODEyOH0.R-9Y5b_M7rpKS9zT9hqcdAdDI7m9GICYRDZkIteS9jg'
          },
          body: JSON.stringify({ offer_id: offerId })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error:', response.status, errorText);
        
        if (response.status === 422 || errorText.includes('no longer available')) {
          setError('This offer has expired. Please search for flights again.');
        } else {
          setError('Failed to load baggage services');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('📡 RAW API RESPONSE:', data);
      if (data?.available_services?.baggage) {
        console.log('📡 BAGGAGE SERVICES FROM API:', data.available_services.baggage);
        console.log('📡 FIRST BAGGAGE SERVICE:', data.available_services.baggage[0]);
        console.log('📡 ALL FIELDS IN FIRST BAG:', data.available_services.baggage[0] ? Object.keys(data.available_services.baggage[0]) : []);
      }
      console.log('✅ Baggage response:', data);

      if (data.success) {
        const baggage = data.available_services?.baggage || [];
        const included = data.included_baggage || [];
        const offerSlices = data.slices || [];

        console.log(`📦 Found ${baggage.length} available baggage services`);
        console.log(`✅ Found ${included.length} included baggage items`);
        console.log(`✈️ Found ${offerSlices.length} flights`);
        
        // DETAILED LOGGING: See data structure from Duffel
        console.log('🔍 First baggage service:', baggage[0]);
        console.log('🔍 Baggage segment_ids:', baggage.map((b: BaggageService) => ({ id: b.id, segment_ids: b.segment_ids })));
        console.log('🔍 Slices structure:', offerSlices);
        console.log('🔍 First slice segments:', offerSlices[0]?.segments);

        setBaggageServices(baggage);
        setIncludedBaggage(included);
        setSlices(offerSlices);
        setLoading(false);
      } else {
        setError('No baggage services available');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Failed to fetch baggage:', err);
      setError('An error occurred loading baggage services');
      setLoading(false);
    }
  };

  // CRITICAL FIX #1: Safe price extraction
  const getPrice = (bag: BaggageService): string => {
    const raw = bag.price ?? bag.total_amount ?? bag.amount ?? '0';
    const value = typeof raw === 'number' ? raw : parseFloat(raw || '0');
    return value.toFixed(2);
  };

  const extractSliceSegmentIds = (slice: Slice): string[] => {
    if (!slice) return [];

    try {
      const segments = (slice as any)?.segments;

      if (Array.isArray(segments)) {
        return segments.map((segment) => segment?.id).filter(Boolean) as string[];
      }

      if (segments && typeof segments === 'object') {
        const values = Object.values(segments);
        if (Array.isArray(values)) {
          return values.map((segment: any) => segment?.id).filter(Boolean) as string[];
        }
      }

      if (slice.id) {
        return [slice.id];
      }

      return [];
    } catch (error) {
      console.error('Error extracting segment IDs:', error);
      return slice?.id ? [slice.id] : [];
    }
  };

  const segmentIdsMatch = (bagSegmentId: string, flightSegmentId: string): boolean => {
    if (!bagSegmentId || !flightSegmentId) return false;

    if (bagSegmentId === flightSegmentId) return true;

    const bagBase = bagSegmentId.slice(0, -1);
    const flightBase = flightSegmentId.slice(0, -1);

    return bagBase === flightBase;
  };

  // PROPER IMPLEMENTATION: Group baggage by flight per Duffel docs
  /**
   * Organize baggage services by slice and passenger for display
   * In per-passenger mode, same bags are shown on all flights
   */
  const getBaggageBySlice = () => {
    const grouped: Record<number, { slice: Slice; baggage: BaggageService[]; baggageByPassenger: Record<string, BaggageService[]> }> = {};

    console.log('🎒 ORGANIZING BAGGAGE FOR DISPLAY');
    console.log('Total slices:', slices.length);
    console.log('Total baggage services:', baggageServices.length);
    console.log('Total passengers:', passengers.length);

    // For each slice, show the same baggage options (per-passenger model)
    slices.forEach((slice, sliceIndex) => {
      const baggageByPassenger: Record<string, BaggageService[]> = {};

      // Organize bags by passenger
      passengers.forEach((passenger) => {
        // Find bags available for this passenger
        const passengerBags = baggageServices.filter((bag) => {
          // Match by passenger_id if available
          if (bag.passenger_id) {
            return bag.passenger_id === passenger.id;
          }
          // Otherwise assume first bag goes to first passenger, etc.
          return false;
        });

        if (passengerBags.length > 0) {
          baggageByPassenger[passenger.id] = passengerBags;
        }
      });

      // If no bags matched by passenger_id, distribute evenly
      if (Object.keys(baggageByPassenger).length === 0 && baggageServices.length > 0) {
        console.log(`📦 Distributing ${baggageServices.length} bags evenly to ${passengers.length} passengers`);
        baggageServices.forEach((bag, index) => {
          const passenger = passengers[index % passengers.length];
          if (passenger) {
            if (!baggageByPassenger[passenger.id]) {
              baggageByPassenger[passenger.id] = [];
            }
            baggageByPassenger[passenger.id].push(bag);
          }
        });
      }

      grouped[sliceIndex] = {
        slice,
        baggage: baggageServices,
        baggageByPassenger,
      };

      console.log(`Slice ${sliceIndex} (${slice.origin?.iata_code} → ${slice.destination?.iata_code}):`);
      console.log(`  Available bags: ${Object.keys(baggageByPassenger).length} passenger(s)`);
    });

    return grouped;
  };

  // Handle add baggage
  const isBagSelected = (bagId: string, passengerId: string) => {
    return selectedBaggage[passengerId]?.id === bagId;
  };

  const handleAddBag = (bag: BaggageService, passengerId: string, passengerIndex: number) => {
    setSelectedBaggage((prev) => {
      const updated = {
        ...prev,
        [passengerId]: {
          ...bag,
          passenger_id: passengerId,
        },
      };

      console.log(`✅ Added bag for passenger ${passengerIndex + 1} (${passengerId})`);
      console.log('💼 This bag is valid for entire trip (all flights)');
      console.log('Current selected bags:', Object.keys(updated).length);

      return updated;
    });
  };

  const handleRemoveBag = (passengerId: string, passengerIndex: number) => {
    setSelectedBaggage((prev) => {
      if (!prev[passengerId]) {
        return prev;
      }

      const updated = { ...prev };
      delete updated[passengerId];

      console.log(`🗑️ Removed bag for passenger ${passengerIndex + 1} (${passengerId})`);
      console.log('Current selected bags:', Object.keys(updated).length);

      return updated;
    });
  };

  // Calculate totals
  const calculateFlightTotal = () => {
    const outboundPrice = outbound?.price || 0;
    const returnPrice = returnFlight?.price || 0;
    return outboundPrice + returnPrice;
  };

  const calculateSeatsTotal = () => {
    const seatsData = localStorage.getItem('selected_seats');
    if (!seatsData) return 0;

    try {
      const seats = JSON.parse(seatsData);
      if (Array.isArray(seats)) {
        return seats.reduce((total: number, seat: any) => {
          return total + parseFloat(seat.amount || seat.price || seat.total_amount || 0);
        }, 0);
      }

      let total = 0;
      Object.values(seats).forEach((flightSeats: any) => {
        Object.values(flightSeats).forEach((seat: any) => {
          total += parseFloat(seat.price || seat.amount || seat.total_amount || 0);
        });
      });

      return total;
    } catch {
      return 0;
    }
  };

  const calculateBaggageTotal = () => {
    const selectedBags = Object.values(selectedBaggage);
    const totalBaggage = selectedBags.reduce((sum, bag) => {
      return sum + parseFloat(bag.price || bag.total_amount || bag.amount || '0');
    }, 0);

    if (selectedBags.length > 0) {
      console.log('💰 Baggage Summary:');
      console.log(`  📦 Bags selected: ${selectedBags.length}`);
      console.log(`  💵 Total cost: $${totalBaggage.toFixed(2)}`);
      console.log(`  ✅ No duplicates (stored by passenger)`);
    }

    return totalBaggage;
  };

  const calculateGrandTotal = () => {
    return calculateFlightTotal() + calculateSeatsTotal() + calculateBaggageTotal();
  };

  // Continue to next step
  const handleContinue = () => {
    console.group('🎒 BUILDING SERVICES ARRAY');
    console.log('📤 Selected baggage state:', selectedBaggage);

    // Build services array from selected baggage
    // Bags are now stored by passenger (no duplicates!)
    const selectedEntries = Object.entries(selectedBaggage);
    
    console.log('📦 Selected baggage by passenger:', selectedEntries.length);

    const baggageServices = selectedEntries.map(([passengerId, bag]) => {
      const amountValue = parseFloat((bag.price as any) || (bag.total_amount as any) || (bag.amount as any) || '0') || 0;
      const passengerNumber = getPassengerNumber(passengerId);

      return {
        id: bag.id,
        type: 'baggage',
        amount: amountValue,
        total_amount: amountValue,
        quantity: 1,
        passenger_id: passengerId,
        currency: bag.currency || bag.total_currency || storedOffer?.total_currency || 'AUD',
        slice_index: null,
        slice_id: bag.metadata?.slice_id || null,
        passenger_number: passengerNumber,
        description: bag.metadata?.type ? `${bag.metadata.type} bag` : 'Baggage'
      };
    });

    console.log('📦 Baggage services:', baggageServices.length);
    console.log('Service IDs:', baggageServices.map(s => s.id));
    console.log('✅ No deduplication needed - stored by passenger!');

    // Calculate baggage total
    const baggageTotal = baggageServices.reduce((sum, s) => sum + s.amount, 0);
    console.log('💰 Baggage total: $' + baggageTotal.toFixed(2));

    console.log('📋 Services being saved:', baggageServices);
    console.log('Each service amount:', baggageServices.map(service => service.amount));
    console.groupEnd();
 
    localStorage.setItem('selected_baggage', JSON.stringify(baggageServices));
    localStorage.setItem('baggage_total', baggageTotal.toFixed(2));

    console.log('💾 Saved to localStorage:', {
      count: baggageServices.length,
      total: baggageTotal.toFixed(2),
      serviceIds: baggageServices.map(s => s.id)
    });

    const target = offerId ? `/passenger-details?offer_id=${offerId}` : '/passenger-details';
    setLocation(target);
  };

  const handleBackToSeats = () => {
    const target = offerId ? `/seat-selection?offer_id=${offerId}` : '/seat-selection';
    setLocation(target);
  };

  const handleSkipBaggage = () => {
    console.log('⏭️ Skipping baggage selection');
    const target = offerId ? `/passenger-details?offer_id=${offerId}` : '/passenger-details';
    setLocation(target);
  };

  const scrollToBaggage = () => {
    if (baggageCardsRef.current) {
      baggageCardsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading baggage options...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => setLocation('/flight-results')}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Search Flights Again
          </button>
        </div>
      </div>
    );
  }

  // Get passenger number for display
  const getPassengerNumber = (passengerId: string) => {
    const index = passengers.findIndex(p => p.id === passengerId);
    return index >= 0 ? index + 1 : '?';
  };

  const baggageBySlice = getBaggageBySlice();
  const selectedPassengerIds = Object.keys(selectedBaggage);
  const selectedBaggageCount = selectedPassengerIds.length;
  const selectedBaggageArray = selectedPassengerIds.map((passengerId) => ({
    passengerId,
    bag: selectedBaggage[passengerId],
    passengerNumber: getPassengerNumber(passengerId),
  }));
  const hasAnyBaggage = Object.values(baggageBySlice).some(slice => slice.baggage.length > 0);

  const storedSlices: any[] = storedOffer?.slices || [];
  const primarySlice = storedSlices[0];
  const secondarySlice = storedSlices[1];
  const offerId = storedOffer?.id || outbound?.offerId || '';
  const routeOriginLabel =
    primarySlice?.origin?.iata_code ||
    primarySlice?.origin?.city_name ||
    outbound?.origin ||
    'Origin';
  const routeDestinationLabel =
    primarySlice?.destination?.iata_code ||
    primarySlice?.destination?.city_name ||
    outbound?.destination ||
    'Destination';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <button
          onClick={handleBackToSeats}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Seats
        </button>

        {/* Optional Messaging */}
        <div className="max-w-4xl mx-auto mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                🧳 Additional Baggage (Optional)
              </h2>
              <p className="text-gray-700 mb-4">
                Add extra baggage below, or skip to continue with the included baggage allowance only.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={handleSkipBaggage}
                  className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 font-medium transition-all"
                >
                  Skip to Passenger Details →
                </button>
                <button
                  type="button"
                  onClick={scrollToBaggage}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all"
                >
                  Add Baggage Below ↓
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1 md:text-right">
              <div>🧳 Extra bag: $40.27 each</div>
              <div>✅ Free to skip</div>
            </div>
          </div>
        </div>
        
        <div ref={baggageCardsRef} className="baggage-cards grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Additional Baggage</h1>
              <p className="text-gray-600">
                Add extra baggage to your booking (optional)
              </p>
            </div>

            {/* Informational Banner */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-2xl mt-0.5">💼</span>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900 text-lg">
                    About Extra Baggage
                  </p>
                  <div className="mt-2 space-y-2 text-sm text-blue-700">
                    <p>
                      Extra bags are valid for your <strong>entire trip</strong>. When you add 
                      a bag for a passenger, it automatically covers all flights in this booking.
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Each bag covers both outbound and return flights</li>
                      <li>You only need to add it once per passenger</li>
                      <li>Remove from any flight to remove from all flights</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Included Baggage Info */}
            {includedBaggage.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Included with Your Ticket:
                </h3>
                <ul className="text-sm text-green-700 space-y-1">
                  {includedBaggage.slice(0, 4).map((bag, idx) => (
                    <li key={idx}>
                      • {bag.quantity} {bag.type?.replace('_', ' ') || 'baggage'} bag{bag.quantity > 1 ? 's' : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CRITICAL FIX: Baggage Grouped by Flight */}
            {hasAnyBaggage ? (
              <div className="space-y-8" ref={baggageCardsRef}>
                {Object.entries(baggageBySlice).map(([sliceIndex, sliceData]) => {
                  if (sliceData.baggage.length === 0) return null;
                  
                  const isOutbound = parseInt(sliceIndex) === 0;
                  const storedSlice = storedOffer?.slices?.[parseInt(sliceIndex)];
                  const originIata = storedSlice?.origin?.iata_code || storedSlice?.origin?.city_name || (isOutbound ? routeOriginLabel : routeDestinationLabel);
                  const destinationIata = storedSlice?.destination?.iata_code || storedSlice?.destination?.city_name || (isOutbound ? routeDestinationLabel : routeOriginLabel);
                  const originCity = storedSlice?.origin?.city_name || primarySlice?.origin?.city_name || storedSlice?.origin?.iata_code;
                  const destinationCity = storedSlice?.destination?.city_name || primarySlice?.destination?.city_name || storedSlice?.destination?.iata_code;
                  const departureDate = sliceData.slice.departure_datetime;
                  
                  return (
                    <div key={sliceIndex} className="border-2 border-gray-300 rounded-lg p-6 bg-white shadow-sm">
                      
                      {/* Flight Header */}
                      <div className={`mb-4 pb-4 border-b-2 ${isOutbound ? 'border-blue-200 bg-blue-50' : 'border-purple-200 bg-purple-50'} -m-6 p-6 mb-6 rounded-t-lg`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{isOutbound ? '✈️' : '🔙'}</span>
                          <h3 className={`text-xl font-bold ${isOutbound ? 'text-blue-800' : 'text-purple-800'}`}>
                            {isOutbound ? 'OUTBOUND FLIGHT' : 'RETURN FLIGHT'}
                          </h3>
                        </div>
                        <p className="text-gray-700 font-semibold text-lg">
                          {originIata} → {destinationIata}
                        </p>
                        {(originCity || destinationCity) && (
                          <p className="text-sm text-gray-600">
                            {(originCity || originIata)} → {(destinationCity || destinationIata)}
                          </p>
                        )}
                        {departureDate && (
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(departureDate).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        )}
                      </div>

                      {/* Baggage Options for this Flight */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-700 text-lg">
                          Select Additional Baggage for This Flight
                        </h4>
                        
                        {passengers.map((passenger, passengerIdx) => {
                          const sliceIdx = parseInt(sliceIndex);
                          const passengerBags = sliceData.baggageByPassenger[passenger.id] || [];
                          const passengerDisplayNumber = passengerIdx + 1;

                          return (
                            <div key={passenger.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <div className="flex items-start gap-3 mb-3">
                                <div className="text-xl">🧍</div>
                                <div>
                                  <h5 className="font-semibold text-gray-800">
                                    Passenger {passengerDisplayNumber}
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    {passenger.type === 'adult' ? 'Adult' : passenger.type.replace('_', ' ')}
                                  </p>
                                </div>
                              </div>

                              {passengerBags.length === 0 ? (
                                <p className="text-sm text-gray-500 pl-8">
                                  No additional baggage available for this passenger on this flight.
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {passengerBags.map((bag) => {
                                    const selected = isBagSelected(bag.id, passenger.id);
                                    const displayPrice = getPrice(bag);
                                    const displayCurrency = bag.currency || bag.total_currency || outbound?.currency || 'USD';
                                    const weightLimit = bag.metadata?.maximum_weight_kg || 23;
                                    const lengthLimit = bag.metadata?.maximum_length_cm;

                                    return (
                                      <Card
                                        key={bag.id}
                                        className={`
                                          flex flex-col md:flex-row md:items-center justify-between p-5 transition-all
                                          ${selected
                                            ? 'border-2 border-green-500 bg-green-50 shadow-md'
                                            : 'border-2 border-gray-200 bg-gray-50 hover:border-green-300 hover:shadow-sm'
                                          }
                                        `}
                                      >
                                        <div className="flex-1 mb-4 md:mb-0">
                                          <div className="flex items-start gap-3 mb-2">
                                            <div className="text-2xl">🎒</div>
                                            <div>
                                              <h5 className="font-semibold text-gray-800 text-base">
                                                Extra {bag.metadata?.type || 'Checked'} Bag
                                              </h5>
                                              <p className="text-sm text-gray-600">
                                                For Passenger {passengerDisplayNumber}
                                              </p>
                                              {selected ? (
                                                <p className="text-xs text-blue-600 font-semibold mt-1 flex items-center gap-1">
                                                  <span>💼</span>
                                                  <span>Valid for entire trip (all flights)</span>
                                                </p>
                                              ) : (
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                  <span>ℹ️</span>
                                                  <span>Will be valid for all flights on this trip</span>
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="text-sm text-gray-600 ml-11 space-y-0.5">
                                            <div>• Up to {weightLimit}kg</div>
                                            {lengthLimit && <div>• Max {lengthLimit}cm</div>}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-4 md:ml-4">
                                          <div className="text-right">
                                            <div className="text-2xl font-bold text-green-600">
                                              ${displayPrice}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {displayCurrency}
                                            </div>
                                          </div>
                                          <div>
                                            {selected ? (
                                              <Button
                                                onClick={() => handleRemoveBag(passenger.id, passengerIdx)}
                                                className="px-5 py-5 bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
                                              >
                                                Remove
                                              </Button>
                                            ) : (
                                              <Button
                                                onClick={() => handleAddBag(bag, passenger.id, passengerIdx)}
                                                className="px-5 py-5 bg-green-500 text-white hover:bg-green-600 transition-colors font-medium"
                                              >
                                                + Add
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      </Card>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-gray-100 p-8 text-center">
                <div className="text-5xl mb-4">✈️</div>
                <p className="text-gray-600 text-lg mb-2">
                  No additional baggage available for purchase on this flight.
                </p>
                <p className="text-sm text-gray-500">
                  Your included baggage allowance will still apply.
                </p>
              </Card>
            )}

          </div>

          {/* Sidebar - Trip Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Trip Summary</h2>

              {/* Flight Info */}
              <div className="mb-6 pb-6 border-b">
                <div className="text-sm text-gray-600 mb-2">Route</div>
                <div className="font-semibold text-gray-900">
                  {primarySlice?.origin?.iata_code || routeOriginLabel} → {primarySlice?.destination?.iata_code || routeDestinationLabel}
                </div>
                {secondarySlice && (
                  <div className="text-sm text-gray-600 mt-1">
                    {secondarySlice.origin?.iata_code || secondarySlice.origin?.city_name || routeDestinationLabel} → {secondarySlice.destination?.iata_code || secondarySlice.destination?.city_name || routeOriginLabel}
                  </div>
                )}
              </div>

              {/* Passengers */}
              <div className="mb-6 pb-6 border-b">
                <div className="text-sm text-gray-600 mb-2">Passengers</div>
                <div className="font-semibold text-gray-900">
                  {passengers.length} {passengers.length === 1 ? 'Passenger' : 'Passengers'}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 pb-6 border-b">
                <div className="flex justify-between text-gray-700">
                  <span>Flight{returnFlight ? 's' : ''}</span>
                  <span className="font-semibold">
                    ${calculateFlightTotal().toFixed(2)}
                  </span>
                </div>

                {calculateSeatsTotal() > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Seats</span>
                    <span className="font-semibold text-green-600">
                      +${calculateSeatsTotal().toFixed(2)}
                    </span>
                  </div>
                )}

                {selectedBaggageCount > 0 && (
                  <div className="flex justify-between items-center text-gray-700">
                    <div className="flex items-center gap-2">
                      <span>Extra Baggage ({selectedBaggageCount} bag{selectedBaggageCount !== 1 ? 's' : ''})</span>
                      <span className="text-xs">💼</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      +${calculateBaggageTotal().toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* CRITICAL: Per-Flight Breakdown */}
              {selectedBaggageCount > 0 && slices.length > 0 && (
                <div className="mb-6 pb-6 border-b">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Baggage Breakdown:
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(baggageBySlice).map(([sliceIndex, { slice }]) => {
                      const sliceIdx = parseInt(sliceIndex);
                      const sliceEntries = selectedBaggageArray;
                      if (sliceEntries.length === 0) return null;
                      
                      const isOutbound = sliceIdx === 0;
                      const storedSlice = storedOffer?.slices?.[sliceIdx];
                      const originIata = storedSlice?.origin?.iata_code || slice.origin?.iata_code || slice.origin?.city_name || 'Origin';
                      const destinationIata = storedSlice?.destination?.iata_code || slice.destination?.iata_code || slice.destination?.city_name || 'Destination';
                      const originCity = storedSlice?.origin?.city_name || slice.origin?.city_name;
                      const destinationCity = storedSlice?.destination?.city_name || slice.destination?.city_name;
                      const sliceTotal = sliceEntries.reduce((sum, entry) =>
                        sum + parseFloat(entry.bag.price || entry.bag.total_amount || entry.bag.amount || '0'),
                      0);
                      
                      return (
                        <div key={sliceIndex} className="text-sm">
                          <div className="font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                            <span>{isOutbound ? '✈️' : '🔙'}</span>
                            <span>{originIata} → {destinationIata}</span>
                          </div>
                          {(originCity || destinationCity) && (
                            <div className="text-xs text-gray-500 ml-5 mb-1">
                              {(originCity || originIata)} → {(destinationCity || destinationIata)}
                            </div>
                          )}
                          {sliceEntries.map((entry) => (
                            <div key={`${sliceIndex}-${entry.passengerId}`} className="text-gray-600 ml-5 text-xs mb-1 flex justify-between">
                              <span>Passenger {entry.passengerNumber}</span>
                              <span>${getPrice(entry.bag)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between font-medium text-gray-700 ml-5 mt-1 text-xs">
                            <span>Subtotal:</span>
                            <span>${sliceTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grand Total */}
              <div className="border-t border-gray-300 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <span className="text-3xl font-bold text-green-600">
                    ${calculateGrandTotal().toFixed(2)}
                  </span>
                </div>
                <div className="text-right text-xs text-gray-500 mt-1">
                  {outbound?.currency || 'AUD'}
                </div>

                <div className="space-y-3 mt-6">
                  <Button
                    onClick={handleContinue}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Continue to Passenger Details
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>

                  <button
                    onClick={handleSkipBaggage}
                    className="w-full text-center text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors"
                  >
                    Skip baggage
                  </button>
                </div>
              </div>
            </Card>

          </div>

        </div>
      </div>
    </div>
  );
}
