import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Plane, Wifi, Coffee, Star, Clock } from "lucide-react";

interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    time: string;
    city: string;
  };
  arrival: {
    airport: string;
    time: string;
    city: string;
  };
  duration: string;
  stops: number;
  price: number;
  class: string;
  amenities: string[];
}

interface FlightCardProps {
  flight: Flight;
  onSelect: () => void;
  buttonText?: string;
  type?: 'outbound' | 'return';
}

export default function FlightCard({ flight, onSelect, buttonText = "Select", type = 'outbound' }: FlightCardProps) {
  const getAirlineCode = (airline: string) => {
    const codes: { [key: string]: string } = {
      'American Airlines': 'AA',
      'Delta Airlines': 'DL',
      'United Airlines': 'UA',
      'Southwest Airlines': 'WN',
      'JetBlue Airways': 'B6',
    };
    return codes[airline] || airline.substring(0, 2).toUpperCase();
  };

  const getPriceColor = (price: number) => {
    if (price < 300) return "text-green-600 bg-green-50 border-green-200";
    if (price < 500) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getAmenityIcon = (amenity: string) => {
    if (amenity.toLowerCase().includes('wifi')) return <Wifi className="w-4 h-4" />;
    if (amenity.toLowerCase().includes('meal')) return <Coffee className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
  };

  return (
    <div className="bg-white rounded-xl p-6 border-2 border-gray-100 hover:border-accent hover:shadow-xl transition-all duration-300 group" data-testid={`card-flight-${flight.id}`}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
        {/* Airline & Flight Info */}
        <div className="lg:col-span-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-luxury text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md">
              {getAirlineCode(flight.airline)}
            </div>
            <div>
              <div className="font-bold text-gray-900" data-testid={`text-airline-${flight.id}`}>
                {flight.airline}
              </div>
              <div className="text-xs text-gray-500" data-testid={`text-flight-number-${flight.id}`}>
                {flight.flightNumber}
              </div>
            </div>
          </div>
        </div>

        {/* Flight Route */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900" data-testid={`text-departure-time-${flight.id}`}>
                {flight.departure.time}
              </div>
              <div className="text-sm font-medium text-gray-600" data-testid={`text-departure-airport-${flight.id}`}>
                {flight.departure.airport}
              </div>
              <div className="text-xs text-gray-400">{flight.departure.city}</div>
            </div>
            
            <div className="flex-1 mx-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <Clock className="w-4 h-4 text-gray-400 mr-1" />
                <span className="text-sm font-medium text-gray-600" data-testid={`text-duration-${flight.id}`}>
                  {flight.duration}
                </span>
              </div>
              <div className="flex items-center justify-center my-2">
                <div className="h-0.5 bg-gradient-to-r from-accent to-luxury flex-1 rounded"></div>
                <div className="mx-2 p-1 bg-gray-100 rounded-full">
                  <Plane className="w-3 h-3 text-accent transform rotate-90" />
                </div>
                <div className="h-0.5 bg-gradient-to-r from-luxury to-accent flex-1 rounded"></div>
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${flight.stops === 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`} data-testid={`text-stops-${flight.id}`}>
                {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900" data-testid={`text-arrival-time-${flight.id}`}>
                {flight.arrival.time}
              </div>
              <div className="text-sm font-medium text-gray-600" data-testid={`text-arrival-airport-${flight.id}`}>
                {flight.arrival.airport}
              </div>
              <div className="text-xs text-gray-400">{flight.arrival.city}</div>
            </div>
          </div>
        </div>

        {/* Amenities & Class */}
        <div className="lg:col-span-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2" data-testid={`text-class-${flight.id}`}>
            {flight.class}
          </div>
          <div className="flex flex-wrap gap-1">
            {flight.amenities.slice(0, 3).map((amenity, index) => (
              <div key={index} className="flex items-center space-x-1 text-xs bg-gray-100 px-2 py-1 rounded-full" data-testid={`text-amenity-${flight.id}-${index}`}>
                {getAmenityIcon(amenity)}
                <span className="truncate max-w-16">{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Price & Select */}
        <div className="lg:col-span-1 text-right">
          <div className={`inline-block px-3 py-1 rounded-lg border ${getPriceColor(flight.price)} mb-3`}>
            <div className="text-2xl font-black" data-testid={`text-price-${flight.id}`}>
              {formatCurrency(flight.price)}
            </div>
            <div className="text-xs font-medium opacity-80">per person</div>
          </div>
          <Button 
            onClick={onSelect} 
            className="w-full bg-gradient-to-r from-accent to-luxury hover:from-accent/90 hover:to-luxury/90 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105" 
            data-testid={`button-select-flight-${flight.id}-${type}`}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
}
