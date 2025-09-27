import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HotelCard from "@/components/hotel-card";
import { HotelCardSkeleton } from "@/components/loading-skeleton";
import { SlidersHorizontal, List, Map } from "lucide-react";

interface HotelSearchResult {
  hotels: Array<{
    id: string;
    name: string;
    address: string;
    rating: number;
    pricePerNight: number;
    distanceFromVenue: number;
    amenities: string[];
    imageUrl: string;
    freeCancellation: boolean;
  }>;
  eventDetails: {
    name: string;
    venue: string;
    latitude: string;
    longitude: string;
  };
}

export default function HotelResults() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [activeFilters, setActiveFilters] = useState<string[]>(['500m']);

  // In a real app, this would get eventId from URL params
  const eventId = new URLSearchParams(window.location.search).get('eventId') || 'event-1';

  const { data, isLoading, error } = useQuery<HotelSearchResult>({
    queryKey: [`/api/hotels/search?eventId=${eventId}&checkIn=2024-07-15&checkOut=2024-07-17&guests=2`],
  });

  const handleFilterToggle = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleHotelSelect = () => {
    setLocation('/flights');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        {/* Header Skeleton */}
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            {Array.from({ length: 3 }, (_, i) => (
              <HotelCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Error Loading Hotels</h1>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Search Summary */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2" data-testid="text-hotels-title">
                Hotels near {data.eventDetails.name}
              </h1>
              <p className="text-muted-foreground" data-testid="text-search-summary">
                {data.eventDetails.venue} • July 15-17, 2024 • 2 guests
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Button variant="outline" size="sm" data-testid="button-filters">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <div className="flex bg-muted rounded-md p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  data-testid="button-list-view"
                >
                  <List className="mr-2 h-4 w-4" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  data-testid="button-map-view"
                >
                  <Map className="mr-2 h-4 w-4" />
                  Map
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: '500m', label: '≤ 500m from venue' },
              { id: '1km', label: '≤ 1km from venue' },
              { id: '2km', label: '≤ 2km from venue' },
              { id: '4star', label: '4+ Star Rating' },
              { id: 'cancellation', label: 'Free Cancellation' },
              { id: 'under200', label: 'Under $200/night' },
            ].map((filter) => (
              <Badge
                key={filter.id}
                variant={activeFilters.includes(filter.id) ? 'default' : 'secondary'}
                className="cursor-pointer hover:bg-opacity-80 transition-colors"
                onClick={() => handleFilterToggle(filter.id)}
                data-testid={`filter-${filter.id}`}
              >
                {filter.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <p className="text-muted-foreground" data-testid="text-results-count">
            Showing {data.hotels.length} hotels • Sorted by distance from venue
          </p>
        </div>

        <div className="space-y-6">
          {data.hotels.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              onSelect={handleHotelSelect}
            />
          ))}
        </div>

        {/* Empty state if no results */}
        {data.hotels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground" data-testid="no-hotels-message">
              No hotels found matching your criteria. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
