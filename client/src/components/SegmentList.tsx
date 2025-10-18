import { fmtTime, fmtIsoDur, plusOneDayFlag } from '@/utils/formatters';
import { Plane, Clock } from 'lucide-react';

interface Segment {
  id: string;
  origin: { iata_code: string; city_name?: string; };
  destination: { iata_code: string; city_name?: string; };
  departing_at: string;
  arriving_at: string;
  marketing_carrier: { name: string; iata_code: string; };
  marketing_carrier_flight_number: string;
  operating_carrier?: { name: string; };
  aircraft?: { name: string; };
  duration: string;
  origin_terminal?: string;
  destination_terminal?: string;
}

interface SegmentListProps {
  segments: Segment[];
  className?: string;
}

export function SegmentList({ segments, className = '' }: SegmentListProps) {
  if (!segments || segments.length === 0) {
    return <div className="text-muted-foreground">No segment details available</div>;
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid="segment-list">
      {segments.map((segment, index) => {
        const isNextDay = plusOneDayFlag(segment.departing_at, segment.arriving_at);
        const flightNumber = `${segment.marketing_carrier.iata_code}${segment.marketing_carrier_flight_number}`;
        
        return (
          <div key={segment.id || index}>
            {/* Segment */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex-shrink-0 mt-1">
                <Plane className="w-5 h-5 text-slate-600" />
              </div>
              
              <div className="flex-1 space-y-2">
                {/* Flight info */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {segment.marketing_carrier.name}
                    </div>
                    <div className="text-sm text-slate-600">
                      {flightNumber}
                      {segment.operating_carrier && 
                        segment.operating_carrier.name !== segment.marketing_carrier.name && (
                          <span className="ml-2 text-xs">
                            (Operated by {segment.operating_carrier.name})
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    {fmtIsoDur(segment.duration)}
                  </div>
                </div>

                {/* Route */}
                <div className="flex items-center justify-between text-sm">
                  <div className="text-left">
                    <div className="font-semibold text-lg">{fmtTime(segment.departing_at)}</div>
                    <div className="text-slate-600">
                      {segment.origin.iata_code}
                      {segment.origin_terminal && ` T${segment.origin_terminal}`}
                    </div>
                    <div className="text-xs text-slate-500">{segment.origin.city_name}</div>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center px-4">
                    <div className="w-full h-px bg-slate-300" />
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-lg">
                      {fmtTime(segment.arriving_at)}
                      {isNextDay && (
                        <span className="ml-1 text-xs text-orange-600 font-normal">+1</span>
                      )}
                    </div>
                    <div className="text-slate-600">
                      {segment.destination.iata_code}
                      {segment.destination_terminal && ` T${segment.destination_terminal}`}
                    </div>
                    <div className="text-xs text-slate-500">{segment.destination.city_name}</div>
                  </div>
                </div>

                {/* Aircraft */}
                {segment.aircraft?.name && (
                  <div className="text-xs text-slate-500">
                    Aircraft: {segment.aircraft.name}
                  </div>
                )}
              </div>
            </div>

            {/* Layover indicator */}
            {index < segments.length - 1 && (
              <div className="flex items-center gap-2 py-2 px-4 text-sm text-slate-600">
                <div className="w-full h-px bg-slate-200" />
                <span className="flex-shrink-0 px-2 py-1 bg-slate-100 rounded text-xs">
                  Layover in {segment.destination.city_name || segment.destination.iata_code}
                </span>
                <div className="w-full h-px bg-slate-200" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
