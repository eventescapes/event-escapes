// ImprovedTripSummary.tsx - Expedia-style trip summary with per-passenger breakdown

import React from 'react';

interface Passenger {
  id: string;
  type: 'adult' | 'child' | 'infant_without_seat' | 'infant_with_seat';
}

interface Slice {
  id: string;
  origin: { iata_code: string; city_name?: string };
  destination: { iata_code: string; city_name?: string };
  departure_time?: string;
  arrival_time?: string;
  duration?: string;
}

interface Offer {
  id: string;
  total_amount: string;
  total_currency: string;
  base_amount: string;  // Flight cost only (no taxes)
  tax_amount: string;   // All taxes and fees
  passengers: Passenger[];
  slices: Slice[];
}

interface ImprovedTripSummaryProps {
  offer: Offer;
  selectedSeats?: any[];
  selectedBaggage?: any[];
}

const ImprovedTripSummary: React.FC<ImprovedTripSummaryProps> = ({
  offer,
  selectedSeats = [],
  selectedBaggage = []
}) => {
  // Calculate per-passenger pricing
  const passengerCount = offer.passengers.length || 1;
  const totalAmount = parseFloat(offer.total_amount || '0') || 0;
  const baseAmountRaw = offer.base_amount ? parseFloat(offer.base_amount) : NaN;
  const taxAmountRaw = offer.tax_amount ? parseFloat(offer.tax_amount) : NaN;
  const hasBreakdown = !isNaN(baseAmountRaw) && !isNaN(taxAmountRaw);
  const baseAmount = hasBreakdown ? baseAmountRaw : 0;
  const taxAmount = hasBreakdown ? taxAmountRaw : 0;
  
  const perPersonTotal = passengerCount > 0 ? totalAmount / passengerCount : 0;
  const perPersonBase = hasBreakdown ? baseAmount / passengerCount : 0;
  const perPersonTax = hasBreakdown ? taxAmount / passengerCount : 0;

  // Calculate services costs
  const seatsCost = selectedSeats.reduce((sum, seat) => {
    const price = parseFloat(seat.price || seat.amount || seat.total_amount || 0);
    return sum + price;
  }, 0);
  
  const baggageCost = selectedBaggage.reduce((sum, bag) => {
    const price = parseFloat(bag.total_amount || bag.amount || bag.price || 0);
    return sum + price;
  }, 0);

  const servicesCost = seatsCost + baggageCost;
  const grandTotal = totalAmount + servicesCost;

  // Debug logging
  console.log('💰 ImprovedTripSummary Calculations:');
  console.log('- Flight total:', totalAmount);
  console.log('- Seats cost:', seatsCost, `(${selectedSeats.length} seats)`);
  console.log('- Baggage cost:', baggageCost, `(${selectedBaggage.length} items)`);
  console.log('- Services total:', servicesCost);
  console.log('- GRAND TOTAL:', grandTotal);

  // Get passenger type label
  const getPassengerTypeLabel = (type: string) => {
    switch(type) {
      case 'adult': return 'Adult';
      case 'child': return 'Child';
      case 'infant_without_seat': return 'Infant (on lap)';
      case 'infant_with_seat': return 'Infant (with seat)';
      default: return 'Passenger';
    }
  };

  // Get passenger type counts
  const passengerCounts = offer.passengers.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const passengerSummary = Object.entries(passengerCounts)
    .map(([type, count]) => {
      const label = getPassengerTypeLabel(type);
      return `${count} ${label}${count > 1 ? 's' : ''}`;
    })
    .join(', ');

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
      {/* Header */}
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Price Summary
      </h2>

      {/* Passenger Count Badge */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
        <div className="flex items-center gap-2 text-blue-900">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="font-semibold">{passengerSummary}</span>
        </div>
      </div>

      {/* Per-Passenger Breakdown */}
      <div className="space-y-6 mb-6">
        {offer.passengers.map((passenger, index) => (
          <div key={passenger.id} className="border-b border-gray-200 pb-4 last:border-0">
            <h3 className="font-bold text-gray-900 mb-2">
              Traveller {index + 1}: {getPassengerTypeLabel(passenger.type)}
            </h3>
            
            {hasBreakdown ? (
              <div className="space-y-2 ml-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base fare</span>
                  <span className="text-gray-900 font-medium">
                    {offer.total_currency}${perPersonBase.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxes & fees</span>
                  <span className="text-gray-900 font-medium">
                    {offer.total_currency}${perPersonTax.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="ml-4 text-sm text-gray-500">
                Price includes all taxes and fees
              </div>
            )}

            <div className="ml-4 flex justify-between text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-900 font-semibold">Passenger Total</span>
              <span className="text-gray-900 font-bold">
                {offer.total_currency}${perPersonTotal.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Flight Subtotal */}
      <div className="border-t border-gray-300 pt-4 space-y-2">
        <div className="flex justify-between text-gray-900">
          <span className="font-medium">Flight Subtotal</span>
          <span className="font-semibold">
            {offer.total_currency}${totalAmount.toFixed(2)}
          </span>
        </div>

        {/* Services if any */}
        {selectedSeats.length > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Seat Selection ({selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''})</span>
            <span className="font-medium">
              {offer.total_currency}${seatsCost.toFixed(2)}
            </span>
          </div>
        )}

        {selectedBaggage.length > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Extra Baggage ({selectedBaggage.length} bag{selectedBaggage.length > 1 ? 's' : ''})</span>
            <span className="font-medium">
              {offer.total_currency}${baggageCost.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div className="border-t-2 border-gray-300 mt-4 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-gray-900">Trip Total</span>
          <span className="text-2xl font-bold text-green-600">
            {offer.total_currency}${grandTotal.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Rates are quoted in {offer.total_currency === 'AUD' ? 'Australian dollars' : offer.total_currency}
        </p>
      </div>

      {/* Refund Notice (if applicable) */}
      <div className="mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
        You may be entitled to a refund under applicable consumer protection laws.
      </div>
    </div>
  );
};

export default ImprovedTripSummary;

