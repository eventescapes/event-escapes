import { getAirlineName, fmtTime, fmtIsoDur, stopsLabel, plusOneDayFlag, formatCabin } from '@/utils/formatters';
import { Plane, Clock, Users, Briefcase } from 'lucide-react';

interface ItineraryBarProps {
  offer: any;
  className?: string;
}

export function ItineraryBar({ offer, className = '' }: ItineraryBarProps) {
  if (!offer || !offer.slices) {
    return null;
  }

  const formatPrice = (amount: string | number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(Number(amount));
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`} data-testid="itinerary-bar">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Plane className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-lg text-slate-900">
              {getAirlineName(offer)}
            </h3>
            <div className="text-sm text-slate-600">
              {offer.slices[0]?.segments?.[0]?.passengers?.[0]?.cabin_class && (
                <span className="mr-2">{formatCabin(offer.slices[0].segments[0].passengers[0].cabin_class)}</span>
              )}
              {offer.conditions?.fare_brand_name && (
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                  {offer.conditions.fare_brand_name}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">
            {formatPrice(offer.total_amount, offer.total_currency)}
          </div>
          <div className="text-xs text-slate-600">Total price</div>
        </div>
      </div>

      {/* Slices */}
      <div className="space-y-4">
        {offer.slices.map((slice: any, index: number) => {
          const firstSegment = slice.segments?.[0];
          const lastSegment = slice.segments?.[slice.segments.length - 1];
          
          if (!firstSegment || !lastSegment) return null;

          const isNextDay = plusOneDayFlag(firstSegment.departing_at, lastSegment.arriving_at);
          const stops = slice.segments.length - 1;

          return (
            <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  {/* Departure */}
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {fmtTime(firstSegment.departing_at)}
                    </div>
                    <div className="text-sm font-medium text-slate-700">
                      {firstSegment.origin.iata_code}
                    </div>
                    <div className="text-xs text-slate-500">
                      {firstSegment.origin.city_name}
                    </div>
                  </div>

                  {/* Flight info */}
                  <div className="flex-1 px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-full h-px bg-slate-300" />
                      <Plane className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="w-full h-px bg-slate-300" />
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                      <Clock className="w-3 h-3" />
                      <span>{fmtIsoDur(slice.duration)}</span>
                      <span className="text-slate-400">•</span>
                      <span>{stopsLabel(stops)}</span>
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
                    <div className="text-xs text-slate-500">
                      {lastSegment.destination.city_name}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional info */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200 text-sm text-slate-600">
        {offer.passengers && (
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{offer.passengers.length} {offer.passengers.length === 1 ? 'passenger' : 'passengers'}</span>
          </div>
        )}
        {offer.available_services?.some((s: any) => s.type === 'baggage') && (
          <div className="flex items-center gap-1">
            <Briefcase className="w-4 h-4" />
            <span>Baggage included</span>
          </div>
        )}
      </div>
    </div>
  );
}
