// src/components/ui/BaggageSelectionModal.tsx
import { useState, useEffect } from "react";
import { X, Luggage, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// âœ… Import API function instead of direct fetch
import { getBaggageServices, type BaggageService } from "../../lib/supabase";

interface BaggageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  offerId: string;
  passengers: Array<{ id: string; type: string }>;
  onComplete: (baggage: any[]) => void;
}

interface SelectedBaggage {
  serviceId: string;
  passengerId: string;
  type: "checked" | "carry_on";
  quantity: number;
  amount: string;
  maxQuantity: number;
}

export function BaggageSelectionModal({
  isOpen,
  onClose,
  offerId,
  passengers,
  onComplete,
}: BaggageSelectionModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableBaggage, setAvailableBaggage] = useState<BaggageService[]>(
    [],
  );
  const [includedBaggage, setIncludedBaggage] = useState<any[]>([]);
  const [selectedBaggage, setSelectedBaggage] = useState<
    Record<string, SelectedBaggage>
  >({});

  // âœ… Load baggage services using API layer
  useEffect(() => {
    if (isOpen && offerId) {
      loadBaggageServices();
    }
  }, [isOpen, offerId]);

  const loadBaggageServices = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🧳 Loading baggage services for offer:", offerId);

      // âœ… Call API layer (no direct fetch!)
      const result = await getBaggageServices(offerId);

      if (result.success) {
        console.log("✅ Baggage services loaded");
        console.log(
          "Available baggage:",
          result.available_services.baggage.length,
        );
        console.log("Included baggage:", result.included_baggage.length);

        setAvailableBaggage(result.available_services.baggage || []);
        setIncludedBaggage(result.included_baggage || []);
      } else {
        throw new Error("Failed to load baggage services");
      }
    } catch (err) {
      console.error("❌ Failed to load baggage services:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load baggage services",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (service: BaggageService, delta: number) => {
    const key = `${service.passenger_id}-${service.id}`;
    const current = selectedBaggage[key];

    if (!current && delta > 0) {
      // Add new selection
      setSelectedBaggage((prev) => ({
        ...prev,
        [key]: {
          serviceId: service.id,
          passengerId: service.passenger_id,
          type: service.metadata.type,
          quantity: 1,
          amount: service.price,
          maxQuantity: service.maximum_quantity,
        },
      }));
    } else if (current) {
      const newQuantity = Math.max(
        0,
        Math.min(current.quantity + delta, service.maximum_quantity),
      );

      if (newQuantity === 0) {
        // Remove selection
        setSelectedBaggage((prev) => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      } else {
        // Update quantity
        setSelectedBaggage((prev) => ({
          ...prev,
          [key]: { ...current, quantity: newQuantity },
        }));
      }
    }
  };

  const handleComplete = () => {
    const baggageArray = Object.values(selectedBaggage).map((item) => ({
      id: item.serviceId,
      type: "baggage",
      amount: parseFloat(item.amount),
      quantity: item.quantity,
      passenger_id: item.passengerId,
    }));

    console.log("🧳 Completing baggage selection:", baggageArray);
    onComplete(baggageArray);
  };

  const getTotalCost = () => {
    return Object.values(selectedBaggage).reduce((sum, item) => {
      return sum + parseFloat(item.amount) * item.quantity;
    }, 0);
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Loading baggage options...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Baggage Selection Error</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => onComplete([])}
                variant="outline"
                className="flex-1"
              >
                Skip Baggage
              </Button>
              <Button onClick={onClose} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Luggage className="h-5 w-5" />
              <span>Add Baggage</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Included Baggage */}
          {includedBaggage.length > 0 && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">
                ✅ Included with Your Ticket
              </h3>
              <ul className="space-y-1 text-sm text-green-800">
                {includedBaggage.map((bag, idx) => (
                  <li key={idx}>
                    {bag.quantity} {bag.type} bag{bag.quantity > 1 ? "s" : ""}{" "}
                    per passenger
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Available Baggage by Passenger */}
          {availableBaggage.length > 0 ? (
            <div className="space-y-6">
              {passengers.map((passenger, passengerIdx) => {
                const passengerBaggage = availableBaggage.filter(
                  (bag) => bag.passenger_id === passenger.id,
                );

                if (passengerBaggage.length === 0) return null;

                return (
                  <div key={passenger.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Passenger {passengerIdx + 1}
                    </h3>

                    <div className="space-y-3">
                      {passengerBaggage.map((service) => {
                        const key = `${service.passenger_id}-${service.id}`;
                        const selected = selectedBaggage[key];
                        const quantity = selected?.quantity || 0;

                        return (
                          <div
                            key={service.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                Additional{" "}
                                {service.metadata.type === "checked"
                                  ? "Checked"
                                  : "Carry-on"}{" "}
                                Bag
                              </div>
                              <div className="text-sm text-gray-600">
                                {service.metadata.maximum_weight_kg && (
                                  <span>
                                    Up to {service.metadata.maximum_weight_kg}kg
                                  </span>
                                )}
                                {" • "}
                                <span className="font-semibold text-blue-600">
                                  ${service.price} {service.currency}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleQuantityChange(service, -1)
                                }
                                disabled={quantity === 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>

                              <span className="w-8 text-center font-semibold">
                                {quantity}
                              </span>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(service, 1)}
                                disabled={quantity >= service.maximum_quantity}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Luggage className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                No additional baggage options available for this flight.
              </p>
            </div>
          )}

          {/* Total Cost */}
          {Object.keys(selectedBaggage).length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">
                  Total Baggage Cost:
                </span>
                <span className="text-xl font-bold text-blue-600">
                  ${getTotalCost().toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => onComplete([])}
              variant="outline"
              className="flex-1"
            >
              Skip Baggage
            </Button>
            <Button
              onClick={handleComplete}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Continue
              {Object.keys(selectedBaggage).length > 0 && (
                <span className="ml-2">(${getTotalCost().toFixed(2)})</span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
