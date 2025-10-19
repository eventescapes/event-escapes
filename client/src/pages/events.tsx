import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X, MapPin, Calendar, ExternalLink, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
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
  price_min?: string;
  price_max?: string;
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
}

function EventCard({ event, onClick }: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false);

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
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const lowestPrice = event.price_min ? parseFloat(event.price_min) : null;
  const maxPrice = event.price_max ? parseFloat(event.price_max) : null;
  const isLaunchPeriod = new Date() < new Date('2026-06-30');
  const rewardAmount = isLaunchPeriod ? 20 : 10;

  return (
    <div 
      className="relative group cursor-pointer rounded-2xl overflow-hidden bg-gray-900 dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      data-testid={`event-card-${event.id}`}
    >
      {/* Rewards Badge - Top Right */}
      <div className="absolute top-3 right-3 z-20">
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl animate-pulse flex items-center gap-1"
          data-testid="rewards-badge">
          <span>🎉</span>
          <span>Earn ${rewardAmount}</span>
        </div>
      </div>

      {/* Event Image */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={getEventImage()} 
          alt={event.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
          data-testid={`event-image-${event.id}`}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Category Badge - Bottom Left of Image */}
        <div className="absolute bottom-3 left-3">
          <span className={`backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold ${
            event.segment === 'Music' 
              ? 'bg-purple-600/90' 
              : event.segment === 'Sports'
              ? 'bg-blue-600/90'
              : 'bg-pink-600/90'
          }`}
          data-testid={`event-segment-${event.id}`}>
            {event.segment}
          </span>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-5">
        {/* Event Name */}
        <h3 className="text-xl font-bold text-white dark:text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors"
          data-testid={`event-name-${event.id}`}>
          {event.name}
        </h3>

        {/* Date & Time */}
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-400 text-sm mb-3"
          data-testid={`event-date-${event.id}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(event.event_start_date)}</span>
          <span>•</span>
          <span>{formatTime(event.event_start_date)}</span>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-400 text-sm mb-4"
          data-testid={`event-location-${event.id}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="line-clamp-1">
            {getCountryFlag(event.venue_country_code)} {event.venue_city} • {event.venue_name}
          </span>
        </div>

        {/* Price Section */}
        {lowestPrice && (
          <div className="mb-4 p-3 bg-gray-800 dark:bg-gray-700 rounded-lg"
            data-testid={`event-price-${event.id}`}>
            <p className="text-xs text-gray-400 dark:text-gray-400 mb-1">Starting from</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-white dark:text-white">
                ${lowestPrice.toFixed(2)}
              </p>
              {maxPrice && lowestPrice !== maxPrice && (
                <p className="text-sm text-gray-400 dark:text-gray-400 mb-1">
                  - ${maxPrice.toFixed(2)}
                </p>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">{event.currency || 'USD'}</p>
          </div>
        )}

        {/* Rewards Messaging */}
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <span className="text-2xl">💎</span>
            <div>
              <p className="text-white dark:text-white font-semibold text-sm">
                Book & Earn Rewards
              </p>
              <p className="text-gray-300 dark:text-gray-300 text-xs mt-1">
                Get ${rewardAmount} hotel credit + points on every booking
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group relative overflow-hidden"
          data-testid={`button-get-tickets-${event.id}`}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          
          <div className="relative flex items-center justify-center gap-2">
            <span className="text-lg">Get Tickets & Earn ${rewardAmount}</span>
            <svg 
              className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          <p className="relative text-xs mt-1 opacity-90">
            Plus earn points on hotels & flights
          </p>
        </button>

        {/* Trust indicators */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Secure Booking</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Instant Rewards</span>
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

  const handlePackageBooking = () => {
    window.location.href = `/packages/build?event=${event.id}&venue_lat=${event.venue_latitude}&venue_lng=${event.venue_longitude}&venue_name=${encodeURIComponent(event.venue_name)}`;
  };

  const handleTicketPurchase = () => {
    setShowUserInfoModal(true);
  };

  const dateTime = formatDateTime(event.event_start_date);
  const lowestPrice = event.price_min ? parseFloat(event.price_min) : null;
  const maxPrice = event.price_max ? parseFloat(event.price_max) : null;

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
            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Button
                onClick={handlePackageBooking}
                className="h-16 text-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                data-testid="button-book-package-modal"
              >
                <Package className="mr-3 h-6 w-6" />
                <div className="text-left">
                  <div className="font-bold">Book Complete Package</div>
                  <div className="text-xs text-white/80">Flights + Hotels + Tickets</div>
                </div>
              </Button>

              <Button
                onClick={handleTicketPurchase}
                variant="outline"
                className="h-16 text-lg border-white/30 hover:bg-white/10"
                data-testid="button-buy-tickets-modal"
              >
                <ExternalLink className="mr-3 h-6 w-6" />
                <div className="text-left">
                  <div className="font-bold">Get Tickets on Ticketmaster</div>
                  <div className="text-xs text-white/60">Official tickets</div>
                </div>
              </Button>
            </div>

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
                  {lowestPrice && (
                    <div>
                      <div className="text-sm text-white/60">Price Range</div>
                      <div className="font-semibold flex items-center gap-2">
                        {event.currency || 'USD'} ${lowestPrice.toFixed(2)}
                        {maxPrice && lowestPrice !== maxPrice && ` - $${maxPrice.toFixed(2)}`}
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
                <h3 className="text-xl font-bold mb-3">About This Event</h3>
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (events.length === 0) {
    return null;
  }

  // Sort by lowest price
  const sortedEvents = [...events].sort((a, b) => {
    const priceA = a.price_min ? parseFloat(a.price_min) : Infinity;
    const priceB = b.price_min ? parseFloat(b.price_min) : Infinity;
    return priceA - priceB;
  });

  return (
    <>
      <div 
        ref={sectionRef}
        className={`mb-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{icon}</span>
            <h2 className="text-3xl font-bold text-white dark:text-white" data-testid={`section-title-${title}`}>
              {title}
            </h2>
            {viewAllCount && (
              <span className="text-gray-400 dark:text-gray-400 text-sm">
                ({viewAllCount} events)
              </span>
            )}
          </div>
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {sortedEvents.slice(0, 12).map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onClick={() => setSelectedEvent(event)}
            />
          ))}
        </div>
      </div>

      {selectedEvent && (
        <NetflixStyleModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-gray-800 dark:bg-gray-700 rounded-2xl overflow-hidden animate-pulse">
          <div className="h-64 bg-gray-700 dark:bg-gray-600" />
          <div className="p-5 space-y-3">
            <div className="h-6 bg-gray-700 dark:bg-gray-600 rounded w-3/4" />
            <div className="h-4 bg-gray-700 dark:bg-gray-600 rounded w-1/2" />
            <div className="h-4 bg-gray-700 dark:bg-gray-600 rounded w-2/3" />
            <div className="h-12 bg-gray-700 dark:bg-gray-600 rounded-lg" />
          </div>
        </div>
      ))}
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
    console.log('🎫 Fetching live Ticketmaster events with 3-4 month rolling window...');
    setLoading(true);
    setError(null);

    try {
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() + 7);
      
      const endDate = new Date();
      endDate.setMonth(today.getMonth() + 4);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log('📅 Date range:', { startDateStr, endDateStr });

      const regions = [
        { code: 'US', priority: 1 },
        { code: 'CA', priority: 2 },
        { code: 'GB', priority: 3 },
        { code: 'AU', priority: 4 }
      ];

      const fetchFromRegion = async (regionCode: string, priority: number) => {
        console.log(`🔍 Fetching ${regionCode} events from LIVE API...`);
        
        const response = await fetch(
          `/api/ticketmaster-events/live?country=${regionCode}&startDate=${startDateStr}&endDate=${endDateStr}&limit=50`
        );

        if (!response.ok) {
          console.error(`❌ Failed to fetch ${regionCode} events:`, response.status);
          return [];
        }

        const events = await response.json();
        console.log(`✅ ${regionCode} events:`, events.length);
        
        return events.map((event: TicketmasterEvent) => ({
          ...event,
          regionPriority: priority,
          event_start_date: typeof event.event_start_date === 'string' 
            ? event.event_start_date 
            : new Date(event.event_start_date).toISOString()
        }));
      };

      const eventResults = await Promise.all(
        regions.map(r => fetchFromRegion(r.code, r.priority))
      );

      const combinedEvents = eventResults.flat();
      setAllEvents(combinedEvents);
      
      console.log('📊 Total events loaded:', combinedEvents.length);

      categorizeEvents(combinedEvents);
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

    newCategories.happeningSoon = events
      .filter(e => new Date(e.event_start_date) <= thirtyDaysOut)
      .sort((a, b) => new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime())
      .slice(0, 20);

    newCategories.sportsUSCA = events
      .filter(e => 
        (e.venue_country_code === 'US' || e.venue_country_code === 'CA') &&
        e.segment === 'Sports'
      )
      .sort((a, b) => new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime())
      .slice(0, 30);

    newCategories.musicUSCA = events
      .filter(e => 
        (e.venue_country_code === 'US' || e.venue_country_code === 'CA') &&
        e.segment === 'Music'
      )
      .sort((a, b) => new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime())
      .slice(0, 30);

    newCategories.ukEvents = events
      .filter(e => e.venue_country_code === 'GB')
      .sort((a, b) => new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime())
      .slice(0, 30);

    newCategories.auEvents = events
      .filter(e => e.venue_country_code === 'AU')
      .sort((a, b) => new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime())
      .slice(0, 30);

    const championshipKeywords = ['final', 'championship', 'cup', 'bowl', 'series', 'grand prix', 'playoff', 'world'];
    newCategories.championships = events
      .filter(e => {
        const name = e.name.toLowerCase();
        return championshipKeywords.some(keyword => name.includes(keyword));
      })
      .sort((a, b) => new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime())
      .slice(0, 20);

    newCategories.arts = events
      .filter(e => 
        e.segment === 'Arts & Theatre' ||
        e.segment === 'Arts'
      )
      .sort((a, b) => new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime())
      .slice(0, 20);

    setCategories(newCategories);
  };

  const isLaunchPeriod = new Date() < new Date('2026-06-30');
  const rewardAmount = isLaunchPeriod ? 20 : 10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 dark:from-black dark:via-gray-900 dark:to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section with Rewards */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white py-8 px-6 rounded-2xl mb-8 shadow-2xl">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Unforgettable Events
              <span className="block text-amber-300 mt-2">+ Instant Rewards 🎉</span>
            </h1>
            <p className="text-xl mb-6 opacity-90">
              Book event tickets and earn ${rewardAmount} hotel credit instantly
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span>✓</span>
                <span>${rewardAmount} Hotel Credit per ticket</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span>✓</span>
                <span>Earn points on every booking</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span>✓</span>
                <span>Best prices guaranteed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && <LoadingSkeleton />}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 text-lg mb-4">❌ {error}</p>
            <Button onClick={fetchEvents} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Events Categories */}
        {!loading && !error && (
          <>
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
                title="Sports USA & Canada" 
                events={categories.sportsUSCA}
                icon="🏈"
                viewAllCount={categories.sportsUSCA.length}
              />
            )}
            
            {categories.musicUSCA.length >= 4 && (
              <HorizontalScroller 
                title="Music USA & Canada" 
                events={categories.musicUSCA}
                icon="🎵"
                viewAllCount={categories.musicUSCA.length}
              />
            )}
            
            {categories.ukEvents.length >= 4 && (
              <HorizontalScroller 
                title="United Kingdom Events" 
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
