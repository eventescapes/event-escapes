import { useEffect, useState } from "react";
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

type SelectedBaggageEntry = {
  sliceIndex: number;
  bag: BaggageService;
  passengerNumber: number;
};

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
  const [selectedBaggage, setSelectedBaggage] = useState<SelectedBaggageEntry[]>([]);
  const [slices, setSlices] = useState<Slice[]>([]);

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
    const ids: string[] = [];

    // Helper to push id safely
    const pushId = (value: any) => {
      if (!value) return;
      if (typeof value === 'string') {
        ids.push(value);
      } else if (typeof value === 'object' && value.id) {
        ids.push(value.id);
      }
    };

    // 1. segments property might be an array, object with data, etc.
    const segments: any = (slice as any).segments;

    if (Array.isArray(segments)) {
      segments.forEach(pushId);
    } else if (segments && typeof segments === 'object') {
      if (Array.isArray(segments.data)) {
        segments.data.forEach(pushId);
      } else if (Array.isArray(segments.items)) {
        segments.items.forEach(pushId);
      } else {
        Object.values(segments).forEach(value => {
          if (Array.isArray(value)) {
            value.forEach(pushId);
          } else {
            pushId(value);
          }
        });
      }
    }

    // 2. Some responses include segment_ids directly on slice
    if (Array.isArray((slice as any).segment_ids)) {
      (slice as any).segment_ids.forEach(pushId);
    } else if ((slice as any).segment_id) {
      pushId((slice as any).segment_id);
    }

    // 3. Fallback: infer from slice id (sli_xxx -> seg_xxx)
    if (ids.length === 0 && slice.id?.startsWith('sli_')) {
      ids.push(slice.id.replace('sli_', 'seg_'));
    }

    return Array.from(new Set(ids.filter(Boolean)));
  };

  const segmentIdsMatch = (bagSegmentId: string, flightSegmentId: string): boolean => {
    if (!bagSegmentId || !flightSegmentId) return false;

    if (bagSegmentId === flightSegmentId) return true;

    const bagBase = bagSegmentId.slice(0, -1);
    const flightBase = flightSegmentId.slice(0, -1);

    return bagBase === flightBase;
  };

  // PROPER IMPLEMENTATION: Group baggage by flight per Duffel docs
  const getBaggageBySlice = () => {
    const grouped: Record<number, { slice: Slice; baggage: BaggageService[] }> = {};
    
      console.log('📦 Total baggage services:', baggageServices.length);
      console.log('✈️ Total slices:', slices.length);
    
    slices.forEach((slice, sliceIndex) => {
      const sliceSegmentIds = extractSliceSegmentIds(slice);
      console.log(`\n📍 Processing slice ${sliceIndex}:`, {
        slice_id: slice.id,
        segment_ids: sliceSegmentIds
      });
      
      // Find baggage services that match ANY of this slice's segments
      const sliceBaggage = baggageServices.filter(bag => {
        // Each bag has segment_ids indicating which segments (flights) it applies to
        if (!bag.segment_ids || !Array.isArray(bag.segment_ids)) {
          console.log(`⚠️ Bag ${bag.id} has no segment_ids, defaulting to slice 0`);
          return sliceIndex === 0; // Put in first slice by default
        }
        
        // CRITICAL MATCHING LOGIC: Compare bag's segment_ids against slice's segment IDs
        console.log(`🔍 Checking bag ${bag.id}:`);
        console.log(`   Bag segment_ids: [${bag.segment_ids.join(', ')}]`);
        console.log(`   Slice segment_ids: [${sliceSegmentIds.join(', ')}]`);
        
        // Check if ANY of the bag's segment_ids match ANY of this slice's segments
        const hasMatch = bag.segment_ids.some(bagSegId => {
          const matchedSliceSeg = sliceSegmentIds.find(sliceSegId => segmentIdsMatch(bagSegId, sliceSegId));
          if (matchedSliceSeg) {
            const isExact = bagSegId === matchedSliceSeg;
            console.log(`   ✅ MATCH FOUND: Bag segment "${bagSegId}" ${isExact ? 'exactly matches' : `~approximately matches~ "${matchedSliceSeg}"`}`);
            return true;
          }
          return false;
        });
        
        if (hasMatch) {
          console.log(`✅ Bag ${bag.id} MATCHED to slice ${sliceIndex}`);
        } else {
          console.log(`❌ Bag ${bag.id} NO MATCH for slice ${sliceIndex}`);
        }
        
        return hasMatch;
      });
      
      console.log(`📋 Slice ${sliceIndex} has ${sliceBaggage.length} baggage services`);
      
      grouped[sliceIndex] = {
        slice: slice,
        baggage: sliceBaggage
      };
    });
    
    // FALLBACK: If no baggage matched any slices, divide evenly
    const totalMatched = Object.values(grouped).reduce((sum, g) => sum + g.baggage.length, 0);
    
    if (totalMatched === 0 && baggageServices.length > 0) {
      console.log('⚠️ No baggage matched segments, falling back to even distribution');
      
      const bagsPerSlice = Math.ceil(baggageServices.length / slices.length);
      slices.forEach((slice, sliceIndex) => {
        const startIdx = sliceIndex * bagsPerSlice;
        const endIdx = Math.min(startIdx + bagsPerSlice, baggageServices.length);
        grouped[sliceIndex] = {
          slice: slice,
          baggage: baggageServices.slice(startIdx, endIdx)
        };
      });
    }
    
    return grouped;
  };

  // Handle add baggage
  const isBagSelected = (bagId: string, sliceIndex: number) => {
    return selectedBaggage.some(entry => entry.sliceIndex === sliceIndex && entry.bag.id === bagId);
  };

  const toggleBaggageSelection = (bag: BaggageService, sliceIndex: number, passengerNumber: number) => {
    setSelectedBaggage(prev => {
      const exists = prev.some(entry => entry.sliceIndex === sliceIndex && entry.bag.id === bag.id);
      if (exists) {
        console.log('🗑️ Removing baggage:', { bagId: bag.id, sliceIndex });
        return prev.filter(entry => !(entry.sliceIndex === sliceIndex && entry.bag.id === bag.id));
      }
      console.log('🎒 Adding baggage:', { bagId: bag.id, sliceIndex });
      return [...prev, { sliceIndex, bag, passengerNumber }];
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
    return selectedBaggage.reduce((sum, entry) => {
      const bag = entry.bag;
      return sum + parseFloat(bag.price || bag.total_amount || bag.amount || '0');
    }, 0);
  };

  const calculateGrandTotal = () => {
    return calculateFlightTotal() + calculateSeatsTotal() + calculateBaggageTotal();
  };

  // Continue to next step
  const handleContinue = () => {
    console.log('📤 Continuing with baggage:', selectedBaggage);

    // Save selected baggage to localStorage
    const baggageForStorage = selectedBaggage.map(entry => ({
      ...entry.bag,
      __sliceIndex: entry.sliceIndex,
      __passengerNumber: entry.passengerNumber,
    }));

    localStorage.setItem('selected_baggage', JSON.stringify(baggageForStorage));
    localStorage.setItem('baggage_total', calculateBaggageTotal().toFixed(2));

    console.log('💾 Saved baggage:', {
      count: selectedBaggage.length,
      total: calculateBaggageTotal().toFixed(2),
      services: selectedBaggage.map(entry => entry.bag.id)
    });

    // Navigate to passenger details
    setLocation('/passenger-details');
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
  const hasAnyBaggage = Object.values(baggageBySlice).some(slice => slice.baggage.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Additional Baggage</h1>
              <p className="text-gray-600">
                Add extra baggage to your booking (optional)
              </p>
            </div>

            {/* CRITICAL: Round-Trip Warning */}
            {slices.length > 1 && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💡</div>
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-1">
                      Planning a round-trip?
                    </h3>
                    <p className="text-sm text-blue-700">
                      Each extra bag needs to be added <strong>separately for each flight</strong>. 
                      Need a bag for the entire trip? Add it for both outbound and return flights.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
              <div className="space-y-8">
                {Object.entries(baggageBySlice).map(([sliceIndex, { slice, baggage }]) => {
                  if (baggage.length === 0) return null;
                  
                  const isOutbound = parseInt(sliceIndex) === 0;
                  const originIata = slice.origin?.iata_code || slice.origin?.city_name || 'Origin';
                  const destinationIata = slice.destination?.iata_code || slice.destination?.city_name || 'Destination';
                  const originCity = slice.origin?.city_name;
                  const destinationCity = slice.destination?.city_name;
                  const departureDate = slice.departure_datetime;
                  
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
                        
                        {baggage.map((bag, bagIndex) => {
                          const sliceIdx = parseInt(sliceIndex);
                          const selected = isBagSelected(bag.id, sliceIdx);
                          const passengerNum = getPassengerNumber(bag.passenger_id);
                          const passengerDisplayNumber = passengerNum !== '?' ? passengerNum : bagIndex + 1;
                          console.log('💰 Baggage service pricing check:', {
                            bag_id: bag.id,
                            price: bag.price,
                            currency: bag.currency,
                            total_amount: bag.total_amount,
                            amount: bag.amount,
                            total_currency: bag.total_currency,
                            metadata: bag.metadata
                          });
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
                              {/* Bag Info */}
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
                                    {/* CRITICAL WARNING */}
                                    <p className="text-xs text-orange-600 font-semibold mt-1 flex items-center gap-1">
                                      <span>⚠️</span>
                                      <span>For this flight only</span>
                                    </p>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600 ml-11 space-y-0.5">
                                  <div>• Up to {weightLimit}kg</div>
                                  {lengthLimit && <div>• Max {lengthLimit}cm</div>}
                                </div>
                              </div>

                              {/* Price & Button */}
                              <div className="flex items-center gap-4 md:ml-4">
                                {/* Price */}
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-green-600">
                                    ${displayPrice}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {displayCurrency}
                                  </div>
                                </div>

                                {/* Button */}
                                <div>
                                  {selected ? (
                                    <Button
                                      onClick={() => toggleBaggageSelection(bag, sliceIdx, passengerDisplayNumber)}
                                      className="px-5 py-5 bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
                                    >
                                      Remove
                                    </Button>
                                  ) : (
                                    <Button
                                      onClick={() => toggleBaggageSelection(bag, sliceIdx, passengerDisplayNumber)}
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

            {/* Navigation Buttons */}
            <div className="mt-8 space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={() => setLocation('/seat-selection')}
                  variant="outline"
                  className="flex-1 py-6 text-base"
                >
                  ← Back to Seats
                </Button>
                <Button
                  onClick={handleContinue}
                  className="flex-1 py-6 bg-green-500 hover:bg-green-600 text-white text-base font-semibold"
                >
                  Continue to Passenger Details →
                </Button>
              </div>

              {/* Skip Option */}
              {hasAnyBaggage && (
                <div className="text-center">
                  <button
                    onClick={handleContinue}
                    className="text-gray-500 hover:text-gray-700 text-sm underline"
                  >
                    Skip - Continue without extra baggage
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Sidebar - Trip Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Trip Summary</h2>

              {/* Flight Info */}
              <div className="mb-6 pb-6 border-b">
                <div className="text-sm text-gray-600 mb-2">Route</div>
                <div className="font-semibold text-gray-900">
                  {outbound?.origin} → {outbound?.destination}
                </div>
                {returnFlight && (
                  <div className="text-sm text-gray-600 mt-1">
                    Round trip
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

                {selectedBaggage.length > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Baggage ({selectedBaggage.length} bag{selectedBaggage.length > 1 ? 's' : ''})</span>
                    <span className="font-semibold text-green-600">
                      +${calculateBaggageTotal().toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* CRITICAL: Per-Flight Breakdown */}
              {selectedBaggage.length > 0 && slices.length > 0 && (
                <div className="mb-6 pb-6 border-b">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Baggage Breakdown:
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(baggageBySlice).map(([sliceIndex, { slice }]) => {
                      const sliceIdx = parseInt(sliceIndex);
                      const sliceEntries = selectedBaggage.filter(entry => entry.sliceIndex === sliceIdx);
                      if (sliceEntries.length === 0) return null;
                      
                      const isOutbound = sliceIdx === 0;
                      const originIata = slice.origin?.iata_code || slice.origin?.city_name || 'Origin';
                      const destinationIata = slice.destination?.iata_code || slice.destination?.city_name || 'Destination';
                      const originCity = slice.origin?.city_name;
                      const destinationCity = slice.destination?.city_name;
                      const sliceTotal = sliceEntries.reduce((sum, entry) => 
                        sum + parseFloat(entry.bag.price || entry.bag.total_amount || entry.bag.amount || '0'), 0
                      );
                      
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
                            <div key={entry.bag.id} className="flex justify-between text-gray-600 ml-5 text-xs mb-1">
                              <span>• Passenger {entry.passengerNumber}</span>
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
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-3xl font-bold text-green-600">
                  ${calculateGrandTotal().toFixed(2)}
                </span>
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">
                {outbound?.currency || 'AUD'}
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
