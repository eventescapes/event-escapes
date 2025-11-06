import { useMemo, useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useCart } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Plane, Luggage, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { SeatSelectionModal } from "@/components/SeatSelectionModal";
import { BaggageSelectionModal } from "@/components/ui/BaggageSelectionModal";

// âœ… Import API function
import { saveAncillaries } from "../lib/supabase";

export default function AncillaryChoicePage() {
  const [, params] = useRoute("/ancillaries/:offerId");
  const [, navigate] = useLocation();
  const offerId = params?.offerId || "";
  const { items, setServicesForOffer } = useCart();

  const cartItem = useMemo(
    () => items.find((i) => i.offerId === offerId),
    [items, offerId],
  );

  const [wantSeats, setWantSeats] = useState(false);
  const [wantBags, setWantBags] = useState(false);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [showBaggageModal, setShowBaggageModal] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
  const [selectedBaggage, setSelectedBaggage] = useState<any[]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [loadingPassengers, setLoadingPassengers] = useState(true);
  const [availableServices, setAvailableServices] = useState<any>(null);
  const [loadingServices, setLoadingServices] = useState(true);
  const [saving, setSaving] = useState(false);

  // ----------------------------------------------------
  // STEP 1: fetch passengers
  // ----------------------------------------------------
  useEffect(() => {
    const fetchPassengerIds = async () => {
      if (!offerId) return;
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-offer-lite`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ offerId }),
          },
        );

        if (!response.ok) throw new Error("Failed to fetch passenger IDs");
        const data = await response.json();
        setPassengers(data.passengers || []);
      } catch (error) {
        console.error("❌ Error fetching passenger IDs:", error);
        const fallback = Array.from(
          { length: cartItem?.searchParams?.passengers || 1 },
          (_, i) => ({ id: `passenger_${i + 1}`, type: "adult" }),
        );
        setPassengers(fallback);
      } finally {
        setLoadingPassengers(false);
      }
    };
    fetchPassengerIds();
  }, [offerId, cartItem]);

  // ----------------------------------------------------
  // STEP 2: fetch available services (Duffel seats/bags)
  // ----------------------------------------------------
  useEffect(() => {
    const fetchAvailableServices = async () => {
      if (!offerId) return;
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/available-services`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ offer_id: offerId }),
          },
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        setAvailableServices(data.availableServices || {});
      } catch (err) {
        console.error("❌ Failed to fetch available services:", err);
        setAvailableServices({});
      } finally {
        setLoadingServices(false);
      }
    };
    fetchAvailableServices();
  }, [offerId]);

  // ----------------------------------------------------
  // MAIN EVENT HANDLERS
  // ----------------------------------------------------
  const onContinue = () => {
    if (wantSeats) {
      setShowSeatModal(true);
      return;
    }
    if (wantBags) {
      setShowBaggageModal(true);
      return;
    }
    proceedToCheckout();
  };

  const handleSeatsSelected = (seats: any[]) => {
    setSelectedSeats(seats);
    setShowSeatModal(false);
    if (wantBags) setShowBaggageModal(true);
    else proceedToCheckout();
  };

  const handleBaggageComplete = (baggage: any[]) => {
    setSelectedBaggage(baggage);
    setShowBaggageModal(false);
    proceedToCheckout();
  };

  // âœ… Backend persistence + navigate to NEW checkout
  const proceedToCheckout = async () => {
    try {
      setSaving(true);

      const totalAmount =
        selectedSeats.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0) +
        selectedBaggage.reduce(
          (sum, b) => sum + (parseFloat(b.amount) || 0),
          0,
        );

      // âœ… Call API layer to save ancillaries
      const res = await saveAncillaries({
        offerId,
        passengers,
        seats: selectedSeats,
        baggage: selectedBaggage,
        totalAmount,
        currency: cartItem.offer?.total_currency || "AUD",
      });

      console.log("✅ Ancillaries saved to Supabase:", res);

      // Store services locally in cart for UI reference
      const servicesWithDetails = [
        ...selectedSeats.map((s) => ({
          id: s.serviceId || s.id,
          type: "seat",
          amount: s.amount,
          currency: cartItem.offer?.total_currency || "AUD",
        })),
        ...selectedBaggage.map((b) => ({
          id: b.serviceId || b.id,
          type: "baggage",
          amount: b.amount,
          currency: cartItem.offer?.total_currency || "AUD",
        })),
      ];

      setServicesForOffer(offerId, servicesWithDetails);

      // âœ… Navigate to NEW checkout (not old passenger-details)
      navigate(`/checkout/${offerId}`);
    } catch (err) {
      console.error("❌ Failed to save ancillaries:", err);
      alert("Could not save your selections. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // âœ… Updated skip handler - goes to NEW checkout
  const handleSkip = () => navigate(`/checkout/${offerId}`);

  // ----------------------------------------------------
  // UI STATES
  // ----------------------------------------------------
  if (!cartItem) {
    navigate("/flights");
    return null;
  }

  if (loadingPassengers || loadingServices) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-blue-200">Loading flight extras...</p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/flights")}
          className="flex items-center text-blue-200 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Flight Selection
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Add extras to your flight?
          </h1>
          <p className="text-blue-200">
            Customize your travel experience with seats and baggage
          </p>
        </div>

        {/* Flight summary */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Plane className="h-6 w-6 text-blue-300" />
            <h2 className="text-xl font-semibold text-white">Your Flight</h2>
          </div>
          <div className="space-y-2 text-blue-100">
            <div className="flex justify-between">
              <span className="opacity-80">Route:</span>
              <span className="font-medium">
                {cartItem.offer.slices?.[0]?.origin?.iata_code || "N/A"} →{" "}
                {cartItem.offer.slices?.[0]?.destination?.iata_code || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">Price:</span>
              <span className="font-medium">
                {cartItem.offer.total_currency?.toUpperCase()} $
                {parseFloat(cartItem.offer.total_amount || "0").toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">Passengers:</span>
              <span className="font-medium">{passengers.length}</span>
            </div>
          </div>
        </div>

        {/* Seats + Baggage cards */}
        <div className="space-y-4 mb-8">
          {/* Seats */}
          <div
            className={`bg-white/10 rounded-xl border-2 transition-all ${
              wantSeats ? "border-blue-400 bg-blue-500/20" : "border-white/20"
            } p-6`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-lg ${wantSeats ? "bg-blue-500" : "bg-white/10"}`}
                >
                  <Plane
                    className={`h-6 w-6 ${wantSeats ? "text-white" : "text-blue-300"}`}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
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
                className={`flex-1 ${wantSeats ? "bg-blue-500 text-white" : "bg-white/10 text-white"}`}
              >
                Yes, select seats
              </Button>
              <Button
                onClick={() => setWantSeats(false)}
                className={`flex-1 ${!wantSeats ? "bg-white/20 text-white" : "bg-white/5 text-white/70"}`}
              >
                No thanks
              </Button>
            </div>
          </div>

          {/* Baggage */}
          <div
            className={`bg-white/10 rounded-xl border-2 transition-all ${
              wantBags ? "border-blue-400 bg-blue-500/20" : "border-white/20"
            } p-6`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-lg ${wantBags ? "bg-blue-500" : "bg-white/10"}`}
                >
                  <Luggage
                    className={`h-6 w-6 ${wantBags ? "text-white" : "text-blue-300"}`}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
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
                className={`flex-1 ${wantBags ? "bg-blue-500 text-white" : "bg-white/10 text-white"}`}
              >
                Yes, add bags
              </Button>
              <Button
                onClick={() => setWantBags(false)}
                className={`flex-1 ${!wantBags ? "bg-white/20 text-white" : "bg-white/5 text-white/70"}`}
              >
                No thanks
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/30"
          >
            Skip for now
          </Button>
          <Button
            disabled={saving}
            onClick={onContinue}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold"
          >
            {saving ? "Saving..." : "Continue"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <p className="text-center text-blue-200 text-sm mt-6">
          You can always add these later, but availability may change
        </p>
      </div>

      {/* Modals */}
      {showSeatModal && (
        <SeatSelectionModal
          offerId={offerId}
          passengers={passengers}
          availableServices={availableServices?.seat || []}
          onSeatsSelected={handleSeatsSelected}
          onClose={() => setShowSeatModal(false)}
          onSkip={() => {
            setShowSeatModal(false);
            if (wantBags) setShowBaggageModal(true);
            else proceedToCheckout();
          }}
        />
      )}

      {showBaggageModal && (
        <BaggageSelectionModal
          isOpen={showBaggageModal}
          offerId={offerId}
          passengers={passengers}
          availableServices={availableServices?.baggage || []}
          onClose={() => setShowBaggageModal(false)}
          onComplete={handleBaggageComplete}
        />
      )}
    </div>
  );
}
