import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingBag, ArrowLeft, CreditCard, Plane } from 'lucide-react';

interface CartItem {
  type: 'flight';
  offerId: string;
  addedAt: string;
  flight: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate: string | null;
    airline: string;
    totalAmount: string;
    totalCurrency: string;
  };
  selectedSeats: Array<{
    serviceId: string;
    designator: string;
    passengerId: string;
    segmentId: string;
    amount: string;
  }>;
  selectedBaggage: Array<{
    serviceId: string;
    quantity: number;
    passengerId: string;
    segmentId: string;
    amount: string;
  }>;
  passengers: any[];
  pricing: {
    flightBase: number;
    seats: number;
    baggage: number;
    total: number;
    currency: string;
  };
}

export default function CartPage() {
  const [, navigate] = useLocation();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const data = localStorage.getItem('eventescapes_cart');
    if (data) {
      try {
        setCartItems(JSON.parse(data));
      } catch (error) {
        console.error('Error loading cart:', error);
        setCartItems([]);
      }
    }
  };

  const removeItem = (index: number) => {
    const newCart = cartItems.filter((_, i) => i !== index);
    setCartItems(newCart);
    localStorage.setItem('eventescapes_cart', JSON.stringify(newCart));
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      return sum + (item.pricing?.total || 0);
    }, 0);
  };

  const formatPrice = (amount: number, currency: string) => {
    return `${currency.toUpperCase()} $${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const getSeatDesignators = (seats: CartItem['selectedSeats']) => {
    return seats?.map(s => s.designator).join(', ') || '';
  };

  const getTotalBaggageCount = (baggage: CartItem['selectedBaggage']) => {
    return baggage?.reduce((sum, b) => sum + (b.quantity || 1), 0) || 0;
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Button
                variant="ghost"
                onClick={() => navigate('/flights')}
                className="flex items-center gap-2"
                data-testid="button-back-to-search"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Search
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Your Cart</h1>
              <div className="w-[120px]" />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center" data-testid="empty-cart">
            <ShoppingBag className="mx-auto h-24 w-24 text-gray-400 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start planning your next adventure! Search for flights to add to your cart.
            </p>
            <Button
              onClick={() => navigate('/flights')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              data-testid="button-search-flights"
            >
              Search Flights
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currency = cartItems[0]?.pricing?.currency || cartItems[0]?.flight?.totalCurrency || 'AUD';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => navigate('/flights')}
              className="flex items-center gap-2"
              data-testid="button-back-to-search"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              Your Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
            </h1>
            <div className="w-[120px]" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" 
                data-testid={`cart-item-${index}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Flight Route */}
                    <div className="flex items-center gap-2 mb-3">
                      <Plane className="w-5 h-5 text-blue-600" />
                      <h3 className="text-xl font-semibold text-gray-900">
                        {item.flight?.origin || 'N/A'} → {item.flight?.destination || 'N/A'}
                      </h3>
                    </div>

                    {/* Flight Info */}
                    <div className="space-y-1 mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Departure:</span> {formatDate(item.flight?.departureDate || '')}
                      </p>
                      {item.flight?.returnDate && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Return:</span> {formatDate(item.flight.returnDate)}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Airline:</span> {item.flight?.airline || 'N/A'}
                      </p>
                    </div>

                    {/* Price Breakdown */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-gray-900 mb-3">Price Breakdown</h4>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Base Fare</span>
                        <span className="font-medium">
                          {formatPrice(item.pricing?.flightBase || 0, currency)}
                        </span>
                      </div>

                      {item.selectedSeats && item.selectedSeats.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Seats ({getSeatDesignators(item.selectedSeats)})
                          </span>
                          <span className="font-medium">
                            {formatPrice(item.pricing?.seats || 0, currency)}
                          </span>
                        </div>
                      )}

                      {item.selectedBaggage && item.selectedBaggage.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Baggage ({getTotalBaggageCount(item.selectedBaggage)} {getTotalBaggageCount(item.selectedBaggage) === 1 ? 'bag' : 'bags'})
                          </span>
                          <span className="font-medium">
                            {formatPrice(item.pricing?.baggage || 0, currency)}
                          </span>
                        </div>
                      )}

                      <div className="border-t pt-2 mt-2 flex justify-between">
                        <span className="font-semibold text-gray-900">Subtotal</span>
                        <span className="font-bold text-gray-900">
                          {formatPrice(item.pricing?.total || 0, currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-4"
                    data-testid={`button-remove-item-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Flight {index + 1}
                    </span>
                    <span className="font-medium">
                      {formatPrice(item.pricing?.total || 0, currency)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex items-center justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>{formatPrice(calculateTotal(), currency)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                  data-testid="button-proceed-checkout"
                >
                  <CreditCard className="w-4 h-4" />
                  Proceed to Checkout
                </Button>

                <Button
                  onClick={() => navigate('/flights')}
                  variant="outline"
                  className="w-full"
                  data-testid="button-continue-shopping"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
