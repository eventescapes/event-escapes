import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FlightCard from "@/components/flight-card";
import { FlightCardSkeleton } from "@/components/loading-skeleton";

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
  const [searchParams, setSearchParams] = useState({
    from: "LAX",
    to: "JFK",
    departureDate: "2024-07-15",
    returnDate: "2024-07-17",
    passengers: "2",
  });

  const { data, isLoading, error } = useQuery<FlightSearchResult>({
    queryKey: [`/api/flights/search?from=${searchParams.from}&to=${searchParams.to}&departureDate=${searchParams.departureDate}&returnDate=${searchParams.returnDate}&passengers=${searchParams.passengers}`],
  });

  const handleOutboundSelect = (flightId: string) => {
    setSelectedOutbound(flightId);
  };

  const handleReturnSelect = () => {
    setLocation('/checkout');
  };

  const handleSearch = () => {
    // Trigger new search with updated params
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse mb-8">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        
        <div className="space-y-6">
          {Array.from({ length: 3 }, (_, i) => (
            <FlightCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Error Loading Flights</h1>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-flights-title">
          Select Your Flights
        </h1>
        <p className="text-muted-foreground" data-testid="text-search-summary">
          {searchParams.from} to {searchParams.to} • {searchParams.departureDate} - {searchParams.returnDate} • {searchParams.passengers} passengers
        </p>
      </div>

      {/* Flight Search Form */}
      <div className="bg-card rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="from" className="block text-sm font-medium mb-2">From</Label>
            <Input
              id="from"
              type="text"
              value={`${searchParams.from} - Los Angeles`}
              onChange={(e) => setSearchParams(prev => ({ ...prev, from: e.target.value.split(' - ')[0] }))}
              data-testid="input-from"
            />
          </div>
          <div>
            <Label htmlFor="to" className="block text-sm font-medium mb-2">To</Label>
            <Input
              id="to"
              type="text"
              value={`${searchParams.to} - New York`}
              onChange={(e) => setSearchParams(prev => ({ ...prev, to: e.target.value.split(' - ')[0] }))}
              data-testid="input-to"
            />
          </div>
          <div>
            <Label htmlFor="departure" className="block text-sm font-medium mb-2">Departure</Label>
            <Input
              id="departure"
              type="date"
              value={searchParams.departureDate}
              onChange={(e) => setSearchParams(prev => ({ ...prev, departureDate: e.target.value }))}
              data-testid="input-departure"
            />
          </div>
          <div>
            <Label htmlFor="return" className="block text-sm font-medium mb-2">Return</Label>
            <Input
              id="return"
              type="date"
              value={searchParams.returnDate}
              onChange={(e) => setSearchParams(prev => ({ ...prev, returnDate: e.target.value }))}
              data-testid="input-return"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSearch} className="w-full" data-testid="button-search-flights">
              Search Flights
            </Button>
          </div>
        </div>
      </div>

      {/* Outbound Flights */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4" data-testid="text-outbound-title">
          Outbound Flights - {searchParams.departureDate}
        </h2>
        <div className="space-y-4">
          {data.outbound.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              onSelect={() => handleOutboundSelect(flight.id)}
              buttonText="Select Outbound"
              type="outbound"
            />
          ))}
        </div>
        
        {data.outbound.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground" data-testid="no-outbound-message">
              No outbound flights found. Try different dates or destinations.
            </p>
          </div>
        )}
      </div>

      {/* Return Flights - Only show if outbound is selected */}
      {selectedOutbound && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" data-testid="text-return-title">
            Return Flights - {searchParams.returnDate}
          </h2>
          <div className="space-y-4">
            {data.return.map((flight) => (
              <FlightCard
                key={flight.id}
                flight={flight}
                onSelect={handleReturnSelect}
                buttonText="Select & Continue"
                type="return"
              />
            ))}
          </div>
          
          {data.return.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground" data-testid="no-return-message">
                No return flights found. Try different dates.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!selectedOutbound && (
        <div className="text-center py-8">
          <p className="text-muted-foreground" data-testid="select-outbound-message">
            Please select an outbound flight to see return options.
          </p>
        </div>
      )}
    </div>
  );
}
