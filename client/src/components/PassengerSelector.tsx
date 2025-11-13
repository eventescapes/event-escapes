// PassengerSelector.tsx - Professional passenger type selector for Event Escapes

import React, { useState, useEffect } from 'react';

interface PassengerCount {
  adults: number;
  children: number;
  infantsOnLap: number;
  infantsWithSeat: number;
}

interface PassengerSelectorProps {
  value: PassengerCount;
  onChange: (counts: PassengerCount) => void;
  maxTotal?: number;  // Maximum total passengers (default: 9)
}

const PassengerSelector: React.FC<PassengerSelectorProps> = ({
  value,
  onChange,
  maxTotal = 9
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [counts, setCounts] = useState<PassengerCount>(value);

  // Calculate totals
  const totalPassengers = counts.adults + counts.children + counts.infantsWithSeat;
  const totalWithLapInfants = totalPassengers + counts.infantsOnLap;

  // Validation rules
  const canAddAdult = totalPassengers < maxTotal;
  const canAddChild = totalPassengers < maxTotal;
  const canAddInfantSeat = totalPassengers < maxTotal;
  const canAddInfantLap = counts.infantsOnLap < counts.adults; // 1 infant per adult rule
  
  const canRemoveAdult = counts.adults > 1; // Must have at least 1 adult
  const canRemoveChild = counts.children > 0;
  const canRemoveInfantSeat = counts.infantsWithSeat > 0;
  const canRemoveInfantLap = counts.infantsOnLap > 0;

  // Handle count changes
  const updateCount = (type: keyof PassengerCount, increment: boolean) => {
    const newCounts = { ...counts };
    
    if (increment) {
      newCounts[type] += 1;
    } else {
      newCounts[type] = Math.max(0, newCounts[type] - 1);
      
      // If removing adults, ensure infant-on-lap count doesn't exceed adults
      if (type === 'adults') {
        newCounts.infantsOnLap = Math.min(newCounts.infantsOnLap, newCounts[type]);
      }
    }
    
    setCounts(newCounts);
  };

  // Apply changes when "Done" is clicked
  const handleDone = () => {
    onChange(counts);
    setIsOpen(false);
  };

  // Generate summary text
  const getSummaryText = () => {
    const parts = [];
    
    if (counts.adults > 0) {
      parts.push(`${counts.adults} Adult${counts.adults > 1 ? 's' : ''}`);
    }
    if (counts.children > 0) {
      parts.push(`${counts.children} Child${counts.children > 1 ? 'ren' : ''}`);
    }
    if (counts.infantsOnLap > 0) {
      parts.push(`${counts.infantsOnLap} Infant${counts.infantsOnLap > 1 ? 's' : ''} (on lap)`);
    }
    if (counts.infantsWithSeat > 0) {
      parts.push(`${counts.infantsWithSeat} Infant${counts.infantsWithSeat > 1 ? 's' : ''} (seat)`);
    }
    
    return parts.join(', ');
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Users Icon (Heroicon) */}
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-gray-900 font-medium">
              {getSummaryText()}
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-6">
            
            {/* Adults */}
            <PassengerRow
              iconType="adult"
              label="Adults"
              description="Age 18+"
              count={counts.adults}
              onIncrement={() => updateCount('adults', true)}
              onDecrement={() => updateCount('adults', false)}
              canIncrement={canAddAdult}
              canDecrement={canRemoveAdult}
            />

            {/* Children */}
            <PassengerRow
              iconType="child"
              label="Children"
              description="Age 2-17"
              count={counts.children}
              onIncrement={() => updateCount('children', true)}
              onDecrement={() => updateCount('children', false)}
              canIncrement={canAddChild}
              canDecrement={canRemoveChild}
            />

            {/* Infants on Lap */}
            <PassengerRow
              iconType="infant"
              label="Infants on lap"
              description="Under 2 years"
              count={counts.infantsOnLap}
              onIncrement={() => updateCount('infantsOnLap', true)}
              onDecrement={() => updateCount('infantsOnLap', false)}
              canIncrement={canAddInfantLap}
              canDecrement={canRemoveInfantLap}
            />

            {/* Infants with Seat */}
            <PassengerRow
              iconType="infant"
              label="Infants in seat"
              description="Under 2 years"
              count={counts.infantsWithSeat}
              onIncrement={() => updateCount('infantsWithSeat', true)}
              onDecrement={() => updateCount('infantsWithSeat', false)}
              canIncrement={canAddInfantSeat}
              canDecrement={canRemoveInfantSeat}
            />

            {/* Validation Messages */}
            <div className="mt-4 space-y-2">
              {/* Max passengers warning */}
              {totalPassengers >= maxTotal && (
                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Maximum {maxTotal} passengers per booking</span>
                </div>
              )}

              {/* Infant rule explanation */}
              {counts.infantsOnLap > 0 && (
                <div className="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Each infant on lap must be accompanied by 1 adult</span>
                </div>
              )}

              {/* Lap infant limit reached */}
              {counts.infantsOnLap >= counts.adults && counts.adults > 0 && (
                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>
                    Add more adults to include more infants on lap
                    {counts.adults === 1 && ' (1 infant per adult)'}
                  </span>
                </div>
              )}
            </div>

            {/* Total Count Display */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Total passengers:</span>
                <span className="font-semibold text-gray-900">
                  {totalPassengers}
                  {counts.infantsOnLap > 0 && (
                    <span className="text-gray-500 font-normal">
                      {' '}+ {counts.infantsOnLap} lap infant{counts.infantsOnLap > 1 ? 's' : ''}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Done Button */}
            <button
              type="button"
              onClick={handleDone}
              className="w-full mt-4 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Done
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Passenger Row Component
interface PassengerRowProps {
  iconType: 'adult' | 'child' | 'infant';
  label: string;
  description: string;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  canIncrement: boolean;
  canDecrement: boolean;
}

const PassengerRow: React.FC<PassengerRowProps> = ({
  iconType,
  label,
  description,
  count,
  onIncrement,
  onDecrement,
  canIncrement,
  canDecrement
}) => {
  // Get the appropriate icon based on type
  const getIcon = () => {
    switch (iconType) {
      case 'adult':
        // User Icon (Heroicon)
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'child':
        // User Icon (smaller variant for child)
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'infant':
        // Heart Icon for infants (Heroicon)
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex flex-col justify-center">
          <div className="font-medium text-gray-900 leading-tight">{label}</div>
          <div className="text-sm text-gray-500 leading-tight mt-0.5">{description}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Decrement Button */}
        <button
          type="button"
          onClick={onDecrement}
          disabled={!canDecrement}
          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors ${
            canDecrement
              ? 'border-blue-500 text-blue-500 hover:bg-blue-50'
              : 'border-gray-300 text-gray-300 cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        {/* Count Display */}
        <span className="w-10 text-center font-semibold text-gray-900 text-base">
          {count}
        </span>

        {/* Increment Button */}
        <button
          type="button"
          onClick={onIncrement}
          disabled={!canIncrement}
          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors ${
            canIncrement
              ? 'border-blue-500 text-blue-500 hover:bg-blue-50'
              : 'border-gray-300 text-gray-300 cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PassengerSelector;
