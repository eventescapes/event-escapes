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
    const item = sessionStorage.getItem("checkout_item");
    const passengers = sessionStorage.getItem("passenger_data");

    if (!item || !passengers) {
      navigate("/");
      return;
    }

    try {
      setCheckoutItem(JSON.parse(item));
      setPassengerData(JSON.parse(passengers));
    } catch (err) {
      console.error("Error loading booking data:", err);
      navigate("/");
    }
  }, [navigate]);

  if (!checkoutItem || !passengerData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />
      </div>
    );
  }

  // Duffel offer data
  const offer = checkoutItem.offer;
  const airline = offer?.owner?.name || "Unknown Airline";
  const currency = (offer?.total_currency || "AUD").toUpperCase();
  const flightPrice = parseFloat(offer?.total_amount || "0");

  // Ancillary calculation
  const servicesWithDetails = checkoutItem.servicesWithDetails || [];

  const seatsTotal = servicesWithDetails
    .filter((s: any) => s.type === "seat")
    .reduce((sum, s) => sum + parseFloat(s.amount || "0"), 0);

  const baggageTotal = servicesWithDetails
    .filter((s: any) => s.type === "baggage")
    .reduce(
      (sum, s) => sum + parseFloat(s.amount || "0") * (s.quantity || 1),
      0,
    );

  const servicesTotal = seatsTotal + baggageTotal;
  const grandTotal = flightPrice + servicesTotal;

  const origin = offer?.slices?.[0]?.origin?.iata_code || "N/A";
  const destination =
    offer?.slices?.[offer.slices.length - 1]?.destination?.iata_code || "N/A";

  const handlePayNow = async () => {
    setSubmitting(true);

    try {
      const requestBody = {
        offerId: checkoutItem.offer.id,
        passengers: passengerData,
        services: checkoutItem.services || [],
        servicesWithDetails,
        flightPrice: flightPrice.toFixed(2),
        seatsTotal: seatsTotal.toFixed(2),
        baggageTotal: baggageTotal.toFixed(2),
        totalAmount: grandTotal.toFixed(2),
        currency: currency,
        offerData: checkoutItem.offer,
      };
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify(requestBody),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create checkout session');
      }

      window.location.href = result.url;

    } catch (error: any) {
      alert(`Payment initialization failed: ${error.message}`);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate("/passenger-details")}
          className="flex items-center text-blue-200 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Passenger Details
        </button>

        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Review Your Booking
        </h1>
        <p className="text-blue-200 text-center mb-8">
          Please review your booking before proceeding to payment
        </p>

        {/* Flight */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Plane className="h-6 w-6 text-blue-300" />
            <h2 className="text-xl font-semibold text-white">Flight Details</h2>
          </div>
          <div className="space-y-2 text-blue-100">
            <div className="flex justify-between">
              <span className="opacity-80">Airline:</span>
              <span className="font-medium">{airline}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">Route:</span>
              <span className="font-medium">
                {origin} → {destination}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">Passengers:</span>
              <span className="font-medium">{passengerData.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">Flight Price:</span>
              <span className="font-medium">
                {currency} ${flightPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </Card>

        {/* Extras */}
        {servicesTotal > 0 && (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Luggage className="h-6 w-6 text-blue-300" />
              <h2 className="text-xl font-semibold text-white">
                Extras Summary
              </h2>
            </div>
            <div className="space-y-2 text-blue-100">
              {seatsTotal > 0 && (
                <div className="flex justify-between">
                  <span>Seat Selection</span>
                  <span>
                    {currency} ${seatsTotal.toFixed(2)}
                  </span>
                </div>
              )}
              {baggageTotal > 0 && (
                <div className="flex justify-between">
                  <span>Baggage</span>
                  <span>
                    {currency} ${baggageTotal.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-white font-semibold pt-2 border-t border-white/20">
                <span>Extras Total:</span>
                <span>
                  {currency} ${servicesTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Grand total */}
        <Card className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-white/30 backdrop-blur-lg p-6 mb-6">
          <div className="flex justify-between text-white font-bold text-2xl">
            <span>Grand Total:</span>
            <span>
              {currency} ${grandTotal.toFixed(2)}
            </span>
          </div>
        </Card>

        {/* Pay now */}
        <Button
          onClick={handlePayNow}
          disabled={submitting}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 text-lg"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" /> Pay {currency} $
              {grandTotal.toFixed(2)} Now
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
