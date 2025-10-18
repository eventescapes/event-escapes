import { useMemo, useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useCart } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Plane, Luggage, ArrowRight, Loader2 } from "lucide-react";
import { SeatSelectionModal } from "@/components/SeatSelectionModal";
import { BaggageSelectionModal } from "@/components/ui/BaggageSelectionModal";
import { ItineraryBar } from "@/components/ItineraryBar";
import { Countdown } from "@/components/Countdown";
import { apiRequest } from "@/lib/queryClient";

export default function AncillaryChoicePage() {
  const [, params] = useRoute("/ancillaries/:offerId");
  const [, navigate] = useLocation();
  const offerId = params?.offerId || "";
  const { items, setServicesForOffer } = useCart();
  const cartItem = useMemo(() => items.find(i => i.offerId === offerId), [items, offerId]);
  
  // Cart session support
  const [cartSessionOffer, setCartSessionOffer] = useState<any>(null);
  const [cartSessionExpiry, setCartSessionExpiry] = useState<string | null>(null);
  const [loadingCartSession, setLoadingCartSession] = useState(false);

  const [wantSeats, setWantSeats] = useState(false);
  const [wantBags, setWantBags] = useState(false);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [showBaggageModal, setShowBaggageModal] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
  const [selectedBaggage, setSelectedBaggage] = useState<any[]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [loadingPassengers, setLoadingPassengers] = useState(true);

  // Load from cart session if sid param is present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sid');
    
    if (sessionId) {
      setLoadingCartSession(true);
      apiRequest(`/api/cart/${sessionId}`)
        .then((data: any) => {
          console.log('📦 Loaded offer from cart session:', data.cart);
          if (data.cart) {
            setCartSessionOffer(data.cart.offerJson);
            setCartSessionExpiry(data.cart.expiresAt);
          }
        })
        .catch((error) => {
          console.error('❌ Failed to load cart session:', error);
        })
        .finally(() => {
          setLoadingCartSession(false);
        });
    }
  }, []);

  // Fetch real passenger IDs from Duffel via get-offer-lite
  useEffect(() => {
    const fetchPassengerIds = async () => {
      if (!offerId) return;
      
      try {
        console.log('🎫 Fetching passenger IDs for offer:', offerId);
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-offer-lite`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ offerId })
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch passenger IDs');
        }

        const data = await response.json();
        console.log('✅ Passenger IDs fetched:', data.passengers);
        setPassengers(data.passengers || []);
      } catch (error) {
        console.error('❌ Error fetching passenger IDs:', error);
        // Fallback to synthetic passengers if fetch fails
        const fallbackPassengers = Array.from(
          { length: cartItem?.searchParams?.passengers || 1 },
          (_, i) => ({ id: `passenger_${i + 1}`, type: 'adult' })
        );
        setPassengers(fallbackPassengers);
      } finally {
        setLoadingPassengers(false);
      }
    };

    fetchPassengerIds();
  }, [offerId, cartItem]);

  // Use cart session offer if available, otherwise fall back to cartItem
  const displayOffer = cartSessionOffer || cartItem?.offer;

  if (!cartItem && !cartSessionOffer) {
    navigate("/flights");
    return null;
  }

  if (loadingPassengers || loadingCartSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-blue-200">Loading flight information...</p>
        </div>
      </div>
    );
  }

  const onContinue = () => {
    if (wantSeats) {
      setShowSeatModal(true);
      return;
    }
    if (wantBags) {
      setShowBaggageModal(true);
      return;
    }
    
    // Go directly to passenger details since we're skipping extras
    proceedToCheckout();
  };

  const handleSeatsSelected = (seats: any[]) => {
    console.log('💺 Seats selected:', seats);
    setSelectedSeats(seats);
    setShowSeatModal(false);
    
    // After seats, check if user wants bags
    if (wantBags) {
      setShowBaggageModal(true);
    } else {
      proceedToCheckout();
    }
  };

  const handleBaggageComplete = (baggage: any[]) => {
    console.log('🧳 Baggage selected:', baggage);
    setSelectedBaggage(baggage);
    setShowBaggageModal(false);
    proceedToCheckout();
  };

  const proceedToCheckout = () => {
    // Format services in Duffel API format: { id, type, quantity, passenger_id }
    const services = [
      ...selectedSeats.map((s: any) => ({ 
        id: s.serviceId || s.id, 
        type: 'seat',
        quantity: 1,
        passenger_id: s.passengerId || s.passenger_id
      })),
      ...selectedBaggage.map((b: any) => ({ 
        id: b.serviceId || b.id, 
        type: 'baggage',
        quantity: b.quantity || 1,
        passenger_id: b.passengerId || b.passenger_id
      })),
    ];
    
    console.log('💺🎒 Formatted services for checkout:', services);
    setServicesForOffer(offerId, services);
    
    // Use cart session offer if available
    const offerToSave = displayOffer || cartItem.offer;
    
    // Save to sessionStorage for checkout
    const checkoutData = {
      offer: offerToSave,
      selectedSeats,
      selectedBaggage,
      services, // Include formatted services
      passengers, // Include real passenger IDs
    };
    sessionStorage.setItem('checkout_item', JSON.stringify(checkoutData));
    
    // Pass session ID if available
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sid');
    if (sessionId) {
      navigate(`/passenger-details?sid=${sessionId}`);
    } else {
      navigate("/passenger-details");
    }
  };

  const handleSkip = () => {
    // Use cart session offer if available
    const offerToSave = displayOffer || cartItem.offer;
    
    // Skip directly to passenger details
    const checkoutData = {
      offer: offerToSave,
      selectedSeats: [],
      selectedBaggage: [],
    };
    sessionStorage.setItem('checkout_item', JSON.stringify(checkoutData));
    
    // Pass session ID if available
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sid');
    if (sessionId) {
      navigate(`/passenger-details?sid=${sessionId}`);
    } else {
      navigate("/passenger-details");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-page-title">
            Add extras to your flight?
          </h1>
          <p className="text-blue-200">
            Customize your travel experience with seats and baggage
          </p>
        </div>

        {/* Countdown Timer (if from cart session) */}
        {cartSessionExpiry && (
          <div className="mb-6">
            <Countdown expiresAt={cartSessionExpiry} />
          </div>
        )}

        {/* Itinerary Bar (if offer is available) */}
        {displayOffer && (
          <div className="mb-6">
            <ItineraryBar offer={displayOffer} />
          </div>
        )}

        {/* Flight Summary */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Plane className="h-6 w-6 text-blue-300" />
            <h2 className="text-xl font-semibold text-white">Your Flight</h2>
          </div>
          {displayOffer && (
            <div className="space-y-2 text-blue-100">
              <div className="flex justify-between">
                <span className="opacity-80">Route:</span>
                <span className="font-medium">
                  {displayOffer.slices?.[0]?.origin?.iata_code || 'N/A'} → {displayOffer.slices?.[0]?.destination?.iata_code || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-80">Price:</span>
                <span className="font-medium">
                  {displayOffer.total_currency?.toUpperCase()} ${parseFloat(displayOffer.total_amount || '0').toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-80">Passengers:</span>
                <span className="font-medium">{passengers.length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Choice Cards */}
        <div className="space-y-4 mb-8">
          {/* Seats */}
          <div 
            className={`bg-white/10 backdrop-blur-lg rounded-xl border-2 transition-all ${
              wantSeats ? 'border-blue-400 bg-blue-500/20' : 'border-white/20'
            } p-6`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${wantSeats ? 'bg-blue-500' : 'bg-white/10'}`}>
                  <Plane className={`h-6 w-6 ${wantSeats ? 'text-white' : 'text-blue-300'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white" data-testid="text-seats-title">
                    Select Seats
                  </h3>
                  <p className="text-sm text-blue-200">
                    Choose your preferred seats
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setWantSeats(true)}
                variant={wantSeats ? "default" : "outline"}
                className={`flex-1 ${wantSeats ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white border-white/30'}`}
                data-testid="button-seats-yes"
              >
                Yes, select seats
              </Button>
              <Button
                onClick={() => setWantSeats(false)}
                variant={!wantSeats ? "default" : "outline"}
                className={`flex-1 ${!wantSeats ? 'bg-white/20 text-white' : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/20'}`}
                data-testid="button-seats-no"
              >
                No thanks
              </Button>
            </div>
          </div>

          {/* Baggage */}
          <div 
            className={`bg-white/10 backdrop-blur-lg rounded-xl border-2 transition-all ${
              wantBags ? 'border-blue-400 bg-blue-500/20' : 'border-white/20'
            } p-6`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${wantBags ? 'bg-blue-500' : 'bg-white/10'}`}>
                  <Luggage className={`h-6 w-6 ${wantBags ? 'text-white' : 'text-blue-300'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white" data-testid="text-baggage-title">
                    Add Baggage
                  </h3>
                  <p className="text-sm text-blue-200">
                    Add checked or extra bags
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setWantBags(true)}
                variant={wantBags ? "default" : "outline"}
                className={`flex-1 ${wantBags ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white border-white/30'}`}
                data-testid="button-baggage-yes"
              >
                Yes, add bags
              </Button>
              <Button
                onClick={() => setWantBags(false)}
                variant={!wantBags ? "default" : "outline"}
                className={`flex-1 ${!wantBags ? 'bg-white/20 text-white' : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/20'}`}
                data-testid="button-baggage-no"
              >
                No thanks
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/30"
            data-testid="button-skip"
          >
            Skip for now
          </Button>
          <Button
            onClick={onContinue}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold"
            data-testid="button-continue"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Info */}
        <p className="text-center text-blue-200 text-sm mt-6">
          You can always add these later, but availability may change
        </p>
      </div>

      {/* Seat Selection Modal */}
      {showSeatModal && (
        <SeatSelectionModal
          offerId={offerId}
          passengers={passengers}
          onSeatsSelected={handleSeatsSelected}
          onClose={() => {
            setShowSeatModal(false);
            if (wantBags) {
              setShowBaggageModal(true);
            } else {
              proceedToCheckout();
            }
          }}
          onSkip={() => {
            setShowSeatModal(false);
            if (wantBags) {
              setShowBaggageModal(true);
            } else {
              proceedToCheckout();
            }
          }}
        />
      )}

      {/* Baggage Selection Modal */}
      {showBaggageModal && (
        <BaggageSelectionModal
          isOpen={showBaggageModal}
          onClose={() => {
            setShowBaggageModal(false);
            proceedToCheckout();
          }}
          offerId={offerId}
          passengers={passengers}
          onComplete={handleBaggageComplete}
        />
      )}
    </div>
  );
}
