import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useBooking } from "@/contexts/BookingContext";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { Calendar, Bed, Plane, Music, CreditCard, Bitcoin, Shield, Star, CheckCircle, User, Mail, Phone, Lock, Gift } from "lucide-react";
import { z } from "zod";
import { Env, assertSecretsReady } from "@/config/env";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
let stripePromise: ReturnType<typeof loadStripe> | null = null;
assertSecretsReady(["STRIPE_PUBLISHABLE_KEY"]);
if (Env.STRIPE_PUBLISHABLE_KEY) {
  stripePromise = loadStripe(Env.STRIPE_PUBLISHABLE_KEY);
  console.log("✓ Stripe payment integration enabled");
} else {
  console.log("⚠ Stripe payment integration disabled - payment processing unavailable");
}

const guestInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  paymentMethod: z.enum(["card", "crypto"]),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to terms and conditions"),
});

type GuestInfo = z.infer<typeof guestInfoSchema>;

// Helper function to format booking data for display
const getBookingDisplayData = ({ booking, calculateTotal }: { booking: any, calculateTotal: () => number }) => {
  const subtotal = calculateTotal();
  const taxes = Math.round(subtotal * 0.1); // 10% tax
  const total = subtotal + taxes;

  return {
    event: {
      name: booking.selectedEvent?.title || "No Event Selected",
      dates: booking.selectedEvent?.date || "TBD",
      tickets: "General Admission × 1",
      price: booking.selectedEvent?.price || 0,
    },
    hotel: {
      name: booking.selectedHotel?.name || "No Hotel Selected",
      dates: "TBD",
      room: "Standard Room × 1",
      price: booking.selectedHotel?.price || 0,
    },
    flights: {
      route: "TBD",
      details: "Economy × 1 passenger",
      price: (booking.selectedOutboundFlight?.price || 0) + (booking.selectedReturnFlight?.price || 0),
    },
    subtotal,
    taxes,
    total,
  };
};

const CheckoutForm = ({ bookingData }: { bookingData: ReturnType<typeof getBookingDisplayData> }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const { booking } = useBooking(); // Access booking context directly

  const form = useForm<GuestInfo>({
    resolver: zodResolver(guestInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      paymentMethod: "card",
      agreeToTerms: false,
    },
  });

  const handleSubmit = async (data: GuestInfo) => {
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      if (data.paymentMethod === "card") {
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/confirmation`,
          },
        });

        if (error) {
          toast({
            title: "Payment Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          // Create booking record with flight and seat data  
          // Access the actual booking context data
          
          // Prepare flight data if flights are selected
          let flightData = null;
          if (booking.selectedOutboundFlight || booking.selectedReturnFlight) {
            flightData = {
              offerId: booking.selectedOutboundFlight?.id || booking.selectedReturnFlight?.id || 'unknown-offer-id', // TODO: Store proper offer_id in BookingContext
              slices: [] as any[], // Type as any[] to avoid TypeScript never[] error
              currency: 'USD',
              passengers: 1, // TODO: Get from search params
              totalPrice: (booking.selectedOutboundFlight?.price || 0) + (booking.selectedReturnFlight?.price || 0),
              tripType: booking.selectedReturnFlight ? 'return' : 'one-way'
            };
            
            // Add outbound slice
            if (booking.selectedOutboundFlight) {
              flightData.slices.push({
                index: 0,
                type: 'outbound',
                airline: booking.selectedOutboundFlight.airline,
                departure: booking.selectedOutboundFlight.departure,
                arrival: booking.selectedOutboundFlight.arrival,
                duration: booking.selectedOutboundFlight.duration,
                price: booking.selectedOutboundFlight.price,
                stops: booking.selectedOutboundFlight.stops
              });
            }
            
            // Add return slice
            if (booking.selectedReturnFlight) {
              flightData.slices.push({
                index: 1,
                type: 'return',
                airline: booking.selectedReturnFlight.airline,
                departure: booking.selectedReturnFlight.departure,
                arrival: booking.selectedReturnFlight.arrival,
                duration: booking.selectedReturnFlight.duration,
                price: booking.selectedReturnFlight.price,
                stops: booking.selectedReturnFlight.stops
              });
            }
          }

          await apiRequest("POST", "/api/bookings", {
            guestEmail: data.email,
            guestName: `${data.firstName} ${data.lastName}`,
            guestPhone: data.phone,
            totalAmount: bookingData.total,
            status: "confirmed",
            flightData,
            selectedSeats: booking.selectedSeats || {}
          });

          setLocation("/confirmation");
        }
      } else {
        // Handle crypto payment
        toast({
          title: "Crypto Payment",
          description: "Crypto payment integration coming soon!",
        });
      }
    } catch (error) {
      toast({
        title: "Booking Error",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      {/* Premium Guest Information */}
      <div className="glass-card p-8 animate-luxury-fade-in">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl font-bold text-primary">Guest Information</h2>
          <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-4 py-2">
            <User className="w-4 h-4 text-accent mr-2" />
            <span className="font-accent font-semibold text-accent text-sm">Primary Guest</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="firstName" className="font-accent font-semibold text-primary flex items-center">
              <User className="w-4 h-4 mr-2 text-accent" />
              First Name
            </Label>
            <Input
              id="firstName"
              {...form.register("firstName")}
              className="glass border-0 focus:ring-2 focus:ring-accent font-accent"
              placeholder="Enter your first name"
              data-testid="input-first-name"
            />
            {form.formState.errors.firstName && (
              <p className="text-destructive text-sm mt-2 font-accent">{form.formState.errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-3">
            <Label htmlFor="lastName" className="font-accent font-semibold text-primary flex items-center">
              <User className="w-4 h-4 mr-2 text-accent" />
              Last Name
            </Label>
            <Input
              id="lastName"
              {...form.register("lastName")}
              className="glass border-0 focus:ring-2 focus:ring-accent font-accent"
              placeholder="Enter your last name"
              data-testid="input-last-name"
            />
            {form.formState.errors.lastName && (
              <p className="text-destructive text-sm mt-2 font-accent">{form.formState.errors.lastName.message}</p>
            )}
          </div>
          <div className="space-y-3">
            <Label htmlFor="email" className="font-accent font-semibold text-primary flex items-center">
              <Mail className="w-4 h-4 mr-2 text-accent" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              className="glass border-0 focus:ring-2 focus:ring-accent font-accent"
              placeholder="your@email.com"
              data-testid="input-email"
            />
            {form.formState.errors.email && (
              <p className="text-destructive text-sm mt-2 font-accent">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-3">
            <Label htmlFor="phone" className="font-accent font-semibold text-primary flex items-center">
              <Phone className="w-4 h-4 mr-2 text-accent" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              {...form.register("phone")}
              className="glass border-0 focus:ring-2 focus:ring-accent font-accent"
              placeholder="+1 (555) 123-4567"
              data-testid="input-phone"
            />
            {form.formState.errors.phone && (
              <p className="text-destructive text-sm mt-2 font-accent">{form.formState.errors.phone.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Premium Payment Method */}
      <div className="glass-card p-8 animate-luxury-slide-in">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl font-bold text-primary">Payment Method</h2>
          <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-4 py-2">
            <Lock className="w-4 h-4 text-accent mr-2" />
            <span className="font-accent font-semibold text-accent text-sm">Secure Payment</span>
          </div>
        </div>
        <RadioGroup
          value={form.watch("paymentMethod")}
          onValueChange={(value) => form.setValue("paymentMethod", value as "card" | "crypto")}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-xl transition-all duration-300 hover:shadow-luxury">
            <div className="flex items-center space-x-4">
              <RadioGroupItem value="card" id="card" data-testid="radio-card" className="border-accent" />
              <Label htmlFor="card" className="flex items-center space-x-4 flex-1 cursor-pointer">
                <div className="w-12 h-12 bg-luxury-gradient rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-accent font-semibold text-primary">Credit/Debit Card</div>
                  <div className="text-sm text-muted-foreground font-accent">Secure payment via Stripe</div>
                </div>
                <div className="flex space-x-2">
                  <i className="fab fa-cc-visa text-2xl text-accent"></i>
                  <i className="fab fa-cc-mastercard text-2xl text-accent"></i>
                  <i className="fab fa-cc-amex text-2xl text-accent"></i>
                </div>
              </Label>
            </div>
          </div>
          
          {form.watch("paymentMethod") === "card" && (
            <div className="ml-16 p-6 glass rounded-xl animate-luxury-scale-in">
              <PaymentElement 
                data-testid="stripe-payment-element"
                options={{
                  layout: 'tabs'
                }}
              />
            </div>
          )}

          <div className="glass p-6 rounded-xl transition-all duration-300 hover:shadow-luxury opacity-60">
            <div className="flex items-center space-x-4">
              <RadioGroupItem value="crypto" id="crypto" data-testid="radio-crypto" className="border-accent" disabled />
              <Label htmlFor="crypto" className="flex items-center space-x-4 cursor-pointer">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Bitcoin className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="font-accent font-semibold text-muted-foreground">Cryptocurrency</div>
                  <div className="text-sm text-muted-foreground font-accent">Coming soon</div>
                </div>
                <div className="flex space-x-2">
                  <i className="fab fa-bitcoin text-2xl text-muted-foreground"></i>
                  <i className="fab fa-ethereum text-2xl text-muted-foreground"></i>
                </div>
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Premium Terms and Conditions */}
      <div className="glass-card p-8 animate-luxury-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-xl font-semibold text-primary">Terms & Agreement</h3>
          <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-4 py-2">
            <Shield className="w-4 h-4 text-accent mr-2" />
            <span className="font-accent font-semibold text-accent text-sm">Protected</span>
          </div>
        </div>
        <div className="flex items-start space-x-4 p-4 glass rounded-xl">
          <Checkbox
            id="terms"
            checked={form.watch("agreeToTerms")}
            onCheckedChange={(checked) => form.setValue("agreeToTerms", checked as boolean)}
            data-testid="checkbox-terms"
            className="border-accent data-[state=checked]:bg-luxury-gradient data-[state=checked]:border-accent mt-1"
          />
          <div className="flex-1">
            <Label htmlFor="terms" className="cursor-pointer font-accent font-medium text-primary leading-relaxed">
              I agree to EventEscapes'{" "}
              <a href="#" className="text-accent hover:text-luxury font-semibold hover:underline transition-colors">
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a href="#" className="text-accent hover:text-luxury font-semibold hover:underline transition-colors">
                Privacy Policy
              </a>
              .
            </Label>
            <p className="mt-3 text-muted-foreground font-accent leading-relaxed">
              By completing this booking, you also agree to the cancellation and refund policies of individual service providers. All transactions are protected by our premium guarantee.
            </p>
          </div>
        </div>
        {form.formState.errors.agreeToTerms && (
          <p className="text-destructive text-sm mt-4 font-accent flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            {form.formState.errors.agreeToTerms.message}
          </p>
        )}
      </div>

      <div className="space-y-6">
        <Button
          type="submit"
          className="btn-luxury w-full py-4 text-lg font-accent font-semibold animate-luxury-pulse"
          disabled={!stripe || isProcessing}
          data-testid="button-complete-booking"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
              Processing Your Booking...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Gift className="w-5 h-5 mr-3" />
              Complete Booking - {formatCurrency(bookingData.total)}
            </div>
          )}
        </Button>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="w-4 h-4 text-accent" />
            <p className="text-sm text-muted-foreground font-accent">
              Secure payment processed by Stripe
            </p>
          </div>
          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground font-accent">
            <span className="flex items-center">
              <Lock className="w-3 h-3 mr-1" />
              256-bit SSL
            </span>
            <span>•</span>
            <span className="flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              PCI Compliant
            </span>
          </div>
        </div>
      </div>
    </form>
  );
};

export default function Checkout() {
  const { booking, calculateTotal } = useBooking();
  const bookingData = getBookingDisplayData({ booking, calculateTotal });
  const [clientSecret, setClientSecret] = useState("");
  const [stripeAvailable, setStripeAvailable] = useState(!!stripePromise);
  const { toast } = useToast();

  useEffect(() => {
    // Only create PaymentIntent if Stripe is available
    if (stripePromise) {
      apiRequest("POST", "/api/create-payment-intent", { 
        amount: bookingData.total,
        bookingId: "temp-booking-id" 
      })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch((error) => {
          console.log("Payment setup failed:", error);
          setStripeAvailable(false);
          toast({
            title: "Payment Setup Error",
            description: "Payment processing is currently unavailable. You can still review your booking details.",
            variant: "destructive",
          });
        });
    }
  }, [bookingData.total, toast]);

  // If Stripe is not available, show the form without payment processing
  if (!stripeAvailable || !stripePromise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="text-center mb-12 animate-luxury-fade-in">
            <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-4 py-2 mb-6">
              <Calendar className="w-4 h-4 text-accent mr-2" />
              <span className="font-accent font-semibold text-accent text-sm tracking-wide uppercase">Trip Review</span>
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-primary mb-4 tracking-tight" data-testid="text-checkout-title">
              Review Your
              <span className="text-luxury block">Premium Journey</span>
            </h1>
          </div>
          <div className="glass-card p-6 mb-8 animate-luxury-slide-in">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-accent font-semibold text-amber-600 dark:text-amber-400">
                  ⚠ Payment processing is temporarily unavailable
                </p>
                <p className="text-muted-foreground font-accent text-sm">
                  You can review your luxury trip details below. Payment will be processed once available.
                </p>
              </div>
            </div>
          </div>
          <CheckoutForm bookingData={bookingData} />
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 bg-luxury-gradient rounded-full flex items-center justify-center mx-auto mb-6 animate-luxury-pulse">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-primary mb-4">Preparing Secure Payment</h2>
          <p className="font-accent text-muted-foreground mb-6">Setting up your premium checkout experience...</p>
          <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full mx-auto" aria-label="Loading" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="text-center mb-12 animate-luxury-fade-in">
          <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-4 py-2 mb-6">
            <Calendar className="w-4 h-4 text-accent mr-2" />
            <span className="font-accent font-semibold text-accent text-sm tracking-wide uppercase">Premium Checkout</span>
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-primary mb-4 tracking-tight" data-testid="text-checkout-title">
            Complete Your
            <span className="text-luxury block">Luxury Experience</span>
          </h1>
          <p className="font-accent text-muted-foreground text-lg max-w-2xl mx-auto">
            Secure your premium travel package with our luxury concierge service
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Premium Booking Form */}
          <div className="lg:col-span-2">
            {stripePromise !== null && clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm bookingData={bookingData} />
              </Elements>
            ) : (
              <CheckoutForm bookingData={bookingData} />
            )}
          </div>

          {/* Premium Booking Summary */}
          <div className="lg:col-span-1">
            <div className="glass-card p-8 sticky top-24 animate-luxury-scale-in">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-2xl font-bold text-primary">Trip Summary</h2>
                <div className="inline-flex items-center bg-luxury-gradient-subtle rounded-full px-4 py-2">
                  <Star className="w-4 h-4 text-accent mr-2" />
                  <span className="font-accent font-semibold text-accent text-sm">Premium</span>
                </div>
              </div>
              
              {/* Premium Event */}
              <div className="mb-8 p-4 glass rounded-xl">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-luxury-gradient rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-accent font-semibold text-primary" data-testid="text-event-name">
                      {bookingData.event.name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-accent" data-testid="text-event-dates">
                      {bookingData.event.dates}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3 font-accent" data-testid="text-event-tickets">
                  {bookingData.event.tickets}
                </p>
                <p className="text-right font-accent font-bold text-primary text-lg" data-testid="text-event-price">
                  {formatCurrency(bookingData.event.price)}
                </p>
              </div>

              {/* Premium Hotel */}
              <div className="mb-8 p-4 glass rounded-xl">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-luxury-gradient rounded-full flex items-center justify-center">
                    <Bed className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-accent font-semibold text-primary" data-testid="text-hotel-name">
                      {bookingData.hotel.name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-accent" data-testid="text-hotel-dates">
                      {bookingData.hotel.dates}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3 font-accent" data-testid="text-hotel-room">
                  {bookingData.hotel.room}
                </p>
                <p className="text-right font-accent font-bold text-primary text-lg" data-testid="text-hotel-price">
                  {formatCurrency(bookingData.hotel.price)}
                </p>
              </div>

              {/* Premium Flights */}
              <div className="mb-8 p-4 glass rounded-xl">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-luxury-gradient rounded-full flex items-center justify-center">
                    <Plane className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-accent font-semibold text-primary" data-testid="text-flights-name">
                      Round-trip Flights
                    </h3>
                    <p className="text-sm text-muted-foreground font-accent" data-testid="text-flights-route">
                      {bookingData.flights.route}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3 font-accent" data-testid="text-flights-details">
                  {bookingData.flights.details}
                </p>
                <p className="text-right font-accent font-bold text-primary text-lg" data-testid="text-flights-price">
                  {formatCurrency(bookingData.flights.price)}
                </p>
              </div>

              {/* Premium Total */}
              <div className="glass p-6 rounded-xl">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center font-accent">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-primary" data-testid="text-subtotal">{formatCurrency(bookingData.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center font-accent">
                    <span className="text-muted-foreground">Taxes & Fees</span>
                    <span className="font-medium text-primary" data-testid="text-taxes">{formatCurrency(bookingData.taxes)}</span>
                  </div>
                </div>
                <div className="border-t border-accent/20 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-display text-xl font-bold text-primary">Total</span>
                    <span className="font-display text-2xl font-bold text-luxury" data-testid="text-total">{formatCurrency(bookingData.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
