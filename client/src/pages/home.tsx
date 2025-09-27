import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EventCard from "@/components/event-card";
import { EventCardSkeleton } from "@/components/loading-skeleton";
import { Search } from "lucide-react";
import type { Event } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchFilters, setSearchFilters] = useState({
    city: "",
    date: "",
    category: "",
  });
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);

  // Parse URL parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.size > 0) {
      setSearchFilters({
        city: params.get('city') || '',
        date: params.get('date') || '',
        category: params.get('category') || '',
      });
      setSearchParams(params);
    }
  }, []);

  // Build API query with search parameters
  const buildApiQuery = () => {
    const params = new URLSearchParams();
    if (searchFilters.city) params.append('city', searchFilters.city);
    if (searchFilters.category && searchFilters.category !== 'all') params.append('category', searchFilters.category);
    if (searchFilters.date) {
      const startDate = new Date(searchFilters.date);
      params.append('startDate', startDate.toISOString());
    }
    return params.toString() ? `/api/events?${params.toString()}` : '/api/events';
  };

  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ['events', searchFilters],
    queryFn: () => fetch(buildApiQuery()).then(res => {
      if (!res.ok) throw new Error('Failed to fetch events');
      return res.json();
    }),
  });

  const handleSearch = () => {
    // Update URL with search parameters
    const params = new URLSearchParams();
    if (searchFilters.city) params.append('city', searchFilters.city);
    if (searchFilters.category && searchFilters.category !== 'all') params.append('category', searchFilters.category);
    if (searchFilters.date) params.append('date', searchFilters.date);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    window.history.pushState({}, '', `${window.location.pathname}${newUrl}`);
    
    // Trigger new search by updating search params
    setSearchParams(params);
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080")'
          }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center h-full text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Unforgettable Events.<br />Complete Travel Packages.
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Discover amazing events and book everything you need in one place
            </p>
            
            {/* Search Bar */}
            <div className="bg-white rounded-xl p-6 shadow-2xl max-w-4xl mx-auto" data-testid="search-form">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <Label htmlFor="where" className="block text-sm font-medium text-muted-foreground mb-2">
                    Where
                  </Label>
                  <Input
                    id="where"
                    type="text"
                    placeholder="City or venue"
                    value={searchFilters.city}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, city: e.target.value }))}
                    data-testid="input-where"
                  />
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor="when" className="block text-sm font-medium text-muted-foreground mb-2">
                    When
                  </Label>
                  <Input
                    id="when"
                    type="date"
                    value={searchFilters.date}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, date: e.target.value }))}
                    data-testid="input-when"
                  />
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor="event-type" className="block text-sm font-medium text-muted-foreground mb-2">
                    Event Type
                  </Label>
                  <Select
                    value={searchFilters.category}
                    onValueChange={(value) => setSearchFilters(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger data-testid="select-event-type">
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="music">Music Festivals</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="conference">Conferences</SelectItem>
                      <SelectItem value="theater">Theater</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-1 flex items-end">
                  <Button 
                    onClick={handleSearch} 
                    className="w-full"
                    data-testid="button-search"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Search Events
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Events */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Featured Events</h2>
          <p className="text-xl text-muted-foreground">Handpicked events happening near you</p>
        </div>

        {error && (
          <div className="text-center py-12">
            <p className="text-destructive" data-testid="error-message">
              Error loading events. Please try again later.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }, (_, i) => (
              <EventCardSkeleton key={i} />
            ))
          ) : events && events.length > 0 ? (
            events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground" data-testid="no-events-message">
                No events found. Try adjusting your search criteria.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-muted py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Book your complete event experience in just a few clicks</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center" data-testid="step-1">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Find Your Event</h3>
              <p className="text-muted-foreground">Browse events by location, date, and type. Discover amazing experiences near you.</p>
            </div>
            <div className="text-center" data-testid="step-2">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                <i className="fas fa-bed"></i>
              </div>
              <h3 className="text-xl font-bold mb-2">2. Book Your Stay</h3>
              <p className="text-muted-foreground">Choose from hotels near the venue, sorted by distance. Add flights and tickets too.</p>
            </div>
            <div className="text-center" data-testid="step-3">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                <i className="fas fa-check"></i>
              </div>
              <h3 className="text-xl font-bold mb-2">3. Enjoy Your Trip</h3>
              <p className="text-muted-foreground">Everything booked in one place. Get confirmation and enjoy your complete event experience.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
