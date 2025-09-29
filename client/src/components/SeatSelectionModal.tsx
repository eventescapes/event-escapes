import React, { useState, useEffect } from 'react';
import { fetchSeatMaps } from '@/utils/duffel';
import { X } from 'lucide-react';

interface SeatSelectionProps {
  offerId: string;
  passengers: Array<{ id: string; type: string }>;
  onSeatsSelected: (seats: any[]) => void;
  onClose: () => void;
  onSkip: () => void;
}

export const SeatSelectionModal: React.FC<SeatSelectionProps> = ({
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
      setError(null);
      console.log('[SeatSelectionModal] Loading seat maps for offer:', offerId);
      const response = await fetchSeatMaps(offerId);
      console.log('[SeatSelectionModal] Loaded seat maps:', response);
      setSeatMaps(response.data || []);
    } catch (err: any) {
      console.error('[SeatSelectionModal] Error loading seat maps:', err);
      setError(err.message || 'Failed to load seat maps');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat: any, segmentIndex: number, passengerId: string) => {
    if (!seat.available_services || seat.available_services.length === 0) {
      console.log('[SeatSelectionModal] Seat not available:', seat.designator);
      return;
    }

    const seatKey = `${segmentIndex}-${passengerId}`;
    const service = seat.available_services[0];

    // Check if seat is already selected - if so, deselect it
    if (selectedSeats[seatKey]) {
      setSelectedSeats(prev => {
        const newSeats = { ...prev };
        delete newSeats[seatKey];
        return newSeats;
      });
      return;
    }

    console.log('[SeatSelectionModal] Seat selected:', {
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
      return 'bg-green-500 text-white font-bold border-2 border-green-600 shadow-lg';
    }
    if (seat.characteristics?.includes('extra_legroom')) {
      return 'bg-blue-100 hover:bg-blue-200 cursor-pointer border-2 border-blue-400 text-blue-800';
    }
    return 'bg-gray-100 hover:bg-gray-200 cursor-pointer border border-gray-300 text-gray-700';
  };

  const handleContinue = () => {
    const seats = Object.values(selectedSeats);
    console.log('[SeatSelectionModal] Continuing with seats:', seats);
    onSeatsSelected(seats);
  };

  const renderSeatElement = (element: any, elementIndex: number, segmentIndex: number) => {
    const key = `${segmentIndex}-${elementIndex}`;
    
    switch (element.type) {
      case 'seat':
        const isAvailable = element.available_services?.length > 0;
        const price = isAvailable ? parseFloat(element.available_services[0].total_amount) : 0;
        const isSelected = isSeatSelected(element.id, segmentIndex);

        return (
          <button
            key={key}
            onClick={() => handleSeatClick(element, segmentIndex, passengers[0]?.id)}
            disabled={!isAvailable}
            className={`
              relative w-10 h-10 rounded-lg text-xs font-semibold 
              flex flex-col items-center justify-center 
              transition-all duration-200 transform hover:scale-105
              ${getSeatColor(element, segmentIndex)}
              ${isSelected ? 'animate-pulse' : ''}
            `}
            title={`${element.designator}${price > 0 ? ' - $' + price.toFixed(0) : ''}${element.characteristics?.length ? '\n' + element.characteristics.join(', ') : ''}`}
            data-testid={`seat-${element.designator}`}
          >
            <span className="text-[10px] font-bold">{element.designator}</span>
            {price > 0 && (
              <span className="text-[8px] mt-0.5 opacity-75">
                ${price.toFixed(0)}
              </span>
            )}
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-[8px]">✓</span>
              </div>
            )}
          </button>
        );

      case 'aisle':
        return (
          <div 
            key={key} 
            className="w-4 h-10 flex items-center justify-center"
            data-testid="aisle-divider"
          >
            <div className="w-0.5 h-8 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 rounded-full shadow-sm"></div>
          </div>
        );

      case 'exit_row':
        return (
          <div 
            key={key} 
            className="w-10 h-10 flex items-center justify-center text-[8px] font-bold text-red-600 bg-red-50 rounded border border-red-200"
            data-testid="exit-row"
          >
            EXIT
          </div>
        );

      case 'lavatory':
        return (
          <div 
            key={key} 
            className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-sm border border-purple-200"
            data-testid="lavatory"
          >
            🚻
          </div>
        );

      default:
        return (
          <div 
            key={key} 
            className="w-10 h-10"
            data-testid="empty-space"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="seat-modal-loading">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="flex flex-col items-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-gray-700 text-lg font-medium">Loading seat maps...</p>
            <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="seat-modal-error">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <h3 className="text-xl font-bold text-red-600 mb-4">Unable to Load Seats</h3>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={loadSeatMaps}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
              data-testid="button-retry-seats"
            >
              Retry
            </button>
            <button
              onClick={onSkip}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              data-testid="button-skip-seats"
            >
              Skip Seats
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto" data-testid="seat-selection-modal">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold">Select Your Seats</h2>
            <p className="text-blue-100 text-sm mt-1">
              {seatMaps.length} flight segment{seatMaps.length !== 1 ? 's' : ''} • {passengers.length} passenger{passengers.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:bg-blue-800 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
            data-testid="button-close-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Legend */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-100 border border-gray-300 rounded"></div>
                <span className="text-gray-700">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded relative">
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-[8px]">✓</span>
                  </div>
                </div>
                <span className="text-gray-700">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-300 rounded"></div>
                <span className="text-gray-700">Unavailable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 border-2 border-blue-400 rounded"></div>
                <span className="text-gray-700">Extra Legroom</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 rounded-full"></div>
                <span className="text-gray-700">Aisle</span>
              </div>
            </div>
          </div>

          {/* Seat Maps */}
          <div className="px-6 py-6">
            {seatMaps.map((seatMap, segmentIndex) => (
              <div key={seatMap.id} className="mb-8">
                <h3 className="text-lg font-bold mb-6 text-gray-800 border-b pb-2">
                  Flight Segment {segmentIndex + 1}
                </h3>

                {/* Cabin Layout */}
                {seatMap.cabins?.map((cabin: any, cabinIndex: number) => (
                  <div key={cabinIndex} className="border-2 border-gray-200 rounded-xl p-6 mb-6 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                      <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                        {cabin.cabin_class} Class
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {cabin.rows?.length || 0} rows
                      </span>
                    </div>

                    <div className="space-y-2 overflow-x-auto">
                      {cabin.rows?.map((row: any, rowIndex: number) => (
                        <div key={rowIndex} className="flex gap-1 justify-center items-center min-w-max">
                          {/* Row Number */}
                          <span className="text-xs font-medium text-gray-500 w-8 text-right mr-2">
                            {rowIndex + 1}
                          </span>

                          {/* Seat Sections with Aisle Spacing */}
                          {row.sections?.map((section: any, sectionIndex: number) => (
                            <React.Fragment key={sectionIndex}>
                              <div className="flex gap-1">
                                {section.elements?.map((element: any, elementIndex: number) => 
                                  renderSeatElement(element, elementIndex, segmentIndex)
                                )}
                              </div>
                              {/* Aisle spacing between sections (except after last section) */}
                              {sectionIndex < row.sections.length - 1 && (
                                <div className="w-4 h-10 flex items-center justify-center" data-testid="section-aisle">
                                  <div className="w-1 h-8 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 rounded-full shadow-sm"></div>
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-6 rounded-b-xl">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 mb-3">Selected Seats</h4>
              {Object.keys(selectedSeats).length === 0 ? (
                <p className="text-sm text-gray-500 italic">No seats selected yet</p>
              ) : (
                <div className="space-y-2">
                  {Object.values(selectedSeats).map((seat, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                      <span className="font-bold text-green-600">{seat.designator}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">Segment {seat.segmentIndex + 1}</span>
                      <span className="text-gray-400">•</span>
                      <span className="font-semibold text-gray-800">{seat.currency} ${seat.price.toFixed(2)}</span>
                      {seat.characteristics?.length > 0 && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {seat.characteristics.join(', ')}
                          </span>
                        </>
                      )}
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
              data-testid="button-skip-seats"
            >
              Skip Seat Selection
            </button>
            <button
              onClick={handleContinue}
              disabled={Object.keys(selectedSeats).length === 0}
              className="flex-1 bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors shadow-lg disabled:shadow-none"
              data-testid="button-continue-seats"
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

export default SeatSelectionModal;