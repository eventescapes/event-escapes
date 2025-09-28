import { useState, useEffect, useRef } from 'react';
import type { FlightSearchResponseRaw, FlightSearchResponse } from '@/types/flights';
import { baseCard, brandSelected, selectedCard } from '@/components/SelectedCardStyles';
import TripSummary from '@/components/TripSummary';

interface Flight {
  id: string;
  airline: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  stops: string;
  price: number;
  currency: string;
}

const FlightSearch = () => {
  const [searchParams, setSearchParams] = useState({
    from: 'LAX',
    to: 'JFK',
    departDate: '2025-10-05',
    returnDate: '2025-10-12',
    passengers: 1
  });

  const [flights, setFlights] = useState<{ outbound: any[]; inbound: any[] }>({ outbound: [], inbound: [] });
  const [selectedFlights, setSelectedFlights] = useState<{
    outbound: Flight | null;
    return: Flight | null;
  }>({
    outbound: null,
    return: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const returnRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);

  // Environment validation on component mount
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const debug = {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined',
      keyPreview: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'undefined',
      fullEndpoint: supabaseUrl ? `${supabaseUrl}/functions/v1/flights-search` : 'Cannot construct - URL missing'
    };
    
    setDebugInfo(debug);
    console.log('Environment Check:', debug);
    
    if (!supabaseUrl || !supabaseKey) {
      setError('Missing environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Replit Secrets.');
    }
  }, []);

  const handleInputChange = (field: string, value: string | number) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const searchFlights = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('=== FLIGHT SEARCH STARTING ===');
    console.log('Search params:', searchParams);
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      setError('Environment variables not configured. Check Replit Secrets for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }
    
    const endpoint = `${supabaseUrl}/functions/v1/flights-search`;
    console.log('Calling endpoint:', endpoint);
    console.log('Using auth key:', supabaseKey.substring(0, 20) + '...');
    
    setLoading(true);
    setError(null);
    setSelectedFlights({ outbound: null, return: null });
    
    const requestBody = {
      origin: searchParams.from,
      destination: searchParams.to,
      departureDate: searchParams.departDate,
      returnDate: searchParams.returnDate,
      passengers: searchParams.passengers
    };
    
    console.log('Request body:', requestBody);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        throw new Error('Server returned non-JSON response. Check if the endpoint is correct.');
      }

      const raw = await response.json();
      console.log('Flight data received:', raw);
      
      if (raw.error) {
        throw new Error(raw.error);
      }
      
      const normalize = (raw: FlightSearchResponseRaw): FlightSearchResponse => ({
        outbound: raw?.outbound ?? [],
        inbound: raw?.inbound ?? (raw && raw["return"]) ?? [],
        total_offers: raw?.total_offers,
      });

      const data = normalize(raw);
      setFlights({ outbound: data.outbound, inbound: data.inbound });
      
    } catch (err) {
      console.error('Flight search error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Search failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFlightSelect = (flight: Flight, type: 'outbound' | 'return') => {
    console.log(`Selecting ${type} flight:`, flight);
    setSelectedFlights(prev => ({
      ...prev,
      [type]: flight
    }));
    
    // Auto-scroll to Return section after selecting outbound flight
    if (type === 'outbound') {
      setTimeout(() => {
        returnRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
    
    // Auto-scroll to Trip Summary after selecting return flight (desktop only)
    if (type === 'return') {
      // only on desktop (matches md breakpoint)
      if (window.matchMedia("(min-width: 768px)").matches) {
        setTimeout(() => {
          summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
      }
    }
  };

  const getTotalPrice = () => {
    const outboundPrice = selectedFlights.outbound?.price || 0;
    const returnPrice = selectedFlights.return?.price || 0;
    return (outboundPrice + returnPrice) * searchParams.passengers;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      <div className="md:grid md:grid-cols-[1fr_320px] md:gap-6">
        <div>
      {/* Environment Status */}
      {debugInfo && (
        <div className={`border rounded-lg p-4 mb-6 ${debugInfo.hasSupabaseUrl && debugInfo.hasSupabaseKey ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`} data-testid="environment-status">
          <h3 className="font-medium mb-2" data-testid="text-environment-title">Environment Status</h3>
          <div className="text-sm space-y-1">
            <div data-testid="text-supabase-url-status">Supabase URL: {debugInfo.hasSupabaseUrl ? '✓ Connected' : '✗ Missing'}</div>
            <div data-testid="text-supabase-key-status">Supabase Key: {debugInfo.hasSupabaseKey ? '✓ Available' : '✗ Missing'}</div>
            <div className="text-xs text-gray-600" data-testid="text-endpoint">Endpoint: {debugInfo.fullEndpoint}</div>
          </div>
        </div>
      )}

      {/* Search Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8" data-testid="form-flight-search">
        <h2 className="text-2xl font-bold mb-6 text-center" data-testid="text-search-title">Search Real Flights</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">From</label>
            <input
              type="text"
              value={searchParams.from}
              onChange={(e) => handleInputChange('from', e.target.value.toUpperCase())}
              placeholder="LAX"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              maxLength={3}
              data-testid="input-from"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">To</label>
            <input
              type="text"
              value={searchParams.to}
              onChange={(e) => handleInputChange('to', e.target.value.toUpperCase())}
              placeholder="JFK"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              maxLength={3}
              data-testid="input-to"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Depart</label>
            <input
              type="date"
              value={searchParams.departDate}
              onChange={(e) => handleInputChange('departDate', e.target.value)}
              min="2025-09-29"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="input-departure"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Return</label>
            <input
              type="date"
              value={searchParams.returnDate}
              onChange={(e) => handleInputChange('returnDate', e.target.value)}
              min={searchParams.departDate}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="input-return"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Passengers</label>
            <select
              value={searchParams.passengers}
              onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="select-passengers"
            >
              {[1,2,3,4,5,6].map(num => (
                <option key={num} value={num}>{num} passenger{num > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={searchFlights}
              disabled={loading || !debugInfo?.hasSupabaseUrl || !debugInfo?.hasSupabaseKey}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-medium"
              data-testid="button-search-flights"
            >
              {loading ? 'Searching...' : 'Search Flights'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" data-testid="error-display">
          <div className="flex items-start">
            <span className="text-red-500 text-xl mr-3">⚠️</span>
            <div className="flex-1">
              <h4 className="text-red-800 font-medium" data-testid="text-error-title">Search Error</h4>
              <p className="text-red-700 text-sm mt-1" data-testid="text-error-message">{error}</p>
              <details className="mt-2">
                <summary className="text-xs text-red-600 cursor-pointer" data-testid="button-debug-info">Debug Info</summary>
                <pre className="text-xs mt-1 p-2 bg-red-100 rounded overflow-x-auto" data-testid="text-debug-info">
{debugInfo ? JSON.stringify(debugInfo, null, 2) : 'No debug info available'}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Flight Results */}
      {(flights.outbound?.length > 0 || flights.inbound?.length > 0) && (
        <div className="space-y-8" data-testid="results-container">
          {/* Results Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4" data-testid="results-summary">
            <h3 className="font-medium text-green-800" data-testid="text-results-title">Search Results</h3>
            <p className="text-sm text-green-700" data-testid="text-results-count">
              Found {flights.outbound.length} outbound and {flights.inbound.length} return flights.
            </p>
          </div>

          {/* Outbound Flights */}
          {flights.outbound?.length > 0 && (
            <div data-testid="section-outbound">
              <h3 className="text-xl font-bold mb-4 flex items-center" data-testid="text-outbound-title">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-3">Outbound</span>
                {searchParams.from} → {searchParams.to}
              </h3>
              <div className="space-y-4">
                {flights.outbound.map((flight, index) => (
                  <div 
                    key={flight.id || index}
                    className={`p-6 ${baseCard} ${
                      selectedFlights.outbound?.id === flight.id 
                        ? `${selectedCard} ${brandSelected}` 
                        : 'border-gray-200 bg-white'
                    }`}
                    data-testid={`card-outbound-flight-${index}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-medium" data-testid={`text-airline-${index}`}>
                            {flight.airline || 'Airline'}
                          </span>
                          <span className="ml-3 text-gray-600 text-sm" data-testid={`text-flight-number-${index}`}>
                            {flight.flight_number || `Flight ${index + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="font-bold text-xl" data-testid={`text-departure-time-${index}`}>{flight.departure_time || 'N/A'}</div>
                            <div className="text-gray-600 text-sm" data-testid={`text-departure-airport-${index}`}>{searchParams.from}</div>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-sm text-gray-600" data-testid={`text-duration-${index}`}>{flight.duration || 'N/A'}</div>
                            <div className="border-t border-gray-300 my-2 relative">
                              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-white px-2">✈️</div>
                            </div>
                            <div className="text-xs text-gray-500" data-testid={`text-stops-${index}`}>{flight.stops || 'N/A'}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-xl" data-testid={`text-arrival-time-${index}`}>{flight.arrival_time || 'N/A'}</div>
                            <div className="text-gray-600 text-sm" data-testid={`text-arrival-airport-${index}`}>{searchParams.to}</div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-8 text-right">
                        <div className="text-3xl font-bold text-green-600 mb-1" data-testid={`text-price-${index}`}>
                          ${flight.price ? Math.round(flight.price) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600 mb-3" data-testid={`text-currency-${index}`}>{flight.currency || 'USD'}</div>
                        <button
                          onClick={() => handleFlightSelect(flight, 'outbound')}
                          className={`px-4 py-2 rounded-xl font-medium transition-all ${
                            selectedFlights.outbound?.id === flight.id
                              ? 'bg-green-600 text-white shadow'
                              : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                          }`}
                          data-testid={`button-select-outbound-${index}`}
                        >
                          {selectedFlights.outbound?.id === flight.id ? 'Selected ✓' : 'Select Flight'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Return Flights */}
          {flights.inbound?.length > 0 ? (
            <div ref={returnRef} data-testid="section-return">
              <h3 className="text-xl font-bold mb-4 flex items-center" data-testid="text-return-title">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-3">Return</span>
                {searchParams.to} → {searchParams.from}
              </h3>
              <div className="space-y-4">
                {flights.inbound.map((flight, index) => (
                  <div 
                    key={flight.id || index}
                    className={`p-6 ${baseCard} ${
                      selectedFlights.return?.id === flight.id 
                        ? `${selectedCard} ${brandSelected}` 
                        : 'border-gray-200 bg-white'
                    }`}
                    data-testid={`card-return-flight-${index}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium" data-testid={`text-return-airline-${index}`}>
                            {flight.airline || 'Airline'}
                          </span>
                          <span className="ml-3 text-gray-600 text-sm" data-testid={`text-return-flight-number-${index}`}>
                            {flight.flight_number || `Flight ${index + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="font-bold text-xl" data-testid={`text-return-departure-time-${index}`}>{flight.departure_time || 'N/A'}</div>
                            <div className="text-gray-600 text-sm" data-testid={`text-return-departure-airport-${index}`}>{searchParams.to}</div>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-sm text-gray-600" data-testid={`text-return-duration-${index}`}>{flight.duration || 'N/A'}</div>
                            <div className="border-t border-gray-300 my-2 relative">
                              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-white px-2">✈️</div>
                            </div>
                            <div className="text-xs text-gray-500" data-testid={`text-return-stops-${index}`}>{flight.stops || 'N/A'}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-xl" data-testid={`text-return-arrival-time-${index}`}>{flight.arrival_time || 'N/A'}</div>
                            <div className="text-gray-600 text-sm" data-testid={`text-return-arrival-airport-${index}`}>{searchParams.from}</div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-8 text-right">
                        <div className="text-3xl font-bold text-green-600 mb-1" data-testid={`text-return-price-${index}`}>
                          ${flight.price ? Math.round(flight.price) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600 mb-3" data-testid={`text-return-currency-${index}`}>{flight.currency || 'USD'}</div>
                        <button
                          onClick={() => handleFlightSelect(flight, 'return')}
                          className={`px-4 py-2 rounded-xl font-medium transition-all ${
                            selectedFlights.return?.id === flight.id
                              ? 'bg-green-600 text-white shadow'
                              : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                          }`}
                          data-testid={`button-select-return-${index}`}
                        >
                          {selectedFlights.return?.id === flight.id ? 'Selected ✓' : 'Select Flight'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No return flights for these dates.</div>
          )}

        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16" data-testid="loading-container">
          <div className="inline-flex items-center px-6 py-4 font-semibold leading-6 text-lg shadow-lg rounded-lg text-white bg-gradient-to-r from-blue-500 to-purple-500" data-testid="loading-indicator">
            <svg className="animate-spin -ml-1 mr-4 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Searching flights via Duffel API...
          </div>
          <p className="text-gray-600 mt-4" data-testid="text-loading-description">Connecting to your working backend</p>
        </div>
      )}

      {/* No Results */}
      {(!flights.outbound || flights.outbound.length === 0) && !loading && (
        <div className="text-center py-16" data-testid="no-results-container">
          <div className="text-6xl mb-4">✈️</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2" data-testid="text-no-results-title">No flights found</h3>
          <p className="text-gray-600 mb-6" data-testid="text-no-results-message">
            No flights available for this route and date combination
          </p>
          <button
            onClick={() => setFlights({ outbound: [], inbound: [] })}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            data-testid="button-try-new-search"
          >
            Try New Search
          </button>
        </div>
      )}
        </div>

        <div ref={summaryRef}>
          <TripSummary
            outbound={{
              price: selectedFlights.outbound?.price ? { amount: selectedFlights.outbound.price, currency: selectedFlights.outbound.currency || 'USD' } : undefined,
              carrier: selectedFlights.outbound?.airline,
            }}
            inbound={{
              price: selectedFlights.return?.price ? { amount: selectedFlights.return.price, currency: selectedFlights.return.currency || 'USD' } : undefined,
              carrier: selectedFlights.return?.airline,
            }}
            passengers={searchParams.passengers}
            onContinue={() => {
              console.log('Continue to payment clicked');
              // Future: navigate to checkout/payment page
            }}
          />
        </div>
      </div>

      {/* Mobile sticky total */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40">
        <div className="mx-4 mb-4 rounded-2xl bg-white shadow-xl border p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-base font-semibold">
              {(selectedFlights.return?.currency || selectedFlights.outbound?.currency || "USD").toUpperCase()} $
              {(((selectedFlights.outbound?.price||0) + (selectedFlights.return?.price||0)) * searchParams.passengers).toFixed(0)}
            </div>
          </div>
          <button
            disabled={!(selectedFlights.outbound && selectedFlights.return)}
            onClick={() => console.log('Mobile continue clicked')}
            className={
              "px-5 py-3 rounded-xl text-white font-medium " +
              ((selectedFlights.outbound && selectedFlights.return) ? "bg-green-600" : "bg-gray-300")
            }
          >
            {(selectedFlights.outbound && selectedFlights.return) ? "Continue" : "Select flights"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlightSearch;