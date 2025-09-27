import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDateRange } from "@/lib/utils";
import { MapPin, Users, Star, Heart, Calendar, Clock, Trophy, Shield, CheckCircle, Gift } from "lucide-react";
import type { Event } from "@shared/schema";

export default function EventDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: [`/api/events/${id}`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 bg-luxury-gradient rounded-full flex items-center justify-center mx-auto mb-6 animate-luxury-pulse">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-primary mb-4">Loading Event Details</h2>
          <p className="font-accent text-muted-foreground">Preparing your premium experience...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
        <div className="glass-card p-12 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="font-display text-3xl font-bold text-destructive mb-4">Event Not Found</h1>
          <p className="text-muted-foreground font-accent mb-6">The premium event you're looking for doesn't exist or has been removed.</p>
          <Button 
            onClick={() => setLocation('/')}
            className="btn-luxury"
          >
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  const handleFindHotels = () => {
    setLocation(`/hotels?eventId=${event.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Premium Event Hero */}
      <div className="relative h-[70vh] lg:h-[80vh] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105" 
          style={{
            backgroundImage: `url("${event.imageUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080'}")`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10"></div>
        </div>
        <div className="relative z-10 flex items-end h-full">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-12 w-full">
            <div className="glass p-8 lg:p-12 text-white animate-luxury-slide-in">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <Badge 
                  variant="secondary" 
                  className="bg-luxury-gradient text-white border-0 px-4 py-2 font-accent font-semibold" 
                  data-testid="badge-category"
                >
                  ✨ {event.category}
                </Badge>
                <div className="flex items-center text-accent font-accent font-medium" data-testid="text-date-range">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDateRange(event.startDate, event.endDate)}
                </div>
              </div>
              <h1 className="font-display text-5xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight" data-testid="text-event-title">
                {event.title}
              </h1>
              <p className="text-xl lg:text-2xl mb-8 font-accent leading-relaxed opacity-90 max-w-4xl" data-testid="text-event-description">
                {event.description}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-accent font-semibold text-accent">Venue</div>
                    <span className="font-medium" data-testid="text-venue">{event.venue}, {event.city}</span>
                  </div>
                </div>
                {event.maxAttendees && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="font-accent font-semibold text-accent">Capacity</div>
                      <span className="font-medium" data-testid="text-attendees">{event.maxAttendees.toLocaleString()}+ guests</span>
                    </div>
                  </div>
                )}
                {event.rating && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-accent fill-accent" />
                    </div>
                    <div>
                      <div className="font-accent font-semibold text-accent">Rating</div>
                      <span className="font-medium" data-testid="text-rating">
                        {event.rating} ({event.reviewCount?.toLocaleString()} reviews)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 space-luxury">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Premium Event Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card p-8 animate-luxury-fade-in">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-3xl font-bold text-primary">About This Premium Event</h2>
                <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-4 py-2">
                  <Trophy className="w-4 h-4 text-accent mr-2" />
                  <span className="font-accent font-semibold text-accent text-sm">Premium Experience</span>
                </div>
              </div>
              <p className="text-muted-foreground mb-8 text-lg font-accent leading-relaxed" data-testid="text-about">
                {event.description || "Join us for an unforgettable premium experience that will create lasting memories through world-class entertainment and exceptional service."}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-display text-xl font-semibold text-primary flex items-center">
                    <Star className="w-5 h-5 text-accent mr-2" />
                    Premium Highlights
                  </h3>
                  <ul className="space-y-3" data-testid="list-highlights">
                    <li className="flex items-center text-muted-foreground font-accent">
                      <CheckCircle className="w-4 h-4 text-accent mr-3 flex-shrink-0" />
                      World-class entertainment experience
                    </li>
                    <li className="flex items-center text-muted-foreground font-accent">
                      <CheckCircle className="w-4 h-4 text-accent mr-3 flex-shrink-0" />
                      Luxury venue with premium amenities
                    </li>
                    <li className="flex items-center text-muted-foreground font-accent">
                      <CheckCircle className="w-4 h-4 text-accent mr-3 flex-shrink-0" />
                      Professional production quality
                    </li>
                    <li className="flex items-center text-muted-foreground font-accent">
                      <CheckCircle className="w-4 h-4 text-accent mr-3 flex-shrink-0" />
                      Unforgettable moments guaranteed
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-display text-xl font-semibold text-primary flex items-center">
                    <Gift className="w-5 h-5 text-accent mr-2" />
                    What's Included
                  </h3>
                  <ul className="space-y-3" data-testid="list-included">
                    <li className="flex items-center text-muted-foreground font-accent">
                      <CheckCircle className="w-4 h-4 text-accent mr-3 flex-shrink-0" />
                      Premium event access
                    </li>
                    <li className="flex items-center text-muted-foreground font-accent">
                      <CheckCircle className="w-4 h-4 text-accent mr-3 flex-shrink-0" />
                      Detailed program & information
                    </li>
                    <li className="flex items-center text-muted-foreground font-accent">
                      <CheckCircle className="w-4 h-4 text-accent mr-3 flex-shrink-0" />
                      24/7 concierge support
                    </li>
                    <li className="flex items-center text-muted-foreground font-accent">
                      <CheckCircle className="w-4 h-4 text-accent mr-3 flex-shrink-0" />
                      Digital confirmation & QR codes
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Premium Venue Information */}
            <div className="glass-card p-8 animate-luxury-slide-in">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-3xl font-bold text-primary">Venue & Location</h2>
                <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-4 py-2">
                  <MapPin className="w-4 h-4 text-accent mr-2" />
                  <span className="font-accent font-semibold text-accent text-sm">Premium Location</span>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-primary mb-3" data-testid="text-venue-name">
                      {event.venue}
                    </h3>
                    <p className="text-muted-foreground font-accent text-lg leading-relaxed" data-testid="text-venue-description">
                      Located in the heart of {event.city}, this prestigious venue provides the perfect luxury setting for an extraordinary experience with world-class facilities and exceptional service.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 glass rounded-lg">
                      <MapPin className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-accent font-semibold text-primary mb-1">Address</div>
                        <span className="text-muted-foreground" data-testid="text-address">{event.address}</span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-4 glass rounded-lg">
                      <Clock className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-accent font-semibold text-primary mb-1">Event Times</div>
                        <span className="text-muted-foreground">Doors open 1 hour before showtime</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="glass rounded-xl h-64 flex items-center justify-center relative overflow-hidden" data-testid="venue-map">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5"></div>
                    <div className="relative z-10 text-center">
                      <div className="w-16 h-16 bg-luxury-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-display text-xl font-semibold text-primary mb-2">Interactive Map</h4>
                      <p className="font-accent text-muted-foreground">Premium venue location & directions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Booking Panel */}
          <div className="lg:col-span-1">
            <div className="glass-card p-8 sticky top-24 animate-luxury-scale-in">
              <div className="text-center mb-8">
                <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-4 py-2 mb-4">
                  <Star className="w-4 h-4 text-accent mr-2" />
                  <span className="font-accent font-semibold text-accent text-sm">Premium Tickets</span>
                </div>
                <div className="font-display text-4xl font-bold text-primary mb-2" data-testid="text-price">
                  From {formatCurrency(event.priceFrom || 0)}
                </div>
                <div className="text-muted-foreground font-accent">per person</div>
              </div>

              <div className="space-y-6 mb-8">
                <div className="space-y-3">
                  <Label htmlFor="ticket-type" className="font-accent font-semibold text-primary flex items-center">
                    <Trophy className="w-4 h-4 mr-2 text-accent" />
                    Ticket Experience
                  </Label>
                  <Select defaultValue="general">
                    <SelectTrigger className="glass border-0 focus:ring-2 focus:ring-accent" data-testid="select-ticket-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">
                        General Admission - {formatCurrency(event.priceFrom || 0)}
                      </SelectItem>
                      <SelectItem value="vip">
                        VIP Access - {formatCurrency((event.priceFrom || 0) * 2.5)}
                      </SelectItem>
                      <SelectItem value="premium">
                        Premium Package - {formatCurrency((event.priceFrom || 0) * 4)}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="ticket-quantity" className="font-accent font-semibold text-primary flex items-center">
                    <Users className="w-4 h-4 mr-2 text-accent" />
                    Number of Guests
                  </Label>
                  <Select defaultValue="1">
                    <SelectTrigger className="glass border-0 focus:ring-2 focus:ring-accent" data-testid="select-quantity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Ticket</SelectItem>
                      <SelectItem value="2">2 Tickets</SelectItem>
                      <SelectItem value="3">3 Tickets</SelectItem>
                      <SelectItem value="4">4+ Tickets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <Button 
                  onClick={handleFindHotels} 
                  className="btn-luxury w-full font-accent font-semibold text-lg py-3" 
                  data-testid="button-add-to-trip"
                >
                  <MapPin className="mr-2 h-5 w-5" />
                  Add to Trip & Find Hotels
                </Button>

                <Button 
                  variant="outline" 
                  className="btn-luxury-secondary w-full font-accent font-medium" 
                  data-testid="button-save"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Save for Later
                </Button>
              </div>

              <div className="glass p-6 rounded-xl">
                <h3 className="font-display text-lg font-semibold text-primary mb-4 flex items-center">
                  <Shield className="w-5 h-5 text-accent mr-2" />
                  EventEscapes Premium
                </h3>
                <ul className="space-y-3" data-testid="list-benefits">
                  <li className="flex items-center text-muted-foreground font-accent">
                    <CheckCircle className="w-4 h-4 text-accent mr-3 flex-shrink-0" />
                    Free cancellation up to 48h
                  </li>
                  <li className="flex items-center text-muted-foreground font-accent">
                    <CheckCircle className="w-4 h-4 text-accent mr-3 flex-shrink-0" />
                    Best price guarantee
                  </li>
                  <li className="flex items-center text-muted-foreground font-accent">
                    <CheckCircle className="w-4 h-4 text-accent mr-3 flex-shrink-0" />
                    Complete luxury packages
                  </li>
                  <li className="flex items-center text-muted-foreground font-accent">
                    <CheckCircle className="w-4 h-4 text-accent mr-3 flex-shrink-0" />
                    24/7 concierge support
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
