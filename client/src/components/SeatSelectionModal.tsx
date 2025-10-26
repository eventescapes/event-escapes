import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface SeatSelectionProps {
  offerId: string;
  passengers: Array<{ id: string; type: string }>;
  availableServices: any[]; // passed from AncillaryChoicePage
  onSeatsSelected: (seats: any[]) => void;
  onClose: () => void;
  onSkip: () => void;
}

export const SeatSelectionModal: React.FC<SeatSelectionProps> = ({
  offerId,
  passengers,
  availableServices = [],
  onSeatsSelected,
  onClose,
  onSkip,
}) => {
  const [selectedSeats, setSelectedSeats] = useState<Record<string, any>>({});

  // Automatically group available seats by segment
  const seatSegments = React.useMemo(() => {
    const segments: Record<string, any[]> = {};
    availableServices.forEach((service) => {
      const segmentIds = service.segmentIds || service.segment_ids || [];
      segmentIds.forEach((segId: string) => {
        if (!segments[segId]) segments[segId] = [];
        segments[segId].push(service);
      });
    });
    return segments;
  }, [availableServices]);

  const handleSeatClick = (
    service: any,
    segmentId: string,
    passengerId: string,
  ) => {
    const key = `${segmentId}-${passengerId}`;
    if (selectedSeats[key]) {
      const copy = { ...selectedSeats };
      delete copy[key];
      setSelectedSeats(copy);
    } else {
      setSelectedSeats({
        ...selectedSeats,
        [key]: {
          serviceId: service.id,
          designator: service.metadata?.designator || "Seat",
          amount: service.totalAmount || service.total_amount,
          currency: service.totalCurrency || service.total_currency || "AUD",
          passengerId,
          segmentId,
        },
      });
    }
  };

  const getTotalPrice = (): number =>
    Object.values(selectedSeats).reduce(
      (sum, s) => sum + parseFloat(s.amount || 0),
      0,
    );

  const handleContinue = () => {
    const seatsArray = Object.values(selectedSeats);
    console.log("🎫 Seats selected (from Supabase):", seatsArray);
    onSeatsSelected(seatsArray);
  };

  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold">Select Your Seats</h2>
            <p className="text-blue-100 text-sm mt-1">
              {Object.keys(seatSegments).length} segment
              {Object.keys(seatSegments).length !== 1 ? "s" : ""} •{" "}
              {passengers.length} passenger
              {passengers.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {Object.keys(seatSegments).length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              No seat maps or seat services available for this fare.
            </div>
          ) : (
            Object.entries(seatSegments).map(([segmentId, seats], idx) => (
              <div key={segmentId} className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-4">
                  Segment {idx + 1} ({seats.length} seats available)
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {seats.map((s: any, i: number) => {
                    const isSelected = Object.values(selectedSeats).some(
                      (sel) => sel.serviceId === s.id,
                    );
                    return (
                      <button
                        key={i}
                        onClick={() =>
                          handleSeatClick(s, segmentId, passengers[0]?.id)
                        }
                        className={`p-3 rounded-lg text-xs font-semibold transition ${
                          isSelected
                            ? "bg-green-500 text-white border-2 border-green-600 shadow-md"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                        }`}
                        title={`Seat ${s.metadata?.designator || ""} - ${s.totalAmount || s.total_amount} ${s.totalCurrency || s.total_currency}`}
                      >
                        {s.metadata?.designator || s.id.slice(0, 4)}
                        <div className="text-[10px] text-gray-500">
                          $
                          {parseFloat(
                            s.totalAmount || s.total_amount || 0,
                          ).toFixed(0)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-6 rounded-b-xl">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 mb-3">Selected Seats</h4>
              {Object.keys(selectedSeats).length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  No seats selected yet
                </p>
              ) : (
                <div className="space-y-2">
                  {Object.values(selectedSeats).map((seat: any, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 text-sm bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm"
                    >
                      <span className="font-bold text-green-600">
                        {seat.designator}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="font-semibold text-gray-800">
                        {seat.currency} ${seat.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right ml-6">
              <div className="text-sm text-gray-600 mb-1">
                Total Seat Charges
              </div>
              <div className="text-3xl font-bold text-green-600">
                {Object.values(selectedSeats)[0]?.currency || "AUD"} $
                {getTotalPrice().toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onSkip}
              className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
            >
              Skip Seat Selection
            </button>
            <button
              onClick={handleContinue}
              disabled={Object.keys(selectedSeats).length === 0}
              className="flex-1 bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors shadow-lg"
            >
              {Object.keys(selectedSeats).length === 0
                ? "Select at least one seat"
                : `Continue with ${Object.keys(selectedSeats).length} Seat(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionModal;
