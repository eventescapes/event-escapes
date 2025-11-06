// src/components/SeatSelectionModal.tsx
import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// âœ… Import API function instead of direct fetch
import { getSeatMaps, type SeatMap } from "../lib/supabase";

interface SeatSelectionModalProps {
  offerId: string;
  passengers: Array<{ id: string; type: string }>;
  onSeatsSelected: (seats: any[]) => void;
  onClose: () => void;
  onSkip: () => void;
}

interface SelectedSeat {
  serviceId: string;
  designator: string;
  passengerId: string;
  segmentId: string;
  amount: string;
}

export function SeatSelectionModal({
  offerId,
  passengers,
  onSeatsSelected,
  onClose,
  onSkip,
}: SeatSelectionModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seatMaps, setSeatMaps] = useState<SeatMap[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<
    Record<number, SelectedSeat>
  >({});
  const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);

  // âœ… Load seat maps using API layer
  useEffect(() => {
    loadSeatMaps();
  }, [offerId]);

  const loadSeatMaps = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("💺 Loading seat maps for offer:", offerId);

      // âœ… Call API layer (no direct fetch!)
      const result = await getSeatMaps(offerId);

      if (result.success && result.seat_maps) {
        console.log("✅ Seat maps loaded:", result.seat_maps.length);
        setSeatMaps(result.seat_maps);
      } else {
        throw new Error("No seat maps available");
      }
    } catch (err) {
      console.error("❌ Failed to load seat maps:", err);
      setError(err instanceof Error ? err.message : "Failed to load seat maps");
    } finally {
      setLoading(false);
    }
  };

  /**
   * âš ï¸ CRITICAL: Extract service ID using passenger index
   * This is THE MOST IMPORTANT function for multi-passenger seat selection
   */
  const getSeatServiceIdForPassenger = (
    seatElement: any,
    passengerIndex: number,
  ): string | null => {
    if (
      !seatElement.services ||
      seatElement.services.length <= passengerIndex
    ) {
      console.warn(
        `Seat ${seatElement.designator} not available for passenger ${passengerIndex}`,
      );
      return null;
    }

    // âœ… CORRECT: Use passenger index to get service from array
    return seatElement.services[passengerIndex].id;
  };

  const getSeatPrice = (seatElement: any, passengerIndex: number): string => {
    if (
      !seatElement.services ||
      seatElement.services.length <= passengerIndex
    ) {
      return "0";
    }
    return seatElement.services[passengerIndex].total_amount || "0";
  };

  const handleSeatClick = (seatElement: any, segmentId: string) => {
    if (!seatElement.available) return;

    const serviceId = getSeatServiceIdForPassenger(
      seatElement,
      currentPassengerIndex,
    );
    if (!serviceId) {
      alert(
        `This seat is not available for passenger ${currentPassengerIndex + 1}`,
      );
      return;
    }

    const price = getSeatPrice(seatElement, currentPassengerIndex);

    setSelectedSeats((prev) => ({
      ...prev,
      [currentPassengerIndex]: {
        serviceId,
        designator: seatElement.designator,
        passengerId: passengers[currentPassengerIndex].id,
        segmentId,
        amount: price,
      },
    }));

    console.log(
      `✅ Passenger ${currentPassengerIndex + 1} selected seat ${seatElement.designator} (service index ${currentPassengerIndex})`,
    );
  };

  const handleNextPassenger = () => {
    if (currentPassengerIndex < passengers.length - 1) {
      setCurrentPassengerIndex(currentPassengerIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    const seatsArray = Object.values(selectedSeats);

    // Verify all seats have amounts
    const invalidSeats = seatsArray.filter(
      (seat) => !seat.amount || seat.amount === "0",
    );
    if (invalidSeats.length > 0) {
      console.error("❌ Some seats missing prices:", invalidSeats);
    }

    console.log("💺 Completing seat selection:", seatsArray);
    onSeatsSelected(seatsArray);
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Loading seat maps...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Seat Selection Error</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={onSkip} variant="outline" className="flex-1">
                Skip Seat Selection
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

  const currentSeatMap = seatMaps[0]; // For now, show first seat map
  if (!currentSeatMap) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Seat Maps Available</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-gray-600 mb-4">
              No seat maps available for this flight.
            </p>
            <Button onClick={onSkip} className="w-full">
              Skip Seat Selection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentPassenger = passengers[currentPassengerIndex];
  const isLastPassenger = currentPassengerIndex === passengers.length - 1;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Select Seat for Passenger {currentPassengerIndex + 1}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Passenger Progress */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              {passengers.map((_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-2 rounded ${
                    idx < currentPassengerIndex
                      ? "bg-green-500"
                      : idx === currentPassengerIndex
                        ? "bg-blue-500"
                        : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Passenger {currentPassengerIndex + 1} of {passengers.length}
              {selectedSeats[currentPassengerIndex] && (
                <span className="ml-2 text-green-600">
                  (Selected: {selectedSeats[currentPassengerIndex].designator})
                </span>
              )}
            </p>
          </div>

          {/* Seat Map */}
          <div className="border rounded-lg p-6 bg-gray-50">
            {currentSeatMap.cabins.map((cabin, cabinIdx) => (
              <div key={cabinIdx} className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase">
                  {cabin.cabin_class}
                </h3>

                {cabin.rows.map((row, rowIdx) => (
                  <div key={rowIdx} className="mb-2">
                    {row.sections.map((section, sectionIdx) => (
                      <div
                        key={sectionIdx}
                        className="flex justify-center gap-1 mb-1"
                      >
                        {section.elements.map((element, elementIdx) => {
                          if (element.type === "seat") {
                            const isSelected =
                              selectedSeats[currentPassengerIndex]
                                ?.designator === element.designator;
                            const isAvailable = element.available;
                            const price = getSeatPrice(
                              element,
                              currentPassengerIndex,
                            );

                            return (
                              <button
                                key={elementIdx}
                                onClick={() =>
                                  handleSeatClick(
                                    element,
                                    currentSeatMap.segment_id,
                                  )
                                }
                                disabled={!isAvailable}
                                className={`
                                  w-12 h-12 rounded text-xs font-medium transition-all
                                  ${
                                    isSelected
                                      ? "bg-blue-500 text-white ring-2 ring-blue-600"
                                      : isAvailable
                                        ? "bg-white hover:bg-blue-50 border border-gray-300"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  }
                                `}
                                title={`${element.designator} - $${price}`}
                              >
                                <div>{element.designator}</div>
                                {isAvailable && price !== "0" && (
                                  <div className="text-[10px]">${price}</div>
                                )}
                                {isSelected && (
                                  <Check className="h-3 w-3 mx-auto" />
                                )}
                              </button>
                            );
                          } else if (element.type === "empty") {
                            return (
                              <div key={elementIdx} className="w-12 h-12" />
                            );
                          } else {
                            return (
                              <div
                                key={elementIdx}
                                className="w-12 h-12 flex items-center justify-center text-xs text-gray-400"
                              >
                                {element.type === "lavatory" ? "🚻" : "🚪"}
                              </div>
                            );
                          }
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white border border-gray-300 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <span>Unavailable</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button onClick={onSkip} variant="outline" className="flex-1">
              Skip All Seats
            </Button>
            {selectedSeats[currentPassengerIndex] && (
              <Button
                onClick={handleNextPassenger}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLastPassenger ? "Complete Selection" : "Next Passenger"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
