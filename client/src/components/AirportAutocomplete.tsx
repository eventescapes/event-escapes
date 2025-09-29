import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin } from 'lucide-react';

interface Airport {
  iata_code: string;
  name: string;
  city: string;
  country: string;
}

interface AirportAutocompleteProps {
  value: string;
  onChange: (airportCode: string) => void;
  placeholder: string;
  label?: string;
  className?: string;
}

export default function AirportAutocomplete({ 
  value, 
  onChange, 
  placeholder, 
  label,
  className = '' 
}: AirportAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Popular airports as initial suggestions
  const popularAirports = [
    { iata_code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'USA' },
    { iata_code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA' },
    { iata_code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK' },
    { iata_code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE' }
  ];

  // Initialize input value from props
  useEffect(() => {
    if (value && !inputValue) {
      setInputValue(value);
    }
  }, [value]);

  // Debounced search function
  useEffect(() => {
    console.log('🔍 Input value changed:', inputValue, 'Length:', inputValue.length);
    
    if (inputValue.length >= 2) {
      console.log('🔍 Input long enough, setting up debounced search...');
      
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        console.log('🔍 Cleared previous timeout');
      }
      
      debounceRef.current = setTimeout(() => {
        console.log('🔍 Debounce timeout triggered, calling searchAirports');
        searchAirports(inputValue);
      }, 300); // 300ms delay
    } else {
      console.log('🔍 Input too short, clearing suggestions');
      setSuggestions([]);
      setIsOpen(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        suggestionsRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAirports = async (query: string) => {
    try {
      setLoading(true);
      
      console.log('🔍 AIRPORT SEARCH DEBUG - Starting search for:', query);
      console.log('🔍 Input length:', query.length);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('🔍 Environment check:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey,
        supabaseUrl: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING'
      });
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase environment variables');
        return;
      }

      console.log('🔍 Making API call to airport-search...');

      const response = await fetch(`${supabaseUrl}/functions/v1/airport-search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseKey
        },
        body: JSON.stringify({ query })
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Airport search API response:', data);
        
        if (data.airports && data.airports.length > 0) {
          console.log('✅ Found airports:', data.airports.length);
          setSuggestions(data.airports);
          setIsOpen(true);
          console.log('✅ Set suggestions and opened dropdown');
        } else {
          console.warn('⚠️ API returned empty airports array:', data);
          setSuggestions([]);
          setIsOpen(false);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Airport search API error:', response.status, errorText);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('❌ Airport search fetch error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
      console.log('🔍 Airport search completed');
    }
  };

  // Component mount debug
  useEffect(() => {
    console.log('🔧 AirportAutocomplete mounted');
    console.log('🔧 Environment check:', {
      NODE_ENV: import.meta.env.MODE,
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'EXISTS' : 'MISSING',
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING'
    });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('📝 Input changed from', inputValue, 'to', newValue);
    setInputValue(newValue);
    
    // If user clears input, clear the selected value
    if (newValue === '') {
      console.log('📝 Input cleared, clearing selection');
      onChange('');
    }
  };

  const handleAirportSelect = (airport: Airport) => {
    const displayText = `${airport.iata_code} - ${airport.name}`;
    setInputValue(displayText);
    onChange(airport.iata_code);
    setIsOpen(false);
    setSuggestions([]);
    
    console.log('✈️ Selected airport:', airport);
  };

  const handleInputFocus = () => {
    if (inputValue === '' || inputValue.length < 2) {
      setSuggestions(popularAirports);
      setIsOpen(true);
    } else if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Debug Test Buttons - Development Only */}
      {import.meta.env.MODE === 'development' && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <h3 className="text-sm font-bold mb-2">Airport Autocomplete Debug</h3>
          <div className="flex gap-2 mb-2">
            <button 
              onClick={() => {
                console.log('🧪 Testing airport search directly...');
                searchAirports('la');
              }}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
            >
              Test Search "la"
            </button>
            
            <button 
              onClick={() => {
                console.log('🧪 Testing environment variables...');
                console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING');
                console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
              }}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm"
            >
              Test Environment
            </button>
          </div>
          <div className="text-xs text-gray-600">
            Debug: loading={loading.toString()}, isOpen={isOpen.toString()}, suggestions={suggestions.length}, inputLength={inputValue.length}
          </div>
        </div>
      )}
      
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          autoComplete="off"
          data-testid={`airport-autocomplete-${label?.toLowerCase().replace(/\s+/g, '-') || 'input'}`}
        />
        
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
        
        {loading && (
          <div className="absolute right-3 top-3.5">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          style={{ zIndex: 9999 }}
          data-testid="airport-suggestions-dropdown"
        >
          {suggestions.map((airport, index) => (
            <button
              key={`${airport.iata_code}-${index}`}
              onClick={() => handleAirportSelect(airport)}
              className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none transition-colors"
              data-testid={`airport-suggestion-${airport.iata_code}`}
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-blue-600">{airport.iata_code}</span>
                    <span className="text-gray-900 font-medium">{airport.name}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {airport.city}
                    {airport.country && airport.city && ', '}
                    {airport.country}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && !loading && inputValue.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <div className="text-gray-500 text-center" data-testid="no-airports-found">
            No airports found for "{inputValue}"
          </div>
        </div>
      )}
    </div>
  );
}