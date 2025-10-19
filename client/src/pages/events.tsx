import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, ChevronLeft, ChevronRight, ExternalLink, X, MapPin, Calendar, DollarSign, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserInfoModal } from '@/components/UserInfoModal';

interface TicketmasterEvent {
  id: string;
  name: string;
  event_start_date: string;
  venue_name: string;
  venue_city: string;
  venue_country_code: string;
  venue_address?: string;
  venue_latitude: number;
  venue_longitude: number;
  price_min?: number;
  price_max?: number;
  currency?: string;
  segment: string;
  genre?: string;
  sub_genre?: string;
  info?: string;
  please_note?: string;
  images?: string;
  url: string;
  is_major_event: boolean;
  filter_reason?: string;
}

interface EventCardProps {
  event: TicketmasterEvent;
  onClick: () => void;
  showRewardsBadge?: boolean;
}

function EventCard({ event, onClick, showRewardsBadge = true }: EventCardProps) {
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
    const now = new Date();
    const diffTime = Math.abs(date.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      weekday: 'short'
    });
    
    // Add relative time
    if (diffDays <= 7) {
      return `In ${diffDays} days • ${formattedDate}`;
    } else if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      return `In ${weeks} week${weeks > 1 ? 's' : ''} • ${formattedDate}`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `In ${months} month${months > 1 ? 's' : ''} • ${formattedDate}`;
    }
  };

  const formatPrice = () => {
    if (event.price_min && event.price_max) {
      return `${event.currency || 'USD'} ${event.price_min} - ${event.price_max}`;
    }
    return 'Check Ticketmaster';
  };

  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'CA': '🇨🇦',
      'AU': '🇦🇺'
    };
    return flags[countryCode] || '🌍';
  };

  const isLaunchPeriod = new Date() < new Date('2026-06-30');
  const rewardAmount = isLaunchPeriod ? 20 : 10;

  return (
    <div 
      className="cursor-pointer group"
      onClick={onClick}
      data-testid={`event-card-${event.id}`}
    >
      <div className="relative overflow-hidden rounded-2xl transform transition-all duration-500 group-hover:scale-[1.05] group-hover:shadow-2xl group-hover:shadow-purple-500/20 bg-gradient-to-b from-slate-900 to-black border border-slate-800 group-hover:border-purple-500/50 h-full flex flex-col">
        {/* Image Section */}
        <div className="relative h-[280px] overflow-hidden flex-shrink-0">
          <img 
            src={getEventImage()} 
            alt={event.name}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
            data-testid={`event-image-${event.id}`}
          />
          
          {/* Gradient Overlay - Strong dark gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30" />
          
          {/* Category Badge - Top Right */}
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
              event.segment === 'Music' 
                ? 'bg-purple-500/90 text-white' 
                : event.segment === 'Sports'
                ? 'bg-blue-500/90 text-white'
                : 'bg-pink-500/90 text-white'
            }`}
            data-testid={`event-segment-${event.id}`}>
              {event.segment}
            </span>
          </div>
          
          {/* Rewards Badge - Top Left */}
          {showRewardsBadge && (
            <div className="absolute top-3 left-3">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse"
                data-testid="rewards-badge">
                🎉 Earn ${rewardAmount}
              </div>
            </div>
          )}
          
          {/* Event Info Overlay - Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h3 
              className="text-white font-bold text-xl mb-3 line-clamp-2 group-hover:text-purple-300 transition-colors duration-300" 
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9), 0 4px 24px rgba(0,0,0,0.6)' }}
              data-testid={`event-name-${event.id}`}
            >
              {event.name}
            </h3>
            
            <div className="space-y-2 text-white/90 text-sm">
              <div 
                className="flex items-center gap-2" 
                style={{ textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}
                data-testid={`event-date-${event.id}`}
              >
                <span className="text-base">📅</span>
                <span className="font-medium">{formatDate(event.event_start_date)}</span>
              </div>
              <div 
                className="flex items-center gap-2" 
                style={{ textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}
                data-testid={`event-location-${event.id}`}
              >
                <span className="text-base">{getCountryFlag(event.venue_country_code)}</span>
                <span className="font-medium">{event.venue_city}</span>
              </div>
              <div 
                className="flex items-center gap-2" 
                style={{ textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}
                data-testid={`event-venue-${event.id}`}
              >
                <span className="text-base">🏟️</span>
                <span className="line-clamp-1 font-medium">{event.venue_name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Price Section - Below Image */}
        <div className="p-3 bg-gradient-to-b from-slate-900 to-black border-t border-slate-800 mt-auto">
          <div className="flex items-center justify-between" data-testid={`event-price-${event.id}`}>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <div>
                <div className="text-xs text-slate-400">From</div>
                <div className="text-base font-bold text-white">{formatPrice()}</div>
              </div>
            </div>
            <div className="bg-purple-600/20 border border-purple-500/50 rounded px-2 py-1">
              <div className="text-xs text-purple-300 font-semibold">Details</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NetflixStyleModal({ event, onClose }: { event: TicketmasterEvent; onClose: () => void }) {
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  
  const getEventImage = () => {
    try {
      if (!event.images) return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop';
      
      const images = typeof event.images === 'string' ? JSON.parse(event.images) : event.images;
      if (Array.isArray(images) && images.length > 0) {
        const highResImage = images.find((img: any) => img.width > 1000) || images[0];
        return highResImage.url || highResImage;
      }
      return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop';
    } catch {
      return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop';
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const handleTicketPurchase = () => {
    setShowUserInfoModal(true);
  };

  const dateTime = formatDateTime(event.event_start_date);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black text-white border-none" data-testid="event-modal">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
          data-testid="button-close-modal"
        >
          <X className="h-6 w-6" />
        </button>

        <ScrollArea className="h-[90vh]">
          {/* Hero Banner */}
          <div className="relative h-[400px] w-full">
            <img 
              src={getEventImage()} 
              alt={event.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  event.segment === 'Music' 
                    ? 'bg-purple-500' 
                    : 'bg-blue-500'
                }`}>
                  {event.segment}
                </span>
                {event.genre && (
                  <span className="px-4 py-2 rounded-full text-sm bg-white/20">
                    {event.genre}
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
              <div className="flex items-center gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>{dateTime.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>{event.venue_city}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 bg-gradient-to-b from-black to-slate-900">
            {/* Reward Callout Banner */}
            <div className="mb-6 p-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🎉</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">Earn $20 Hotel Credit!</h3>
                  <p className="text-white/80 text-sm">Book this event and get $20 towards your hotel stay through our Event Escapes Rewards program.</p>
                </div>
              </div>
            </div>

            {/* Single CTA Button */}
            <Button
              onClick={handleTicketPurchase}
              className="w-full h-20 text-xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 shadow-2xl hover:shadow-purple-500/50 transform hover:scale-[1.02] transition-all duration-300 mb-8 relative overflow-hidden group"
              data-testid="button-book-now-earn"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="relative flex items-center justify-center gap-3">
                <ExternalLink className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-bold">Book Now & Earn $20</div>
                  <div className="text-xs text-white/90">Get your tickets on Ticketmaster</div>
                </div>
              </div>
            </Button>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Details
                </h3>
                <div className="space-y-3 text-white/80">
                  <div>
                    <div className="text-sm text-white/60">Date & Time</div>
                    <div className="font-semibold">{dateTime.date} at {dateTime.time}</div>
                  </div>
                  {event.price_min && event.price_max && (
                    <div>
                      <div className="text-sm text-white/60">Price Range</div>
                      <div className="font-semibold flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {event.currency || 'USD'} {event.price_min} - {event.price_max}
                      </div>
                    </div>
                  )}
                  {event.filter_reason && (
                    <div>
                      <div className="text-sm text-white/60">Why This Event</div>
                      <div className="font-semibold">{event.filter_reason}</div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Venue Information
                </h3>
                <div className="space-y-3 text-white/80">
                  <div>
                    <div className="text-sm text-white/60">Venue</div>
                    <div className="font-semibold">{event.venue_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-white/60">Location</div>
                    <div className="font-semibold">
                      {event.venue_city}, {event.venue_country_code}
                    </div>
                  </div>
                  {event.venue_address && (
                    <div>
                      <div className="text-sm text-white/60">Address</div>
                      <div className="font-semibold">{event.venue_address}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {event.info && (
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  About This Event
                </h3>
                <p className="text-white/80 leading-relaxed">{event.info}</p>
              </div>
            )}

            {/* Important Notes */}
            {event.please_note && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <h3 className="text-yellow-500 font-bold mb-2">⚠️ Important Information</h3>
                <p className="text-white/80">{event.please_note}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
      {showUserInfoModal && (
        <UserInfoModal
          open={showUserInfoModal}
          onClose={() => setShowUserInfoModal(false)}
          event={event}
        />
      )}
    </Dialog>
  );
}

function HorizontalScroller({ title, events, icon, viewAllCount }: { 
  title: string; 
  events: TicketmasterEvent[]; 
  icon: string;
  viewAllCount?: number;
}) {
  const [selectedEvent, setSelectedEvent] = useState<TicketmasterEvent | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const cardsPerPage = 10; // Show 10 cards at a time (2 rows × 5 cards)
  
  const totalPages = Math.ceil(events.length / cardsPerPage);
  const currentEvents = events.slice(
    currentPage * cardsPerPage,
    (currentPage + 1) * cardsPerPage
  );

  // Auto-advance page every 8 seconds
  useEffect(() => {
    if (events.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 8000);

    return () => clearInterval(interval);
  }, [totalPages, events.length]);

  const goToPage = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentPage((prev) => Math.max(0, prev - 1));
    } else {
      setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
    }
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <h2 className="text-2xl font-bold" data-testid={`section-title-${title}`}>
              {title}
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              ({events.length} events)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Page {currentPage + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage('prev')}
                disabled={currentPage === 0}
                className="rounded-full"
                data-testid={`scroll-left-${title}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage('next')}
                disabled={currentPage === totalPages - 1}
                className="rounded-full"
                data-testid={`scroll-right-${title}`}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Responsive Grid: 1 col mobile, 3 cols tablet, 5 cols desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {currentEvents.map((event, index) => (
            <div 
              key={event.id}
              className="animate-fadeIn"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <EventCard 
                event={event} 
                onClick={() => setSelectedEvent(event)}
              />
            </div>
          ))}
        </div>

        {/* Page Indicators */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentPage 
                    ? 'w-8 bg-purple-600' 
                    : 'w-2 bg-gray-600 hover:bg-gray-500'
                }`}
                data-testid={`page-indicator-${i}`}
              />
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <NetflixStyleModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
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

interface EventCategories {
  happeningSoon: TicketmasterEvent[];
  sportsUSCA: TicketmasterEvent[];
  musicUSCA: TicketmasterEvent[];
  ukEvents: TicketmasterEvent[];
  auEvents: TicketmasterEvent[];
  championships: TicketmasterEvent[];
  arts: TicketmasterEvent[];
}

export default function Events() {
  const [allEvents, setAllEvents] = useState<TicketmasterEvent[]>([]);
  const [categories, setCategories] = useState<EventCategories>({
    happeningSoon: [],
    sportsUSCA: [],
    musicUSCA: [],
    ukEvents: [],
    auEvents: [],
    championships: [],
    arts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    console.log('🎫 Fetching comprehensive Ticketmaster events (6 months, all classifications)...');
    setLoading(true);
    setError(null);

    try {
      // Fetch ALL events from all regions with all classifications
      // The backend will handle: US, CA, GB, AU × Music, Sports, Arts, Family
      console.log('🚀 Making comprehensive API call to fetch events...');
      
      const response = await fetch('/api/ticketmaster-events/live');

      if (!response.ok) {
        console.error('❌ Failed to fetch events:', response.status);
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const events = await response.json();
      console.log(`✅ Received ${events.length} unique events from Ticketmaster!`);
      
      // Normalize event dates
      const normalizedEvents = events.map((event: TicketmasterEvent) => ({
        ...event,
        event_start_date: typeof event.event_start_date === 'string' 
          ? event.event_start_date 
          : new Date(event.event_start_date).toISOString()
      }));

      setAllEvents(normalizedEvents);
      
      console.log('📊 Total events loaded:', normalizedEvents.length);

      // Categorize events dynamically
      categorizeEvents(normalizedEvents);
    } catch (err: any) {
      console.error('❌ Error fetching events:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const categorizeEvents = (events: TicketmasterEvent[]) => {
    const newCategories: EventCategories = {
      happeningSoon: [],
      sportsUSCA: [],
      musicUSCA: [],
      ukEvents: [],
      auEvents: [],
      championships: [],
      arts: []
    };

    const thirtyDaysOut = new Date();
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

    // 1. HAPPENING SOON (Next 30 days, all regions)
    newCategories.happeningSoon = events
      .filter(e => new Date(e.event_start_date) <= thirtyDaysOut)
      .sort((a, b) => new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime())
      .slice(0, 20);

    // 2. SPORTS BY REGION (US/CA combined)
    newCategories.sportsUSCA = events
      .filter(e => 
        (e.venue_country_code === 'US' || e.venue_country_code === 'CA') &&
        e.segment === 'Sports'
      )
      .sort((a, b) => new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime())
      .slice(0, 30);

    // 3. MUSIC BY REGION (US/CA)
    newCategories.musicUSCA = events
      .filter(e => 
        (e.venue_country_code === 'US' || e.venue_country_code === 'CA') &&
        e.segment === 'Music'
      )
      .sort((a, b) => new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime())
      .slice(0, 30);

    // 4. UK EVENTS (All types)
    newCategories.ukEvents = events
      .filter(e => e.venue_country_code === 'GB')
      .sort((a, b) => new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime())
      .slice(0, 30);

    // 5. AUSTRALIA EVENTS (All types)
    newCategories.auEvents = events
      .filter(e => e.venue_country_code === 'AU')
      .sort((a, b) => new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime())
      .slice(0, 30);

    // 6. CHAMPIONSHIPS/FINALS (All regions, filter by keywords)
    const championshipKeywords = ['final', 'championship', 'cup', 'bowl', 'series', 'grand prix', 'playoff', 'world'];
    newCategories.championships = events
      .filter(e => {
        const name = e.name.toLowerCase();
        return championshipKeywords.some(keyword => name.includes(keyword));
      })
      .sort((a, b) => new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime())
      .slice(0, 20);

    // 7. ARTS & THEATER (All regions)
    newCategories.arts = events
      .filter(e => 
        e.segment === 'Arts & Theatre' ||
        e.segment === 'Arts'
      )
      .sort((a, b) => new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime())
      .slice(0, 20);

    setCategories(newCategories);
    
    console.log('📂 Categories:', {
      happeningSoon: newCategories.happeningSoon.length,
      sportsUSCA: newCategories.sportsUSCA.length,
      musicUSCA: newCategories.musicUSCA.length,
      ukEvents: newCategories.ukEvents.length,
      auEvents: newCategories.auEvents.length,
      championships: newCategories.championships.length,
      arts: newCategories.arts.length
    });
  };

  const isLaunchPeriod = new Date() < new Date('2026-06-30');
  const rewardAmount = isLaunchPeriod ? 20 : 10;

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
                  className="h-12 text-slate-900"
                  data-testid="input-location"
                />
              </div>
              <div>
                <Input
                  type="date"
                  className="h-12 text-slate-900"
                  data-testid="input-date"
                />
              </div>
              <div>
                <Select>
                  <SelectTrigger className="h-12 text-slate-900" data-testid="select-event-type">
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
        {/* Rewards Banner */}
        {isLaunchPeriod ? (
          <div 
            className="rounded-xl p-6 text-center mb-8 shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: '#000000'
            }}
            data-testid="banner-launch-celebration"
          >
            <h2 className="text-3xl font-bold mb-2">🎉 LAUNCH CELEBRATION 🎉</h2>
            <p className="text-xl font-bold mb-1">Book Event Tickets → Earn ${rewardAmount} Hotel Credit</p>
            <p className="text-sm opacity-90 mb-2">Limited Time: Launch Special Through June 2026</p>
            <p className="text-xs opacity-75">Plus, earn points on all bookings with Event Escapes Rewards!</p>
          </div>
        ) : (
          <div 
            className="rounded-xl p-6 text-center mb-8 shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: '#ffffff'
            }}
            data-testid="banner-rewards-program"
          >
            <h2 className="text-2xl font-bold mb-2">Event Escapes Rewards</h2>
            <p className="text-lg mb-1">Earn ${rewardAmount} hotel credit on every event ticket purchase!</p>
            <p className="text-sm opacity-90">Plus, collect points on hotels, flights, and packages</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center mb-8">
            <p className="text-red-700 dark:text-red-300 font-semibold">{error}</p>
            <Button 
              onClick={fetchEvents} 
              className="mt-4"
              variant="outline"
              data-testid="button-retry"
            >
              Try Again
            </Button>
          </div>
        )}

        {loading ? (
          <>
            <LoadingSkeleton />
            <LoadingSkeleton />
            <LoadingSkeleton />
          </>
        ) : allEvents.length === 0 ? (
          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-12 text-center">
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-4">No events found</p>
            <p className="text-sm text-slate-500 dark:text-slate-500">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <>
            {/* Dynamic Carousels - Only show categories with 4+ events */}
            {categories.happeningSoon.length >= 4 && (
              <HorizontalScroller 
                title="Happening Soon" 
                events={categories.happeningSoon} 
                icon="⚡"
                viewAllCount={categories.happeningSoon.length}
              />
            )}

            {categories.sportsUSCA.length >= 4 && (
              <HorizontalScroller 
                title="Sports - USA & Canada" 
                events={categories.sportsUSCA} 
                icon="🏈"
                viewAllCount={categories.sportsUSCA.length}
              />
            )}

            {categories.musicUSCA.length >= 4 && (
              <HorizontalScroller 
                title="Music & Concerts - USA & Canada" 
                events={categories.musicUSCA} 
                icon="🎵"
                viewAllCount={categories.musicUSCA.length}
              />
            )}

            {categories.ukEvents.length >= 4 && (
              <HorizontalScroller 
                title="UK Premier Events" 
                events={categories.ukEvents} 
                icon="🇬🇧"
                viewAllCount={categories.ukEvents.length}
              />
            )}

            {categories.auEvents.length >= 4 && (
              <HorizontalScroller 
                title="Australia Events" 
                events={categories.auEvents} 
                icon="🇦🇺"
                viewAllCount={categories.auEvents.length}
              />
            )}

            {categories.championships.length >= 4 && (
              <HorizontalScroller 
                title="Championships & Finals" 
                events={categories.championships} 
                icon="🏆"
                viewAllCount={categories.championships.length}
              />
            )}

            {categories.arts.length >= 4 && (
              <HorizontalScroller 
                title="Arts & Theater" 
                events={categories.arts} 
                icon="🎭"
                viewAllCount={categories.arts.length}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
