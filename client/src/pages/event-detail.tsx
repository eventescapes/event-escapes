import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDateRange } from "@/lib/utils";
import { MapPin, Users, Star, Heart } from "lucide-react";
import type { Event } from "@shared/schema";

export default function EventDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: [`/api/events/${id}`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Event Not Found</h1>
          <p className="text-muted-foreground">The event you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const handleFindHotels = () => {
    setLocation(`/hotels?eventId=${event.id}`);
  };

  return (
    <div>
      {/* Event Hero */}
      <div className="relative h-96 md:h-[600px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{
            backgroundImage: `url("${event.imageUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080'}")`
          }}
        >
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
        <div className="relative z-10 flex items-end h-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <Badge variant="secondary" className="bg-accent text-accent-foreground" data-testid="badge-category">
                  {event.category}
                </Badge>
                <span className="text-sm" data-testid="text-date-range">
                  {formatDateRange(event.startDate, event.endDate)}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-event-title">
                {event.title}
              </h1>
              <p className="text-xl mb-4" data-testid="text-event-description">
                {event.description}
              </p>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span data-testid="text-venue">{event.venue}, {event.city}</span>
                </div>
                {event.maxAttendees && (
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span data-testid="text-attendees">{event.maxAttendees.toLocaleString()}+ attendees</span>
                  </div>
                )}
                {event.rating && (
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 fill-accent text-accent" />
                    <span data-testid="text-rating">
                      {event.rating} ({event.reviewCount?.toLocaleString()} reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">About This Event</h2>
              <p className="text-muted-foreground mb-4" data-testid="text-about">
                {event.description || "Join us for an unforgettable experience that will create lasting memories."}
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-semibold mb-2">Event Highlights</h3>
                  <ul className="text-muted-foreground space-y-1" data-testid="list-highlights">
                    <li>• World-class experience</li>
                    <li>• Premium venue</li>
                    <li>• Professional production</li>
                    <li>• Memorable moments</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">What's Included</h3>
                  <ul className="text-muted-foreground space-y-1" data-testid="list-included">
                    <li>• Event access</li>
                    <li>• Program & information</li>
                    <li>• Customer support</li>
                    <li>• Digital confirmation</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Venue Information */}
            <div className="bg-card rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Venue & Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2" data-testid="text-venue-name">{event.venue}</h3>
                  <p className="text-muted-foreground mb-3" data-testid="text-venue-description">
                    Located in {event.city}, this venue provides the perfect setting for an amazing experience.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span data-testid="text-address">{event.address}</span>
                    </div>
                  </div>
                </div>
                <div className="map-container rounded-lg h-48 flex items-center justify-center relative" data-testid="venue-map">
                  <div className="map-pin text-primary text-2xl" style={{ top: '50%', left: '50%' }}>
                    <MapPin className="w-6 h-6" />
                  </div>
                  <span className="text-muted-foreground">Interactive Map</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Panel */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="text-price">
                  From {formatCurrency(event.priceFrom || 0)}
                </div>
                <div className="text-muted-foreground">per person</div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="ticket-type" className="block text-sm font-medium mb-2">
                    Ticket Type
                  </Label>
                  <Select defaultValue="general">
                    <SelectTrigger data-testid="select-ticket-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">
                        General Admission - {formatCurrency(event.priceFrom || 0)}
                      </SelectItem>
                      <SelectItem value="vip">
                        VIP Access - {formatCurrency((parseFloat(event.priceFrom || "0") * 2.5).toString())}
                      </SelectItem>
                      <SelectItem value="premium">
                        Premium Package - {formatCurrency((parseFloat(event.priceFrom || "0") * 4).toString())}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ticket-quantity" className="block text-sm font-medium mb-2">
                    Number of Tickets
                  </Label>
                  <Select defaultValue="1">
                    <SelectTrigger data-testid="select-quantity">
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

              <Button 
                onClick={handleFindHotels} 
                className="w-full mb-4" 
                data-testid="button-add-to-trip"
              >
                Add to Trip & Find Hotels
              </Button>

              <Button variant="outline" className="w-full" data-testid="button-save">
                <Heart className="mr-2 h-4 w-4" />
                Save for Later
              </Button>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">
                  <i className="fas fa-info-circle text-primary mr-2"></i>
                  Why book with EventEscapes?
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1" data-testid="list-benefits">
                  <li>• Free cancellation up to 48h</li>
                  <li>• Best price guarantee</li>
                  <li>• Complete trip packages</li>
                  <li>• 24/7 customer support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
