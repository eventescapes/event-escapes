// Updated interface to match backend response
interface FlightDisplay {
  id: string;
  offerId: string;
  sliceId: string;
  sliceIndex: number;
  airline: string;
  airlineCode: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  departureAirport: string;
  arrivalAirport: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
  segments: Array<{
    airline: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    aircraft?: string;
  }>;
}

// Update the FlightCard props
interface FlightCardProps {
  flight: FlightDisplay; // Use new interface
  onSelect: () => void;
  buttonText?: string;
  type?: 'outbound' | 'return';
  isSelected?: boolean;
}

export default function FlightCard({ 
  flight, 
  onSelect, 
  buttonText = "Select", 
  type = 'outbound',
  isSelected = false 
}: FlightCardProps) {
  // ... keep existing styling functions ...

  return (
    <div className={`bg-white rounded-xl p-6 border-2 transition-all duration-300 group ${
      isSelected 
        ? 'border-green-500 bg-green-50 shadow-lg' 
        : 'border-gray-100 hover:border-accent hover:shadow-xl'
    }`} data-testid={`card-flight-${flight.id}`}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
        {/* Airline & Flight Info */}
        <div className="lg:col-span-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-luxury text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md">
              {flight.airlineCode || flight.airline.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-gray-900" data-testid={`text-airline-${flight.id}`}>
                {flight.airline}
              </div>
              <div className="text-xs text-gray-500" data-testid={`text-flight-number-${flight.id}`}>
                {flight.flight_number}
              </div>
            </div>
          </div>
        </div>

        {/* Flight Route */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900" data-testid={`text-departure-time-${flight.id}`}>
                {flight.departure_time ? new Date(flight.departure_time).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : 'N/A'}
              </div>
              <div className="text-sm font-medium text-gray-600" data-testid={`text-departure-airport-${flight.id}`}>
                {flight.departureAirport}
              </div>
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
                {flight.arrival_time ? new Date(flight.arrival_time).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : 'N/A'}
              </div>
              <div className="text-sm font-medium text-gray-600" data-testid={`text-arrival-airport-${flight.id}`}>
                {flight.arrivalAirport}
              </div>
            </div>
          </div>
        </div>

        {/* Price & Select */}
        <div className="lg:col-span-2 text-right">
          <div className={`inline-block px-3 py-1 rounded-lg border ${getPriceColor(flight.price)} mb-3`}>
            <div className="text-2xl font-black" data-testid={`text-price-${flight.id}`}>
              {formatCurrency(flight.price)}
            </div>
            <div className="text-xs font-medium opacity-80">per person</div>
          </div>
          <Button 
            onClick={onSelect} 
            className={`w-full font-bold py-3 rounded-lg shadow-lg transition-all duration-300 ${
              isSelected
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gradient-to-r from-accent to-luxury hover:from-accent/90 hover:to-luxury/90 text-white'
            }`}
            data-testid={`button-select-flight-${flight.id}-${type}`}
          >
            {isSelected ? '✓ Selected' : buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
}
