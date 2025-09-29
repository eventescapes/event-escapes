import { useLocation } from 'wouter';
import { useBooking } from '@/contexts/BookingContext';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingBag, ArrowLeft, CreditCard } from 'lucide-react';

export default function CartPage() {
  const [, navigate] = useLocation();
  const { cart, removeFromCart, getCartTotal, getCartItemCount, clearCart } = useBooking();

  const handleContinueShopping = () => {
    navigate('/');
  };

  const handleProceedToCheckout = () => {
    if (cart.items.length === 0) return;
    navigate('/checkout');
  };

  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId);
  };

  const formatPrice = (amount: number, currency: string) => {
    return `${currency.toUpperCase()} $${amount.toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Button
                variant="ghost"
                onClick={handleContinueShopping}
                className="flex items-center gap-2"
                data-testid="button-back-to-search"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Search
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Your Cart</h1>
              <div className="w-[120px]" /> {/* Spacer for center alignment */}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center" data-testid="empty-cart">
            <ShoppingBag className="mx-auto h-24 w-24 text-gray-400 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start planning your next adventure! Search for flights, hotels, or events to add to your cart.
            </p>
            <Button
              onClick={handleContinueShopping}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              data-testid="button-start-shopping"
            >
              Start Planning Your Trip
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={handleContinueShopping}
              className="flex items-center gap-2"
              data-testid="button-back-to-search"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              Your Cart ({getCartItemCount()} {getCartItemCount() === 1 ? 'item' : 'items'})
            </h1>
            <Button
              variant="ghost"
              onClick={clearCart}
              className="text-red-600 hover:text-red-700"
              data-testid="button-clear-cart"
            >
              Clear Cart
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cart.items.map((item, index) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-testid={`cart-item-${index}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Added {formatDate(item.addedAt)}
                      </span>
                    </div>
                    
                    {/* Enhanced Flight Details */}
                    {item.type === 'flight' && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {item.outboundFlight && item.returnFlight ? 'Round-trip' : 'One-way'}: {item.outboundFlight?.departure} → {item.outboundFlight?.arrival}
                          {item.returnFlight && ` → ${item.returnFlight.departure}`}
                        </h3>
                        
                        {item.outboundFlight && (
                          <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-3 rounded-r-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">Outbound Flight</h4>
                            <div className="space-y-1">
                              <div className="text-sm text-blue-800">
                                <span className="font-medium">{item.outboundFlight.airline} {(item.outboundFlight as any).flightNumber || item.outboundFlight.id?.slice(-4)}</span>
                                <span className="mx-2">|</span>
                                <span>{(item.outboundFlight as any).departTime || 'TBD'} - {(item.outboundFlight as any).arriveTime || 'TBD'}</span>
                              </div>
                              <div className="text-sm text-blue-700">
                                <span className="font-medium">Cabin:</span> {(item.outboundFlight as any).cabinClass || 'Economy'}
                                <span className="mx-2">•</span>
                                <span>Duration: {item.outboundFlight.duration}</span>
                                <span className="mx-2">•</span>
                                <span>{item.outboundFlight.stops === 0 ? 'Direct' : `${item.outboundFlight.stops} stop(s)`}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {item.returnFlight && (
                          <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-3 rounded-r-lg">
                            <h4 className="font-semibold text-green-900 mb-2">Return Flight</h4>
                            <div className="space-y-1">
                              <div className="text-sm text-green-800">
                                <span className="font-medium">{item.returnFlight.airline} {(item.returnFlight as any).flightNumber || item.returnFlight.id?.slice(-4)}</span>
                                <span className="mx-2">|</span>
                                <span>{(item.returnFlight as any).departTime || 'TBD'} - {(item.returnFlight as any).arriveTime || 'TBD'}</span>
                              </div>
                              <div className="text-sm text-green-700">
                                <span className="font-medium">Cabin:</span> {(item.returnFlight as any).cabinClass || 'Economy'}
                                <span className="mx-2">•</span>
                                <span>Duration: {item.returnFlight.duration}</span>
                                <span className="mx-2">•</span>
                                <span>{item.returnFlight.stops === 0 ? 'Direct' : `${item.returnFlight.stops} stop(s)`}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Selected Seats */}
                        {(item.selectedSeats?.outbound.length || item.selectedSeats?.return.length) && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <h5 className="font-medium text-gray-900 mb-2">Selected Seats</h5>
                            {item.selectedSeats?.outbound.length > 0 && (
                              <p className="text-sm text-gray-600">
                                Outbound: {item.selectedSeats.outbound.map(seat => seat.designator).join(', ')}
                                <span className="ml-2 font-medium">
                                  {formatPrice(item.selectedSeats.outbound.reduce((sum, seat) => sum + seat.price, 0), item.currency)}
                                </span>
                              </p>
                            )}
                            {item.selectedSeats?.return.length > 0 && (
                              <p className="text-sm text-gray-600">
                                Return: {item.selectedSeats.return.map(seat => seat.designator).join(', ')}
                                <span className="ml-2 font-medium">
                                  {formatPrice(item.selectedSeats.return.reduce((sum, seat) => sum + seat.price, 0), item.currency)}
                                </span>
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* Selected Baggage */}
                        {item.selectedBaggage && item.selectedBaggage.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <h5 className="font-medium text-gray-900 mb-2">Selected Baggage</h5>
                            {item.selectedBaggage.map((bag, bagIndex) => (
                              <p key={bagIndex} className="text-sm text-gray-600">
                                {bag.type}: {bag.weight}
                                <span className="ml-2 font-medium">
                                  {formatPrice(bag.price, item.currency)}
                                </span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Hotel Details */}
                    {item.type === 'hotel' && item.hotel && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900">{item.hotel.name}</h4>
                        <p className="text-sm text-gray-600">{item.hotel.location}</p>
                        <p className="text-sm text-gray-600">Rating: {item.hotel.rating}/5</p>
                      </div>
                    )}
                    
                    {/* Event Details */}
                    {item.type === 'event' && item.event && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900">{item.event.title}</h4>
                        <p className="text-sm text-gray-600">{item.event.venue}</p>
                        <p className="text-sm text-gray-600">{item.event.date}</p>
                      </div>
                    )}
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        For {item.passengers} {item.passengers === 1 ? 'passenger' : 'passengers'}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(item.subtotal, item.currency)}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-4"
                    data-testid={`button-remove-item-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                {cart.items.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {item.type === 'flight' ? (
                        `Flight ${index + 1} (${item.passengers}p)`
                      ) : item.type === 'hotel' ? (
                        `Hotel ${index + 1}`
                      ) : (
                        `Event ${index + 1}`
                      )}
                    </span>
                    <span className="font-medium">{formatPrice(item.subtotal, item.currency)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 mb-6">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(getCartTotal(), cart.items[0]?.currency || 'AUD')}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  For {cart.items.reduce((sum, item) => sum + item.passengers, 0)} total passenger(s)
                </p>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={handleProceedToCheckout}
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                  data-testid="button-proceed-checkout"
                >
                  <CreditCard className="w-4 h-4" />
                  Proceed to Checkout
                </Button>
                
                <Button
                  onClick={handleContinueShopping}
                  variant="outline"
                  className="w-full"
                  data-testid="button-continue-planning"
                >
                  Continue Planning Your Trip
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}