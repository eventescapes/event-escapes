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
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { Calendar, Bed, Plane, Music, CreditCard, Bitcoin } from "lucide-react";
import { z } from "zod";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const guestInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  paymentMethod: z.enum(["card", "crypto"]),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to terms and conditions"),
});

type GuestInfo = z.infer<typeof guestInfoSchema>;

// Mock booking data - in real app this would come from booking state/context
const mockBookingData = {
  event: {
    name: "Summer Beats Festival",
    dates: "July 15-17, 2024",
    tickets: "General Admission × 2",
    price: 178,
  },
  hotel: {
    name: "The Plaza Hotel",
    dates: "July 15-17, 2024 (2 nights)",
    room: "Deluxe Room × 1",
    price: 598,
  },
  flights: {
    route: "LAX ↔ JFK",
    details: "Economy × 2 passengers",
    price: 1256,
  },
  subtotal: 2032,
  taxes: 203,
  total: 2235,
};

const CheckoutForm = ({ bookingData }: { bookingData: typeof mockBookingData }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

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
          // Create booking record
          await apiRequest("POST", "/api/bookings", {
            guestEmail: data.email,
            guestName: `${data.firstName} ${data.lastName}`,
            guestPhone: data.phone,
            totalAmount: bookingData.total,
            status: "confirmed",
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
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Guest Information */}
      <div className="bg-card rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Guest Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="block text-sm font-medium mb-2">
              First Name
            </Label>
            <Input
              id="firstName"
              {...form.register("firstName")}
              data-testid="input-first-name"
            />
            {form.formState.errors.firstName && (
              <p className="text-destructive text-sm mt-1">{form.formState.errors.firstName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName" className="block text-sm font-medium mb-2">
              Last Name
            </Label>
            <Input
              id="lastName"
              {...form.register("lastName")}
              data-testid="input-last-name"
            />
            {form.formState.errors.lastName && (
              <p className="text-destructive text-sm mt-1">{form.formState.errors.lastName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              data-testid="input-email"
            />
            {form.formState.errors.email && (
              <p className="text-destructive text-sm mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone" className="block text-sm font-medium mb-2">
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              {...form.register("phone")}
              data-testid="input-phone"
            />
            {form.formState.errors.phone && (
              <p className="text-destructive text-sm mt-1">{form.formState.errors.phone.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-card rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Payment Method</h2>
        <RadioGroup
          value={form.watch("paymentMethod")}
          onValueChange={(value) => form.setValue("paymentMethod", value as "card" | "crypto")}
          className="space-y-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="card" id="card" data-testid="radio-card" />
            <Label htmlFor="card" className="flex items-center space-x-2 flex-1 cursor-pointer">
              <CreditCard className="w-5 h-5" />
              <span>Credit/Debit Card</span>
              <div className="flex space-x-2 ml-auto">
                <i className="fab fa-cc-visa text-xl"></i>
                <i className="fab fa-cc-mastercard text-xl"></i>
                <i className="fab fa-cc-amex text-xl"></i>
              </div>
            </Label>
          </div>
          
          {form.watch("paymentMethod") === "card" && (
            <div className="ml-6 p-4 border border-border rounded-lg">
              <PaymentElement data-testid="stripe-payment-element" />
            </div>
          )}

          <div className="flex items-center space-x-2 pt-4 border-t border-border">
            <RadioGroupItem value="crypto" id="crypto" data-testid="radio-crypto" />
            <Label htmlFor="crypto" className="flex items-center space-x-2 cursor-pointer">
              <Bitcoin className="w-5 h-5" />
              <span>Pay with Cryptocurrency</span>
              <div className="flex space-x-2 ml-2">
                <i className="fab fa-bitcoin text-xl text-accent"></i>
                <i className="fab fa-ethereum text-xl text-accent"></i>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-card rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={form.watch("agreeToTerms")}
            onCheckedChange={(checked) => form.setValue("agreeToTerms", checked as boolean)}
            data-testid="checkbox-terms"
          />
          <div className="text-sm">
            <Label htmlFor="terms" className="cursor-pointer">
              I agree to EventEscapes'{" "}
              <a href="#" className="text-primary hover:underline">
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </Label>
            <p className="mt-2 text-muted-foreground">
              By booking, you also agree to the cancellation and refund policies of individual service providers.
            </p>
          </div>
        </div>
        {form.formState.errors.agreeToTerms && (
          <p className="text-destructive text-sm mt-2">{form.formState.errors.agreeToTerms.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full py-3 text-lg"
        disabled={!stripe || isProcessing}
        data-testid="button-complete-booking"
      >
        {isProcessing ? "Processing..." : `Complete Booking - ${formatCurrency(bookingData.total)}`}
      </Button>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Secure payment processed by Stripe
        </p>
      </div>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    apiRequest("POST", "/api/create-payment-intent", { 
      amount: mockBookingData.total,
      bookingId: "temp-booking-id" 
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch(() => {
        toast({
          title: "Payment Setup Error",
          description: "Unable to initialize payment. Please refresh the page.",
          variant: "destructive",
        });
      });
  }, [toast]);

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-3xl font-bold mb-8" data-testid="text-checkout-title">
        Review & Book Your Trip
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm bookingData={mockBookingData} />
          </Elements>
        </div>

        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Trip Summary</h2>
            
            {/* Event */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-semibold" data-testid="text-event-name">
                  {mockBookingData.event.name}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-1" data-testid="text-event-dates">
                {mockBookingData.event.dates}
              </p>
              <p className="text-sm text-muted-foreground mb-2" data-testid="text-event-tickets">
                {mockBookingData.event.tickets}
              </p>
              <p className="text-right font-medium" data-testid="text-event-price">
                {formatCurrency(mockBookingData.event.price)}
              </p>
            </div>

            {/* Hotel */}
            <div className="mb-6 border-t border-border pt-4">
              <div className="flex items-center space-x-3 mb-2">
                <Bed className="w-5 h-5 text-primary" />
                <h3 className="font-semibold" data-testid="text-hotel-name">
                  {mockBookingData.hotel.name}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-1" data-testid="text-hotel-dates">
                {mockBookingData.hotel.dates}
              </p>
              <p className="text-sm text-muted-foreground mb-2" data-testid="text-hotel-room">
                {mockBookingData.hotel.room}
              </p>
              <p className="text-right font-medium" data-testid="text-hotel-price">
                {formatCurrency(mockBookingData.hotel.price)}
              </p>
            </div>

            {/* Flights */}
            <div className="mb-6 border-t border-border pt-4">
              <div className="flex items-center space-x-3 mb-2">
                <Plane className="w-5 h-5 text-primary" />
                <h3 className="font-semibold" data-testid="text-flights-name">
                  Round-trip Flights
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-1" data-testid="text-flights-route">
                {mockBookingData.flights.route}
              </p>
              <p className="text-sm text-muted-foreground mb-2" data-testid="text-flights-details">
                {mockBookingData.flights.details}
              </p>
              <p className="text-right font-medium" data-testid="text-flights-price">
                {formatCurrency(mockBookingData.flights.price)}
              </p>
            </div>

            {/* Total */}
            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center mb-2">
                <span>Subtotal</span>
                <span data-testid="text-subtotal">{formatCurrency(mockBookingData.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Taxes & Fees</span>
                <span data-testid="text-taxes">{formatCurrency(mockBookingData.taxes)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold border-t border-border pt-2">
                <span>Total</span>
                <span data-testid="text-total">{formatCurrency(mockBookingData.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
