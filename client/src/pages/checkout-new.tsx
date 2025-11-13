import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FlightData {
  id: string;
  offerId?: string;
  sliceId?: string;
  airline: string;
  flight_number?: string;
  origin: string;
  destination: string;
  departure_datetime?: string;
  arrival_datetime?: string;
  duration: string;
  price: number;
  currency?: string;
  total_amount?: string;
  total_currency?: string;
}

interface PassengerData {
  id: string;
  type: string;
  title: string;
  given_name: string;
  family_name: string;
  gender: string;
  born_on: string;
  email: string;
  phone_number: string;
  identity_documents?: any[];
}

interface ServiceItem {
  id: string;
  type: string;
  amount: number;
  quantity: number;
}

export default function CheckoutNew() {
  const [outbound, setOutbound] = useState<FlightData | null>(null);
  const [returnFlight, setReturnFlight] = useState<FlightData | null>(null);
  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  const [seats, setSeats] = useState<ServiceItem[]>([]);
  const [baggage, setBaggage] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // STEP 2: CALCULATE TOTALS (EXACTLY AS BACKEND DOES)
  // Base flight price from offer
  const basePrice = outbound ? parseFloat(outbound.total_amount || outbound.price?.toString() || '0') : 0;
  
  // Services cost (seats + baggage) - MUST match backend calculation
  const services: ServiceItem[] = [...seats, ...baggage];
  const servicesCost = services.reduce((sum, service) => {
    const amount = parseFloat(service.amount || service.total_amount || 0);
    const quantity = service.quantity || 1;
    return sum + (amount * quantity);
  }, 0);
  
  // Grand total (MUST match backend calculation exactly)
  const grandTotal = parseFloat((basePrice + servicesCost).toFixed(2));
  
  // For display breakdown
  const flightTotal = (outbound?.price || 0) + (returnFlight?.price || 0);
  const seatsTotal = seats.reduce((sum, s) => {
    const amount = parseFloat(s.amount || s.total_amount || 0);
    const quantity = s.quantity || 1;
    return sum + (amount * quantity);
  }, 0);
  const baggageTotal = baggage.reduce((sum, b) => {
    const amount = parseFloat(b.amount || b.total_amount || 0);
    const quantity = b.quantity || 1;
    return sum + (amount * quantity);
  }, 0);

  useEffect(() => {
    // STEP 1: LOAD DATA ON MOUNT
    console.log('💳 CHECKOUT LOADED:');
    
    try {
      // Load FRESH offer (verified price from passenger-details page)
      const freshOfferData = localStorage.getItem('fresh_offer');
      if (freshOfferData) {
        const freshOffer = JSON.parse(freshOfferData);
        setOutbound(freshOffer);
        console.log('✅ Using verified fresh offer from Duffel');
        console.log('   Offer ID:', freshOffer.id);
        console.log('   Fresh Price:', freshOffer.total_amount, freshOffer.total_currency);
      } else {
        // Fallback to old offer if fresh not available
        const outboundData = localStorage.getItem('selected_outbound');
        const outboundFlight = outboundData ? JSON.parse(outboundData) : null;
        setOutbound(outboundFlight);
        console.warn('⚠️ No fresh offer found, using cached data');
      }
      
      // Load return flight
      const returnData = localStorage.getItem('selected_return');
      const returnFlightData = returnData ? JSON.parse(returnData) : null;
      setReturnFlight(returnFlightData);
      
      // Load passengers
      const passengersData = localStorage.getItem('passenger_data');
      const passengersArray = passengersData ? JSON.parse(passengersData) : [];
      setPassengers(passengersArray);
      
      // Load seats
      const seatsData = localStorage.getItem('selected_seat_services') || localStorage.getItem('selected_seats');
      const seatsArray = seatsData ? JSON.parse(seatsData) : [];
      setSeats(Array.isArray(seatsArray) ? seatsArray : []);
      
      // Load baggage
      const baggageData = localStorage.getItem('selected_baggage');
      const baggageArray = baggageData ? JSON.parse(baggageData) : [];
      setBaggage(baggageArray);
      
      console.log('Passengers:', passengersArray?.length);
      console.log('Services:', [...seatsArray, ...baggageArray].length);
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading checkout data:', error);
      setLoading(false);
    }
  }, []);

  // STEP 3: VALIDATE DATA BEFORE SENDING
  const validateCheckoutData = () => {
    if (!outbound?.id) {
      alert('No flight selected');
      return false;
    }
    
    if (!passengers || passengers.length === 0) {
      alert('No passenger data');
      return false;
    }
    
    // Validate passengers have required fields
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.id || !p.type || !p.title || !p.given_name || !p.family_name || 
          !p.gender || !p.born_on || !p.email || !p.phone_number) {
        alert(`Passenger ${i + 1} missing required fields`);
        console.error('Invalid passenger:', p);
        return false;
      }
    }
    
    // Validate services format
    for (let s of services) {
      if (!s.id || !s.type || typeof s.amount !== 'number' || !s.quantity) {
        alert('Invalid service format');
        console.error('Bad service:', s);
        return false;
      }
    }
    
    return true;
  };

  // STEP 4: CREATE STRIPE CHECKOUT SESSION
  const handleProceedToPayment = async () => {
    if (!validateCheckoutData()) return;
    
    setIsProcessing(true);
    
    // Build EXACT payload format (matches successful bookings EBVBTV, AA6USG, AX43CE)
    const payload = {
      offerId: outbound!.id,
      passengers: passengers,  // Already formatted from passenger-details page
      services: services,      // Already formatted from seat/baggage selection
      totalAmount: grandTotal,
      currency: outbound!.total_currency || 'AUD'
    };
    
    console.log('🚀 CREATING CHECKOUT SESSION:');
    console.log('═══════════════════════════════════════════');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');
    console.log('PRICE BREAKDOWN:');
    console.log('Base:', basePrice);
    console.log('Services:', servicesCost, `(${services.length} items)`);
    console.log('TOTAL:', grandTotal);
    console.log('═══════════════════════════════════════════');
    
    try {
      const response = await fetch(
        'https://jxrrhsqffnzeljszbecg.supabase.co/functions/v1/create-checkout-session',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4cnJoc3FmZm56ZWxqc3piZWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzIxMjgsImV4cCI6MjA3MDkwODEyOH0.R-9Y5b_M7rpKS9zT9hqcdAdDI7m9GICYRDZkIteS9jg'
          },
          body: JSON.stringify(payload)
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create session');
      }
      
      const data = await response.json();
      
      console.log('✅ SESSION CREATED:');
      console.log('Session ID:', data.sessionId);
      console.log('Redirecting to Stripe...');
      
      // Redirect to Stripe
      window.location.href = data.url;
      
    } catch (error: any) {
      console.error('❌ CHECKOUT ERROR:', error);
      alert(`Checkout failed: ${error.message}`);
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12">
          <div className="text-6xl mb-4 animate-bounce">💳</div>
          <div className="text-2xl font-semibold mb-2">Loading checkout...</div>
          <div className="text-gray-600">Preparing your booking</div>
        </div>
      </div>
    );
  }

  if (!outbound || passengers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2">Incomplete Booking</h3>
          <p className="text-gray-600 mb-4">Please complete all booking steps first.</p>
          <Button onClick={() => window.location.href = '/flights'}>← Back to Flights</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Button 
            onClick={() => window.location.href = '/passenger-details'} 
            variant="outline"
            className="mb-4"
          >
            ← Back to Passenger Details
          </Button>
          <h1 className="text-3xl font-bold mb-2">Review & Pay</h1>
          <p className="text-gray-600">Review your booking details and complete payment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Booking Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Flight Details */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span>✈️</span> Flight Details
              </h2>

              {/* Outbound Flight */}
              {outbound && (
                <div className="mb-6 pb-6 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                        Outbound Flight
                      </div>
                      <div className="font-semibold text-xl mb-2">
                        {outbound.airline}
                      </div>
                      <div className="text-lg text-gray-700 mb-2">
                        {outbound.origin} → {outbound.destination}
                      </div>
                      {outbound.departure_datetime && (
                        <div className="text-sm text-gray-600">
                          {new Date(outbound.departure_datetime).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                          {' • '}
                          {new Date(outbound.departure_datetime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${outbound.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {outbound.currency}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Return Flight */}
              {returnFlight && (
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                        Return Flight
                      </div>
                      <div className="font-semibold text-xl mb-2">
                        {returnFlight.airline}
                      </div>
                      <div className="text-lg text-gray-700 mb-2">
                        {returnFlight.origin} → {returnFlight.destination}
                      </div>
                      {returnFlight.departure_datetime && (
                        <div className="text-sm text-gray-600">
                          {new Date(returnFlight.departure_datetime).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                          {' • '}
                          {new Date(returnFlight.departure_datetime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${returnFlight.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {returnFlight.currency}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Passenger Details */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span>👥</span> Passengers ({passengers.length})
              </h2>
              
              <div className="space-y-4">
                {passengers.map((passenger, index) => (
                  <div key={passenger.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold">
                        Passenger {index + 1}
                      </div>
                      <div className="text-sm text-gray-700">
                        {passenger.title}. {passenger.given_name} {passenger.family_name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {passenger.type.charAt(0).toUpperCase() + passenger.type.slice(1)} • Born: {passenger.born_on}
                      </div>
                      {index === 0 && (
                        <div className="text-xs text-gray-600 mt-1">
                          📧 {passenger.email} • 📱 {passenger.phone_number}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Seats & Baggage */}
            {services.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span>🎒</span> Additional Services
                </h2>

                {seats.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-3">Seat Selections ({seats.length})</h3>
                    <div className="space-y-2">
                      {seats.map((seat, index) => (
                        <div key={`${seat.id}-${index}`} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded">
                          <div>
                            <span className="text-gray-700">🪑 Seat service</span>
                            <div className="text-xs text-gray-500">ID: {seat.id}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${(parseFloat(seat.amount || seat.total_amount || 0)).toFixed(2)}</div>
                            <div className="text-xs text-gray-500">Qty: {seat.quantity || 1}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {baggage.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Baggage ({baggage.length})</h3>
                    <div className="space-y-2">
                     {baggage.map((bag, index) => (
                       <div key={`${bag.id}-${index}`} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded">
                         <div>
                           <span className="text-gray-700">🧳 Extra checked bag</span>
                           <div className="text-xs text-gray-500">ID: {bag.id}</div>
                         </div>
                         <div className="text-right">
                           <div className="font-semibold">${(parseFloat(bag.amount || bag.total_amount || 0)).toFixed(2)}</div>
                           <div className="text-xs text-gray-500">Qty: {bag.quantity || 1}</div>
                         </div>
                       </div>
                     ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar - Price Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card className="p-6 bg-gradient-to-br from-gray-50 to-white shadow-lg">
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                  <span>💰</span> Price Summary
                </h3>

                <div className="space-y-4 mb-6">
                  {/* Flights */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Flights</span>
                    <span className="font-semibold text-lg">
                      ${basePrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Seats */}
                  {seats.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Seats ({seats.length})</span>
                      <span className="font-semibold text-green-600">
                        +${seatsTotal.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Baggage */}
                  {baggage.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Baggage ({baggage.length})</span>
                      <span className="font-semibold text-green-600">
                        +${baggageTotal.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t-2 border-gray-300 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xl font-bold">TOTAL</span>
                      <span className="text-3xl font-bold text-green-600">
                        ${grandTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      {outbound?.total_currency || 'AUD'}
                    </div>
                  </div>
                </div>

                {/* Payment Button */}
                <Button
                  size="lg"
                  className="w-full py-6 text-lg bg-green-600 hover:bg-green-700 font-bold"
                  onClick={handleProceedToPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Secure Payment →
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500 mt-4">
                  🔒 Secure payment powered by Stripe
                </p>
                <p className="text-xs text-center text-gray-400 mt-2">
                  Test card: 4242 4242 4242 4242
                </p>

                {/* Booking Details */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold text-sm mb-3">Booking Details</h4>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Passengers:</span>
                      <span className="font-semibold">{passengers.length}</span>
                    </div>
                    {seats.length > 0 && (
                      <div className="flex justify-between">
                        <span>Seats:</span>
                        <span className="font-semibold">{seats.length}</span>
                      </div>
                    )}
                    {baggage.length > 0 && (
                      <div className="flex justify-between">
                        <span>Baggage:</span>
                        <span className="font-semibold">{baggage.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

