import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateRange } from "@/lib/utils";
import type { Event } from "@shared/schema";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <div className="bg-card rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow" data-testid={`card-event-${event.id}`}>
      <Link href={`/events/${event.id}`}>
        <img 
          src={event.imageUrl || "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"} 
          alt={event.title} 
          className="w-full h-48 object-cover cursor-pointer"
          data-testid={`img-event-${event.id}`}
        />
      </Link>
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" data-testid={`badge-category-${event.id}`}>
            {event.category}
          </Badge>
          <span className="text-muted-foreground text-sm" data-testid={`text-date-${event.id}`}>
            {formatDateRange(event.startDate, event.endDate)}
          </span>
        </div>
        <Link href={`/events/${event.id}`}>
          <h3 className="text-xl font-bold mb-2 cursor-pointer hover:text-primary transition-colors" data-testid={`text-title-${event.id}`}>
            {event.title}
          </h3>
        </Link>
        <p className="text-muted-foreground mb-3" data-testid={`text-venue-${event.id}`}>
          {event.venue}, {event.city}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground" data-testid={`text-price-${event.id}`}>
            From {formatCurrency(event.priceFrom || 0)}/person
          </span>
          <Link href={`/events/${event.id}`}>
            <Button className="text-sm" data-testid={`button-build-trip-${event.id}`}>
              Build My Trip
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
