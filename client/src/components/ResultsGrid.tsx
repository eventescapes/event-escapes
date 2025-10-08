import { HotelCardAirbnb } from './HotelCardAirbnb';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Building2, RefreshCw } from 'lucide-react';
import type { HotelCard } from '@/lib/hotels';

interface ResultsGridProps {
  hotels: HotelCard[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectHotel: (rateKey: string) => void;
}

function HotelSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6" data-testid="skeleton-hotel">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Skeleton className="w-full h-48 rounded-xl" />
        </div>
        <div className="md:col-span-2 space-y-4">
          <div>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex justify-between items-end">
            <div>
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResultsGrid({ hotels, loading, error, onRetry, onSelectHotel }: ResultsGridProps) {
  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 space-y-6">
        {Array.from({ length: 8 }, (_, i) => (
          <HotelSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4" data-testid="text-error-title">
            Couldn't load hotels
          </h2>
          <p className="text-slate-600 mb-6" data-testid="text-error-message">
            {error}. Please try again.
          </p>
          <Button
            onClick={onRetry}
            className="rounded-full px-6 bg-blue-600 hover:bg-blue-700"
            data-testid="button-retry"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (hotels.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4" data-testid="text-empty-title">
            No hotels found
          </h2>
          <p className="text-slate-600 mb-6" data-testid="text-empty-message">
            We couldn't find any hotels matching your search criteria. Try adjusting your filters or search dates.
          </p>
        </div>
      </div>
    );
  }

  // Results
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2" data-testid="text-results-title">
          Available Hotels
        </h2>
        <p className="text-slate-600" data-testid="text-results-count">
          {hotels.length} {hotels.length === 1 ? 'hotel' : 'hotels'} found
        </p>
      </div>
      
      <div className="space-y-6">
        {hotels.map((hotel) => (
          <HotelCardAirbnb
            key={hotel.hotelId}
            hotel={hotel}
            onSelect={onSelectHotel}
          />
        ))}
      </div>
    </div>
  );
}
