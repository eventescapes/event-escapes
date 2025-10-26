import { useState, useMemo } from "react";
import { X, Luggage, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BaggageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  offerId: string;
  passengers: any[];
  availableServices: any[]; // ✅ New prop from AncillaryChoicePage
  onComplete: (selectedBaggage: SelectedBaggage[]) => void;
}

interface SelectedBaggage {
  serviceId: string;
  quantity: number;
  passengerId: string;
  segmentId: string;
  amount: string;
}

export function BaggageSelectionModal({
  isOpen,
  onClose,
  offerId,
  passengers,
  availableServices = [],
  onComplete,
}: BaggageSelectionModalProps) {
  const [selections, setSelections] = useState<Record<string, number>>({});

  // Memoize baggage data (parsed from availableServices)
  const baggageServices = useMemo(() => {
    return availableServices.filter((s) => s.type === "baggage");
  }, [availableServices]);

  const updateQuantity = (
    serviceId: string,
    delta: number,
    maxQuantity: number,
  ) => {
    setSelections((prev) => {
      const current = prev[serviceId] || 0;
      const newValue = Math.max(0, Math.min(maxQuantity, current + delta));
      return { ...prev, [serviceId]: newValue };
    });
  };

  const getTotalCost = (): number => {
    return Object.entries(selections).reduce((sum, [serviceId, quantity]) => {
      const service = baggageServices.find((s) => s.id === serviceId);
      if (service && quantity > 0) {
        return sum + parseFloat(service.totalAmount || service.total_amount);
      }
      return sum;
    }, 0);
  };

  const handleComplete = () => {
    const selected: SelectedBaggage[] = Object.entries(selections)
      .filter(([_, qty]) => qty > 0)
      .map(([serviceId, quantity]) => {
        const service = baggageServices.find((s) => s.id === serviceId);
        return {
          serviceId,
          quantity,
          passengerId: service?.passengerIds?.[0] || passengers[0]?.id || "",
          segmentId: service?.segmentIds?.[0] || "0",
          amount: service?.totalAmount || service?.total_amount || "0",
        };
      });

    console.log("🧳 Final baggage selection:", selected);
    onComplete(selected);
  };

  const handleSkip = () => {
    console.log("🧳 Baggage skipped");
    onComplete([]);
  };

  if (!isOpen) return null;

  const totalCost = getTotalCost();
  const currency =
    baggageServices[0]?.totalCurrency ||
    baggageServices[0]?.total_currency ||
    "AUD";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Baggage</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select additional checked baggage for your flight
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {baggageServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Luggage className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Additional Baggage Available
              </h3>
              <p className="text-gray-600 mb-6 text-center max-w-md">
                This flight does not offer additional baggage options at this
                time. You can proceed with the standard baggage allowance
                included in your ticket.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {baggageServices.map((service, index) => {
                const quantity = selections[service.id] || 0;
                const maxQuantity = service.maximumQuantity || 3;
                const baggageType = service.metadata?.type || "Checked Bag";
                const weight = service.metadata?.maximum_weight_kg;

                return (
                  <div
                    key={service.id}
                    className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Luggage className="w-5 h-5 text-gray-600" />
                          <h4 className="font-semibold text-gray-900">
                            {baggageType}
                          </h4>
                        </div>
                        {weight && (
                          <p className="text-sm text-gray-600 mb-1">
                            Up to {weight}kg
                          </p>
                        )}
                        <p className="text-lg font-bold text-blue-600">
                          {currency.toUpperCase()} $
                          {parseFloat(
                            service.totalAmount || service.total_amount,
                          ).toFixed(2)}{" "}
                          <span className="text-sm font-normal text-gray-600">
                            per bag
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() =>
                              updateQuantity(service.id, -1, maxQuantity)
                            }
                            disabled={quantity === 0}
                            className="w-8 h-8 bg-white rounded flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold">
                            {quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(service.id, 1, maxQuantity)
                            }
                            disabled={quantity >= maxQuantity}
                            className="w-8 h-8 bg-white rounded flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">Total Baggage Cost</div>
            <div className="text-2xl font-bold text-gray-900">
              {currency.toUpperCase()} ${totalCost.toFixed(2)}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSkip}
              variant="outline"
              className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Skip Baggage
            </Button>
            <Button
              onClick={handleComplete}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Continue {totalCost > 0 ? `+$${totalCost.toFixed(2)}` : ""}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
