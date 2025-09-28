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
import { Plane, Calendar, Users, MapPin, Search, ArrowRightLeft, Clock, Star, Plus, Minus } from "lucide-react";

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
    departureDate: "2025-01-15",
    returnDate: "2025-01-22",
    passengers: "2",
    cabin: "economy"
  });

  // Convert search params to Supabase Edge Function format - reactive to searchParams changes
  const flightSearchParams: FlightSearchParams = {
    origin: searchParams.from,
    destination: searchParams.to,
    departureDate: searchParams.departureDate,
    returnDate: searchParams.returnDate,
    passengers: parseInt(searchParams.passengers),
    cabin: searchParams.cabin
  };

  const { data, isLoading, error, refetch, isFetching } = useQuery<FlightSearchResult>({
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
    // Reset selected flights when doing a new search
    setSelectedOutbound(null);
    setSelectedReturn(null);
    
    // Trigger refetch with new search parameters
    // The query key will automatically update due to flightSearchParams changes
    refetch();
  };

  if (isLoading || isFetching) {
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

        {/* Kayak-Style Flight Search Form */}
        <div className="relative max-w-6xl mx-auto mb-12">
          <div className="glass-card p-6 md:p-8 rounded-2xl shadow-2xl border border-white/20 animate-luxury-slide-in">
            <div className="text-center mb-6">
              <h2 className="font-display text-2xl font-bold text-primary mb-2">Modify Your Search</h2>
              <p className="text-muted-foreground font-accent">Find the perfect flight for your journey</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              {/* From */}
              <div className="lg:col-span-2">
                <Label className="text-sm font-semibold text-primary mb-2 block">From</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-accent" />
                  <Input
                    value={searchParams.from}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, from: e.target.value }))}
                    placeholder="LAX"
                    className="pl-10 h-12 border-2 border-muted focus:border-accent rounded-lg bg-white/50 backdrop-blur font-medium"
                    data-testid="input-from"
                  />
                </div>
              </div>
              
              {/* To */}
              <div className="lg:col-span-2">
                <Label className="text-sm font-semibold text-primary mb-2 block">To</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-accent" />
                  <Input
                    value={searchParams.to}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="JFK"
                    className="pl-10 h-12 border-2 border-muted focus:border-accent rounded-lg bg-white/50 backdrop-blur font-medium"
                    data-testid="input-to"
                  />
                </div>
              </div>
              
              {/* Departure */}
              <div className="lg:col-span-2">
                <Label className="text-sm font-semibold text-primary mb-2 block">Departure</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-accent" />
                  <Input
                    type="date"
                    value={searchParams.departureDate}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, departureDate: e.target.value }))}
                    className="pl-10 h-12 border-2 border-muted focus:border-accent rounded-lg bg-white/50 backdrop-blur font-medium"
                    data-testid="input-departure"
                  />
                </div>
              </div>
              
              {/* Return */}
              <div className="lg:col-span-2">
                <Label className="text-sm font-semibold text-primary mb-2 block">Return</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-accent" />
                  <Input
                    type="date"
                    value={searchParams.returnDate}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, returnDate: e.target.value }))}
                    className="pl-10 h-12 border-2 border-muted focus:border-accent rounded-lg bg-white/50 backdrop-blur font-medium"
                    data-testid="input-return"
                  />
                </div>
              </div>
              
              {/* Passengers */}
              <div className="lg:col-span-2">
                <Label className="text-sm font-semibold text-primary mb-2 block">Passengers</Label>
                <div className="flex items-center border-2 border-muted rounded-lg bg-white/50 backdrop-blur h-12">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchParams(prev => ({ ...prev, passengers: Math.max(1, parseInt(prev.passengers) - 1).toString() }))}
                    className="h-full px-3 hover:bg-accent/10"
                    disabled={parseInt(searchParams.passengers) <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 text-center font-bold text-primary bg-transparent border-0">
                    {searchParams.passengers}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchParams(prev => ({ ...prev, passengers: Math.min(9, parseInt(prev.passengers) + 1).toString() }))}
                    className="h-full px-3 hover:bg-accent/10"
                    disabled={parseInt(searchParams.passengers) >= 9}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Cabin Class */}
              <div className="lg:col-span-1">
                <Label className="text-sm font-semibold text-primary mb-2 block">Class</Label>
                <select 
                  value={searchParams.cabin}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, cabin: e.target.value }))}
                  className="w-full h-12 border-2 border-muted focus:border-accent rounded-lg bg-white/50 backdrop-blur font-medium px-3"
                  data-testid="select-cabin"
                >
                  <option value="economy">Economy</option>
                  <option value="premium_economy">Premium</option>
                  <option value="business">Business</option>
                  <option value="first">First</option>
                </select>
              </div>
              
              {/* Search Button */}
              <div className="lg:col-span-1">
                <Button 
                  onClick={handleSearch} 
                  disabled={isFetching}
                  className="w-full h-12 bg-gradient-to-r from-accent to-luxury text-white font-bold rounded-lg hover:from-accent/90 hover:to-luxury/90 transition-all duration-300 shadow-lg" 
                  data-testid="button-search-flights"
                >
                  {isFetching ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 rounded-xl sticky top-6">
              <h3 className="font-display text-xl font-bold text-primary mb-6">Filter Flights</h3>
              
              {/* Sort Options */}
              <div className="mb-6">
                <Label className="text-sm font-semibold text-primary mb-3 block">Sort by</Label>
                <select className="w-full p-3 border-2 border-muted rounded-lg bg-white/50 backdrop-blur font-medium">
                  <option value="price">Price (Low to High)</option>
                  <option value="duration">Duration</option>
                  <option value="departure">Departure Time</option>
                  <option value="arrival">Arrival Time</option>
                </select>
              </div>
              
              {/* Price Range */}
              <div className="mb-6">
                <Label className="text-sm font-semibold text-primary mb-3 block">Price Range</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="price-low" className="rounded" />
                    <label htmlFor="price-low" className="text-sm">Under $300</label>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-auto">Great Deal</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="price-mid" className="rounded" />
                    <label htmlFor="price-mid" className="text-sm">$300 - $500</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="price-high" className="rounded" />
                    <label htmlFor="price-high" className="text-sm">$500+</label>
                  </div>
                </div>
              </div>
              
              {/* Airlines */}
              <div className="mb-6">
                <Label className="text-sm font-semibold text-primary mb-3 block">Airlines</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="american" className="rounded" />
                    <label htmlFor="american" className="text-sm">American Airlines</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="delta" className="rounded" />
                    <label htmlFor="delta" className="text-sm">Delta Airlines</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="united" className="rounded" />
                    <label htmlFor="united" className="text-sm">United Airlines</label>
                  </div>
                </div>
              </div>
              
              {/* Stops */}
              <div className="mb-6">
                <Label className="text-sm font-semibold text-primary mb-3 block">Stops</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="direct" className="rounded" />
                    <label htmlFor="direct" className="text-sm">Direct flights only</label>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-auto">Fastest</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="one-stop" className="rounded" />
                    <label htmlFor="one-stop" className="text-sm">1 stop or fewer</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Flight Results */}
          <div className="lg:col-span-3">
            {/* Social Proof & Urgency */}
            <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">127 people viewing flights to {searchParams.to}</span>
                </div>
                <div className="text-sm font-semibold text-orange-600">Book within 24h for best prices!</div>
              </div>
            </div>
            
            {/* Outbound Flights */}
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
      </div>
    </div>
  );
}
