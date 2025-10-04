import { Button } from '@/components/ui/button';

interface TripSummaryProps {
  currentSelection: {
    offer: any | null;
    seats: Array<{ designator: string; amount: string }>;
    baggage: Array<{ quantity: number; amount: string }>;
  };
  onBookNow: () => void;
  onAddToCart: () => void;
}

export default function TripSummary({
  currentSelection,
  onBookNow,
  onAddToCart
}: TripSummaryProps) {
  const { offer, seats, baggage } = currentSelection;
  
  const flightAmount = offer ? parseFloat(offer.total_amount?.toString() || '0') : 0;
  const seatsAmount = seats.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
  const baggageAmount = baggage.reduce((sum, b) => sum + (parseFloat(b.amount || '0') * (b.quantity || 1)), 0);
  const total = flightAmount + seatsAmount + baggageAmount;
  const currency = offer?.total_currency || 'AUD';

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-4" data-testid="order-summary">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>

      {/* Flight Status */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Outbound</div>
          {offer ? (
            <div className="text-sm text-gray-900">
              {offer.slices?.[0]?.segments?.[0]?.airline || 'Selected'}
            </div>
          ) : (
            <div className="text-sm text-gray-400">Not selected</div>
          )}
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Return</div>
          <div className="text-sm text-gray-400">Not selected</div>
        </div>
      </div>

      {/* Total */}
      <div className="border-t pt-4 mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-lg font-semibold text-gray-900">Total</span>
          <span className="text-sm text-gray-500">For 1 passenger</span>
        </div>
        <div className="text-3xl font-bold text-blue-600" data-testid="total-amount">
          {currency.toUpperCase()} ${total.toFixed(2)}
        </div>
      </div>

      {/* Price Breakdown */}
      {offer && (
        <div className="border-t pt-4 mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Price Breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Flight</span>
              <span className="font-medium">{currency.toUpperCase()} ${flightAmount.toFixed(2)}</span>
            </div>
            
            {seats.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Seats ({seats.map(s => s.designator).join(', ')})
                </span>
                <span className="font-medium">{currency.toUpperCase()} ${seatsAmount.toFixed(2)}</span>
              </div>
            )}
            
            {baggage.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Baggage ({baggage.reduce((sum, b) => sum + (b.quantity || 1), 0)} {baggage.reduce((sum, b) => sum + (b.quantity || 1), 0) === 1 ? 'bag' : 'bags'})
                </span>
                <span className="font-medium">{currency.toUpperCase()} ${baggageAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {offer ? (
        <div className="space-y-3">
          <Button
            onClick={onBookNow}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            data-testid="button-book-now"
          >
            Book Now
          </Button>
          <Button
            onClick={onAddToCart}
            variant="outline"
            className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold"
            data-testid="button-add-to-cart"
          >
            Add to Cart
          </Button>
        </div>
      ) : (
        <Button
          disabled
          className="w-full bg-gray-300 text-gray-500 cursor-not-allowed font-semibold"
          data-testid="button-select-flight"
        >
          Select a flight to continue
        </Button>
      )}
    </div>
  );
}
