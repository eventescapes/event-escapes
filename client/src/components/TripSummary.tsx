import { Button } from '@/components/ui/button';
import { useCart } from '@/store/cartStore';
import { useLocation } from 'wouter';

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
  const { offer } = currentSelection;
  const { items, getSeats, getBaggage, getTotal, clearOffer } = useCart();
  const [, navigate] = useLocation();
  
  // Get cart item for this offer
  const cartItem = offer ? items.find(i => i.offerId === offer.id) : null;
  
  // Get seats and baggage from cart store (with prices) or fall back to props
  const seatsFromCart = cartItem ? getSeats(offer.id) : [];
  const baggageFromCart = cartItem ? getBaggage(offer.id) : [];
  
  // Use cart data if available, otherwise fall back to props
  const seats = seatsFromCart.length > 0 ? seatsFromCart : currentSelection.seats;
  const baggage = baggageFromCart.length > 0 ? baggageFromCart : currentSelection.baggage;
  
  // Calculate amounts
  const flightAmount = offer ? parseFloat(offer.total_amount?.toString() || '0') : 0;
  const seatsAmount = seats.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
  const baggageAmount = baggage.reduce((sum, b) => sum + (parseFloat(b.amount || '0') * (b.quantity || 1)), 0);
  const total = flightAmount + seatsAmount + baggageAmount;
  const currency = offer?.total_currency || 'AUD';
  
  console.log('📊 TripSummary calculated:', { flightAmount, seatsAmount, baggageAmount, total });

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-4" data-testid="order-summary">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>

      {/* Selected Flight Details */}
      {offer && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Selected Flight</h4>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to change your flight? Your seat and baggage selections will be lost.')) {
                  clearOffer(offer.id);
                  navigate('/flight-results');
                }
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
              data-testid="button-change-flight"
            >
              Change flight
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-gray-900 dark:text-gray-100">
                  {offer.slices?.[0]?.origin?.iata_code || offer.slices?.[0]?.origin} → {offer.slices?.[0]?.destination?.iata_code || offer.slices?.[0]?.destination}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                  {offer.slices?.[0]?.segments?.[0]?.airline || 'Flight'} • {offer.slices?.[0]?.segments?.[0]?.flight_number || ''}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-xs">
                  {offer.slices?.[0]?.duration || ''} • {offer.slices?.[0]?.segments?.length === 1 ? 'Direct' : `${offer.slices?.[0]?.segments?.length - 1} stop(s)`}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-600 dark:text-blue-400">
                  {currency.toUpperCase()} ${flightAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flight Status */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Outbound</div>
          {offer ? (
            <div className="text-sm text-gray-900 dark:text-gray-100">
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
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Price Breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Flight</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{currency.toUpperCase()} ${flightAmount.toFixed(2)}</span>
            </div>
            
            {seats.length > 0 && (
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="text-gray-600 dark:text-gray-400">Seats</span>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                    {seats.map(s => s.designator).filter(Boolean).join(', ') || `${seats.length} seat(s)`}
                  </div>
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{currency.toUpperCase()} ${seatsAmount.toFixed(2)}</span>
              </div>
            )}
            
            {baggage.length > 0 && (
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="text-gray-600 dark:text-gray-400">Baggage</span>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                    {baggage.reduce((sum, b) => sum + (b.quantity || 1), 0)} {baggage.reduce((sum, b) => sum + (b.quantity || 1), 0) === 1 ? 'bag' : 'bags'}
                  </div>
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{currency.toUpperCase()} ${baggageAmount.toFixed(2)}</span>
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
