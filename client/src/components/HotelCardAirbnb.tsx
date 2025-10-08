import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Check, X } from 'lucide-react';
import type { HotelCard } from '@/lib/hotels';

interface HotelCardAirbnbProps {
  hotel: HotelCard;
  onSelect: (rateKey: string) => void;
}

export function HotelCardAirbnb({ hotel, onSelect }: HotelCardAirbnbProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price);
  };

  const renderStars = (stars?: number) => {
    if (!stars) return null;
    return (
      <div className="flex items-center gap-1" aria-label={`${stars} stars`}>
        {Array.from({ length: stars }, (_, i) => (
          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
    );
  };

  const thumbnailUrl = hotel.thumbnail || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop';

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
      data-testid={`card-hotel-${hotel.hotelId}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {/* Image */}
        <div className="md:col-span-1">
          <img
            src={thumbnailUrl}
            alt={hotel.name}
            className="w-full h-48 object-cover rounded-xl"
            data-testid={`img-hotel-${hotel.hotelId}`}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop';
            }}
          />
        </div>

        {/* Details */}
        <div className="md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 
                  className="text-xl font-bold text-slate-900"
                  data-testid={`text-hotel-name-${hotel.hotelId}`}
                >
                  {hotel.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {renderStars(hotel.stars)}
                  {hotel.locality && (
                    <span 
                      className="text-sm text-slate-600"
                      data-testid={`text-locality-${hotel.hotelId}`}
                    >
                      • {hotel.locality}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {hotel.board && (
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  data-testid={`badge-board-${hotel.hotelId}`}
                >
                  {hotel.board}
                </Badge>
              )}
              {hotel.refundable !== undefined && (
                <Badge 
                  variant={hotel.refundable ? "default" : "outline"}
                  className={`text-xs ${hotel.refundable ? 'bg-green-500 hover:bg-green-600' : ''}`}
                  data-testid={`badge-refundable-${hotel.hotelId}`}
                >
                  {hotel.refundable ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Refundable
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3 mr-1" />
                      Non-refundable
                    </>
                  )}
                </Badge>
              )}
              {hotel.paymentType && (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  data-testid={`badge-payment-${hotel.hotelId}`}
                >
                  Pay {hotel.paymentType === 'AT_HOTEL' ? 'at Hotel' : 'Online'}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div 
                className="text-2xl font-bold text-slate-900"
                data-testid={`text-price-${hotel.hotelId}`}
              >
                {formatPrice(hotel.price, hotel.currency)}
              </div>
              <div className="text-sm text-slate-600">per night</div>
            </div>
            <Button
              onClick={() => onSelect(hotel.rateKey)}
              className="rounded-full px-6 bg-blue-600 hover:bg-blue-700"
              data-testid={`button-select-${hotel.hotelId}`}
            >
              Select
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
