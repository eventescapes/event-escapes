import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Passenger {
  id: string;
  type: string;
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
  departure_time?: string;  // Legacy support
  arrival_time?: string;    // Legacy support
  duration: string;
  price: number;
  currency: string;
  passengers?: Passenger[];  // Passenger data from offer
}

interface SeatService {
  id: string;
  total_amount: string;
  total_currency: string;
}

interface SeatElement {
  type: string;
  designator?: string;
  available?: boolean;
  services?: SeatService[];
}

interface SeatMap {
  slice_id: string;
  cabins?: Array<{
    aisles: number;
    cabin_class?: string;
    rows: Array<{
      sections: Array<{
        elements: SeatElement[];
      }>;
    }>;
  }>;
}

interface SelectedSeat {
  seatDesignator: string;
  serviceId: string;
  price: number;
  amount: number;
  currency: string;
}

interface SelectedSeatsState {
  [flightIndex: number]: {
    [passengerIndex: number]: SelectedSeat;
  };
}

interface BaggageServices {
  available_services?: {
    baggage?: Array<{
      id: string;
      passenger_id: string;
      type: string;
      total_amount: string;
      total_currency: string;
    }>;
  };
  included_baggage?: Array<{
    passenger_id: string;
    quantity: number;
  }>;
}

export default function SeatSelection() {
  const [outbound, setOutbound] = useState<FlightData | null>(null);
  const [returnFlight, setReturnFlight] = useState<FlightData | null>(null);
  const [seatMaps, setSeatMaps] = useState<SeatMap[]>([]);
  const [baggageServices, setBaggageServices] = useState<BaggageServices | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeatsState>({});
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const seatSectionRef = useRef<HTMLDivElement | null>(null);
  
  // Get passenger count from loaded passengers
  const passengerCount = passengers.length || 1;

  useEffect(() => {
    // Load selected flights from localStorage
    const outboundData = localStorage.getItem('selected_outbound');
    const returnData = localStorage.getItem('selected_return');
    
    console.log('📦 Loading flight data from localStorage');
    
    if (outboundData) {
      const outboundFlight = JSON.parse(outboundData);
      console.log('🔍 RAW OUTBOUND DATA:', outboundFlight);
      console.log('🔍 Outbound dates:', {
        departure_datetime: outboundFlight.departure_datetime,
        departure_time: outboundFlight.departure_time,
        arrival_datetime: outboundFlight.arrival_datetime,
        arrival_time: outboundFlight.arrival_time
      });
      setOutbound(outboundFlight);
      console.log('✅ Outbound flight loaded:', outboundFlight.airline, outboundFlight.origin, '→', outboundFlight.destination);
      
      // Load passengers from flight data
      if (outboundFlight.passengers && outboundFlight.passengers.length > 0) {
        setPassengers(outboundFlight.passengers);
        console.log('✅ Loaded passengers:', outboundFlight.passengers.length, 'passengers');
        console.log('👥 Passenger types:', outboundFlight.passengers.map((p: Passenger) => p.type).join(', '));
      } else {
        console.warn('⚠️ No passengers found in flight data, defaulting to 1 passenger');
        setPassengers([{ id: 'default', type: 'adult' }]);
      }
      
      // Fetch seat maps and baggage for the offer
      fetchSeatMapsAndBaggage(outboundFlight.offerId);
    } else {
      console.error('❌ No outbound flight found in localStorage');
      setLoading(false);
    }
    
    if (returnData) {
      const returnFlightData = JSON.parse(returnData);
      console.log('🔍 RAW RETURN DATA:', returnFlightData);
      console.log('🔍 Return dates:', {
        departure_datetime: returnFlightData.departure_datetime,
        departure_time: returnFlightData.departure_time,
        arrival_datetime: returnFlightData.arrival_datetime,
        arrival_time: returnFlightData.arrival_time
      });
      setReturnFlight(returnFlightData);
      console.log('✅ Return flight loaded:', returnFlightData.airline, returnFlightData.origin, '→', returnFlightData.destination);
    }
  }, []);

  const fetchSeatMapsAndBaggage = async (offerId: string) => {
    setLoading(true);
    console.log('🔄 Fetching seat maps and baggage for offer:', offerId);
    
    try {
      // Fetch seat maps
      console.log('🪑 Requesting seat maps...');
      const seatResponse = await fetch('https://jxrrhsqffnzeljszbecg.supabase.co/functions/v1/duffel_seat_maps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4cnJoc3FmZm56ZWxqc3piZWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzIxMjgsImV4cCI6MjA3MDkwODEyOH0.R-9Y5b_M7rpKS9zT9hqcdAdDI7m9GICYRDZkIteS9jg'
        },
        body: JSON.stringify({ offer_id: offerId })
      });
      
      const seatData = await seatResponse.json();
      console.log('✅ Seat maps received:', seatData.seat_maps?.length || 0, 'maps');
      console.log('🪑 Full seat response:', seatData);
      
      const loadedSeatMaps = seatData.seat_maps || [];
      setSeatMaps(loadedSeatMaps);
      
      // Detailed data structure verification
      console.log('📊 SEAT MAP DATA VERIFICATION:');
      console.log('Total Seat Maps:', loadedSeatMaps?.length);
      console.log('First Seat Map ID:', loadedSeatMaps?.[0]?.id);
      console.log('First Seat Map Slice ID:', loadedSeatMaps?.[0]?.slice_id);
      console.log('Number of Cabins:', loadedSeatMaps?.[0]?.cabins?.length);
      console.log('Cabin Class:', loadedSeatMaps?.[0]?.cabins?.[0]?.cabin_class);
      console.log('Number of Rows:', loadedSeatMaps?.[0]?.cabins?.[0]?.rows?.length);
      
      // Log a sample seat to verify structure
      const firstRow = loadedSeatMaps?.[0]?.cabins?.[0]?.rows?.[0];
      const firstSection = firstRow?.sections?.[0];
      const firstSeat = firstSection?.elements?.find(el => el.type === 'seat');
      
      console.log('📍 SAMPLE SEAT STRUCTURE:');
      console.log('Designator:', firstSeat?.designator);
      console.log('Available:', firstSeat?.available);
      console.log('Services Array Length:', firstSeat?.services?.length);
      console.log('First Service (Passenger 0):', firstSeat?.services?.[0]);
      console.log('Service ID:', firstSeat?.services?.[0]?.id);
      console.log('Service Price:', firstSeat?.services?.[0]?.total_amount);
      console.log('Service Currency:', firstSeat?.services?.[0]?.total_currency);
      
      console.log('✅ Data structure verified - ready for seat selection');
      
      // Fetch baggage services
      console.log('🧳 Requesting baggage services...');
      const baggageResponse = await fetch('https://jxrrhsqffnzeljszbecg.supabase.co/functions/v1/duffel_offer_services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4cnJoc3FmZm56ZWxqc3piZWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzIxMjgsImV4cCI6MjA3MDkwODEyOH0.R-9Y5b_M7rpKS9zT9hqcdAdDI7m9GICYRDZkIteS9jg'
        },
        body: JSON.stringify({ offer_id: offerId })
      });
      
      const baggageData = await baggageResponse.json();
      console.log('✅ Baggage services loaded:', baggageData.available_services?.baggage?.length || 0);
      console.log('🎁 Included baggage:', baggageData.included_baggage?.length || 0);
      console.log('🧳 Full baggage response:', baggageData);
      setBaggageServices(baggageData);
      
    } catch (error) {
      console.error('❌ Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debug logging for data structure
  useEffect(() => {
    if (seatMaps.length > 0) {
      console.log('📊 === SEAT MAP STRUCTURE ===');
      console.log('- Number of flights:', seatMaps.length);
      
      seatMaps.forEach((map, idx) => {
        console.log(`\n  Flight ${idx + 1}:`, map.slice_id);
        console.log('  - Cabins:', map.cabins?.length);
        
        const firstCabin = map.cabins?.[0];
        if (firstCabin) {
          console.log('  - Aisles:', firstCabin.aisles);
          console.log('  - Rows:', firstCabin.rows?.length);
          
          const firstSeat = firstCabin.rows?.[0]?.sections?.[0]?.elements?.find(e => e.type === 'seat');
          if (firstSeat) {
            console.log('  - First seat:', firstSeat.designator);
            console.log('  - Services count:', firstSeat.services?.length || firstSeat.available_services?.length);
            console.log('  - Example seat services:', firstSeat.services || firstSeat.available_services);
          }
        }
      });
      console.log('\n📊 === END SEAT MAP STRUCTURE ===\n');
    }
    
    if (baggageServices) {
      console.log('📊 === BAGGAGE STRUCTURE ===');
      console.log('- Available baggage services:', baggageServices.available_services?.baggage?.length || 0);
      if (baggageServices.available_services?.baggage?.[0]) {
        console.log('- Example baggage service:', baggageServices.available_services.baggage[0]);
      }
      console.log('- Included baggage:', baggageServices.included_baggage?.length || 0);
      if (baggageServices.included_baggage?.[0]) {
        console.log('- Example included baggage:', baggageServices.included_baggage[0]);
      }
      console.log('📊 === END BAGGAGE STRUCTURE ===\n');
    }
  }, [seatMaps, baggageServices]);

  const scrollToSeats = () => {
    if (seatSectionRef.current) {
      seatSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const storeFlightOfferDataForBaggage = () => {
    try {
      const slicesPayload: any[] = [];

      if (baggageServices?.slices && Array.isArray(baggageServices.slices)) {
        baggageServices.slices.forEach((slice: any) => {
          slicesPayload.push({
            id: slice.id,
            origin: {
              iata_code: slice.origin?.iata_code ?? slice.origin?.airport?.iata_code ?? null,
              city_name: slice.origin?.city_name ?? slice.origin?.airport?.city ?? null,
            },
            destination: {
              iata_code: slice.destination?.iata_code ?? slice.destination?.airport?.iata_code ?? null,
              city_name: slice.destination?.city_name ?? slice.destination?.airport?.city ?? null,
            },
          });
        });
      }

      if (slicesPayload.length === 0) {
        if (outbound) {
          slicesPayload.push({
            id: outbound.sliceId || 'outbound',
            origin: {
              iata_code: outbound.origin,
              city_name: outbound.origin,
            },
            destination: {
              iata_code: outbound.destination,
              city_name: outbound.destination,
            },
          });
        }
        if (returnFlight) {
          slicesPayload.push({
            id: returnFlight.sliceId || 'return',
            origin: {
              iata_code: returnFlight.origin,
              city_name: returnFlight.origin,
            },
            destination: {
              iata_code: returnFlight.destination,
              city_name: returnFlight.destination,
            },
          });
        }
      }

      if (slicesPayload.length > 0) {
        const outboundAmount = parseFloat(outbound?.total_amount || outbound?.price?.toString() || '0');
        const returnAmount = returnFlight ? parseFloat(returnFlight.total_amount || returnFlight.price?.toString() || '0') : 0;
        const totalAmount = outboundAmount + returnAmount;
        const currency = outbound?.total_currency || outbound?.currency || returnFlight?.total_currency || returnFlight?.currency || 'AUD';

        const baseAmounts: number[] = [];
        const taxAmounts: number[] = [];

        if (outbound?.base_amount) baseAmounts.push(parseFloat(outbound.base_amount));
        if (returnFlight?.base_amount) baseAmounts.push(parseFloat(returnFlight.base_amount));

        if (outbound?.tax_amount) taxAmounts.push(parseFloat(outbound.tax_amount));
        if (returnFlight?.tax_amount) taxAmounts.push(parseFloat(returnFlight.tax_amount));

        const offerPayload: Record<string, any> = {
          id: outbound?.offerId || baggageServices?.offer_id || '',
          total_amount: totalAmount ? totalAmount.toFixed(2) : undefined,
          total_currency: currency,
          slices: slicesPayload,
        };

        if (baseAmounts.length > 0) {
          offerPayload.base_amount = baseAmounts.reduce((sum, value) => sum + value, 0).toFixed(2);
          offerPayload.base_currency = currency;
        }

        if (taxAmounts.length > 0) {
          offerPayload.tax_amount = taxAmounts.reduce((sum, value) => sum + value, 0).toFixed(2);
          offerPayload.tax_currency = currency;
        }

        sessionStorage.setItem('flightOfferData', JSON.stringify(offerPayload));
        console.log('💾 Stored flight offer data for baggage page:', offerPayload);
      }
    } catch (error) {
      console.error('⚠️ Failed to store flight offer data for baggage page:', error);
    }
  };

  const clearStoredSeatData = () => {
    localStorage.removeItem('selected_seats');
    localStorage.removeItem('selected_seat_services');
    localStorage.removeItem('selected_seat_details');
    localStorage.removeItem('seats_total');
  };

  const buildSeatServicesPayload = () => {
    const services: Array<{ id: string; type: string; amount: number; quantity: number }> = [];
    const flightsCount = returnFlight ? 2 : 1;

    for (let flightIdx = 0; flightIdx < flightsCount; flightIdx++) {
      const flightSeats = selectedSeats[flightIdx] || {};
      Object.values(flightSeats).forEach((seat: any) => {
        if (!seat || !seat.serviceId) return;
        const amountValue = parseFloat((seat.price as any) || (seat.total_amount as any) || (seat.amount as any) || '0') || 0;
        services.push({
          id: seat.serviceId,
          type: 'seat',
          amount: amountValue,
          quantity: 1,
        });
      });
    }

    return services;
  };

  const handleSkipSeats = () => {
    storeFlightOfferDataForBaggage();
    clearStoredSeatData();
    setSelectedSeats({});
    console.log('⏭️ Skipping seat selection');
    window.location.href = '/baggage-selection';
  };

  const handleContinueToBaggage = () => {
    const services = buildSeatServicesPayload();

    // Validate duplicate seats per flight
    const flightsCount = returnFlight ? 2 : 1;
    for (let flightIdx = 0; flightIdx < flightsCount; flightIdx++) {
      const flightSeats = selectedSeats[flightIdx] || {};
      const seatDesignators = Object.values(flightSeats)
        .filter((seat: any) => seat && seat.seatDesignator)
        .map((seat: any) => seat.seatDesignator);
      const uniqueSeats = new Set(seatDesignators);

      if (seatDesignators.length !== uniqueSeats.size) {
        console.error('❌ DUPLICATE SEATS DETECTED on flight', flightIdx);
        console.error('Seats:', seatDesignators);
        alert('❌ Error: Multiple passengers cannot select the same seat! Please review your seat selections.');
        return;
      }
    }

    for (const service of services) {
      if (!service.id?.startsWith('ase_')) {
        console.error('❌ INVALID SERVICE ID - Must start with "ase_":', service.id);
        alert('Error: Invalid seat service ID. Please try selecting the seat again.');
        return;
      }
      if (typeof service.amount !== 'number' || isNaN(service.amount)) {
        console.error('❌ INVALID AMOUNT - Must be a number:', service.amount, typeof service.amount);
        alert('Error: Invalid seat amount. Please try selecting the seat again.');
        return;
      }
    }

    if (services.length > 0) {
      console.log('✅ VALIDATION PASSED - Data saved to localStorage');
      console.log('Services array:', JSON.stringify(services, null, 2));
      console.log('📊 Trip Summary:', {
        flights: flightTotal,
        seats: seatsCost,
        total: grandTotal
      });

      console.log('💾 Saving services:', services);
      console.log('Each service amount:', services.map(s => s.amount));

      const flatSeatServices = services.map(service => ({
        id: service.id,
        type: 'seat' as const,
        amount: Number(service.amount),
        quantity: service.quantity,
      }));

      localStorage.setItem('selected_seat_details', JSON.stringify(selectedSeats));
      localStorage.setItem('selected_seats', JSON.stringify(flatSeatServices));
      localStorage.setItem('selected_seat_services', JSON.stringify(flatSeatServices));
      localStorage.setItem('seats_total', seatsCost.toFixed(2));
    } else {
      clearStoredSeatData();
    }

    storeFlightOfferDataForBaggage();
    console.log('🎉 Navigating to baggage selection...');
    window.location.href = '/baggage-selection';
  };

  /**
   * CRITICAL: Extract seat service ID for specific passenger
   * The service index MUST match passenger index!
   */
  const getSeatServiceForPassenger = (seatElement: SeatElement, passengerIndex: number) => {
    // Try both 'services' and 'available_services' (API might use either)
    const servicesArray = seatElement.services || (seatElement as any).available_services;
    
    if (!servicesArray || servicesArray.length <= passengerIndex) {
      // Don't log for every unavailable seat - too noisy
      return null;
    }
    
    const service = servicesArray[passengerIndex];
    if (!service || !service.id) {
      return null;
    }
    
    // Try all possible price field names in order
    const priceValue = (service as any).total_amount || 
                       (service as any).amount || 
                       (service as any).price || 
                       (service as any).total_price ||
                       '0';
    
    const price = parseFloat(priceValue);
    
    const currency = (service as any).total_currency || 
                     (service as any).currency || 
                     'AUD';
    
    console.log(`💰 Seat ${seatElement.designator} → Passenger ${passengerIndex} → Price: $${price} ${currency}`);
    
    return {
      id: service.id,
      price: price,
      currency: currency
    };
  };

  const handleSeatSelect = (flightIndex: number, passengerIndex: number, seatElement: SeatElement) => {
    const service = getSeatServiceForPassenger(seatElement, passengerIndex);
    
    if (!service) {
      alert('This seat is not available for this passenger');
      return;
    }
    
    const seatDesignator = seatElement.designator!;
    
    // CRITICAL: Check if this seat is already selected by ANOTHER passenger
    const flightSeats = selectedSeats[flightIndex] || {};
    const isAlreadyTaken = Object.entries(flightSeats).some(
      ([paxIndex, selectedSeat]) => 
        parseInt(paxIndex) !== passengerIndex && 
        selectedSeat?.seatDesignator === seatDesignator
    );
    
    if (isAlreadyTaken) {
      // Find which passenger has this seat
      const takenByPassenger = Object.entries(flightSeats).find(
        ([paxIndex, selectedSeat]) => selectedSeat?.seatDesignator === seatDesignator
      );
      const takenByIndex = takenByPassenger ? parseInt(takenByPassenger[0]) : -1;
      
      alert(`❌ Seat ${seatDesignator} is already selected by Passenger ${takenByIndex + 1}. Please choose a different seat.`);
      console.warn('🚫 Seat selection blocked - already taken by another passenger:', {
        seat: seatDesignator,
        attemptedBy: passengerIndex + 1,
        takenBy: takenByIndex + 1
      });
      return;
    }
    
    const priceValue = parseFloat((service.price as any) || (service.total_amount as any) || (service.amount as any) || '0') || 0;
    const currencyValue = service.currency || service.total_currency || outbound?.currency || 'AUD';

    setSelectedSeats(prev => ({
      ...prev,
      [flightIndex]: {
        ...prev[flightIndex],
        [passengerIndex]: {
          seatDesignator: seatDesignator,
          serviceId: service.id,
          price: priceValue,
          amount: priceValue,
          currency: currencyValue
        }
      }
    }));
    
    console.log('✅ Seat selected:', {
      flight: flightIndex,
      passenger: passengerIndex + 1,
      seat: seatDesignator,
      serviceId: service.id,
      price: priceValue,
      currency: currencyValue
    });
  };

  /**
   * Check if a seat is already taken by ANOTHER passenger
   */
  const isSeatTakenByOtherPassenger = (flightIndex: number, seatDesignator: string, currentPassengerIndex: number): boolean => {
    const flightSeats = selectedSeats[flightIndex] || {};
    return Object.entries(flightSeats).some(
      ([paxIndex, selectedSeat]) => 
        parseInt(paxIndex) !== currentPassengerIndex && 
        selectedSeat?.seatDesignator === seatDesignator
    );
  };

  /**
   * Get which passenger has selected a specific seat
   */
  const getPassengerForSeat = (flightIndex: number, seatDesignator: string): number | null => {
    const flightSeats = selectedSeats[flightIndex] || {};
    const entry = Object.entries(flightSeats).find(
      ([_, seat]) => seat?.seatDesignator === seatDesignator
    );
    return entry ? parseInt(entry[0]) : null;
  };

  const calculateSeatsTotal = () => {
    let total = 0;
    Object.values(selectedSeats).forEach((flight) => {
      Object.values(flight).forEach((seat) => {
        total += seat.price || 0;
      });
    });
    return total;
  };

  // Calculate costs for trip summary
  const seatsCost = calculateSeatsTotal();
  const flightTotal = (outbound?.price || 0) + (returnFlight?.price || 0);
  const grandTotal = flightTotal + seatsCost;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12">
          <div className="text-6xl mb-4 animate-bounce">✈️</div>
          <div className="text-2xl font-semibold mb-2">Loading seat maps and baggage options...</div>
          <div className="text-gray-600">This may take a few moments</div>
        </div>
      </div>
    );
  }

  if (!outbound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-4">No Flight Selected</h2>
          <p className="text-gray-600 mb-6">Please select your flights first.</p>
          <Button onClick={() => window.location.href = '/flights'}>
            Back to Flight Selection
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/flights'}
            className="mb-4"
          >
            ← Back to Flights
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Select Seats & Baggage</h1>
          <p className="text-gray-600">Customize your travel experience</p>
        </div>

        {/* Flight Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Outbound Flight */}
          <Card className="p-6">
            <div className="text-sm text-gray-500 mb-2">Outbound Flight</div>
            <div className="font-semibold text-lg mb-1">{outbound.airline}</div>
            <div className="text-gray-700 mb-2">
              {outbound.origin} → {outbound.destination}
            </div>
            <div className="text-sm text-gray-600">
              {(outbound.departure_datetime || outbound.departure_time) ? (
                new Date(outbound.departure_datetime || outbound.departure_time!).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })
              ) : (
                'Date TBD'
              )}
            </div>
          </Card>

          {/* Return Flight */}
          {returnFlight && (
            <Card className="p-6">
              <div className="text-sm text-gray-500 mb-2">Return Flight</div>
              <div className="font-semibold text-lg mb-1">{returnFlight.airline}</div>
              <div className="text-gray-700 mb-2">
                {returnFlight.origin} → {returnFlight.destination}
              </div>
              <div className="text-sm text-gray-600">
                {(returnFlight.departure_datetime || returnFlight.departure_time) ? (
                  new Date(returnFlight.departure_datetime || returnFlight.departure_time!).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })
                ) : (
                  'Date TBD'
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Seat Selection Guidance */}
        <div className="max-w-4xl mx-auto mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                ✈️ Seat Selection (Optional)
              </h2>
              <p className="text-gray-700 mb-4">
                Choose the seats you prefer below, or skip this step to continue without selecting seats. You can always pick seats later if you prefer.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={handleSkipSeats}
                  className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 font-medium transition-all"
                >
                  Skip to Baggage →
                </button>
                <button
                  type="button"
                  onClick={scrollToSeats}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all"
                >
                  Select Seats Below ↓
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1 md:text-right">
              <div>💺 Seat selection fee: $40.27 per seat</div>
              <div>✅ Free to skip</div>
            </div>
          </div>
        </div>

        {/* Seat Selection UI */}
        <div ref={seatSectionRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Seat Maps */}
          <div className="lg:col-span-2">
            {seatMaps.length > 0 ? (
              seatMaps.map((seatMap, flightIdx) => (
                <div key={flightIdx} className="mb-12">
                  <h3 className="text-2xl font-bold mb-6">
                    Flight {flightIdx + 1}: {flightIdx === 0 ? 'Outbound' : 'Return'}
                  </h3>
                  
                  {/* For EACH passenger - dynamic count */}
                  {passengers.map((passenger, passengerIdx) => (
                    <div key={passenger.id || passengerIdx} className="mb-8">
                      <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                          {passengerIdx + 1}
                        </span>
                        Passenger {passengerIdx + 1}: {passenger.type.charAt(0).toUpperCase() + passenger.type.slice(1)}
                      </h4>
                      
                      {/* Selected seat display */}
                      {selectedSeats[flightIdx]?.[passengerIdx] && (
                        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-green-800">
                                ✅ Seat {selectedSeats[flightIdx][passengerIdx].seatDesignator} Selected
                              </div>
                              <div className="text-sm text-green-700">
                                ${selectedSeats[flightIdx][passengerIdx].price} {selectedSeats[flightIdx][passengerIdx].currency}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSeats(prev => {
                                  const updated = { ...prev };
                                  if (updated[flightIdx]) {
                                    delete updated[flightIdx][passengerIdx];
                                  }
                                  return updated;
                                });
                              }}
                            >
                              Change
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Seat grid - iterate through ALL cabins dynamically */}
                      <Card className="p-6 bg-gray-50">
                        <div className="text-sm text-gray-600 mb-4">
                          Select a seat for Passenger {passengerIdx + 1}
                        </div>
                        
                        {/* Seat Legend */}
                        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded"></div>
                            <span className="text-xs font-medium text-gray-700">Available</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-500 border-2 border-green-600 rounded"></div>
                            <span className="text-xs font-medium text-gray-700">Your Selection</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-red-50 border-2 border-red-300 rounded flex items-center justify-center text-xs font-bold text-red-600">
                              P1
                            </div>
                            <span className="text-xs font-medium text-gray-700">Selected by Another Passenger</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 rounded opacity-60"></div>
                            <span className="text-xs font-medium text-gray-700">Unavailable</span>
                          </div>
                        </div>
                        
                        {/* Iterate through ALL cabins dynamically */}
                        {seatMap.cabins?.map((cabin, cabinIdx) => (
                          <div key={cabinIdx} className="mb-8">
                            <div className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                              {cabin.cabin_class || 'Cabin'} • {cabin.rows?.length || 0} rows
                            </div>
                            
                            {/* Show first 10 rows as EXAMPLE - later expand to show ALL */}
                            <div className="space-y-2">
                              {cabin.rows?.slice(0, 10).map((row, rowIdx) => (
                                <div key={rowIdx} className="flex gap-2 justify-center">
                                  {/* Iterate through ALL sections in row */}
                                  {row.sections?.map((section, sectionIdx) => (
                                    <div key={sectionIdx} className="flex gap-2">
                                      {/* Show ALL seat elements in section */}
                                      {section.elements
                                        ?.filter(el => el.type === 'seat')
                                        .map((seat, seatIdx) => {
                                          const service = getSeatServiceForPassenger(seat, passengerIdx);
                                          const isSelectedByThisPassenger = selectedSeats[flightIdx]?.[passengerIdx]?.seatDesignator === seat.designator;
                                          const isTakenByOther = isSeatTakenByOtherPassenger(flightIdx, seat.designator!, passengerIdx);
                                          const takenByPassengerIndex = isTakenByOther ? getPassengerForSeat(flightIdx, seat.designator!) : null;
                                          const isAvailable = seat.available && service && !isTakenByOther;
                                          
                                          return (
                                            <button
                                              key={`${rowIdx}-${sectionIdx}-${seatIdx}`}
                                              onClick={() => isAvailable && handleSeatSelect(flightIdx, passengerIdx, seat)}
                                              disabled={!isAvailable || isTakenByOther}
                                              className={`
                                                p-3 rounded-lg border-2 font-semibold min-w-[70px] transition-all relative
                                                ${isSelectedByThisPassenger ? 'bg-green-500 text-white border-green-600 shadow-lg' : ''}
                                                ${isTakenByOther ? 'bg-red-50 text-red-600 border-red-300 cursor-not-allowed opacity-75' : ''}
                                                ${isAvailable && !isSelectedByThisPassenger && !isTakenByOther ? 'bg-white hover:bg-blue-50 hover:border-blue-500 border-gray-300 cursor-pointer' : ''}
                                                ${!seat.available && !isTakenByOther ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed opacity-60' : ''}
                                              `}
                                            >
                                              <div className={`text-sm font-bold ${!seat.available && !isTakenByOther ? 'text-gray-400' : ''}`}>
                                                {seat.designator}
                                              </div>
                                              {isTakenByOther && takenByPassengerIndex !== null && (
                                                <div className="text-xs mt-1 font-semibold">P{takenByPassengerIndex + 1}</div>
                                              )}
                                              {!isTakenByOther && service && service.price > 0 && (
                                                <div className="text-xs mt-1">${service.price.toFixed(2)}</div>
                                              )}
                                              {!isAvailable && !isTakenByOther && (
                                                <div className="text-xs mt-1 text-gray-400">N/A</div>
                                              )}
                                            </button>
                                          );
                                        })}
                                      
                                      {/* Add aisle separator between sections */}
                                      {sectionIdx < row.sections.length - 1 && (
                                        <div className="w-6 flex items-center justify-center text-gray-400 text-xs">
                                          ||
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                            
                            <div className="text-xs text-gray-500 mt-4 p-3 bg-blue-50 rounded">
                              📝 Showing first 10 rows for testing. Expand to show all {cabin.rows?.length || 0} rows in production.
                            </div>
                          </div>
                        ))}
                      </Card>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <Card className="p-8 text-center">
                <div className="text-4xl mb-4">🪑</div>
                <h3 className="text-xl font-semibold mb-2">No Seat Maps Available</h3>
                <p className="text-gray-600">Seat selection is not available for this flight.</p>
              </Card>
            )}
          </div>

          {/* Sidebar - Trip Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card className="p-6 bg-gradient-to-br from-gray-50 to-white shadow-lg">
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                  <span>🧳</span> Your Trip Summary
                </h3>
                
                {/* Outbound Flight */}
                {outbound && (
                  <div className="mb-6 pb-6 border-b">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                      Outbound Flight
                    </div>
                    <div className="font-semibold text-lg mb-1">
                      {outbound.airline}
                    </div>
                    <div className="text-sm text-gray-700 mb-2">
                      {outbound.origin} → {outbound.destination}
                    </div>
                    <div className="text-xs text-gray-600 mb-3">
                      {(outbound.departure_datetime || outbound.departure_time) ? (
                        <>
                          {new Date(outbound.departure_datetime || outbound.departure_time!).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                          {' • '}
                          {new Date(outbound.departure_datetime || outbound.departure_time!).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </>
                      ) : (
                        <span className="text-gray-400">Date TBD</span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Flight Price</span>
                      <span className="font-bold">${outbound.price}</span>
                    </div>
                    
                    {/* Show selected seats for outbound */}
                    {selectedSeats[0] && Object.keys(selectedSeats[0]).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600 mb-2">Selected Seats:</div>
                        {Object.entries(selectedSeats[0]).map(([passengerIdx, seat]) => (
                          <div key={passengerIdx} className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">
                              🪑 Passenger {parseInt(passengerIdx) + 1}: Seat {seat.seatDesignator}
                            </span>
                            <span className="font-semibold">${seat.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Return Flight */}
                {returnFlight && (
                  <div className="mb-6 pb-6 border-b">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                      Return Flight
                    </div>
                    <div className="font-semibold text-lg mb-1">
                      {returnFlight.airline}
                    </div>
                    <div className="text-sm text-gray-700 mb-2">
                      {returnFlight.origin} → {returnFlight.destination}
                    </div>
                    <div className="text-xs text-gray-600 mb-3">
                      {(returnFlight.departure_datetime || returnFlight.departure_time) ? (
                        <>
                          {new Date(returnFlight.departure_datetime || returnFlight.departure_time!).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                          {' • '}
                          {new Date(returnFlight.departure_datetime || returnFlight.departure_time!).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </>
                      ) : (
                        <span className="text-gray-400">Date TBD</span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Flight Price</span>
                      <span className="font-bold">${returnFlight.price}</span>
                    </div>
                    
                    {/* Show selected seats for return */}
                    {selectedSeats[1] && Object.keys(selectedSeats[1]).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600 mb-2">Selected Seats:</div>
                        {Object.entries(selectedSeats[1]).map(([passengerIdx, seat]) => (
                          <div key={passengerIdx} className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">
                              🪑 Passenger {parseInt(passengerIdx) + 1}: Seat {seat.seatDesignator}
                            </span>
                            <span className="font-semibold">${seat.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Cost Breakdown */}
                {outbound && (
                  <div className="space-y-3 mb-6">
                    {/* Flights Subtotal */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Flights Subtotal</span>
                      <span className="font-semibold">
                        ${flightTotal.toFixed(2)}
                      </span>
                    </div>
                    
                    {/* Seats Subtotal - only show if seats selected */}
                    {seatsCost > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Seats</span>
                        <span className="font-semibold text-green-600">
                          +${seatsCost.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {/* Divider */}
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center text-xl font-bold">
                        <span>Grand Total</span>
                        <span className="text-green-600">
                          ${grandTotal.toFixed(2)} {outbound.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Continue Button */}
                {outbound && (
                  <div className="border-t-2 border-gray-300 mt-6 pt-6">
                    <div className="space-y-3">
                      <Button
                        type="button"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        onClick={handleContinueToBaggage}
                      >
                        Continue to Baggage
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                      <button
                        type="button"
                        onClick={handleSkipSeats}
                        className="w-full text-center text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors"
                      >
                        Skip seats
                      </button>
                    </div>
                  </div>
                )}
                
                {!outbound && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-3">✈️</div>
                    <div className="text-sm">
                      Select your flights to see trip summary
                    </div>
                  </div>
                )}
              </Card>
              
              {/* Debug Info */}
              <Card className="p-4 bg-blue-50 border-blue-200 mt-4">
                <h4 className="font-semibold text-sm mb-2">📊 Debug Info</h4>
                <div className="text-xs font-mono space-y-1">
                  <div>Seat Maps: {seatMaps.length}</div>
                  <div>Passengers: {passengerCount}</div>
                  <div>Seats Selected: {Object.values(selectedSeats).reduce((acc, flight) => acc + Object.keys(flight).length, 0)}</div>
                  <div>Seats Cost: ${seatsCost.toFixed(2)}</div>
                  <div>Grand Total: ${grandTotal.toFixed(2)}</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

