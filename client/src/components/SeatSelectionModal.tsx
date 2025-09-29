// client/src/components/SeatSelection.tsx
import React, { useState, useEffect } from 'react';
import { fetchSeatMaps } from '@/utils/duffel';

interface SeatSelectionProps {
  offerId: string;
  passengers: Array<{ id: string; type: string }>;
  onSeatsSelected: (seats: any[]) => void;
  onClose: () => void;
  onSkip: () => void;
}

export const SeatSelection: React.FC<SeatSelectionProps> = ({
  offerId,
  passengers,
  onSeatsSelected,
  onClose,
  onSkip
}) => {
  const [seatMaps, setSeatMaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSeatMaps();
  }, [offerId]);

  const loadSeatMaps = async () => {
    try {
      setLoading(true);
      const response = await fetchSeatMaps(offerId);
      console.log('[SeatSelection] Loaded seat maps:', response);
      setSeatMaps(response.data || []);
      setLoading(false);
    } catch (err: any) {
      console.error('[SeatSelection] Error loading seat maps:', err);
      setError(err.message || 'Failed to load seat maps');
      setLoading(false);
    }
  };

  const handleSeatClick = (seat: any, segmentIndex: number, passengerId: string) => {
    if (!seat.available_services || seat.available_services.length === 0) {
      console.log('[SeatSelection] Seat not available:', seat.designator);
      return;
    }

    const seatKey = `${segmentIndex}-${passengerId}`;
    const service = seat.available_services[0];

    console.log('[SeatSelection] Seat selected:', {
      designator: seat.designator,
      price: service.total_amount,
      passengerId
    });

    setSelectedSeats(prev => ({
      ...prev,
      [seatKey]: {
        seatId: seat.id,
        designator: seat.designator,
        serviceId: service.id,
        price: parseFloat(service.total_amount),
        currency: service.total_currency,
        passengerId,
        segmentIndex,
        characteristics: seat.characteristics || []
      }
    }));
  };

  const isSeatSelected = (seatId: string, segmentIndex: number): boolean => {
    return Object.values(selectedSeats).some(
      s => s.seatId === seatId && s.segmentIndex === segmentIndex
    );
  };

  const getTotalPrice = (): number => {
    return Object.values(selectedSeats).reduce((sum, seat) => sum + seat.price, 0);
  };

  const getSeatColor = (seat: any, segmentIndex: number): string => {
    if (!seat.available_services || seat.available_services.length === 0) {
      return 'bg-gray-300 cursor-not-allowed text-gray-500';
    }
    if (isSeatSelected(seat.id, segmentIndex)) {
      return 'bg-green-500 text-white font-bold';
    }
    if (seat.characteristics?.includes('extra_legroom')) {
      return 'bg-blue-100 hover:bg-blue-200 cursor-pointer border-2 border-blue-400';
    }
    return 'bg-gray-100 hover:bg-gray-200 cursor-pointer border border-gray-300';
  };

  const handleContinue = () => {
    const seats = Object.values(selectedSeats);
    console.log('[SeatSelection] Continuing with seats:', seats);
    onSeatsSelected(seats);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-gray-700 text-lg font-medium">Loading seat maps...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h3 className="text-xl font-bold text-red-600 mb-4">Unable to Load Seats</h3>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={loadSeatMaps}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Retry
            </button>
            <button
              onClick={onSkip}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium"
            >
              Skip Seats
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full my-8">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <div>
            <h2 className="text-2xl font-bold">Select Your Seats</h2>
            <p className="text-blue-100 text-sm mt-1">{seatMaps.length} segment(s) available</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:bg-blue-800 rounded-full w-10 h-10 flex items-center justify-center text-3xl transition-colors"
          >
            ×
          </button>
        </div>

        {/* Seat Maps */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          {seatMaps.map((seatMap, segmentIndex) => (
            <div key={seatMap.id} className="mb-8">
              <h3 className="text-lg font-bold mb-4 text-gray-800">
                Flight Segment {segmentIndex + 1}
              </h3>

              {/* Legend */}
              <div className="mb-6 flex flex-wrap gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 border border-gray-300 rounded"></div>
                  <span className="text-gray-700">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded"></div>
                  <span className="text-gray-700">Your Selection</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  <span className="text-gray-700">Unavailable</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 border-2 border-blue-400 rounded"></div>
                  <span className="text-gray-700">Extra Legroom</span>
                </div>
              </div>

              {/* Cabin Layout */}
              {seatMap.cabins.map((cabin: any, cabinIndex: number) => (
                <div key={cabinIndex} className="border-2 border-gray-200 rounded-xl p-6 mb-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b">
                    <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                      {cabin.cabin_class} Class
                    </span>
                    <span className="text-xs text-gray-500">{cabin.rows.length} rows</span>
                  </div>

                  <div className="space-y-2">
                    {cabin.rows.map((row: any, rowIndex: number) => (
                      <div key={rowIndex} className="flex gap-2 justify-center items-center">
                        {/* Row Number */}
                        <span className="text-xs font-medium text-gray-500 w-10 text-right">
                          {rowIndex + 1}
                        </span>

                        {/* Seat Sections */}
                        {row.sections.map((section: any, sectionIndex: number) => (
                          <div key={sectionIndex} className="flex gap-1">
                            {section.elements.map((element: any, elementIndex: number) => {
                              if (element.type === 'seat') {
                                const isAvailable = element.available_services?.length > 0;
                                const price = isAvailable ? parseFloat(element.available_services[0].total_amount) : 0;

                                return (
                                  <button
                                    key={elementIndex}
                                    onClick={() => handleSeatClick(element, segmentIndex, passengers[0]?.id)}
                                    disabled={!isAvailable}
                                    className={`w-12 h-12 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all duration-200 ${getSeatColor(element, segmentIndex)}`}
                                    title={`${element.designator}${price > 0 ? ' - $' + price.toFixed(0) : ''}${element.characteristics?.length ? '\n' + element.characteristics.join(', ') : ''}`}
                                  >
                                    <span>{element.designator}</span>
                                    {price > 0 && <span className="text-[8px] mt-0.5">${price.toFixed(0)}</span>}
                                  </button>
                                );
                              } else if (element.type === 'aisle') {
                                return <div key={elementIndex} className="w-8"></div>;
                              } else if (element.type === 'exit_row') {
                                return (
                                  <div key={elementIndex} className="w-12 h-12 flex items-center justify-center text-[10px] font-bold text-red-600 bg-red-50 rounded">
                                    EXIT
                                  </div>
                                );
                              } else if (element.type === 'lavatory') {
                                return (
                                  <div key={elementIndex} className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-lg">
                                    🚻
                                  </div>
                                );
                              } else {
                                return <div key={elementIndex} className="w-12 h-12"></div>;
                              }
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

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-6 rounded-b-lg">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 mb-3">Your Selected Seats</h4>
              {Object.keys(selectedSeats).length === 0 ? (
                <p className="text-sm text-gray-500 italic">No seats selected yet</p>
              ) : (
                <div className="space-y-2">
                  {Object.values(selectedSeats).map((seat, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm bg-white px-4 py-2 rounded-lg border border-gray-200">
                      <span className="font-bold text-green-600">{seat.designator}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600">Segment {seat.segmentIndex + 1}</span>
                      <span className="text-gray-500">•</span>
                      <span className="font-semibold text-gray-800">{seat.currency} ${seat.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right ml-6">
              <div className="text-sm text-gray-600 mb-1">Total Seat Charges</div>
              <div className="text-3xl font-bold text-green-600">
                {Object.values(selectedSeats)[0]?.currency || 'AUD'} ${getTotalPrice().toFixed(2)}
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
              className="flex-1 bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors shadow-lg disabled:shadow-none"
            >
              {Object.keys(selectedSeats).length === 0 
                ? 'Select at least one seat' 
                : `Continue with ${Object.keys(selectedSeats).length} Seat(s)`
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};