import { useState } from 'react';
import { getAirlineName, getAirlineCode, fmtTime, fmtIsoDur, stopsLabel, plusOneDayFlag, formatCabin } from '@/utils/formatters';
import { Plane, Clock, ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SegmentList } from './SegmentList';

interface FlightCardProps {
  offer: any;
  onSelect: (offer: any) => void;
  isLoading?: boolean;
}

export function FlightCard({ offer, onSelect, isLoading = false }: FlightCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!offer || !offer.slices) {
    return null;
  }

  const formatPrice = (amount: string | number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(Number(amount));
  };

  const airlineName = getAirlineName(offer);
  const airlineCode = getAirlineCode(offer);

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden"
      data-testid={`flight-card-${offer.id}`}
    >
      {/* Main card content */}
      <div className="p-6">
        {/* Each slice */}
        {offer.slices.map((slice: any, sliceIndex: number) => {
          const firstSegment = slice.segments?.[0];
          const lastSegment = slice.segments?.[slice.segments.length - 1];
          
          if (!firstSegment || !lastSegment) return null;

          const isNextDay = plusOneDayFlag(firstSegment.departing_at, lastSegment.arriving_at);
          const stops = slice.segments.length - 1;
          const cabin = firstSegment.passengers?.[0]?.cabin_class;

          return (
            <div key={sliceIndex} className={sliceIndex > 0 ? 'mt-4 pt-4 border-t border-slate-200' : ''}>
              <div className="flex items-center justify-between gap-4">
                {/* Airline */}
                <div className="w-32 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {airlineCode && (
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-700">
                        {airlineCode}
                      </div>
                    )}
                    <div className="text-sm font-medium text-slate-700 truncate">
                      {airlineName}
                    </div>
                  </div>
                </div>

                {/* Route */}
                <div className="flex-1 flex items-center justify-between">
                  {/* Departure */}
                  <div className="text-left">
                    <div className="text-2xl font-bold text-slate-900">
                      {fmtTime(firstSegment.departing_at)}
                    </div>
                    <div className="text-sm font-medium text-slate-700">
                      {firstSegment.origin.iata_code}
                    </div>
                  </div>

                  {/* Flight info */}
                  <div className="flex-1 px-4 max-w-xs">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-full h-px bg-slate-300" />
                      <Plane className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="w-full h-px bg-slate-300" />
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                      <Clock className="w-3 h-3" />
                      <span>{fmtIsoDur(slice.duration)}</span>
                    </div>
                    <div className="text-center text-xs text-slate-500 mt-1">
                      {stopsLabel(stops)}
                    </div>
                  </div>

                  {/* Arrival */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">
                      {fmtTime(lastSegment.arriving_at)}
                      {isNextDay && (
                        <span className="ml-1 text-sm text-orange-600 font-normal">+1</span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-700">
                      {lastSegment.destination.iata_code}
                    </div>
                  </div>
                </div>

                {/* Price and action */}
                <div className="w-48 flex-shrink-0 text-right">
                  {sliceIndex === 0 && (
                    <>
                      <div className="text-3xl font-bold text-slate-900 mb-1">
                        {formatPrice(offer.total_amount, offer.total_currency)}
                      </div>
                      <Button
                        onClick={() => onSelect(offer)}
                        disabled={isLoading}
                        className="w-full"
                        data-testid={`button-select-${offer.id}`}
                      >
                        {isLoading ? 'Selecting...' : 'Select Flight'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Additional info for this slice */}
              {sliceIndex === 0 && (
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                  {cabin && (
                    <div className="flex items-center gap-1">
                      <span>{formatCabin(cabin)}</span>
                    </div>
                  )}
                  {offer.conditions?.fare_brand_name && (
                    <div className="px-2 py-1 bg-slate-100 rounded">
                      {offer.conditions.fare_brand_name}
                    </div>
                  )}
                  {offer.available_services?.some((s: any) => s.type === 'baggage') && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      <span>Baggage included</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expandable details */}
      <div className="border-t border-slate-200">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-6 py-3 flex items-center justify-center gap-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          data-testid={`button-toggle-details-${offer.id}`}
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide flight details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show flight details
            </>
          )}
        </button>

        {expanded && (
          <div className="px-6 pb-6 pt-2">
            {offer.slices.map((slice: any, index: number) => (
              <div key={index} className={index > 0 ? 'mt-6 pt-6 border-t border-slate-200' : ''}>
                {index > 0 && (
                  <h4 className="font-semibold text-slate-900 mb-4">
                    Return Flight
                  </h4>
                )}
                <SegmentList segments={slice.segments || []} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
