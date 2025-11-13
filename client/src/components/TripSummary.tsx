import { Button } from '@/components/ui/button';
import { useCurrency } from '@/lib/currency';
import type { FlightSearchParams } from '@/types/flights';

interface TripSummaryProps {
  selectedOffers: {
    [sliceIndex: number]: {
      offerId: string;
      sliceId: string;
      flight: any;
      price: number;
      currency: string;
    };
  };
  selectedSeats: any;
  onContinue: () => void;
  searchParams: FlightSearchParams;
}

export default function TripSummary({
  selectedOffers,
  selectedSeats,
  onContinue,
  searchParams,
}: TripSummaryProps) {
  const { format: formatCurrency } = useCurrency();

  // Check if any offers are selected
  const hasSelections = Object.keys(selectedOffers).length > 0;
  
  // Calculate total from selected offers
  const total = Object.values(selectedOffers).reduce(
    (sum, selection) => sum + selection.price,
    0
  );

  // Determine expected number of flights
  const expectedFlights = searchParams.tripType === "return" ? 2 : 1;
  const allSelected = Object.keys(selectedOffers).length === expectedFlights;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-4">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>

      {/* Flight Status */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Outbound
          </div>
          {selectedOffers[0] ? (
            <div className="text-sm">
              <div className="font-medium text-gray-900">
                {selectedOffers[0].flight.origin} → {selectedOffers[0].flight.destination}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {selectedOffers[0].flight.airline}
              </div>
              <div className="text-sm font-semibold text-blue-600 mt-2">
                {formatCurrency(selectedOffers[0].price)}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">Not selected</div>
          )}
        </div>

        {searchParams.tripType === "return" && (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Return
            </div>
            {selectedOffers[1] ? (
              <div className="text-sm">
                <div className="font-medium text-gray-900">
                  {selectedOffers[1].flight.origin} → {selectedOffers[1].flight.destination}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {selectedOffers[1].flight.airline}
                </div>
                <div className="text-sm font-semibold text-blue-600 mt-2">
                  {formatCurrency(selectedOffers[1].price)}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">Not selected</div>
            )}
          </div>
        )}
      </div>

      {/* Total */}
      <div className="border-t pt-4 mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-lg font-semibold text-gray-900">Total</span>
          <span className="text-sm text-gray-500">
            For {searchParams.passengers} passenger{searchParams.passengers > 1 ? 's' : ''}
          </span>
        </div>
        <div className="text-3xl font-bold text-blue-600">
          {hasSelections ? formatCurrency(total) : 'AUD $0.00'}
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={onContinue}
        disabled={!allSelected}
        className={`w-full font-semibold ${
          allSelected
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {allSelected
          ? 'Continue to Checkout'
          : `Select ${expectedFlights === 1 ? 'flight' : 'both flights'} to continue`}
      </Button>

      {/* Selection Progress */}
      {!allSelected && hasSelections && (
        <div className="mt-3 text-sm text-center text-gray-500">
          {Object.keys(selectedOffers).length} of {expectedFlights} flight
          {expectedFlights > 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}