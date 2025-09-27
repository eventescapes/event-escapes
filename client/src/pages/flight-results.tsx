import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FlightCard from "@/components/flight-card";
import { FlightCardSkeleton } from "@/components/loading-skeleton";
import { useBooking } from "@/contexts/BookingContext";
import { useToast } from "@/hooks/use-toast";
import { searchFlights, bookFlight, FlightSearchParams } from "@/lib/supabase";
import { Plane, Calendar, Users, MapPin, Search, ArrowRightLeft, Clock, Star } from "lucide-react";

interface FlightSearchResult {
  outbound: Array<{
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
  }>;
  return: Array<{
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
  }>;
}

export default function FlightResults() {
  const [, setLocation] = useLocation();
  const [selectedOutbound, setSelectedOutbound] = useState<string | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<string | null>(null);
  const { updateSelectedOutboundFlight, updateSelectedReturnFlight } = useBooking();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState({
    from: "LAX",
    to: "JFK",
    departureDate: "2024-07-15",
    returnDate: "2024-07-17",
    passengers: "2",
  });

  // Convert search params to Supabase Edge Function format
  const flightSearchParams: FlightSearchParams = {
    origin: searchParams.from,
    destination: searchParams.to,
    departureDate: searchParams.departureDate,
    returnDate: searchParams.returnDate,
    passengers: parseInt(searchParams.passengers),
    cabin: "economy"
  };

  const { data, isLoading, error, refetch } = useQuery<FlightSearchResult>({
    queryKey: ['flights-search', flightSearchParams],
    queryFn: () => searchFlights(flightSearchParams),
    enabled: true
  });

  const bookingMutation = useMutation({
    mutationFn: bookFlight,
    onSuccess: (data) => {
      toast({
        title: "Flight Booked Successfully!",
        description: "Your flight reservation has been confirmed.",
      });
      setLocation('/confirmation');
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book flight. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOutboundSelect = (flightId: string) => {
    setSelectedOutbound(flightId);
    const selectedFlight = data?.outbound.find(f => f.id === flightId);
    if (selectedFlight) {
      updateSelectedOutboundFlight({
        id: selectedFlight.id,
        airline: selectedFlight.airline,
        departure: `${selectedFlight.departure.time} ${selectedFlight.departure.airport}`,
        arrival: `${selectedFlight.arrival.time} ${selectedFlight.arrival.airport}`,
        duration: selectedFlight.duration,
        price: selectedFlight.price,
        stops: selectedFlight.stops,
      });
    }
  };

  const handleReturnSelect = (flightId: string) => {
    setSelectedReturn(flightId);
    const selectedFlight = data?.return.find(f => f.id === flightId);
    if (selectedFlight) {
      updateSelectedReturnFlight({
        id: selectedFlight.id,
        airline: selectedFlight.airline,
        departure: `${selectedFlight.departure.time} ${selectedFlight.departure.airport}`,
        arrival: `${selectedFlight.arrival.time} ${selectedFlight.arrival.airport}`,
        duration: selectedFlight.duration,
        price: selectedFlight.price,
        stops: selectedFlight.stops,
      });
    }
    setLocation('/checkout');
  };

  const handleSearch = () => {
    // Trigger refetch with new search parameters
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="animate-luxury-fade-in mb-12">
            <div className="h-12 bg-luxury-gradient-subtle rounded-lg w-1/2 mb-6"></div>
            <div className="h-6 bg-muted rounded w-2/3 mb-4"></div>
            <div className="glass-card p-8 rounded-xl">
              <div className="h-24 bg-muted rounded-lg"></div>
            </div>
          </div>
          
          <div className="space-y-8">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="animate-luxury-scale-in" style={{ animationDelay: `${i * 200}ms` }}>
                <FlightCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
        <div className="glass-card p-12 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plane className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="font-display text-3xl font-bold text-destructive mb-4">Flight Search Unavailable</h1>
          <p className="text-muted-foreground font-accent mb-6">We're having trouble finding flights. Please try again shortly.</p>
          <Button 
            onClick={() => window.location.reload()}
            className="btn-luxury"
          >
            <Search className="w-4 h-4 mr-2" />
            Search Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Premium Header */}
        <div className="mb-12 animate-luxury-fade-in">
          <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-4 py-2 mb-6">
            <Plane className="w-4 h-4 text-accent mr-2" />
            <span className="font-accent font-semibold text-accent text-sm tracking-wide uppercase">Premium Flights</span>
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-primary mb-4 tracking-tight" data-testid="text-flights-title">
            Select Your
            <span className="text-luxury block">Premium Journey</span>
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground font-accent text-lg" data-testid="text-search-summary">
            <div className="flex items-center">
              <ArrowRightLeft className="w-5 h-5 mr-2 text-accent" />
              <span className="font-semibold text-primary">{searchParams.from}</span>
              <span className="mx-2">to</span>
              <span className="font-semibold text-primary">{searchParams.to}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-accent" />
              {searchParams.departureDate} - {searchParams.returnDate}
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-accent" />
              {searchParams.passengers} passengers
            </div>
          </div>
        </div>

        {/* Premium Flight Search Form */}
        <div className="glass-card p-8 mb-12 animate-luxury-slide-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-semibold text-primary">Modify Your Search</h2>
            <div className="flex items-center text-accent">
              <Search className="w-5 h-5 mr-2" />
              <span className="font-accent font-medium">Find Better Options</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="space-y-2">
              <Label htmlFor="from" className="font-accent font-semibold text-primary flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-accent" />
                Departure City
              </Label>
              <Input
                id="from"
                type="text"
                value={`${searchParams.from} - Los Angeles`}
                onChange={(e) => setSearchParams(prev => ({ ...prev, from: e.target.value.split(' - ')[0] }))}
                className="glass border-0 focus:ring-2 focus:ring-accent font-accent"
                data-testid="input-from"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to" className="font-accent font-semibold text-primary flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-accent" />
                Destination
              </Label>
              <Input
                id="to"
                type="text"
                value={`${searchParams.to} - New York`}
                onChange={(e) => setSearchParams(prev => ({ ...prev, to: e.target.value.split(' - ')[0] }))}
                className="glass border-0 focus:ring-2 focus:ring-accent font-accent"
                data-testid="input-to"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departure" className="font-accent font-semibold text-primary flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-accent" />
                Departure
              </Label>
              <Input
                id="departure"
                type="date"
                value={searchParams.departureDate}
                onChange={(e) => setSearchParams(prev => ({ ...prev, departureDate: e.target.value }))}
                className="glass border-0 focus:ring-2 focus:ring-accent font-accent"
                data-testid="input-departure"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="return" className="font-accent font-semibold text-primary flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-accent" />
                Return
              </Label>
              <Input
                id="return"
                type="date"
                value={searchParams.returnDate}
                onChange={(e) => setSearchParams(prev => ({ ...prev, returnDate: e.target.value }))}
                className="glass border-0 focus:ring-2 focus:ring-accent font-accent"
                data-testid="input-return"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleSearch} 
                className="btn-luxury w-full font-accent font-semibold" 
                data-testid="button-search-flights"
              >
                <Search className="w-4 h-4 mr-2" />
                Update Search
              </Button>
            </div>
          </div>
        </div>

        {/* Premium Outbound Flights */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="animate-luxury-fade-in">
              <h2 className="font-display text-3xl font-bold text-primary mb-2" data-testid="text-outbound-title">
                Outbound Journey
              </h2>
              <p className="text-muted-foreground font-accent flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-accent" />
                Departing {searchParams.departureDate}
              </p>
            </div>
            <div className="animate-luxury-slide-in">
              <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-4 py-2">
                <Star className="w-4 h-4 text-accent mr-2" />
                <span className="font-accent font-semibold text-accent text-sm">{data.outbound.length} Options</span>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {data.outbound.map((flight, index) => (
              <div 
                key={flight.id}
                className="animate-luxury-scale-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <FlightCard
                  flight={flight}
                  onSelect={() => handleOutboundSelect(flight.id)}
                  buttonText="Select Outbound"
                  type="outbound"
                />
              </div>
            ))}
          </div>
          
          {data.outbound.length === 0 && (
            <div className="glass-card p-12 text-center animate-luxury-scale-in">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Plane className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-primary mb-4">No Flights Available</h3>
              <p className="text-muted-foreground font-accent" data-testid="no-outbound-message">
                No outbound flights found for your selected criteria. Try adjusting your dates or destinations.
              </p>
            </div>
          )}
        </div>

        {/* Premium Return Flights - Only show if outbound is selected */}
        {selectedOutbound && (
          <div className="mb-12 animate-luxury-slide-in">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl font-bold text-primary mb-2" data-testid="text-return-title">
                  Return Journey
                </h2>
                <p className="text-muted-foreground font-accent flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-accent" />
                  Returning {searchParams.returnDate}
                </p>
              </div>
              <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-4 py-2">
                <Clock className="w-4 h-4 text-accent mr-2" />
                <span className="font-accent font-semibold text-accent text-sm">Complete Your Trip</span>
              </div>
            </div>
            <div className="space-y-6">
              {data.return.map((flight, index) => (
                <div 
                  key={flight.id}
                  className="animate-luxury-scale-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <FlightCard
                    flight={flight}
                    onSelect={() => handleReturnSelect(flight.id)}
                    buttonText="Complete Booking"
                    type="return"
                  />
                </div>
              ))}
            </div>
            
            {data.return.length === 0 && (
              <div className="glass-card p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-primary mb-4">No Return Flights</h3>
                <p className="text-muted-foreground font-accent" data-testid="no-return-message">
                  No return flights available for your selected date. Please try alternative dates.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Premium Instructions */}
        {!selectedOutbound && (
          <div className="glass-card p-12 text-center animate-luxury-scale-in">
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ArrowRightLeft className="w-10 h-10 text-accent" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-primary mb-4">Choose Your Outbound Flight</h3>
            <p className="text-muted-foreground font-accent text-lg max-w-md mx-auto" data-testid="select-outbound-message">
              Select your preferred outbound flight above to unlock premium return flight options.
            </p>
            <div className="mt-8 flex justify-center">
              <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-6 py-3">
                <Star className="w-4 h-4 text-accent mr-2" />
                <span className="font-accent font-semibold text-accent text-sm">Step 1 of 2</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
