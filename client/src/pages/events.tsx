import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Calendar, ChevronLeft, ChevronRight, ExternalLink, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface TicketmasterEvent {
  id: string;
  name: string;
  event_start_date: string;
  venue_name: string;
  venue_city: string;
  venue_country_code: string;
  venue_latitude: number;
  venue_longitude: number;
  price_min: number;
  price_max: number;
  currency: string;
  segment: string;
  images: string;
  url: string;
  is_major_event: boolean;
}

interface EventCardProps {
  event: TicketmasterEvent;
  onClick: () => void;
}

function EventCard({ event, onClick }: EventCardProps) {
  const getEventImage = () => {
    try {
      if (!event.images) return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop';
      
      const images = typeof event.images === 'string' ? JSON.parse(event.images) : event.images;
      if (Array.isArray(images) && images.length > 0) {
        const highResImage = images.find((img: any) => img.width > 500) || images[0];
        return highResImage.url || highResImage;
      }
      return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop';
    } catch {
      return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      weekday: 'short'
    });
  };

  const formatPrice = () => {
    if (event.price_min && event.price_max) {
      return `${event.currency} ${event.price_min} - ${event.price_max}`;
    }
    return 'Check Ticketmaster';
  };

  return (
    <div 
      className="min-w-[300px] flex-shrink-0 cursor-pointer group"
      onClick={onClick}
      data-testid={`event-card-${event.id}`}
    >
      <div className="relative overflow-hidden rounded-xl transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
        <img 
          src={getEventImage()} 
          alt={event.name}
          className="w-full h-[400px] object-cover"
          data-testid={`event-image-${event.id}`}
        />
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            event.segment === 'Music' 
              ? 'bg-purple-500 text-white' 
              : 'bg-blue-500 text-white'
          }`}
          data-testid={`event-segment-${event.id}`}>
            {event.segment}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
          <h3 className="text-white font-bold text-lg mb-2 line-clamp-2" data-testid={`event-name-${event.id}`}>
            {event.name}
          </h3>
          <div className="space-y-1 text-white/90 text-sm">
            <div className="flex items-center gap-2" data-testid={`event-date-${event.id}`}>
              <span>📅</span>
              <span>{formatDate(event.event_start_date)}</span>
            </div>
            <div className="flex items-center gap-2" data-testid={`event-location-${event.id}`}>
              <span>📍</span>
              <span>{event.venue_city}</span>
            </div>
            <div className="flex items-center gap-2" data-testid={`event-venue-${event.id}`}>
              <span>🏟️</span>
              <span className="line-clamp-1">{event.venue_name}</span>
            </div>
            <div className="flex items-center gap-2" data-testid={`event-price-${event.id}`}>
              <span>💰</span>
              <span>{formatPrice()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HorizontalScroller({ title, events, icon }: { title: string; events: TicketmasterEvent[]; icon: string }) {
  const [selectedEvent, setSelectedEvent] = useState<TicketmasterEvent | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handlePackageBooking = () => {
    if (selectedEvent) {
      window.location.href = `/packages/build?event=${selectedEvent.id}&venue_lat=${selectedEvent.venue_latitude}&venue_lng=${selectedEvent.venue_longitude}`;
    }
  };

  const handleTicketPurchase = () => {
    if (selectedEvent && selectedEvent.url) {
      window.open(selectedEvent.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (events.length === 0) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" data-testid={`section-title-${title}`}>
          <span>{icon}</span> {title}
        </h2>
        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400" data-testid="empty-state">
            No major events found in this region yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2" data-testid={`section-title-${title}`}>
            <span>{icon}</span> {title}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              className="rounded-full"
              data-testid={`scroll-left-${title}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              className="rounded-full"
              data-testid={`scroll-right-${title}`}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {events.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onClick={() => setSelectedEvent(event)}
            />
          ))}
        </div>
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-[500px]" data-testid="booking-modal">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Choose how you'd like to experience this event:
            </p>
            
            <Button
              onClick={handlePackageBooking}
              className="w-full h-auto flex flex-col items-start p-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              data-testid="button-book-package"
            >
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-6 w-6" />
                <span className="text-lg font-bold">Book Complete Package</span>
              </div>
              <span className="text-sm text-white/90 text-left">
                Flights + Hotels + Tickets - Everything you need for an amazing experience
              </span>
            </Button>

            <Button
              onClick={handleTicketPurchase}
              variant="outline"
              className="w-full h-auto flex flex-col items-start p-6"
              data-testid="button-buy-tickets"
            >
              <div className="flex items-center gap-3 mb-2">
                <ExternalLink className="h-6 w-6" />
                <span className="text-lg font-bold">Buy Tickets Only on Ticketmaster</span>
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400 text-left">
                Purchase tickets directly from Ticketmaster
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mb-12">
      <Skeleton className="h-8 w-64 mb-4" />
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-w-[300px]">
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Events() {
  const [usEvents, setUsEvents] = useState<TicketmasterEvent[]>([]);
  const [gbEvents, setGbEvents] = useState<TicketmasterEvent[]>([]);
  const [caEvents, setCaEvents] = useState<TicketmasterEvent[]>([]);
  const [auEvents, setAuEvents] = useState<TicketmasterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setError('Supabase configuration missing');
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const fetchCountry = async (country: string) => {
        const url = `${supabaseUrl}/functions/v1/search-ticketmaster-events?country=${country}&page_size=20&sort_by=event_start_date&is_major_event=true&min_date=${today}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ${country} events`);
        }

        const data = await response.json();
        return data.events || [];
      };

      const [us, gb, ca, au] = await Promise.all([
        fetchCountry('US'),
        fetchCountry('GB'),
        fetchCountry('CA'),
        fetchCountry('AU')
      ]);

      setUsEvents(us);
      setGbEvents(gb);
      setCaEvents(ca);
      setAuEvents(au);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-purple-600 to-purple-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-6xl font-bold mb-4 tracking-tight" data-testid="hero-title">
              Discover Major Events Worldwide
            </h1>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto" data-testid="hero-subtitle">
              Curated packages for F1 races, music festivals, and championship games
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <Input
                  placeholder="Location or Venue"
                  className="h-12"
                  data-testid="input-location"
                />
              </div>
              <div>
                <Input
                  type="date"
                  className="h-12"
                  data-testid="input-date"
                />
              </div>
              <div>
                <Select>
                  <SelectTrigger className="h-12" data-testid="select-event-type">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="music">Music</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Button 
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  data-testid="button-discover"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Discover Events
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8" data-testid="error-message">
            <p className="text-red-800 dark:text-red-200">
              Unable to load events. Please try again. {error}
            </p>
            <Button onClick={fetchEvents} className="mt-4" data-testid="button-retry">
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <>
            <LoadingSkeleton />
            <LoadingSkeleton />
            <LoadingSkeleton />
            <LoadingSkeleton />
          </>
        ) : (
          <>
            <HorizontalScroller title="United States Events" events={usEvents} icon="🇺🇸" />
            <HorizontalScroller title="United Kingdom Events" events={gbEvents} icon="🇬🇧" />
            <HorizontalScroller title="Canada Events" events={caEvents} icon="🇨🇦" />
            <HorizontalScroller title="Australia Events" events={auEvents} icon="🇦🇺" />
          </>
        )}
      </div>
    </div>
  );
}
