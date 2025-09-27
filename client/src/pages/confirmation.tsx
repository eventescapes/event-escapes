import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Check, Download, Calendar, Bed, Plane, Music, Mail, Smartphone, Star, Shield, Gift, Sparkles, Trophy, Crown } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
        {/* Premium Success Header */}
        <div className="text-center mb-16 animate-luxury-fade-in">
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-luxury-gradient rounded-full flex items-center justify-center mx-auto shadow-luxury-xl animate-luxury-pulse">
              <Check className="w-16 h-16 text-white" data-testid="icon-success" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-6 py-3 mb-6">
            <Crown className="w-5 h-5 text-accent mr-2" />
            <span className="font-accent font-semibold text-accent text-sm tracking-wide uppercase">Premium Booking</span>
          </div>
          <h1 className="font-display text-5xl lg:text-6xl font-bold text-primary mb-6 tracking-tight" data-testid="text-success-title">
            Booking
            <span className="text-luxury block">Confirmed!</span>
          </h1>
          <p className="text-xl lg:text-2xl text-muted-foreground font-accent leading-relaxed max-w-3xl mx-auto" data-testid="text-success-subtitle">
            Your luxury travel experience has been successfully secured with our premium concierge service
          </p>
        </div>

        {/* Premium Booking Details */}
        <div className="glass-card p-8 mb-12 animate-luxury-slide-in">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-luxury-gradient rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-bold text-primary" data-testid="text-itinerary-title">
                    Premium Itinerary
                  </h2>
                  <p className="text-muted-foreground font-accent" data-testid="text-booking-reference">
                    Booking Reference: <span className="font-semibold text-accent">#{mockConfirmationData.bookingReference}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="outline" 
                onClick={handleDownloadPDF}
                className="btn-luxury-secondary font-accent font-medium"
                data-testid="button-download-pdf"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Premium PDF
              </Button>
              <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-4 py-2">
                <Shield className="w-4 h-4 text-accent mr-2" />
                <span className="font-accent font-semibold text-accent text-sm">Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Premium Trip Timeline */}
          <div className="space-y-8">
            {/* Premium Outbound Flight */}
            <div className="glass p-6 rounded-xl transition-all duration-300 hover:shadow-luxury border-l-4 border-accent">
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-16 h-16 bg-luxury-gradient rounded-xl flex items-center justify-center shadow-luxury">
                  <Plane className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                    <h3 className="font-display text-xl font-semibold text-primary" data-testid="text-outbound-title">Departure Flight</h3>
                    <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-3 py-1">
                      <Calendar className="w-3 h-3 text-accent mr-1" />
                      <span className="text-sm font-accent font-medium text-accent" data-testid="text-outbound-date">
                        {mockConfirmationData.flights.outbound.date}
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground font-accent mb-2" data-testid="text-outbound-airline">
                    {mockConfirmationData.flights.outbound.airline}
                  </p>
                  <p className="font-accent font-medium text-primary mb-3" data-testid="text-outbound-route">
                    {mockConfirmationData.flights.outbound.route}
                  </p>
                  <div className="glass p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground font-accent" data-testid="text-outbound-confirmation">
                      Confirmation Code: <span className="font-semibold text-accent">{mockConfirmationData.flights.outbound.confirmationCode}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Hotel Check-in */}
            <div className="glass p-6 rounded-xl transition-all duration-300 hover:shadow-luxury border-l-4 border-luxury">
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-16 h-16 bg-luxury-gradient rounded-xl flex items-center justify-center shadow-luxury">
                  <Bed className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                    <h3 className="font-display text-xl font-semibold text-primary" data-testid="text-hotel-title">Luxury Accommodation</h3>
                    <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-3 py-1">
                      <Calendar className="w-3 h-3 text-accent mr-1" />
                      <span className="text-sm font-accent font-medium text-accent" data-testid="text-hotel-dates">
                        {mockConfirmationData.hotel.dates}
                      </span>
                    </div>
                  </div>
                  <p className="font-accent font-semibold text-primary text-lg mb-2" data-testid="text-hotel-name">
                    {mockConfirmationData.hotel.name}
                  </p>
                  <p className="text-muted-foreground font-accent mb-3" data-testid="text-hotel-address">
                    {mockConfirmationData.hotel.address}
                  </p>
                  <div className="glass p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground font-accent" data-testid="text-hotel-confirmation">
                      Reservation Code: <span className="font-semibold text-accent">{mockConfirmationData.hotel.confirmationCode}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Event */}
            <div className="glass p-6 rounded-xl transition-all duration-300 hover:shadow-luxury border-l-4 border-accent">
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-16 h-16 bg-luxury-gradient rounded-xl flex items-center justify-center shadow-luxury">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                    <h3 className="font-display text-xl font-semibold text-primary" data-testid="text-event-title">
                      {mockConfirmationData.event.name}
                    </h3>
                    <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-3 py-1">
                      <Star className="w-3 h-3 text-accent mr-1" />
                      <span className="text-sm font-accent font-medium text-accent" data-testid="text-event-dates">
                        {mockConfirmationData.event.dates}
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground font-accent mb-2" data-testid="text-event-venue">
                    {mockConfirmationData.event.venue}
                  </p>
                  <p className="font-accent font-medium text-primary mb-3" data-testid="text-event-tickets">
                    {mockConfirmationData.event.tickets}
                  </p>
                  <div className="glass p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground font-accent" data-testid="text-event-confirmation">
                      Ticket IDs: <span className="font-semibold text-accent">{mockConfirmationData.event.confirmationCode}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Return Flight */}
            <div className="glass p-6 rounded-xl transition-all duration-300 hover:shadow-luxury border-l-4 border-accent">
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-16 h-16 bg-luxury-gradient rounded-xl flex items-center justify-center shadow-luxury">
                  <Plane className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                    <h3 className="font-display text-xl font-semibold text-primary" data-testid="text-return-title">Return Flight</h3>
                    <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-3 py-1">
                      <Calendar className="w-3 h-3 text-accent mr-1" />
                      <span className="text-sm font-accent font-medium text-accent" data-testid="text-return-date">
                        {mockConfirmationData.flights.return.date}
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground font-accent mb-2" data-testid="text-return-airline">
                    {mockConfirmationData.flights.return.airline}
                  </p>
                  <p className="font-accent font-medium text-primary mb-3" data-testid="text-return-route">
                    {mockConfirmationData.flights.return.route}
                  </p>
                  <div className="glass p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground font-accent" data-testid="text-return-confirmation">
                      Confirmation Code: <span className="font-semibold text-accent">{mockConfirmationData.flights.return.confirmationCode}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Next Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="glass-card p-8 animate-luxury-scale-in">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-luxury-gradient rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display text-xl font-semibold text-primary">
                Check Your Inbox
              </h3>
            </div>
            <p className="text-muted-foreground font-accent leading-relaxed" data-testid="text-email-instructions">
              Premium confirmation details and digital tickets have been sent to your email address. 
              All booking confirmations are secured and include our luxury support contact.
            </p>
            <div className="mt-4 glass p-3 rounded-lg">
              <p className="text-xs text-accent font-accent font-medium">Pro tip: Add our emails to your trusted contacts to ensure delivery</p>
            </div>
          </div>
          <div className="glass-card p-8 animate-luxury-scale-in">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-luxury-gradient rounded-full flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display text-xl font-semibold text-primary">
                EventEscapes App
              </h3>
            </div>
            <p className="text-muted-foreground font-accent leading-relaxed mb-6" data-testid="text-app-instructions">
              Access your premium tickets and manage your luxury travel experience on the go with our award-winning mobile app.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="btn-luxury-secondary font-accent flex-1" 
                data-testid="button-app-store"
              >
                📱 App Store
              </Button>
              <Button 
                variant="outline" 
                className="btn-luxury-secondary font-accent flex-1" 
                data-testid="button-google-play"
              >
                🤖 Google Play
              </Button>
            </div>
          </div>
        </div>

        {/* Premium Account Creation CTA */}
        <div className="glass-card p-12 text-center animate-luxury-fade-in">
          <div className="mb-8">
            <div className="w-20 h-20 bg-luxury-gradient rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-display text-3xl font-bold text-primary mb-4" data-testid="text-account-cta-title">
              Join EventEscapes Elite
            </h3>
            <p className="text-muted-foreground font-accent text-lg leading-relaxed max-w-2xl mx-auto" data-testid="text-account-cta-description">
              Create your premium account to save booking details, track luxury trips, and receive exclusive VIP offers for future experiences.
            </p>
          </div>
          <div className="space-y-4">
            <Button 
              onClick={handleCreateAccount}
              className="btn-luxury px-12 py-4 text-lg font-accent font-semibold"
              data-testid="button-create-account"
            >
              <Gift className="mr-3 h-5 w-5" />
              Create Elite Account
            </Button>
            <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground font-accent">
              <span className="flex items-center">
                <Shield className="w-3 h-3 mr-1" />
                Secure
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Gift className="w-3 h-3 mr-1" />
                Exclusive Perks
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Star className="w-3 h-3 mr-1" />
                Free Forever
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
