import { useMemo, useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useCart } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Plane, Luggage, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { SeatSelectionModal } from "@/components/SeatSelectionModal";
import { BaggageSelectionModal } from "@/components/ui/BaggageSelectionModal";

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

  // 🔹 NEW: store available services fetched from Supabase
  const [availableServices, setAvailableServices] = useState<any>(null);
  const [loadingServices, setLoadingServices] = useState(true);

  // -----------------------------------------------
  // STEP 1: fetch passengers from Supabase function
  // -----------------------------------------------
  useEffect(() => {
    const fetchPassengerIds = async () => {
      if (!offerId) return;
      try {
        console.log("🎫 Fetching passenger IDs for offer:", offerId);
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
        console.log("✅ Passenger IDs fetched:", data.passengers);
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
  // STEP 2: fetch available services (seats & baggage)
  // ----------------------------------------------------
  useEffect(() => {
    const fetchAvailableServices = async () => {
      if (!offerId) return;
      try {
        console.log("🧾 Fetching available services for offer:", offerId);
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
        console.log("✅ Available services:", data.availableServices);
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
  // UI loading states
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
    console.log("💺 Seats selected:", seats);
    setSelectedSeats(seats);
    setShowSeatModal(false);
    if (wantBags) setShowBaggageModal(true);
    else proceedToCheckout();
  };

  const handleBaggageComplete = (baggage: any[]) => {
    console.log("🧳 Baggage selected:", baggage);
    setSelectedBaggage(baggage);
    setShowBaggageModal(false);
    proceedToCheckout();
  };

  const proceedToCheckout = () => {
    const servicesWithDetails = [
      ...selectedSeats.map((s) => ({
        id: s.serviceId || s.id,
        type: "seat",
        quantity: 1,
        amount: s.amount,
        currency: cartItem.offer?.total_currency || "AUD",
        designator: s.designator,
        passengerId: s.passengerId || s.passenger_id,
        segmentId: s.segmentId,
        segmentIndex: s.segmentIndex,
      })),
      ...selectedBaggage.map((b) => ({
        id: b.serviceId || b.id,
        type: "baggage",
        quantity: b.quantity || 1,
        amount: b.amount,
        currency: cartItem.offer?.total_currency || "AUD",
        passengerId: b.passengerId || b.passenger_id,
        segmentId: b.segmentId,
      })),
    ];

    console.log("💺🎒 Services with details for cart:", servicesWithDetails);
    setServicesForOffer(offerId, servicesWithDetails);

    const servicesForBooking = [
      ...selectedSeats.map((s) => ({ id: s.serviceId || s.id, quantity: 1 })),
      ...selectedBaggage.map((b) => ({
        id: b.serviceId || b.id,
        quantity: b.quantity || 1,
      })),
    ];

    const checkoutData = {
      offer: cartItem.offer,
      selectedSeats,
      selectedBaggage,
      servicesWithDetails,
      services: servicesForBooking,
      passengers,
    };

    sessionStorage.setItem("checkout_item", JSON.stringify(checkoutData));
    navigate("/passenger-details");
  };

  const handleSkip = () => {
    const checkoutData = {
      offer: cartItem.offer,
      selectedSeats: [],
      selectedBaggage: [],
    };
    sessionStorage.setItem("checkout_item", JSON.stringify(checkoutData));
    navigate("/passenger-details");
  };

  // ----------------------------------------------------
  // RENDER
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/flight-results")}
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

        {/* Seat and Baggage Options */}
        <div className="space-y-4 mb-8">
          {/* Seats */}
          <div
            className={`bg-white/10 backdrop-blur-lg rounded-xl border-2 transition-all ${
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
            className={`bg-white/10 backdrop-blur-lg rounded-xl border-2 transition-all ${
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

        <div className="flex gap-4">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/30"
          >
            Skip for now
          </Button>
          <Button
            onClick={onContinue}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <p className="text-center text-blue-200 text-sm mt-6">
          You can always add these later, but availability may change
        </p>
      </div>

      {/* Pass available services into modals */}
      {showSeatModal && (
        <SeatSelectionModal
          offerId={offerId}
          passengers={passengers}
          availableServices={availableServices?.seat || []}
          onSeatsSelected={handleSeatsSelected}
          onClose={() => {
            setShowSeatModal(false);
            if (wantBags) setShowBaggageModal(true);
            else proceedToCheckout();
          }}
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
          onClose={() => {
            setShowBaggageModal(false);
            proceedToCheckout();
          }}
          onComplete={handleBaggageComplete}
        />
      )}
    </div>
  );
}
