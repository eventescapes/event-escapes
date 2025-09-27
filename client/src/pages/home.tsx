import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EventCard from "@/components/event-card";
import { EventCardSkeleton } from "@/components/loading-skeleton";
import { Search, MapPin, Calendar, Bed, Plane, CheckCircle, Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Hero Section */}
      <div className="relative h-[600px] md:h-[700px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080")'
          }}
        >
          <div className="overlay-hero absolute inset-0"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center h-full text-center">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="animate-luxury-fade-in">
              <div className="inline-flex items-center bg-glass-bg backdrop-blur-sm border border-glass-border rounded-full px-6 py-3 mb-8">
                <Sparkles className="w-5 h-5 text-accent mr-2" />
                <span className="font-accent font-medium text-white/90 tracking-wide">Premium Travel Experiences</span>
              </div>
              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 text-shadow-luxury leading-tight">
                Unforgettable
                <span className="text-luxury block">Events</span>
                <span className="font-accent text-4xl md:text-5xl lg:text-6xl font-light text-white/90 block mt-4">Complete Travel Packages</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed font-accent">
                Discover world-class events and book your complete luxury travel experience in one seamless journey
              </p>
            </div>
            
            {/* Premium Search Bar */}
            <div className="glass-card p-8 max-w-5xl mx-auto animate-luxury-scale-in" data-testid="search-form">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                  <Label htmlFor="where" className="font-accent font-semibold text-primary mb-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-accent" />
                    Where
                  </Label>
                  <Input
                    id="where"
                    type="text"
                    placeholder="City or venue..."
                    value={searchFilters.city}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, city: e.target.value }))}
                    className="focus-luxury h-12 font-accent"
                    data-testid="input-where"
                  />
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor="when" className="font-accent font-semibold text-primary mb-3 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-accent" />
                    When
                  </Label>
                  <Input
                    id="when"
                    type="date"
                    value={searchFilters.date}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, date: e.target.value }))}
                    className="focus-luxury h-12 font-accent"
                    data-testid="input-when"
                  />
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor="event-type" className="font-accent font-semibold text-primary mb-3 block">
                    Event Type
                  </Label>
                  <Select
                    value={searchFilters.category}
                    onValueChange={(value) => setSearchFilters(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="focus-luxury h-12" data-testid="select-event-type">
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="Music Festival">🎵 Music Festivals</SelectItem>
                      <SelectItem value="Sports">🏆 Sports</SelectItem>
                      <SelectItem value="Conference">📊 Conferences</SelectItem>
                      <SelectItem value="Theater">🎭 Theater</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-1 flex items-end">
                  <Button 
                    onClick={handleSearch} 
                    className="btn-luxury w-full h-12 font-accent font-bold tracking-wide"
                    data-testid="button-search"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Discover Events
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Events */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 space-luxury">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-6 py-2 mb-6">
            <span className="font-accent font-semibold text-accent text-sm tracking-wide uppercase">Curated Selection</span>
          </div>
          <h2 className="font-display text-4xl md:text-6xl font-bold text-primary mb-6 tracking-tight">Featured Events</h2>
          <p className="text-xl md:text-2xl text-muted-foreground font-accent leading-relaxed max-w-3xl mx-auto">Handpicked premium events from around the world, curated for discerning travelers</p>
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
            // Loading skeletons with staggered animation
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
                style={{ animationDelay: `${index * 150}ms` }}
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
                <p className="text-muted-foreground font-accent mb-6 max-w-md mx-auto" data-testid="no-events-message">
                  We couldn't find any events matching your criteria. Try adjusting your search filters.
                </p>
                <Button 
                  onClick={() => setSearchFilters({ city: "", date: "", category: "" })}
                  className="btn-luxury-secondary"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-luxury-gradient-subtle space-luxury">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 mb-6">
              <span className="font-accent font-semibold text-primary text-sm tracking-wide uppercase">Simple Process</span>
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-bold text-primary mb-6 tracking-tight">How It Works</h2>
            <p className="text-xl md:text-2xl text-muted-foreground font-accent leading-relaxed max-w-3xl mx-auto">Experience luxury travel planning made effortless</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group animate-luxury-fade-in" data-testid="step-1">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-luxury-gradient rounded-full flex items-center justify-center mx-auto shadow-luxury-lg group-hover:scale-110 transition-transform duration-500">
                  <Search className="w-12 h-12 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent text-primary rounded-full flex items-center justify-center font-accent font-bold text-sm">1</div>
              </div>
              <h3 className="font-display text-2xl font-bold text-primary mb-4">Discover Events</h3>
              <p className="text-muted-foreground font-accent leading-relaxed">Browse premium events by location, date, and type. Find extraordinary experiences curated for luxury travelers.</p>
            </div>
            <div className="text-center group animate-luxury-fade-in" style={{ animationDelay: '200ms' }} data-testid="step-2">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-luxury-gradient rounded-full flex items-center justify-center mx-auto shadow-luxury-lg group-hover:scale-110 transition-transform duration-500">
                  <div className="flex items-center justify-center space-x-1">
                    <Bed className="w-6 h-6 text-primary" />
                    <Plane className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent text-primary rounded-full flex items-center justify-center font-accent font-bold text-sm">2</div>
              </div>
              <h3 className="font-display text-2xl font-bold text-primary mb-4">Complete Package</h3>
              <p className="text-muted-foreground font-accent leading-relaxed">Add luxury accommodations, premium flights, and event tickets. Everything coordinated seamlessly.</p>
            </div>
            <div className="text-center group animate-luxury-fade-in" style={{ animationDelay: '400ms' }} data-testid="step-3">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-luxury-gradient rounded-full flex items-center justify-center mx-auto shadow-luxury-lg group-hover:scale-110 transition-transform duration-500">
                  <CheckCircle className="w-12 h-12 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent text-primary rounded-full flex items-center justify-center font-accent font-bold text-sm">3</div>
              </div>
              <h3 className="font-display text-2xl font-bold text-primary mb-4">Enjoy Excellence</h3>
              <p className="text-muted-foreground font-accent leading-relaxed">Relax knowing every detail is handled. Your complete luxury travel experience awaits.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
