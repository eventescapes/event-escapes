import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDistance } from "@/lib/utils";
import { Star, Wifi, X } from "lucide-react";

interface Hotel {
  id: string;
  name: string;
  address: string;
  rating: number;
  pricePerNight: number;
  distanceFromVenue: number;
  amenities: string[];
  imageUrl: string;
  freeCancellation: boolean;
}

interface HotelCardProps {
  hotel: Hotel;
  onSelect: () => void;
}

export default function HotelCard({ hotel, onSelect }: HotelCardProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < rating ? 'text-accent fill-accent' : 'text-muted-foreground'}`}
      />
    ));
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow" data-testid={`card-hotel-${hotel.id}`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <img 
            src={hotel.imageUrl} 
            alt={hotel.name} 
            className="w-full h-48 object-cover rounded-lg"
            data-testid={`img-hotel-${hotel.id}`}
          />
        </div>
        <div className="md:col-span-2">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-bold" data-testid={`text-hotel-name-${hotel.id}`}>
                {hotel.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center">
                  <div className="flex">
                    {renderStars(hotel.rating)}
                  </div>
                  <span className="ml-1 text-sm" data-testid={`text-rating-${hotel.id}`}>
                    {hotel.rating} star
                  </span>
                </div>
                <Badge 
                  variant={hotel.distanceFromVenue <= 500 ? "default" : "secondary"}
                  data-testid={`badge-distance-${hotel.id}`}
                >
                  {formatDistance(hotel.distanceFromVenue)} from venue
                </Badge>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mb-3" data-testid={`text-address-${hotel.id}`}>
            {hotel.address}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {hotel.amenities.map((amenity, index) => (
              <Badge key={index} variant="outline" className="text-xs" data-testid={`badge-amenity-${hotel.id}-${index}`}>
                {amenity}
              </Badge>
            ))}
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Wifi className="w-4 h-4 text-muted-foreground" />
              <span>Free WiFi</span>
            </div>
            <div className="flex items-center space-x-1">
              <X className={`w-4 h-4 ${hotel.freeCancellation ? 'text-green-500' : 'text-red-500'}`} />
              <span data-testid={`text-cancellation-${hotel.id}`}>
                {hotel.freeCancellation ? 'Free Cancellation' : 'Non-refundable'}
              </span>
            </div>
          </div>
        </div>
        <div className="md:col-span-1 flex flex-col justify-between">
          <div className="text-right">
            <div className="text-2xl font-bold" data-testid={`text-price-${hotel.id}`}>
              {formatCurrency(hotel.pricePerNight)}
            </div>
            <div className="text-muted-foreground text-sm">per night</div>
            <div className="text-muted-foreground text-xs">includes taxes</div>
          </div>
          <div className="mt-4">
            <Button 
              onClick={onSelect} 
              className="w-full" 
              data-testid={`button-select-hotel-${hotel.id}`}
            >
              Select & Add Flights
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
