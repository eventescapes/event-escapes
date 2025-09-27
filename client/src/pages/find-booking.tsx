import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, Download, Eye, Info } from "lucide-react";
import { z } from "zod";
import type { Booking } from "@shared/schema";

const searchSchema = z.object({
  email: z.string().email("Valid email address is required"),
  bookingReference: z.string().optional(),
});

type SearchForm = z.infer<typeof searchSchema>;

interface BookingWithItems extends Booking {
  items: Array<{
    id: string;
    type: string;
    details: any;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
}

export default function FindBooking() {
  const [searchResults, setSearchResults] = useState<BookingWithItems[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const form = useForm<SearchForm>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      email: "",
      bookingReference: "",
    },
  });

  const handleSearch = async (data: SearchForm) => {
    try {
      setHasSearched(true);
      
      const response = await fetch(`/api/bookings/search?email=${encodeURIComponent(data.email)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search bookings');
      }
      
      const bookings = await response.json();
      setSearchResults(bookings);
      
      if (bookings.length === 0) {
        toast({
          title: "No Bookings Found",
          description: "We couldn't find any bookings associated with this email address.",
        });
      } else {
        toast({
          title: "Bookings Found",
          description: `Found ${bookings.length} booking${bookings.length > 1 ? 's' : ''} for this email.`,
        });
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "There was an error searching for your bookings. Please try again.",
        variant: "destructive",
      });
      setSearchResults([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEventName = (booking: BookingWithItems) => {
    const eventItem = booking.items.find(item => item.type === 'event');
    return eventItem?.details?.name || 'Event Booking';
  };

  const handleViewDetails = (bookingId: string) => {
    // In real implementation, this would navigate to booking details page
    console.log('Viewing details for booking:', bookingId);
  };

  const handleDownloadPDF = (bookingId: string) => {
    // In real implementation, this would download the booking PDF
    console.log('Downloading PDF for booking:', bookingId);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-find-booking-title">
          Find My Booking
        </h1>
        <p className="text-xl text-muted-foreground" data-testid="text-find-booking-subtitle">
          Enter your email address to retrieve your booking details
        </p>
      </div>

      <div className="bg-card rounded-xl p-8">
        <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-6">
          <div>
            <Label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter the email used for booking"
              {...form.register("email")}
              className="text-lg"
              data-testid="input-email"
            />
            {form.formState.errors.email && (
              <p className="text-destructive text-sm mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="bookingReference" className="block text-sm font-medium mb-2">
              Booking Reference (Optional)
            </Label>
            <Input
              id="bookingReference"
              type="text"
              placeholder="e.g., EVT-2024-789456"
              {...form.register("bookingReference")}
              className="text-lg"
              data-testid="input-booking-reference"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full text-lg py-3"
            data-testid="button-find-bookings"
          >
            <Search className="mr-2 h-5 w-5" />
            Find My Bookings
          </Button>
        </form>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">
            <Info className="inline mr-2 text-primary w-5 h-5" />
            Can't find your booking?
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1" data-testid="list-help-tips">
            <li>• Make sure you're using the correct email address</li>
            <li>• Check your spam/junk folder for confirmation emails</li>
            <li>• Contact our support team if you need assistance</li>
          </ul>
          <Button variant="link" className="mt-3 p-0 h-auto text-primary" data-testid="button-contact-support">
            Contact Support
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && searchResults && (
        <div className="mt-8 bg-card rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4" data-testid="text-results-title">
            {searchResults.length > 0 ? 'Found Bookings' : 'No Bookings Found'}
          </h2>
          
          {searchResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground" data-testid="text-no-results">
                No bookings were found for this email address. Please check your email and try again, 
                or contact support if you believe this is an error.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((booking) => (
                <div 
                  key={booking.id} 
                  className="border border-border rounded-lg p-4"
                  data-testid={`booking-result-${booking.id}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold" data-testid={`text-booking-name-${booking.id}`}>
                      {getEventName(booking)}
                    </h3>
                    <Badge 
                      className={`text-white ${getStatusColor(booking.status)}`}
                      data-testid={`badge-status-${booking.id}`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-muted-foreground">Booking Ref:</span>
                      <span className="font-medium ml-1" data-testid={`text-booking-ref-${booking.id}`}>
                        {booking.id}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-medium ml-1" data-testid={`text-booking-total-${booking.id}`}>
                        {formatCurrency(booking.totalAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Booked:</span>
                      <span className="font-medium ml-1" data-testid={`text-booking-date-${booking.id}`}>
                        {formatDate(booking.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Guest:</span>
                      <span className="font-medium ml-1" data-testid={`text-guest-name-${booking.id}`}>
                        {booking.guestName}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      size="sm"
                      onClick={() => handleViewDetails(booking.id)}
                      data-testid={`button-view-details-${booking.id}`}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadPDF(booking.id)}
                      data-testid={`button-download-pdf-${booking.id}`}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
