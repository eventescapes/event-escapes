// src/pages/Checkout.tsx
import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Plane,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

// âœ… Import API layer
import {
  createCheckout,
  type CheckoutRequest,
  type Passenger,
  type Service,
} from "../lib/supabaseApi";

// Import cart store to get selected offer and services
import { useCart } from "@/store/cartStore";

interface PassengerFormData extends Passenger {
  errors?: {
    given_name?: string;
    family_name?: string;
    born_on?: string;
    email?: string;
    phone_number?: string;
  };
}

export default function Checkout() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/checkout/:offerId");

  // Get offer and services from cart
  const { items } = useCart();
  const cartItem = items.find((item) => item.offerId === params?.offerId);

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<
    "passengers" | "review" | "processing"
  >("passengers");

  // Passenger forms - initialized with empty data
  const [passengerForms, setPassengerForms] = useState<PassengerFormData[]>([]);

  // Initialize passenger forms from cart data
  useEffect(() => {
    if (cartItem && cartItem.passengers) {
      const forms = cartItem.passengers.map((p) => ({
        id: p.id,
        type: p.type as "adult" | "child" | "infant_without_seat",
        title: "",
        given_name: "",
        family_name: "",
        gender: "m" as "m" | "f",
        born_on: "",
        email: "",
        phone_number: "",
        errors: {},
      }));
      setPassengerForms(forms);
    }
  }, [cartItem]);

  // Redirect if no cart item
  useEffect(() => {
    if (!loading && !cartItem) {
      console.error("❌ No cart item found for offer:", params?.offerId);
      navigate("/");
    }
  }, [cartItem, loading, params]);

  if (!cartItem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // VALIDATION
  // ==========================================

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Basic international phone validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ""));
  };

  const validateDateOfBirth = (dob: string, type: string): string | null => {
    if (!dob) return "Date of birth is required";

    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (type === "adult" && age < 18) {
      return "Adult passengers must be 18 or older";
    }
    if (type === "child" && (age < 2 || age >= 18)) {
      return "Child passengers must be between 2 and 17 years old";
    }
    if (type === "infant_without_seat" && age >= 2) {
      return "Infant passengers must be under 2 years old";
    }

    return null;
  };

  const validatePassenger = (
    passenger: PassengerFormData,
    index: number,
  ): boolean => {
    const errors: PassengerFormData["errors"] = {};
    let isValid = true;

    // Title
    if (!passenger.title) {
      errors.given_name = "Title is required";
      isValid = false;
    }

    // First name
    if (!passenger.given_name || passenger.given_name.trim().length < 2) {
      errors.given_name = "First name must be at least 2 characters";
      isValid = false;
    }

    // Last name
    if (!passenger.family_name || passenger.family_name.trim().length < 2) {
      errors.family_name = "Last name must be at least 2 characters";
      isValid = false;
    }

    // Email (required for first passenger)
    if (index === 0) {
      if (!passenger.email || !validateEmail(passenger.email)) {
        errors.email = "Valid email is required for primary passenger";
        isValid = false;
      }
    }

    // Phone (required for first passenger)
    if (index === 0) {
      if (!passenger.phone_number || !validatePhone(passenger.phone_number)) {
        errors.phone_number =
          "Valid phone number is required (e.g., +61412345678)";
        isValid = false;
      }
    }

    // Date of birth
    const dobError = validateDateOfBirth(passenger.born_on, passenger.type);
    if (dobError) {
      errors.born_on = dobError;
      isValid = false;
    }

    // Update passenger with errors
    if (!isValid) {
      setPassengerForms((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], errors };
        return updated;
      });
    }

    return isValid;
  };

  const validateAllPassengers = (): boolean => {
    let allValid = true;

    passengerForms.forEach((passenger, index) => {
      const isValid = validatePassenger(passenger, index);
      if (!isValid) allValid = false;
    });

    if (!allValid) {
      setError("Please fix the errors in passenger details");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return allValid;
  };

  // ==========================================
  // FORM HANDLERS
  // ==========================================

  const updatePassenger = (
    index: number,
    field: keyof Passenger,
    value: any,
  ) => {
    setPassengerForms((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
        errors: { ...updated[index].errors, [field]: undefined }, // Clear error on change
      };
      return updated;
    });
  };

  const handleContinueToReview = () => {
    if (validateAllPassengers()) {
      setCurrentStep("review");
      setError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBackToPassengers = () => {
    setCurrentStep("passengers");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ==========================================
  // CHECKOUT SUBMISSION
  // ==========================================

  const handleCompleteBooking = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentStep("processing");

      console.log("💳 === CREATING CHECKOUT SESSION ===");

      // Build services array from cart item
      const services: Service[] = [];

      // Add seats
      if (cartItem.selectedSeats && cartItem.selectedSeats.length > 0) {
        cartItem.selectedSeats.forEach((seat) => {
          services.push({
            id: seat.serviceId,
            type: "seat",
            amount: parseFloat(seat.amount || "0"),
            quantity: 1,
          });
        });
      }

      // Add baggage
      if (cartItem.selectedBaggage && cartItem.selectedBaggage.length > 0) {
        cartItem.selectedBaggage.forEach((bag) => {
          services.push({
            id: bag.id,
            type: "baggage",
            amount: parseFloat(bag.amount || "0"),
            quantity: bag.quantity || 1,
          });
        });
      }

      // Calculate services total
      const servicesTotal = (services || []).reduce((sum, service) => {
        const amount = parseFloat((service as any).amount) || 0;
        const quantity = service.quantity || 1;
        return sum + amount * quantity;
      }, 0);

      // Calculate final total (base + services)
      const basePrice = parseFloat(cartItem.pricing.total);
      const finalTotal = parseFloat((basePrice + servicesTotal).toFixed(2));

      console.log("💰 Price calculation:", {
        base: basePrice,
        services: servicesTotal,
        total: finalTotal,
      });

      // Build checkout request
      const checkoutData: CheckoutRequest = {
        offerId: cartItem.offerId,
        passengers: passengerForms.map((p) => ({
          id: p.id,
          type: p.type,
          title: p.title,
          given_name: p.given_name.trim(),
          family_name: p.family_name.trim(),
          gender: p.gender,
          born_on: p.born_on,
          email: p.email || passengerForms[0].email, // Use primary passenger's email if not provided
          phone_number: p.phone_number || passengerForms[0].phone_number, // Use primary passenger's phone if not provided
        })),
        services,
        totalAmount: finalTotal,
        currency: cartItem.pricing.currency,
      };

      console.log("💳 Checkout request:", {
        offerId: checkoutData.offerId,
        passengers: checkoutData.passengers.length,
        services: checkoutData.services.length,
        total: `${checkoutData.currency} ${checkoutData.totalAmount}`,
      });

      // âœ… Call API layer (no direct fetch!)
      const result = await createCheckout(checkoutData);

      if (result.success && result.url) {
        console.log("✅ Checkout session created:", result.sessionId);
        console.log("✅ Redirecting to Stripe Checkout...");

        // Store booking data in sessionStorage for post-payment page
        sessionStorage.setItem(
          "pending_booking",
          JSON.stringify({
            offerId: cartItem.offerId,
            sessionId: result.sessionId,
            timestamp: new Date().toISOString(),
          }),
        );

        // Redirect to Stripe
        window.location.href = result.url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (err) {
      console.error("❌ Checkout error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create checkout session",
      );
      setCurrentStep("review");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PRICE CALCULATION
  // ==========================================

  const calculatePricing = () => {
    return {
      flightBase: cartItem.pricing.flightBase,
      seats: cartItem.pricing.seats || 0,
      baggage: cartItem.pricing.baggage || 0,
      subtotal:
        cartItem.pricing.flightBase +
        (cartItem.pricing.seats || 0) +
        (cartItem.pricing.baggage || 0),
      tax: 0, // Add tax calculation if needed
      total: cartItem.pricing.total,
      currency: cartItem.pricing.currency,
    };
  };

  const pricing = calculatePricing();

  // ==========================================
  // RENDER: PASSENGERS STEP
  // ==========================================

  if (currentStep === "passengers") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Search
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Complete Your Booking
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  1
                </div>
                <span className="font-medium text-blue-600">
                  Passenger Details
                </span>
              </div>
              <div className="w-16 h-1 bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold">
                  2
                </div>
                <span className="text-gray-600">Review & Pay</span>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info Alert */}
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Please ensure passenger names match exactly with their passport or
              ID.
            </AlertDescription>
          </Alert>

          {/* Passenger Forms */}
          <div className="space-y-6 mb-8">
            {passengerForms.map((passenger, idx) => (
              <Card key={idx}>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span>
                      Passenger {idx + 1}
                      {passenger.type === "child" && " (Child)"}
                      {passenger.type === "infant_without_seat" && " (Infant)"}
                    </span>
                    {idx === 0 && (
                      <span className="ml-2 text-sm font-normal text-blue-600">
                        (Primary Contact)
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title */}
                    <div>
                      <Label htmlFor={`title-${idx}`} className="font-semibold">
                        Title <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={passenger.title}
                        onValueChange={(value) =>
                          updatePassenger(idx, "title", value)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select title" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mr">Mr</SelectItem>
                          <SelectItem value="ms">Ms</SelectItem>
                          <SelectItem value="mrs">Mrs</SelectItem>
                          <SelectItem value="miss">Miss</SelectItem>
                          <SelectItem value="dr">Dr</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Gender */}
                    <div>
                      <Label
                        htmlFor={`gender-${idx}`}
                        className="font-semibold"
                      >
                        Gender <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={passenger.gender}
                        onValueChange={(value) =>
                          updatePassenger(idx, "gender", value as "m" | "f")
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="m">Male</SelectItem>
                          <SelectItem value="f">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* First Name */}
                    <div>
                      <Label
                        htmlFor={`given_name-${idx}`}
                        className="font-semibold"
                      >
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`given_name-${idx}`}
                        value={passenger.given_name}
                        onChange={(e) =>
                          updatePassenger(idx, "given_name", e.target.value)
                        }
                        placeholder="John"
                        className={`mt-1 ${passenger.errors?.given_name ? "border-red-500" : ""}`}
                      />
                      {passenger.errors?.given_name && (
                        <p className="text-sm text-red-600 mt-1">
                          {passenger.errors.given_name}
                        </p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <Label
                        htmlFor={`family_name-${idx}`}
                        className="font-semibold"
                      >
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`family_name-${idx}`}
                        value={passenger.family_name}
                        onChange={(e) =>
                          updatePassenger(idx, "family_name", e.target.value)
                        }
                        placeholder="Smith"
                        className={`mt-1 ${passenger.errors?.family_name ? "border-red-500" : ""}`}
                      />
                      {passenger.errors?.family_name && (
                        <p className="text-sm text-red-600 mt-1">
                          {passenger.errors.family_name}
                        </p>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <Label
                        htmlFor={`born_on-${idx}`}
                        className="font-semibold flex items-center gap-2"
                      >
                        <Calendar className="h-4 w-4" />
                        Date of Birth <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`born_on-${idx}`}
                        type="date"
                        value={passenger.born_on}
                        onChange={(e) =>
                          updatePassenger(idx, "born_on", e.target.value)
                        }
                        max={new Date().toISOString().split("T")[0]}
                        className={`mt-1 ${passenger.errors?.born_on ? "border-red-500" : ""}`}
                      />
                      {passenger.errors?.born_on && (
                        <p className="text-sm text-red-600 mt-1">
                          {passenger.errors.born_on}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <Label
                        htmlFor={`email-${idx}`}
                        className="font-semibold flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Email{" "}
                        {idx === 0 && <span className="text-red-500">*</span>}
                      </Label>
                      <Input
                        id={`email-${idx}`}
                        type="email"
                        value={passenger.email}
                        onChange={(e) =>
                          updatePassenger(idx, "email", e.target.value)
                        }
                        placeholder="john@example.com"
                        className={`mt-1 ${passenger.errors?.email ? "border-red-500" : ""}`}
                      />
                      {passenger.errors?.email && (
                        <p className="text-sm text-red-600 mt-1">
                          {passenger.errors.email}
                        </p>
                      )}
                      {idx === 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                          Booking confirmation will be sent to this email
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <Label
                        htmlFor={`phone-${idx}`}
                        className="font-semibold flex items-center gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        Phone Number{" "}
                        {idx === 0 && <span className="text-red-500">*</span>}
                      </Label>
                      <Input
                        id={`phone-${idx}`}
                        type="tel"
                        value={passenger.phone_number}
                        onChange={(e) =>
                          updatePassenger(idx, "phone_number", e.target.value)
                        }
                        placeholder="+61412345678"
                        className={`mt-1 ${passenger.errors?.phone_number ? "border-red-500" : ""}`}
                      />
                      {passenger.errors?.phone_number && (
                        <p className="text-sm text-red-600 mt-1">
                          {passenger.errors.phone_number}
                        </p>
                      )}
                      {idx === 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                          Include country code (e.g., +61 for Australia)
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Price Summary Card */}
          <Card className="mb-8 border-2 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle>Price Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Flight</span>
                  <span className="font-semibold">
                    ${pricing.flightBase.toFixed(2)}
                  </span>
                </div>
                {pricing.seats > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Seats</span>
                    <span className="font-semibold">
                      ${pricing.seats.toFixed(2)}
                    </span>
                  </div>
                )}
                {pricing.baggage > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Baggage</span>
                    <span className="font-semibold">
                      ${pricing.baggage.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-blue-600">
                    ${pricing.total.toFixed(2)} {pricing.currency}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <Button
            onClick={handleContinueToReview}
            className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            Continue to Review
          </Button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: REVIEW STEP
  // ==========================================

  if (currentStep === "review") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Button
                variant="ghost"
                onClick={handleBackToPassengers}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Passenger Details
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Review Your Booking
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center">
                  âœ"
                </div>
                <span className="font-medium text-green-600">
                  Passenger Details
                </span>
              </div>
              <div className="w-16 h-1 bg-blue-600"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  2
                </div>
                <span className="font-medium text-blue-600">Review & Pay</span>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Flight & Passenger Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Flight Details */}
              <Card>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="h-5 w-5" />
                    Flight Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Route:</span>
                      <span className="font-semibold">
                        {cartItem.flight.origin} → {cartItem.flight.destination}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Departure:</span>
                      <span className="font-semibold">
                        {new Date(
                          cartItem.flight.departureDate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    {cartItem.flight.returnDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Return:</span>
                        <span className="font-semibold">
                          {new Date(
                            cartItem.flight.returnDate,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Airline:</span>
                      <span className="font-semibold">
                        {cartItem.flight.airline}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Passenger Details */}
              {passengerForms.map((passenger, idx) => (
                <Card key={idx}>
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Passenger {idx + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <p className="font-semibold">
                          {passenger.title}. {passenger.given_name}{" "}
                          {passenger.family_name}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Date of Birth:</span>
                        <p className="font-semibold">
                          {new Date(passenger.born_on).toLocaleDateString()}
                        </p>
                      </div>
                      {idx === 0 && (
                        <>
                          <div>
                            <span className="text-gray-600">Email:</span>
                            <p className="font-semibold">{passenger.email}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Phone:</span>
                            <p className="font-semibold">
                              {passenger.phone_number}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Selected Services */}
              {(cartItem.selectedSeats?.length > 0 ||
                cartItem.selectedBaggage?.length > 0) && (
                <Card>
                  <CardHeader className="bg-gray-50">
                    <CardTitle>Selected Services</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3 text-sm">
                      {cartItem.selectedSeats?.length > 0 && (
                        <div>
                          <p className="font-semibold text-gray-900 mb-2">
                            Seats:
                          </p>
                          <ul className="space-y-1 text-gray-700">
                            {cartItem.selectedSeats.map((seat, idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>Seat {seat.designator}</span>
                                <span>
                                  ${parseFloat(seat.amount).toFixed(2)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {cartItem.selectedBaggage?.length > 0 && (
                        <div>
                          <p className="font-semibold text-gray-900 mb-2">
                            Baggage:
                          </p>
                          <ul className="space-y-1 text-gray-700">
                            {cartItem.selectedBaggage.map((bag, idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>{bag.quantity}x Extra Bag</span>
                                <span>
                                  $
                                  {(
                                    parseFloat(bag.amount) * bag.quantity
                                  ).toFixed(2)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Payment */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6 border-2 border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Flight</span>
                      <span className="font-semibold">
                        ${pricing.flightBase.toFixed(2)}
                      </span>
                    </div>
                    {pricing.seats > 0 && (
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>Seats</span>
                        <span className="font-semibold">
                          ${pricing.seats.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {pricing.baggage > 0 && (
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>Baggage</span>
                        <span className="font-semibold">
                          ${pricing.baggage.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-blue-600">
                        ${pricing.total.toFixed(2)} {pricing.currency}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCompleteBooking}
                    disabled={loading}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </span>
                    ) : (
                      <>
                        Pay ${pricing.total.toFixed(2)} {pricing.currency}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-600 text-center mt-4">
                    You will be redirected to Stripe for secure payment
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: PROCESSING STEP
  // ==========================================

  if (currentStep === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Processing Your Booking
          </h2>
          <p className="text-gray-600">
            Please wait while we redirect you to secure payment...
          </p>
        </div>
      </div>
    );
  }

  return null;
}
