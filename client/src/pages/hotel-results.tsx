import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HotelCard from "@/components/hotel-card";
import { HotelCardSkeleton } from "@/components/loading-skeleton";
import { SlidersHorizontal, List, Map, Star, MapPin, Calendar, Users, Filter, ArrowUpDown } from "lucide-react";

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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        {/* Premium Header Skeleton */}
        <div className="glass-card border-b" style={{ borderColor: 'var(--glass-border-color)' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
            <div className="animate-luxury-fade-in">
              <div className="h-10 bg-luxury-gradient-subtle rounded w-1/3 mb-4"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </div>
        
        {/* Premium Content Skeleton */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="animate-luxury-scale-in" style={{ animationDelay: `${i * 200}ms` }}>
                <HotelCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
        <div className="glass-card p-12 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="font-display text-3xl font-bold text-destructive mb-4">Unable to Load Hotels</h1>
          <p className="text-muted-foreground font-accent mb-6">We're having trouble finding accommodations. Please try again.</p>
          <Button 
            onClick={() => window.location.reload()}
            className="btn-luxury"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Premium Header with Search Summary */}
      <div className="glass-card border-b" style={{ borderColor: 'var(--glass-border-color)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="animate-luxury-fade-in">
              <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-4 py-2 mb-4">
                <Star className="w-4 h-4 text-accent mr-2" />
                <span className="font-accent font-semibold text-accent text-sm tracking-wide uppercase">Premium Hotels</span>
              </div>
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-primary mb-3 tracking-tight" data-testid="text-hotels-title">
                Luxury Hotels near
                <span className="text-luxury block">{data.eventDetails.name}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground font-accent" data-testid="text-search-summary">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-accent" />
                  {data.eventDetails.venue}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-accent" />
                  July 15-17, 2024
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-accent" />
                  2 guests
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 animate-luxury-slide-in">
              <Button 
                variant="outline" 
                className="btn-luxury-secondary font-accent font-semibold" 
                data-testid="button-filters"
              >
                <Filter className="mr-2 h-4 w-4" />
                Advanced Filters
              </Button>
              <div className="glass rounded-lg p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'btn-luxury' : 'font-accent'}
                  data-testid="button-list-view"
                >
                  <List className="mr-2 h-4 w-4" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  disabled
                  className="font-accent opacity-50 cursor-not-allowed"
                  data-testid="button-map-view"
                >
                  <Map className="mr-2 h-4 w-4" />
                  Map (Coming Soon)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Filter Chips */}
      <div className="bg-luxury-gradient-subtle border-b" style={{ borderColor: 'var(--glass-border-color)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-accent font-semibold text-primary">Refine Your Search</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="font-accent text-muted-foreground hover:text-accent"
              onClick={() => setActiveFilters(['500m'])}
              data-testid="button-reset-filters"
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { id: '500m', label: '≤ 500m from venue', icon: '📍' },
              { id: '1km', label: '≤ 1km from venue', icon: '🚶' },
              { id: '2km', label: '≤ 2km from venue', icon: '🚗' },
              { id: '4star', label: '4+ Star Rating', icon: '⭐' },
              { id: 'cancellation', label: 'Free Cancellation', icon: '✅' },
              { id: 'under200', label: 'Under $200/night', icon: '💰' },
            ].map((filter) => (
              <Badge
                key={filter.id}
                variant={activeFilters.includes(filter.id) ? 'default' : 'secondary'}
                className={`cursor-pointer font-accent font-medium px-4 py-2 transition-all duration-300 hover:scale-105 ${
                  activeFilters.includes(filter.id) 
                    ? 'bg-luxury-gradient text-primary shadow-luxury' 
                    : 'glass hover:shadow-luxury-lg'
                }`}
                onClick={() => handleFilterToggle(filter.id)}
                data-testid={`filter-${filter.id}`}
              >
                <span className="mr-2">{filter.icon}</span>
                {filter.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Premium Results */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 space-luxury">
        <div className="flex justify-between items-center mb-8">
          <div className="animate-luxury-fade-in">
            <h2 className="font-display text-2xl font-bold text-primary mb-2">Available Accommodations</h2>
            <p className="text-muted-foreground font-accent" data-testid="text-results-count">
              {data.hotels.length} premium hotels • Sorted by proximity to venue
            </p>
          </div>
          <div className="animate-luxury-slide-in">
            <Button 
              variant="outline" 
              className="btn-luxury-secondary font-accent font-medium"
              data-testid="button-sort-price"
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Sort by Price
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {data.hotels.map((hotel, index) => (
            <div 
              key={hotel.id}
              className="animate-luxury-slide-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <HotelCard
                hotel={hotel}
                onSelect={handleHotelSelect}
              />
            </div>
          ))}
        </div>

        {/* Premium Empty State */}
        {data.hotels.length === 0 && (
          <div className="glass-card p-16 text-center animate-luxury-scale-in">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-primary mb-4">No Hotels Found</h3>
            <p className="text-muted-foreground font-accent mb-6 max-w-md mx-auto" data-testid="no-hotels-message">
              We couldn't find any hotels matching your criteria. Try adjusting your filters or expanding your search area.
            </p>
            <Button 
              onClick={() => setActiveFilters(['500m'])}
              className="btn-luxury-secondary"
            >
              Reset All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
