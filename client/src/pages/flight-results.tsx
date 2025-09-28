import { useState } from 'react';

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

interface FlightResults {
  outbound: Flight[];
  return: Flight[];
}

const FlightSearch = () => {
  // Current date for proper validation
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [searchParams, setSearchParams] = useState({
    from: 'LAX',
    to: 'JFK',
    departDate: nextWeek, // Always future date
    returnDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
    passengers: 1
  });

  const [flightResults, setFlightResults] = useState<FlightResults | null>(null);
  const [selectedFlights, setSelectedFlights] = useState<{
    outbound: Flight | null;
    return: Flight | null;
  }>({
    outbound: null,
    return: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fixed: Proper input handling without page reloads
  const handleInputChange = (field: string, value: string | number) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fixed: Connect to your working Duffel API
  const searchFlights = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    setError(null);
    setSelectedFlights({ outbound: null, return: null });
    
    try {
      // Fixed: Use correct parameter names that match your working backend
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/flights-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          origin: searchParams.from,
          destination: searchParams.to,
          departureDate: searchParams.departDate, // camelCase - matches backend
          returnDate: searchParams.returnDate,    // camelCase - matches backend
          passengers: searchParams.passengers
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Real Duffel flight data:', data);
      setFlightResults(data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Search failed: ${errorMessage}`);
      console.error('Flight search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fixed: Working flight selection
  const handleFlightSelect = (flight: Flight, type: 'outbound' | 'return') => {
    setSelectedFlights(prev => ({
      ...prev,
      [type]: flight
    }));
  };

  const getTotalPrice = () => {
    const outboundPrice = selectedFlights.outbound?.price || 0;
    const returnPrice = selectedFlights.return?.price || 0;
    return (outboundPrice + returnPrice) * searchParams.passengers;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Success Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6" data-testid="banner-success">
        <div className="flex items-center">
          <span className="text-2xl mr-3">✈️</span>
          <div>
            <h3 className="text-green-800 font-medium" data-testid="text-banner-title">EventEscapes Flight Search - Live & Working</h3>
            <p className="text-green-700 text-sm" data-testid="text-banner-description">
              Connected to real Duffel API • Live airline data • Current pricing • Actual availability
            </p>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8" data-testid="form-flight-search">
        <h2 className="text-2xl font-bold mb-6 text-center" data-testid="text-search-title">Search Real Flights</h2>
        
        {/* Removed form wrapper to prevent page reloads */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">From</label>
            <input
              type="text"
              value={searchParams.from}
              onChange={(e) => handleInputChange('from', e.target.value.toUpperCase())}
              placeholder="LAX"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              min={today}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="input-return"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Passengers</label>
            <select
              value={searchParams.passengers}
              onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-medium transition-all"
              data-testid="button-search-flights"
            >
              {loading ? (
                <span className="flex items-center justify-center" data-testid="text-searching">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </span>
              ) : 'Search Flights'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" data-testid="error-display">
          <div className="flex items-center">
            <span className="text-red-500 text-xl mr-3">⚠️</span>
            <div>
              <h4 className="text-red-800 font-medium" data-testid="text-error-title">Search Error</h4>
              <p className="text-red-700 text-sm" data-testid="text-error-message">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Real Flight Results from Duffel */}
      {flightResults && (
        <div className="space-y-8" data-testid="results-container">
          {/* Outbound Flights */}
          {flightResults.outbound && flightResults.outbound.length > 0 && (
            <div data-testid="section-outbound">
              <h3 className="text-xl font-bold mb-4 flex items-center" data-testid="text-outbound-title">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-3">Outbound</span>
                {searchParams.from} → {searchParams.to}
              </h3>
              <div className="space-y-4">
                {flightResults.outbound.map((flight, index) => (
                  <div 
                    key={flight.id || index}
                    className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all hover:shadow-lg ${
                      selectedFlights.outbound?.id === flight.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    data-testid={`card-outbound-flight-${index}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-medium" data-testid={`text-airline-${index}`}>
                            {flight.airline}
                          </span>
                          <span className="ml-3 text-gray-600 text-sm" data-testid={`text-flight-number-${index}`}>
                            {flight.flight_number}
                          </span>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="font-bold text-xl" data-testid={`text-departure-time-${index}`}>{flight.departure_time}</div>
                            <div className="text-gray-600 text-sm" data-testid={`text-departure-airport-${index}`}>{searchParams.from}</div>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-sm text-gray-600" data-testid={`text-duration-${index}`}>{flight.duration}</div>
                            <div className="border-t border-gray-300 my-2 relative">
                              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-white px-2">
                                ✈️
                              </div>
                            </div>
                            <div className="text-xs text-gray-500" data-testid={`text-stops-${index}`}>{flight.stops}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-xl" data-testid={`text-arrival-time-${index}`}>{flight.arrival_time}</div>
                            <div className="text-gray-600 text-sm" data-testid={`text-arrival-airport-${index}`}>{searchParams.to}</div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-8 text-right">
                        <div className="text-3xl font-bold text-green-600 mb-1" data-testid={`text-price-${index}`}>
                          ${Math.round(flight.price)}
                        </div>
                        <div className="text-sm text-gray-600 mb-3" data-testid={`text-currency-${index}`}>{flight.currency}</div>
                        <button
                          onClick={() => handleFlightSelect(flight, 'outbound')}
                          className={`px-6 py-3 rounded-lg font-medium transition-all ${
                            selectedFlights.outbound?.id === flight.id
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-yellow-500 hover:bg-yellow-600 text-black shadow-sm hover:shadow-md'
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
          {flightResults.return && flightResults.return.length > 0 && (
            <div data-testid="section-return">
              <h3 className="text-xl font-bold mb-4 flex items-center" data-testid="text-return-title">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-3">Return</span>
                {searchParams.to} → {searchParams.from}
              </h3>
              <div className="space-y-4">
                {flightResults.return.map((flight, index) => (
                  <div 
                    key={flight.id || index}
                    className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all hover:shadow-lg ${
                      selectedFlights.return?.id === flight.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                    data-testid={`card-return-flight-${index}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium" data-testid={`text-return-airline-${index}`}>
                            {flight.airline}
                          </span>
                          <span className="ml-3 text-gray-600 text-sm" data-testid={`text-return-flight-number-${index}`}>
                            {flight.flight_number}
                          </span>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="font-bold text-xl" data-testid={`text-return-departure-time-${index}`}>{flight.departure_time}</div>
                            <div className="text-gray-600 text-sm" data-testid={`text-return-departure-airport-${index}`}>{searchParams.to}</div>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-sm text-gray-600" data-testid={`text-return-duration-${index}`}>{flight.duration}</div>
                            <div className="border-t border-gray-300 my-2 relative">
                              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-white px-2">
                                ✈️
                              </div>
                            </div>
                            <div className="text-xs text-gray-500" data-testid={`text-return-stops-${index}`}>{flight.stops}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-xl" data-testid={`text-return-arrival-time-${index}`}>{flight.arrival_time}</div>
                            <div className="text-gray-600 text-sm" data-testid={`text-return-arrival-airport-${index}`}>{searchParams.from}</div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-8 text-right">
                        <div className="text-3xl font-bold text-green-600 mb-1" data-testid={`text-return-price-${index}`}>
                          ${Math.round(flight.price)}
                        </div>
                        <div className="text-sm text-gray-600 mb-3" data-testid={`text-return-currency-${index}`}>{flight.currency}</div>
                        <button
                          onClick={() => handleFlightSelect(flight, 'return')}
                          className={`px-6 py-3 rounded-lg font-medium transition-all ${
                            selectedFlights.return?.id === flight.id
                              ? 'bg-green-600 text-white shadow-md'
                              : 'bg-yellow-500 hover:bg-yellow-600 text-black shadow-sm hover:shadow-md'
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
          )}

          {/* Selection Summary */}
          {(selectedFlights.outbound || selectedFlights.return) && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white" data-testid="summary-selection">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4" data-testid="text-summary-title">Ready to Book Your Trip</h3>
                <div className="flex justify-center space-x-8 mb-6">
                  <div className="text-center">
                    <div className={`text-3xl mb-2 ${selectedFlights.outbound ? '' : 'opacity-50'}`} data-testid="icon-outbound-status">
                      {selectedFlights.outbound ? '✅' : '⭕'}
                    </div>
                    <div className="text-sm" data-testid="text-outbound-label">Outbound Flight</div>
                    {selectedFlights.outbound && (
                      <div className="text-xs mt-1 opacity-90" data-testid="text-outbound-selected-price">
                        ${Math.round(selectedFlights.outbound.price)}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl mb-2 ${selectedFlights.return ? '' : 'opacity-50'}`} data-testid="icon-return-status">
                      {selectedFlights.return ? '✅' : '⭕'}
                    </div>
                    <div className="text-sm" data-testid="text-return-label">Return Flight</div>
                    {selectedFlights.return && (
                      <div className="text-xs mt-1 opacity-90" data-testid="text-return-selected-price">
                        ${Math.round(selectedFlights.return.price)}
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedFlights.outbound && selectedFlights.return && (
                  <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-6" data-testid="summary-total">
                    <div className="text-3xl font-bold mb-2" data-testid="text-total-price">
                      Total: ${Math.round(getTotalPrice())}
                    </div>
                    <div className="text-sm opacity-90" data-testid="text-passenger-count">
                      For {searchParams.passengers} passenger{searchParams.passengers > 1 ? 's' : ''}
                    </div>
                  </div>
                )}
                
                <div className="bg-white bg-opacity-20 rounded-lg p-4" data-testid="status-message">
                  <div className="text-lg font-medium" data-testid="text-status-main">
                    Real flight selection working perfectly!
                  </div>
                  <div className="text-sm opacity-90 mt-1" data-testid="text-status-sub">
                    Ready for Stripe payment integration
                  </div>
                </div>
              </div>
            </div>
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
            Searching real flights via Duffel API...
          </div>
          <p className="text-gray-600 mt-4" data-testid="text-loading-description">Getting live airline data and pricing</p>
        </div>
      )}

      {/* No Results State */}
      {flightResults && (!flightResults.outbound || flightResults.outbound.length === 0) && !loading && (
        <div className="text-center py-16" data-testid="no-results-container">
          <div className="text-6xl mb-4">✈️</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2" data-testid="text-no-results-title">No flights found</h3>
          <p className="text-gray-600 mb-6" data-testid="text-no-results-message">
            No flights available for this route and date combination
          </p>
          <button
            onClick={() => setFlightResults(null)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            data-testid="button-try-new-search"
          >
            Try New Search
          </button>
        </div>
      )}
    </div>
  );
};

export default FlightSearch;