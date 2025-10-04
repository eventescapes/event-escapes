import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TripSummaryProps {
  currentOffer?: {
    totalAmount: string;
    totalCurrency: string;
  };
  selectedSeats?: Array<{
    designator: string;
    amount: string;
  }>;
  selectedBaggage?: Array<{
    quantity: number;
    amount: string;
  }>;
  onAddToCart?: () => void;
}

export default function TripSummary({
  currentOffer,
  selectedSeats,
  selectedBaggage,
  onAddToCart
}: TripSummaryProps) {
  
  const safeSeats = Array.isArray(selectedSeats) ? selectedSeats : [];
  const safeBaggage = Array.isArray(selectedBaggage) ? selectedBaggage : [];
  
  const calculateTotal = () => {
    const offerAmount = parseFloat(currentOffer?.totalAmount || '0');
    const seatsTotal = safeSeats.reduce((sum, seat) => sum + parseFloat(seat.amount || '0'), 0);
    const baggageTotal = safeBaggage.reduce((sum, bag) => {
      return sum + (parseFloat(bag.amount || '0') * (bag.quantity || 1));
    }, 0);
    
    return offerAmount + seatsTotal + baggageTotal;
  };

  const currency = currentOffer?.totalCurrency || 'AUD';
  const total = calculateTotal();
  const hasOffer = !!currentOffer;

  const formatPrice = (amount: number) => {
    return `${currency.toUpperCase()} $${amount.toFixed(2)}`;
  };

  const getSeatDesignators = () => {
    return safeSeats.map(s => s.designator).join(', ');
  };

  const getBaggageCount = () => {
    return safeBaggage.reduce((sum, b) => sum + (b.quantity || 1), 0);
  };

  return (
    <aside className="sticky top-4 w-full" data-testid="trip-summary">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Trip Summary</h3>

        {/* Selection Status */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <p className="text-sm text-gray-500">Outbound</p>
              <p className="font-medium text-gray-900">
                {hasOffer ? 'Selected' : 'Not selected'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <p className="text-sm text-gray-500">Return</p>
              <p className="font-medium text-gray-900">Not selected</p>
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        {hasOffer && (
          <div className="space-y-3 mb-6">
            <h4 className="font-semibold text-gray-900 text-sm">Price Breakdown</h4>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Flight</span>
              <span className="font-medium">
                {formatPrice(parseFloat(currentOffer.totalAmount))}
              </span>
            </div>

            {safeSeats.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Seats ({getSeatDesignators()})
                </span>
                <span className="font-medium">
                  {formatPrice(safeSeats.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0))}
                </span>
              </div>
            )}

            {safeBaggage.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Baggage ({getBaggageCount()} {getBaggageCount() === 1 ? 'bag' : 'bags'})
                </span>
                <span className="font-medium">
                  {formatPrice(safeBaggage.reduce((sum, b) => sum + (parseFloat(b.amount || '0') * (b.quantity || 1)), 0))}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Total */}
        <div className="mb-6 pt-4 border-t">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-3xl font-bold text-blue-600">
              {formatPrice(total)}
            </span>
          </div>
          <p className="text-sm text-gray-500">For 1 passenger</p>
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={onAddToCart}
          disabled={!hasOffer}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2"
          data-testid="button-add-to-cart"
        >
          <ShoppingCart className="w-5 h-5" />
          {hasOffer ? 'Add to Cart' : 'Select a flight to continue'}
        </Button>
      </div>
    </aside>
  );
}
