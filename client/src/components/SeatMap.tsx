import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Plane } from "lucide-react";
import { fetchSeatMap } from "@/utils/duffel";
import { SeatMapResponse, SeatMap as SeatMapData, SeatElement, SelectedSeat } from "@/types/flights";

interface SeatMapProps {
  offerId: string;
  passengers: number;
  onSeatsSelected: (seats: SelectedSeat[]) => void;
  onClose?: () => void;
}

export default function SeatMap({ offerId, passengers, onSeatsSelected, onClose }: SeatMapProps) {
  const [seatMapData, setSeatMapData] = useState<SeatMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<{ [passengerId: string]: SelectedSeat }>({});
  
  // Generate stable passenger IDs based on passenger count
  const passengerIds = Array.from({ length: passengers }, (_, i) => `passenger_${i + 1}`);

  useEffect(() => {
    const loadSeatMap = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchSeatMap(offerId);
        setSeatMapData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load seat map");
      } finally {
        setLoading(false);
      }
    };

    if (offerId) {
      loadSeatMap();
    }
  }, [offerId]);

  const handleSeatClick = (seat: SeatElement, cabinClass: string) => {
    if (!seat.available_services || seat.available_services.length === 0) return;

    // Check if this seat is already selected by another passenger
    const isAlreadySelected = Object.values(selectedSeats).some(selectedSeat => selectedSeat.seatId === seat.id);
    
    if (isAlreadySelected) {
      // Remove selection
      const passengerToRemove = Object.keys(selectedSeats).find(
        passengerId => selectedSeats[passengerId].seatId === seat.id
      );
      if (passengerToRemove) {
        const newSelectedSeats = { ...selectedSeats };
        delete newSelectedSeats[passengerToRemove];
        setSelectedSeats(newSelectedSeats);
      }
      return;
    }

    // Check if we've reached passenger limit
    if (Object.keys(selectedSeats).length >= passengers) {
      return;
    }

    // Find next available passenger ID that hasn't been assigned
    const nextPassengerId = passengerIds.find(id => !selectedSeats[id]);
    if (!nextPassengerId) {
      return; // All passengers have seats assigned
    }

    // Select seat for the next available passenger
    const service = seat.available_services[0]; // Take first available service
    const newSeat: SelectedSeat = {
      seatId: seat.id,
      designator: seat.designator || seat.name || seat.id,
      serviceId: service.id,
      price: parseFloat(service.total_amount),
      currency: service.total_currency,
      passengerId: nextPassengerId,
      characteristics: seat.characteristics
    };

    setSelectedSeats(prev => ({
      ...prev,
      [nextPassengerId]: newSeat
    }));
  };

  const getSeatColor = (seat: SeatElement): string => {
    const isSelected = Object.values(selectedSeats).some(selectedSeat => selectedSeat.seatId === seat.id);
    const isAvailable = seat.available_services && seat.available_services.length > 0;

    if (isSelected) return "bg-blue-500 text-white border-blue-600";
    if (!isAvailable) return "bg-gray-300 text-gray-500 cursor-not-allowed";
    return "bg-green-500 text-white hover:bg-green-600 cursor-pointer";
  };

  const getSeatIcon = (seat: SeatElement): string => {
    if (seat.type === "aisle") return "░";
    if (seat.type === "lavatory") return "🚽";
    if (seat.type === "exit_row") return "🚪";
    if (seat.type === "walkway") return "═";
    return seat.designator || "💺";
  };

  const handleContinue = () => {
    const seatsArray = Object.values(selectedSeats);
    onSeatsSelected(seatsArray);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto" data-testid="seat-map-loading">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading seat map...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto" data-testid="seat-map-error">
        <CardContent className="p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} data-testid="button-retry">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!seatMapData || !seatMapData.data || seatMapData.data.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto" data-testid="seat-map-no-data">
        <CardContent className="p-8 text-center">
          <p>No seat map available for this flight.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="w-full max-w-4xl mx-auto" data-testid="seat-map-container">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Select Your Seats
          </CardTitle>
          {onClose && (
            <Button variant="outline" onClick={onClose} data-testid="button-close-seat-map">
              Skip Seat Selection
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm" data-testid="seat-legend">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span>Unavailable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Selected</span>
            </div>
          </div>

          {/* Selected Seats Summary */}
          {Object.keys(selectedSeats).length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" data-testid="selected-seats-summary">
              <h4 className="font-medium mb-2">Selected Seats:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.values(selectedSeats).map((seat, index) => (
                  <Badge key={seat.seatId} variant="secondary" data-testid={`badge-selected-seat-${index}`}>
                    {seat.designator} - {seat.currency} ${seat.price}
                    {seat.characteristics && seat.characteristics.length > 0 && (
                      <span className="ml-1 text-xs">({seat.characteristics.join(", ")})</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Seat Map - Iterate through all seat maps */}
          <div className="space-y-8" data-testid="seat-map-cabins">
            {seatMapData.data.map((seatMap: SeatMapData, seatMapIndex) => (
              <div key={seatMapIndex} className="space-y-6">
                <h3 className="text-lg font-semibold text-center" data-testid={`text-flight-segment-${seatMapIndex}`}>
                  Flight Segment {seatMapIndex + 1}
                </h3>
                {seatMap.cabins.map((cabin, cabinIndex) => (
                  <div key={cabinIndex} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-4 text-center" data-testid={`text-cabin-class-${seatMapIndex}-${cabinIndex}`}>
                      {cabin.cabin_class} Class
                    </h4>
                    <div className="space-y-2" data-testid={`cabin-rows-${seatMapIndex}-${cabinIndex}`}>
                      {cabin.rows.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex justify-center gap-1" data-testid={`row-${seatMapIndex}-${rowIndex}`}>
                          {row.sections.map((section, sectionIndex) => (
                            <div key={sectionIndex} className="flex gap-1" data-testid={`section-${seatMapIndex}-${sectionIndex}`}>
                              {section.elements.map((element, elementIndex) => {
                                if (element.type === "aisle") {
                                  return (
                                    <div key={elementIndex} className="w-8 flex items-center justify-center text-gray-400">
                                      |
                                    </div>
                                  );
                                }
                                
                                if (element.type === "seat") {
                                  const isAvailable = element.available_services && element.available_services.length > 0;
                                  const service = element.available_services?.[0];
                                  
                                  return (
                                    <Tooltip key={elementIndex}>
                                      <TooltipTrigger>
                                        <div
                                          className={`w-8 h-8 text-xs rounded flex items-center justify-center border transition-all ${getSeatColor(element)}`}
                                          onClick={() => isAvailable && handleSeatClick(element, cabin.cabin_class)}
                                          data-testid={`seat-${element.designator || element.id}`}
                                        >
                                          {element.designator || "💺"}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="text-sm">
                                          <div className="font-medium">{element.designator || element.name}</div>
                                          {element.characteristics && element.characteristics.length > 0 && (
                                            <div className="text-xs text-gray-600">
                                              {element.characteristics.join(", ")}
                                            </div>
                                          )}
                                          {service && (
                                            <div className="text-xs">
                                              {service.total_currency} ${service.total_amount}
                                            </div>
                                          )}
                                          {!isAvailable && (
                                            <div className="text-xs text-red-600">Unavailable</div>
                                          )}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                }

                                return (
                                  <div key={elementIndex} className="w-8 h-8 flex items-center justify-center text-gray-400">
                                    {getSeatIcon(element)}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Continue Button */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              Selected {Object.keys(selectedSeats).length} of {passengers} seats
            </div>
            <Button 
              onClick={handleContinue}
              disabled={Object.keys(selectedSeats).length !== passengers}
              data-testid="button-continue-with-seats"
            >
              Continue with Selected Seats
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}