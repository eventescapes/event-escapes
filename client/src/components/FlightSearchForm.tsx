import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Plane, Plus, X, Calendar, Users } from 'lucide-react';
import type { FlightSearchParams, TripType } from '@/types/flights';
import AirportAutocomplete from '@/components/AirportAutocomplete';

// Multi-city slice interface (matches types/flights.ts)
interface MultiCitySlice {
  id: string;
  origin: string;
  destination: string;
  departure_date: string;
}

const FlightSearchForm = () => {
  const [, navigate] = useLocation();

  // Flight search state
  const [searchParams, setSearchParams] = useState<FlightSearchParams>({
    tripType: 'return',
    from: '',
    to: '',
    departDate: '',
    returnDate: '',
    passengers: 1,
    cabinClass: 'economy',
    multiCitySlices: []
  });

  // Multi-city state
  const [multiCitySlices, setMultiCitySlices] = useState<MultiCitySlice[]>([
    { id: '1', origin: '', destination: '', departure_date: '' },
    { id: '2', origin: '', destination: '', departure_date: '' }
  ]);

  // Update search params when trip type changes
  const handleTripTypeChange = (tripType: TripType) => {
    setSearchParams(prev => ({ 
      ...prev, 
      tripType,
      multiCitySlices: tripType === 'multi-city' ? multiCitySlices : undefined
    }));
  };

  // Multi-city management
  const addCity = () => {
    if (multiCitySlices.length < 6) {
      const newSlice = { 
        id: Date.now().toString(), 
        origin: '', 
        destination: '', 
        departure_date: '' 
      };
      const updatedSlices = [...multiCitySlices, newSlice];
      setMultiCitySlices(updatedSlices);
      setSearchParams(prev => ({ ...prev, multiCitySlices: updatedSlices }));
    }
  };

  const removeCity = (id: string) => {
    if (multiCitySlices.length > 2) {
      const updatedSlices = multiCitySlices.filter(slice => slice.id !== id);
      setMultiCitySlices(updatedSlices);
      setSearchParams(prev => ({ ...prev, multiCitySlices: updatedSlices }));
    }
  };

  const updateMultiCitySlice = (id: string, field: keyof MultiCitySlice, value: string) => {
    const updatedSlices = multiCitySlices.map(slice => 
      slice.id === id ? { ...slice, [field]: value } : slice
    );
    setMultiCitySlices(updatedSlices);
    setSearchParams(prev => ({ ...prev, multiCitySlices: updatedSlices }));
  };

  // Validate airport codes (IATA format)
  const validateAirportCode = (code: string): boolean => {
    // Basic IATA code validation: 3 letters
    const iataRegex = /^[A-Z]{3}$/;
    return iataRegex.test(code.trim().toUpperCase());
  };

  // Validate dates (each date must be after previous)
  const validateDates = () => {
    if (searchParams.tripType === 'multi-city') {
      for (let i = 1; i < multiCitySlices.length; i++) {
        const prevDate = new Date(multiCitySlices[i - 1].departure_date);
        const currDate = new Date(multiCitySlices[i].departure_date);
        if (currDate <= prevDate) {
          return `Date for slice ${i + 1} must be after the previous date`;
        }
      }
    }
    return null;
  };

  // Handle search submission
  const handleSearch = () => {
    // Airport code validation
    if (searchParams.tripType !== 'multi-city') {
      // Validate origin and destination airport codes
      if (!validateAirportCode(searchParams.from)) {
        alert(`Invalid departure airport code: ${searchParams.from}. Use 3-letter IATA codes like LAX.`);
        return;
      }
      
      if (!validateAirportCode(searchParams.to)) {
        alert(`Invalid destination airport code: ${searchParams.to}. Use 3-letter IATA codes like JFK.`);
        return;
      }
      
      if (searchParams.from.toUpperCase() === searchParams.to.toUpperCase()) {
        alert('Departure and destination airports must be different.');
        return;
      }
    } else {
      // Multi-city airport code validation
      for (let i = 0; i < multiCitySlices.length; i++) {
        const slice = multiCitySlices[i];
        if (slice.origin && !validateAirportCode(slice.origin)) {
          alert(`Invalid origin airport code in flight ${i + 1}: ${slice.origin}. Use 3-letter IATA codes like LAX.`);
          return;
        }
        if (slice.destination && !validateAirportCode(slice.destination)) {
          alert(`Invalid destination airport code in flight ${i + 1}: ${slice.destination}. Use 3-letter IATA codes like JFK.`);
          return;
        }
        if (slice.origin && slice.destination && slice.origin.toUpperCase() === slice.destination.toUpperCase()) {
          alert(`Flight ${i + 1}: Departure and destination airports must be different.`);
          return;
        }
      }
    }

    // Basic validation
    if (searchParams.tripType !== 'multi-city') {
      if (!searchParams.from || !searchParams.to || !searchParams.departDate) {
        alert('Please fill in all required fields');
        return;
      }
      if (searchParams.tripType === 'return' && !searchParams.returnDate) {
        alert('Please select a return date');
        return;
      }
    } else {
      // Multi-city validation
      const incompleteSlice = multiCitySlices.find(slice => 
        !slice.origin || !slice.destination || !slice.departure_date
      );
      if (incompleteSlice) {
        alert('Please complete all multi-city destinations and dates');
        return;
      }
      
      const dateError = validateDates();
      if (dateError) {
        alert(dateError);
        return;
      }
    }

    // Build URL parameters
    const params = new URLSearchParams();
    params.append('tripType', searchParams.tripType);
    params.append('passengers', searchParams.passengers.toString());
    params.append('cabinClass', searchParams.cabinClass || 'economy');

    if (searchParams.tripType === 'multi-city') {
      params.append('multiCitySlices', encodeURIComponent(JSON.stringify(multiCitySlices)));
    } else {
      params.append('from', searchParams.from);
      params.append('to', searchParams.to);
      params.append('departDate', searchParams.departDate);
      if (searchParams.tripType === 'return' && searchParams.returnDate) {
        params.append('returnDate', searchParams.returnDate);
      }
    }

    console.log('=== FLIGHT SEARCH NAVIGATION ===');
    console.log('Trip Type:', searchParams.tripType);
    console.log('URL Params:', params.toString());
    console.log('Multi-city slices:', multiCitySlices);

    // Navigate to flight results
    navigate(`/flights?${params.toString()}`);
  };

  return (
    <Card className="max-w-5xl mx-auto glass-card" data-testid="flight-search-form">
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <Plane className="h-6 w-6 text-accent" />
          <h3 className="text-2xl font-bold text-primary font-display">Flight Search</h3>
        </div>

        <Tabs 
          value={searchParams.tripType} 
          onValueChange={(value) => handleTripTypeChange(value as TripType)}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-3" data-testid="tabs-trip-type">
            <TabsTrigger value="one-way" data-testid="tab-one-way">One Way</TabsTrigger>
            <TabsTrigger value="return" data-testid="tab-return">Return</TabsTrigger>
            <TabsTrigger value="multi-city" data-testid="tab-multi-city">Multi-City</TabsTrigger>
          </TabsList>

          {/* One Way & Return */}
          <TabsContent value="one-way" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AirportAutocomplete
                value={searchParams.from}
                onChange={(code) => setSearchParams(prev => ({ ...prev, from: code }))}
                placeholder="From (city or airport code)"
                label="Departure"
                className=""
              />
              
              <AirportAutocomplete
                value={searchParams.to}
                onChange={(code) => setSearchParams(prev => ({ ...prev, to: code }))}
                placeholder="To (city or airport code)"
                label="Destination"
                className=""
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="departDate" className="font-accent font-semibold text-primary mb-2 block">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Departure Date
                </Label>
                <Input
                  id="departDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={searchParams.departDate}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, departDate: e.target.value }))}
                  className="focus-luxury h-12"
                  data-testid="input-depart-date"
                />
              </div>
              <div>
                <Label htmlFor="passengers" className="font-accent font-semibold text-primary mb-2 block">
                  <Users className="w-4 h-4 inline mr-2" />
                  Passengers
                </Label>
                <Select
                  value={searchParams.passengers.toString()}
                  onValueChange={(value) => setSearchParams(prev => ({ ...prev, passengers: parseInt(value) }))}
                >
                  <SelectTrigger className="focus-luxury h-12" data-testid="select-passengers">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} passenger{num > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cabinClass" className="font-accent font-semibold text-primary mb-2 block">
                  Cabin Class
                </Label>
                <Select
                  value={searchParams.cabinClass}
                  onValueChange={(value) => setSearchParams(prev => ({ ...prev, cabinClass: value as any }))}
                >
                  <SelectTrigger className="focus-luxury h-12" data-testid="select-cabin-class">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="premium_economy">Premium Economy</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="first">First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="return" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AirportAutocomplete
                value={searchParams.from}
                onChange={(code) => setSearchParams(prev => ({ ...prev, from: code }))}
                placeholder="From (city or airport code)"
                label="Departure"
                className=""
              />
              
              <AirportAutocomplete
                value={searchParams.to}
                onChange={(code) => setSearchParams(prev => ({ ...prev, to: code }))}
                placeholder="To (city or airport code)"
                label="Destination"
                className=""
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="departDate-return" className="font-accent font-semibold text-primary mb-2 block">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Departure
                </Label>
                <Input
                  id="departDate-return"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={searchParams.departDate}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, departDate: e.target.value }))}
                  className="focus-luxury h-12"
                  data-testid="input-depart-date-return"
                />
              </div>
              <div>
                <Label htmlFor="returnDate" className="font-accent font-semibold text-primary mb-2 block">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Return
                </Label>
                <Input
                  id="returnDate"
                  type="date"
                  min={searchParams.departDate || new Date().toISOString().split('T')[0]}
                  value={searchParams.returnDate || ''}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, returnDate: e.target.value }))}
                  className="focus-luxury h-12"
                  data-testid="input-return-date"
                />
              </div>
              <div>
                <Label className="font-accent font-semibold text-primary mb-2 block">
                  <Users className="w-4 h-4 inline mr-2" />
                  Passengers
                </Label>
                <Select
                  value={searchParams.passengers.toString()}
                  onValueChange={(value) => setSearchParams(prev => ({ ...prev, passengers: parseInt(value) }))}
                >
                  <SelectTrigger className="focus-luxury h-12" data-testid="select-passengers-return">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} passenger{num > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-accent font-semibold text-primary mb-2 block">
                  Cabin Class
                </Label>
                <Select
                  value={searchParams.cabinClass}
                  onValueChange={(value) => setSearchParams(prev => ({ ...prev, cabinClass: value as any }))}
                >
                  <SelectTrigger className="focus-luxury h-12" data-testid="select-cabin-class-return">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="premium_economy">Premium Economy</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="first">First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Multi-City */}
          <TabsContent value="multi-city" className="space-y-6">
            <div className="space-y-4">
              {multiCitySlices.map((slice, index) => (
                <div 
                  key={slice.id} 
                  className="relative border border-glass-border rounded-lg p-4 bg-glass-bg/30"
                  data-testid={`multi-city-slice-${index}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-primary font-accent">
                      Flight {index + 1}
                      {index > 0 && (
                        <span className="text-sm text-muted-foreground ml-2">
                          from {multiCitySlices[index - 1].destination}
                        </span>
                      )}
                    </h4>
                    {multiCitySlices.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCity(slice.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-remove-city-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <AirportAutocomplete
                      value={slice.origin}
                      onChange={(code) => updateMultiCitySlice(slice.id, 'origin', code)}
                      placeholder="From (city or airport code)"
                      label="From"
                      className=""
                    />
                    
                    <AirportAutocomplete
                      value={slice.destination}
                      onChange={(code) => updateMultiCitySlice(slice.id, 'destination', code)}
                      placeholder="To (city or airport code)"
                      label="To"
                      className=""
                    />
                    
                    <div>
                      <Label className="font-accent font-semibold text-primary mb-2 block">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Departure Date
                      </Label>
                      <Input
                        type="date"
                        min={
                          index === 0 
                            ? new Date().toISOString().split('T')[0]
                            : multiCitySlices[index - 1]?.departure_date || new Date().toISOString().split('T')[0]
                        }
                        value={slice.departure_date}
                        onChange={(e) => updateMultiCitySlice(slice.id, 'departure_date', e.target.value)}
                        className="focus-luxury h-12"
                        data-testid={`input-multi-city-date-${index}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {multiCitySlices.length < 6 && (
              <Button
                variant="outline"
                onClick={addCity}
                className="w-full border-dashed border-accent text-accent hover:bg-accent/10"
                data-testid="button-add-city"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another City (Max 6)
              </Button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-glass-border">
              <div>
                <Label className="font-accent font-semibold text-primary mb-2 block">
                  <Users className="w-4 h-4 inline mr-2" />
                  Passengers
                </Label>
                <Select
                  value={searchParams.passengers.toString()}
                  onValueChange={(value) => setSearchParams(prev => ({ ...prev, passengers: parseInt(value) }))}
                >
                  <SelectTrigger className="focus-luxury h-12" data-testid="select-passengers-multi-city">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} passenger{num > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-accent font-semibold text-primary mb-2 block">
                  Cabin Class
                </Label>
                <Select
                  value={searchParams.cabinClass}
                  onValueChange={(value) => setSearchParams(prev => ({ ...prev, cabinClass: value as any }))}
                >
                  <SelectTrigger className="focus-luxury h-12" data-testid="select-cabin-class-multi-city">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="premium_economy">Premium Economy</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="first">First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button 
            onClick={handleSearch}
            className="btn-luxury px-8 h-12 font-accent font-bold tracking-wide"
            data-testid="button-search-flights"
          >
            <Plane className="mr-2 h-5 w-5" />
            Search Flights
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlightSearchForm;