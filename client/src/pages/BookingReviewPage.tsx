import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plane, Armchair, Luggage, CreditCard, ArrowLeft, Loader2 } from 'lucide-react';

export function BookingReviewPage() {
  const [, navigate] = useLocation();
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [passengerData, setPassengerData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const item = sessionStorage.getItem('checkout_item');
    const passengers = sessionStorage.getItem('passenger_data');
    
    if (!item || !passengers) {
      navigate('/');
      return;
    }

    try {
      setCheckoutItem(JSON.parse(item));
      setPassengerData(JSON.parse(passengers));
    } catch (err) {
      console.error('Error loading booking data:', err);
      navigate('/');
    }
  }, [navigate]);

  if (!checkoutItem || !passengerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />
      </div>
    );
  }

  const flightPrice = parseFloat(checkoutItem.offer?.total_amount || '0');
  const currency = (checkoutItem.offer?.total_currency || 'AUD').toUpperCase();
  
  // Calculate services total
  const seatsTotal = (checkoutItem.selectedSeats || []).reduce((sum: number, seat: any) => 
    sum + parseFloat(seat.amount || '0'), 0
  );
  
  const baggageTotal = (checkoutItem.selectedBaggage || []).reduce((sum: number, bag: any) => 
    sum + (parseFloat(bag.amount || '0') * (bag.quantity || 1)), 0
  );
  
  const servicesTotal = seatsTotal + baggageTotal;
  const grandTotal = flightPrice + servicesTotal;

  const handlePayNow = async () => {
    setSubmitting(true);

    try {
      console.log('💳 Creating Stripe checkout with grand total:', grandTotal);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            offerId: checkoutItem.offer.id,
            passengers: passengerData,
            services: checkoutItem.services || [],
            totalAmount: grandTotal.toFixed(2),  // Grand total including services
            currency: currency,
            offerData: checkoutItem.offer,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create checkout session');
      }

      console.log('✅ Checkout session created');
      console.log('🚀 Redirecting to Stripe with total:', grandTotal);
      window.location.href = result.url;

    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      alert(`Payment initialization failed: ${error.message}`);
      setSubmitting(false);
    }
  };

  const origin = checkoutItem.offer?.slices?.[0]?.origin?.iata_code || 'N/A';
  const destination = checkoutItem.offer?.slices?.[checkoutItem.offer.slices.length - 1]?.destination?.iata_code || 'N/A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/passenger-details')}
          className="flex items-center text-blue-200 hover:text-white mb-6 transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Passenger Details
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-page-title">
            Review Your Booking
          </h1>
          <p className="text-blue-200">
            Please review your booking details before payment
          </p>
        </div>

        <div className="space-y-6">
          {/* Flight Details Card */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Plane className="h-6 w-6 text-blue-300" />
              <h2 className="text-xl font-semibold text-white">Flight Details</h2>
            </div>
            <div className="space-y-2 text-blue-100">
              <div className="flex justify-between">
                <span className="opacity-80">Route:</span>
                <span className="font-medium">{origin} → {destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-80">Passengers:</span>
                <span className="font-medium">{checkoutItem.offer?.passengers?.length || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-80">Flight Price:</span>
                <span className="font-medium text-lg">{currency} ${flightPrice.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Selected Seats Card */}
          {checkoutItem.selectedSeats && checkoutItem.selectedSeats.length > 0 && (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Armchair className="h-6 w-6 text-blue-300" />
                <h2 className="text-xl font-semibold text-white">Selected Seats</h2>
              </div>
              <div className="space-y-3">
                {checkoutItem.selectedSeats.map((seat: any, index: number) => (
                  <div key={index} className="flex justify-between text-blue-100">
                    <span>Seat {seat.designator}</span>
                    <span className="font-medium">{currency} ${parseFloat(seat.amount || '0').toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-white font-semibold pt-2 border-t border-white/20">
                  <span>Seats Subtotal:</span>
                  <span>{currency} ${seatsTotal.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Selected Baggage Card */}
          {checkoutItem.selectedBaggage && checkoutItem.selectedBaggage.length > 0 && (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Luggage className="h-6 w-6 text-blue-300" />
                <h2 className="text-xl font-semibold text-white">Selected Baggage</h2>
              </div>
              <div className="space-y-3">
                {checkoutItem.selectedBaggage.map((bag: any, index: number) => (
                  <div key={index} className="flex justify-between text-blue-100">
                    <span>Checked Bag × {bag.quantity || 1}</span>
                    <span className="font-medium">
                      {currency} ${(parseFloat(bag.amount || '0') * (bag.quantity || 1)).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-white font-semibold pt-2 border-t border-white/20">
                  <span>Baggage Subtotal:</span>
                  <span>{currency} ${baggageTotal.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Grand Total Card */}
          <Card className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 backdrop-blur-lg border-white/30 p-6">
            <div className="space-y-3">
              <div className="flex justify-between text-blue-100 text-lg">
                <span>Flight:</span>
                <span>{currency} ${flightPrice.toFixed(2)}</span>
              </div>
              {servicesTotal > 0 && (
                <div className="flex justify-between text-blue-100 text-lg">
                  <span>Extras (Seats & Baggage):</span>
                  <span>{currency} ${servicesTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="h-px bg-white/30 my-3"></div>
              <div className="flex justify-between text-white font-bold text-2xl">
                <span>Grand Total:</span>
                <span data-testid="text-grand-total">{currency} ${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Pay Now Button */}
          <Button
            onClick={handlePayNow}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 text-lg"
            data-testid="button-pay-now"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Pay {currency} ${grandTotal.toFixed(2)} Now
              </>
            )}
          </Button>

          <p className="text-center text-blue-200 text-sm">
            You will be redirected to Stripe for secure payment
          </p>
        </div>
      </div>
    </div>
  );
}
