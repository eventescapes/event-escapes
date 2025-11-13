import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface BookingRecord {
  id: string;
  booking_reference: string;
  duffel_order_id: string;
  status: string;
  amount: number;
  currency: string;
  passengers_data: any;
  services_data: any;
  order_data: any;
  stripe_session_id: string;
  created_at: string;
  error_message?: string;
}

interface ParsedBooking extends BookingRecord {
  passengers: any[];
  services: any[];
  order: any;
  documentUrl?: string;
  primaryPassenger?: any;
}

const parseJsonField = <T,>(value: any, fallback: T): T => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch (err) {
      console.warn("Failed to parse JSON field", err);
      return fallback;
    }
  }
  if (Array.isArray(value) || typeof value === "object") {
    return value as T;
  }
  return fallback;
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (iso?: string) => {
  if (!iso) return "—";
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
  if (!match) return iso;
  const [, hours, minutes] = match;
  const h = hours ? `${hours}h` : "";
  const m = minutes ? `${minutes}m` : "";
  return `${h}${h && m ? " " : ""}${m}`.trim() || iso;
};

const formatPassengerType = (type?: string) => {
  if (!type) return "—";
  return type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

const extractDocumentUrl = (order: any): string | undefined => {
  const documents: any[] | undefined = order?.documents;
  if (!Array.isArray(documents)) return undefined;
  const preferredTypes = [
    "itinerary_receipt_pdf",
    "itinerary_pdf",
    "invoice_pdf",
    "itinerary_receipt",
  ];
  for (const preferredType of preferredTypes) {
    const doc = documents.find((document) => document.type === preferredType && document.url);
    if (doc?.url) return doc.url;
  }
  const fallback = documents.find((document) => document.url);
  return fallback?.url;
};

const clearLocalBookingCaches = () => {
  try {
    localStorage.removeItem("selected_outbound");
    localStorage.removeItem("selected_return");
    localStorage.removeItem("selected_seats");
    localStorage.removeItem("selected_seat_services");
    localStorage.removeItem("selected_seat_details");
    localStorage.removeItem("selected_baggage");
    localStorage.removeItem("passenger_data");
    localStorage.removeItem("seats_total");
    localStorage.removeItem("baggage_total");
    localStorage.removeItem("round_trip_offers");
  } catch (err) {
    console.warn("Unable to clear cached booking data:", err);
  }
};

const transformBookingRecord = (record: BookingRecord): ParsedBooking => {
  const passengers = parseJsonField<any[]>(record.passengers_data, []);
  const services = parseJsonField<any[]>(record.services_data, []);
  const order = parseJsonField<any>(record.order_data, null);
  const documentUrl = extractDocumentUrl(order);
  return {
    ...record,
    passengers,
    services,
    order,
    documentUrl,
    primaryPassenger: passengers[0],
  };
};

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [booking, setBooking] = useState<ParsedBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const session = urlParams.get("session_id");

    if (!session) {
      setError("Invalid confirmation link. Session ID is missing.");
      setLoading(false);
      return;
    }

    setSessionId(session);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    let attempts = 0;
    let cancelled = false;
    const maxAttempts = 20;

    const pollBooking = async () => {
      if (cancelled) return;

      try {
        const { data, error: dbError } = await supabase
          .from("bookings")
          .select("*")
          .eq("stripe_session_id", sessionId)
          .maybeSingle();

        if (cancelled) return;

        if (dbError && dbError.code !== "PGRST116") {
          throw dbError;
        }

        if (data) {
          if (data.status === "confirmed") {
            const parsed = transformBookingRecord(data as BookingRecord);
            setBooking(parsed);
            setLoading(false);
            clearLocalBookingCaches();
            return;
          }

          if (data.status === "failed") {
            setError(data.error_message || "Booking failed");
            setLoading(false);
            return;
          }
        }

        attempts += 1;
        if (attempts >= maxAttempts) {
          setError("Booking is taking longer than expected. Please check your email for confirmation.");
          setLoading(false);
          return;
        }

        setTimeout(pollBooking, 1000);
      } catch (err: any) {
        console.error("Error fetching booking:", err);
        attempts += 1;
        if (attempts >= maxAttempts) {
          setError("Unable to fetch booking status. Please contact support if you don't receive a confirmation email.");
          setLoading(false);
        } else {
          setTimeout(pollBooking, 1000);
        }
      }
    };

    pollBooking();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const CancelledOrFailedState = (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center shadow-2xl">
        <div className="mb-6">
          <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-6xl">⚠️</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Booking Status Unknown</h1>
          <p className="text-lg text-gray-700 mb-6">{error}</p>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
          <p className="text-lg font-semibold text-green-800 mb-2">✅ Your payment was successful</p>
          <p className="text-sm text-gray-700 mb-2">💳 If the booking failed, a refund will be processed automatically within 5-10 business days.</p>
          <p className="text-sm text-gray-700">📧 Check your email for confirmation or contact our support team.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => setLocation("/")} className="bg-blue-600 hover:bg-blue-700">
            Return to Home
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => (window.location.href = "mailto:support@eventescapes.com")}
          >
            Contact Support
          </Button>
        </div>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-12 text-center shadow-2xl">
          <div className="mb-6">
            <div className="w-24 h-24 border-8 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">⏳ Confirming Your Booking...</h1>
            <p className="text-xl text-gray-700 mb-2">Please wait while we process your reservation.</p>
            <p className="text-sm text-gray-600">This usually takes just a few seconds.</p>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error && !booking) {
    return CancelledOrFailedState;
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="max-w-xl w-full p-8 md:p-12 text-center shadow-xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn’t find a booking for this confirmation link. Please check the link or contact support.</p>
          <Button onClick={() => setLocation("/")}>Return to Home</Button>
        </Card>
      </div>
    );
  }

  const slices: any[] = booking.order?.slices || [];
  const passengers = booking.passengers || [];
  const services = booking.services || [];
  const seatServices = services.filter((service) => service.type === "seat");
  const baggageServices = services.filter((service) => service.type === "baggage");
  const primaryPassenger = booking.primaryPassenger;

  const documentUrl = booking.documentUrl;

  const handleDownload = () => {
    if (!documentUrl) {
      alert("Order documents are not yet available. Please check back later or contact support.");
      return;
    }
    window.open(documentUrl, "_blank", "noopener,noreferrer");
  };

  const handleEmailConfirmation = () => {
    if (!primaryPassenger?.email) {
      alert("We couldn't find an email address for this booking.");
      return;
    }
    const subject = encodeURIComponent(`Your EventEscapes Booking ${booking.booking_reference}`);
    const body = encodeURIComponent(
      `Hi ${primaryPassenger.given_name || "there"},\n\n` +
        `Here are the details of your booking ${booking.booking_reference}. ` +
        `If you need anything else, let us know!\n\n— EventEscapes`
    );
    window.location.href = `mailto:${primaryPassenger.email}?subject=${subject}&body=${body}`;
  };

  const handleCancellation = () => {
    const subject = encodeURIComponent(`Cancellation request for ${booking.booking_reference}`);
    const body = encodeURIComponent(
      `Hi EventEscapes,\n\nI would like to discuss cancelling my booking ${booking.booking_reference}. ` +
        `Please let me know the available options.\n\nThank you.`
    );
    window.location.href = `mailto:support@eventescapes.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4 space-y-8">
        <section className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center shadow">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-green-800 mb-2">Booking Confirmed!</h1>
          <p className="text-xl font-mono font-bold text-green-900 mb-2">{booking.booking_reference || "N/A"}</p>
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-green-700">
            <span>Order ID: {booking.duffel_order_id || "—"}</span>
            <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
              ✓ {booking.status?.toUpperCase()}
            </span>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">✈️ Flight Details</h2>
          {slices.length === 0 ? (
            <p className="text-gray-600">Flight details will be available shortly. Please check your email for updates.</p>
          ) : (
            <div className="space-y-6">
              {slices.map((slice, idx) => {
                const firstSegment = slice.segments?.[0];
                const lastSegment = slice.segments?.[slice.segments?.length - 1] || firstSegment;
                return (
                  <div key={idx} className="border-b border-gray-200 pb-6 last:border-none last:pb-0">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold">
                          {slice.origin?.iata_code} → {slice.destination?.iata_code}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDateTime(firstSegment?.departing_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{firstSegment?.marketing_carrier?.name || "Airline"}</p>
                        <p className="text-sm text-gray-600">
                          Flight {firstSegment?.marketing_carrier_flight_number || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <span className="font-semibold text-gray-700 block mb-1">Departure</span>
                        <p>{slice.origin?.name}</p>
                        <p>{formatDateTime(firstSegment?.departing_at)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <span className="font-semibold text-gray-700 block mb-1">Arrival</span>
                        <p>{slice.destination?.name}</p>
                        <p>{formatDateTime(lastSegment?.arriving_at)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <span className="font-semibold text-gray-700 block mb-1">Duration</span>
                        <p>{formatDuration(slice.duration)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">👥 Passengers</h2>
          {passengers.length === 0 ? (
            <p className="text-gray-600">Passenger details will be sent via email shortly.</p>
          ) : (
            <div className="space-y-4">
              {passengers.map((passenger, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold text-lg">
                    {passenger.given_name} {passenger.family_name}
                  </p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                    <p>Passenger Type: {formatPassengerType(passenger.type)}</p>
                    <p>Date of Birth: {passenger.born_on || "—"}</p>
                    <p>Email: {passenger.email || "—"}</p>
                    <p>Phone: {passenger.phone_number_full || passenger.phone_number || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {(seatServices.length > 0 || baggageServices.length > 0) && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">🎒 Additional Services</h2>
            <div className="space-y-3">
              {seatServices.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-700 mb-2">Selected Seats</p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {seatServices.map((service, idx) => (
                      <li key={`seat-${idx}`}>💺 Seat {service.designator || service.metadata?.seat}</li>
                    ))}
                  </ul>
                </div>
              )}
              {baggageServices.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-700 mb-2">Extra Baggage</p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {baggageServices.map((service, idx) => (
                      <li key={`bag-${idx}`}>🧳 {service.description || "Extra checked bag"}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">💰 Payment Summary</h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500">Total Paid</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(booking.amount, booking.currency)}
              </p>
            </div>
            <div>
              <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                ✅ Payment Confirmed
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Transaction reference: {booking.stripe_session_id || sessionId}
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleDownload}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            disabled={!documentUrl}
          >
            🎫 Download Confirmation PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleEmailConfirmation}
            className="w-full py-3"
          >
            📧 Email Confirmation
          </Button>
          <Button
            variant="outline"
            onClick={handleCancellation}
            className="w-full py-3"
          >
            ❌ Cancel Booking
          </Button>
          <Button onClick={() => setLocation("/flights")} className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3">
            🏠 Book Another Flight
          </Button>
        </section>

        <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          ⚠️ Need to make changes? Cancellations and modifications may be possible within 24 hours of booking. Contact
          support@eventescapes.com for assistance.
        </section>
      </div>
    </div>
  );
}

