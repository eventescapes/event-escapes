import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Plane } from "lucide-react";

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

  return (
    <div className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow" data-testid={`card-flight-${flight.id}`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold">
              {getAirlineCode(flight.airline)}
            </div>
            <div>
              <div className="font-semibold" data-testid={`text-airline-${flight.id}`}>
                {flight.airline}
              </div>
              <div className="text-sm text-muted-foreground" data-testid={`text-flight-number-${flight.id}`}>
                Flight {flight.flightNumber}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-xl font-bold" data-testid={`text-departure-time-${flight.id}`}>
                {flight.departure.time}
              </div>
              <div className="text-sm text-muted-foreground" data-testid={`text-departure-airport-${flight.id}`}>
                {flight.departure.airport}
              </div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-sm text-muted-foreground" data-testid={`text-duration-${flight.id}`}>
                {flight.duration}
              </div>
              <div className="flex items-center justify-center my-1">
                <div className="h-px bg-border flex-1"></div>
                <Plane className="mx-2 text-muted-foreground w-4 h-4" />
                <div className="h-px bg-border flex-1"></div>
              </div>
              <div className="text-sm text-muted-foreground" data-testid={`text-stops-${flight.id}`}>
                {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold" data-testid={`text-arrival-time-${flight.id}`}>
                {flight.arrival.time}
              </div>
              <div className="text-sm text-muted-foreground" data-testid={`text-arrival-airport-${flight.id}`}>
                {flight.arrival.airport}
              </div>
            </div>
          </div>
        </div>
        <div className="md:col-span-1">
          <div className="text-sm text-muted-foreground mb-2" data-testid={`text-class-${flight.id}`}>
            {flight.class}
          </div>
          <div className="space-y-1 text-sm">
            {flight.amenities.map((amenity, index) => (
              <div key={index} data-testid={`text-amenity-${flight.id}-${index}`}>
                • {amenity}
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-1 flex flex-col justify-between">
          <div className="text-right">
            <div className="text-2xl font-bold" data-testid={`text-price-${flight.id}`}>
              {formatCurrency(flight.price)}
            </div>
            <div className="text-sm text-muted-foreground">per person</div>
          </div>
          <Button 
            onClick={onSelect} 
            className="w-full mt-4" 
            data-testid={`button-select-flight-${flight.id}-${type}`}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
}
