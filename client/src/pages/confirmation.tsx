import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Check, Download, Calendar, Bed, Plane, Music, Mail, Smartphone } from "lucide-react";

// Mock confirmation data - in real app this would come from booking context or API
const mockConfirmationData = {
  bookingReference: "EVT-2024-789456",
  event: {
    name: "Summer Beats Festival",
    venue: "Central Park Great Lawn",
    dates: "July 15-17, 2024",
    tickets: "General Admission × 2",
    confirmationCode: "SBF2024001234, SBF2024001235",
  },
  hotel: {
    name: "The Plaza Hotel",
    address: "768 5th Ave, New York, NY 10019",
    dates: "July 15-17, 2024 (2 nights)",
    room: "Deluxe Room × 1",
    confirmationCode: "PLZ987654321",
  },
  flights: {
    outbound: {
      airline: "American Airlines AA1234",
      route: "LAX 08:00 → JFK 16:30 (Direct)",
      date: "July 15, 2024",
      confirmationCode: "AA123456789",
    },
    return: {
      airline: "American Airlines AA4321",
      route: "JFK 19:00 → LAX 22:15 (Direct)",
      date: "July 17, 2024",
      confirmationCode: "AA987654321",
    },
  },
  total: 2235,
};

export default function Confirmation() {
  const handleDownloadPDF = () => {
    // In real implementation, this would generate and download a PDF
    console.log("Downloading PDF...");
  };

  const handleCreateAccount = () => {
    // In real implementation, this would redirect to account creation
    console.log("Creating account...");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10" data-testid="icon-success" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2" data-testid="text-success-title">
          Booking Confirmed!
        </h1>
        <p className="text-xl text-muted-foreground" data-testid="text-success-subtitle">
          Your complete trip package has been successfully booked
        </p>
      </div>

      {/* Booking Details */}
      <div className="bg-card rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-itinerary-title">
              Trip Itinerary
            </h2>
            <p className="text-muted-foreground" data-testid="text-booking-reference">
              Booking Reference: #{mockConfirmationData.bookingReference}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleDownloadPDF}
            className="mt-4 md:mt-0"
            data-testid="button-download-pdf"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* Trip Timeline */}
        <div className="space-y-6">
          {/* Outbound Flight */}
          <div className="flex items-start space-x-4 border-l-4 border-primary pl-4">
            <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
              <Plane className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold" data-testid="text-outbound-title">Outbound Flight</h3>
                <span className="text-sm text-muted-foreground" data-testid="text-outbound-date">
                  {mockConfirmationData.flights.outbound.date}
                </span>
              </div>
              <p className="text-muted-foreground text-sm" data-testid="text-outbound-airline">
                {mockConfirmationData.flights.outbound.airline}
              </p>
              <p className="text-sm" data-testid="text-outbound-route">
                {mockConfirmationData.flights.outbound.route}
              </p>
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-outbound-confirmation">
                Confirmation: {mockConfirmationData.flights.outbound.confirmationCode}
              </p>
            </div>
          </div>

          {/* Hotel Check-in */}
          <div className="flex items-start space-x-4 border-l-4 border-accent pl-4">
            <div className="flex-shrink-0 w-12 h-12 bg-accent text-accent-foreground rounded-lg flex items-center justify-center">
              <Bed className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold" data-testid="text-hotel-title">Hotel Check-in</h3>
                <span className="text-sm text-muted-foreground" data-testid="text-hotel-dates">
                  {mockConfirmationData.hotel.dates}
                </span>
              </div>
              <p className="text-muted-foreground text-sm" data-testid="text-hotel-name">
                {mockConfirmationData.hotel.name}
              </p>
              <p className="text-sm" data-testid="text-hotel-address">
                {mockConfirmationData.hotel.address}
              </p>
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-hotel-confirmation">
                Confirmation: {mockConfirmationData.hotel.confirmationCode}
              </p>
            </div>
          </div>

          {/* Event */}
          <div className="flex items-start space-x-4 border-l-4 border-secondary pl-4">
            <div className="flex-shrink-0 w-12 h-12 bg-secondary text-secondary-foreground rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold" data-testid="text-event-title">
                  {mockConfirmationData.event.name}
                </h3>
                <span className="text-sm text-muted-foreground" data-testid="text-event-dates">
                  {mockConfirmationData.event.dates}
                </span>
              </div>
              <p className="text-muted-foreground text-sm" data-testid="text-event-venue">
                {mockConfirmationData.event.venue}
              </p>
              <p className="text-sm" data-testid="text-event-tickets">
                {mockConfirmationData.event.tickets}
              </p>
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-event-confirmation">
                Ticket IDs: {mockConfirmationData.event.confirmationCode}
              </p>
            </div>
          </div>

          {/* Return Flight */}
          <div className="flex items-start space-x-4 border-l-4 border-primary pl-4">
            <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
              <Plane className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold" data-testid="text-return-title">Return Flight</h3>
                <span className="text-sm text-muted-foreground" data-testid="text-return-date">
                  {mockConfirmationData.flights.return.date}
                </span>
              </div>
              <p className="text-muted-foreground text-sm" data-testid="text-return-airline">
                {mockConfirmationData.flights.return.airline}
              </p>
              <p className="text-sm" data-testid="text-return-route">
                {mockConfirmationData.flights.return.route}
              </p>
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-return-confirmation">
                Confirmation: {mockConfirmationData.flights.return.confirmationCode}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-3">
            <Mail className="inline mr-2 text-primary w-5 h-5" />
            Check Your Email
          </h3>
          <p className="text-muted-foreground text-sm" data-testid="text-email-instructions">
            Confirmation details and tickets have been sent to your email address. 
            Make sure to check your spam folder if you don't see them.
          </p>
        </div>
        <div className="bg-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-3">
            <Smartphone className="inline mr-2 text-primary w-5 h-5" />
            Download Our App
          </h3>
          <p className="text-muted-foreground text-sm mb-3" data-testid="text-app-instructions">
            Access your tickets and manage your trip on the go with the EventEscapes mobile app.
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" data-testid="button-app-store">
              App Store
            </Button>
            <Button variant="outline" size="sm" data-testid="button-google-play">
              Google Play
            </Button>
          </div>
        </div>
      </div>

      {/* Account Creation CTA */}
      <div className="bg-gradient-to-r from-primary to-accent text-white rounded-xl p-6 text-center">
        <h3 className="text-xl font-bold mb-2" data-testid="text-account-cta-title">
          Create Your EventEscapes Account
        </h3>
        <p className="mb-4 opacity-90" data-testid="text-account-cta-description">
          Save your booking details, track your trips, and get exclusive offers for future events.
        </p>
        <Button 
          onClick={handleCreateAccount}
          className="bg-white text-primary hover:bg-white/90 font-medium"
          data-testid="button-create-account"
        >
          Create Free Account
        </Button>
      </div>
    </div>
  );
}
