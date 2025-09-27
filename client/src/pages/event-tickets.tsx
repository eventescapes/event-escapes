import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EventCard from "@/components/event-card";
import { EventCardSkeleton } from "@/components/loading-skeleton";
import { Search, SlidersHorizontal, Calendar, MapPin, Music, Trophy, Briefcase, Theater } from "lucide-react";
import type { Event } from "@shared/schema";

export default function EventTickets() {
  const [, setLocation] = useLocation();
  const [searchFilters, setSearchFilters] = useState({
    city: "",
    date: "",
    category: "",
    priceRange: "",
  });

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
    if (searchFilters.priceRange) params.append('priceRange', searchFilters.priceRange);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    window.history.pushState({}, '', `/event-tickets${newUrl}`);
  };

  const categoryIcons = {
    "Music Festival": Music,
    "Sports": Trophy,
    "Conference": Briefcase,
    "Theater": Theater,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Hero Header */}
      <div className="bg-navy-gradient relative overflow-hidden">
        <div className="overlay-luxury absolute inset-0"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-24">
          <div className="text-center animate-luxury-fade-in">
            <h1 className="font-display text-5xl lg:text-7xl font-bold text-white mb-6 text-shadow-luxury">
              Premium Event
              <span className="text-luxury block">Tickets</span>
            </h1>
            <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              Discover and book tickets to the world's most exclusive events. From music festivals to championship sports, secure your access to unforgettable experiences.
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Search */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-12 relative z-20">
        <div className="glass-card p-8 space-luxury-sm animate-luxury-scale-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-semibold text-primary">Find Your Perfect Event</h2>
            <Button variant="outline" className="btn-luxury-secondary">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <Label htmlFor="destination" className="font-accent font-medium text-secondary mb-3 block">
                <MapPin className="w-4 h-4 inline mr-2" />
                Event Location
              </Label>
              <Input
                id="destination"
                placeholder="Search cities or venues..."
                value={searchFilters.city}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, city: e.target.value }))}
                className="focus-luxury h-12"
                data-testid="input-location"
              />
            </div>

            <div>
              <Label htmlFor="dates" className="font-accent font-medium text-secondary mb-3 block">
                <Calendar className="w-4 h-4 inline mr-2" />
                Event Date
              </Label>
              <Input
                id="dates"
                type="date"
                value={searchFilters.date}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, date: e.target.value }))}
                className="focus-luxury h-12"
                data-testid="input-date"
              />
            </div>

            <div>
              <Label htmlFor="category" className="font-accent font-medium text-secondary mb-3 block">
                Event Category
              </Label>
              <Select
                value={searchFilters.category}
                onValueChange={(value) => setSearchFilters(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="focus-luxury h-12" data-testid="select-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Music Festival">🎵 Music Festivals</SelectItem>
                  <SelectItem value="Sports">🏆 Sports Events</SelectItem>
                  <SelectItem value="Conference">📊 Conferences</SelectItem>
                  <SelectItem value="Theater">🎭 Theater & Arts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleSearch}
                className="btn-luxury w-full h-12 font-accent font-semibold"
                data-testid="button-search"
              >
                <Search className="w-5 h-5 mr-2" />
                Search Events
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Events Results */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 space-luxury">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-primary mb-2">Available Events</h2>
            <p className="text-muted-foreground font-accent">
              {isLoading ? "Searching..." : `Found ${events?.length || 0} premium events`}
            </p>
          </div>
        </div>

        {error && (
          <div className="glass-card p-8 text-center mb-8 border-destructive/20">
            <p className="text-destructive font-accent" data-testid="error-message">
              Unable to load events. Please try again.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="animate-luxury-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <EventCardSkeleton />
              </div>
            ))
          ) : events && events.length > 0 ? (
            events.map((event, index) => (
              <div 
                key={event.id} 
                className="animate-luxury-slide-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <EventCard event={event} />
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="glass-card p-16 text-center">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-primary mb-4">No Events Found</h3>
                <p className="text-muted-foreground font-accent mb-6 max-w-md mx-auto">
                  We couldn't find any events matching your criteria. Try adjusting your search filters or explore our featured events.
                </p>
                <Button 
                  onClick={() => setSearchFilters({ city: "", date: "", category: "", priceRange: "" })}
                  className="btn-luxury-secondary"
                  data-testid="button-clear-filters"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popular Categories */}
      <div className="bg-muted/30 space-luxury">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-primary mb-4">Popular Categories</h2>
            <p className="text-xl text-muted-foreground font-accent">Discover events by type</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(categoryIcons).map(([category, Icon], index) => (
              <div 
                key={category}
                className="card-luxury p-8 text-center cursor-pointer group animate-luxury-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
                onClick={() => {
                  setSearchFilters(prev => ({ ...prev, category }));
                  handleSearch();
                }}
                data-testid={`category-${category.toLowerCase().replace(' ', '-')}`}
              >
                <div className="w-16 h-16 bg-luxury-gradient rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-accent font-semibold text-lg text-primary mb-2">{category}</h3>
                <p className="text-muted-foreground text-sm">Browse {category.toLowerCase()} events</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}