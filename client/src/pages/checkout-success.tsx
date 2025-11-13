import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BookingData {
  id: string;
  booking_reference: string;
  duffel_order_id: string;
  status: string;
  amount: number;
  currency: string;
  passenger_count: number;
  passengers_data: string;
  error_message?: string;
  created_at: string;
}

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('✅ CHECKOUT SUCCESS PAGE LOADED');
    
    // STEP 1: GET SESSION ID FROM URL
    const urlParams = new URLSearchParams(window.location.search);
    const session = urlParams.get('session_id');
    
    if (!session) {
      console.error('❌ No session ID found');
      window.location.href = '/';
      return;
    }
    
    setSessionId(session);
    console.log('Session ID:', session);
    
    // STEP 2: POLL FOR BOOKING CONFIRMATION
    let attempts = 0;
    const maxAttempts = 20; // 20 seconds max
    
    const pollBooking = async () => {
      try {
        const response = await fetch(
          `https://jxrrhsqffnzeljszbecg.supabase.co/rest/v1/bookings?stripe_session_id=eq.${session}&select=*`,
          {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4cnJoc3FmZm56ZWxqc3piZWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzIxMjgsImV4cCI6MjA3MDkwODEyOH0.R-9Y5b_M7rpKS9zT9hqcdAdDI7m9GICYRDZkIteS9jg',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4cnJoc3FmZm56ZWxqc3piZWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzIxMjgsImV4cCI6MjA3MDkwODEyOH0.R-9Y5b_M7rpKS9zT9hqcdAdDI7m9GICYRDZkIteS9jg'
            }
          }
        );
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          const bookingData = data[0];
          
          console.log('📋 BOOKING STATUS:', bookingData.status);
          
          if (bookingData.status === 'confirmed') {
            console.log('✅ BOOKING CONFIRMED!');
            console.log('Booking Reference:', bookingData.booking_reference);
            console.log('Order ID:', bookingData.duffel_order_id);
            
            setBooking(bookingData);
            setLoading(false);
            
            // Clear localStorage
            console.log('🧹 Clearing booking data from localStorage...');
            localStorage.removeItem('selected_outbound');
            localStorage.removeItem('selected_return');
            localStorage.removeItem('selected_seats');
            localStorage.removeItem('selected_seat_services');
            localStorage.removeItem('selected_baggage');
            localStorage.removeItem('passenger_data');
            localStorage.removeItem('seats_total');
            localStorage.removeItem('baggage_total');
            localStorage.removeItem('round_trip_offers');
            console.log('✅ Booking data cleared');
            
            return; // Stop polling
          }
          
          if (bookingData.status === 'failed') {
            console.error('❌ BOOKING FAILED:', bookingData.error_message);
            setError(bookingData.error_message || 'Booking failed');
            setLoading(false);
            return; // Stop polling
          }
          
          // Still processing, continue polling
          console.log('⏳ Booking still processing...', bookingData.status);
        }
        
        attempts++;
        
        if (attempts >= maxAttempts) {
          console.warn('⚠️ Polling timeout - booking still processing');
          setError('Booking is taking longer than expected. Check your email for confirmation.');
          setLoading(false);
        } else {
          // Poll again in 1 second
          setTimeout(pollBooking, 1000);
        }
        
      } catch (err) {
        console.error('Error fetching booking:', err);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(pollBooking, 1000);
        } else {
          setError('Unable to fetch booking status');
          setLoading(false);
        }
      }
    };
    
    pollBooking();
  }, []);

  // STEP 3: DISPLAY LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-12 text-center shadow-2xl">
          <div className="mb-6">
            <div className="w-24 h-24 border-8 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ⏳ Confirming Your Booking...
            </h1>
            <p className="text-xl text-gray-700 mb-2">
              Please wait while we process your reservation.
            </p>
            <p className="text-sm text-gray-600">
              This usually takes just a few seconds.
            </p>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </Card>
      </div>
    );
  }

  // STEP 4: DISPLAY ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-8 md:p-12 text-center shadow-2xl">
          <div className="mb-6">
            <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-6xl">⚠️</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Booking Status Unknown
            </h1>
            <p className="text-lg text-gray-700 mb-6">
              {error}
            </p>
          </div>
          
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
            <p className="text-lg font-semibold text-green-800 mb-2">
              ✅ Your payment was successful
            </p>
            <p className="text-sm text-gray-700 mb-2">
              💳 If booking failed, refund will be processed automatically within 5-10 business days
            </p>
            <p className="text-sm text-gray-700">
              📧 Check your email for confirmation or contact our support team
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setLocation('/')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Return to Home
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.location.href = 'mailto:support@eventescapes.com'}
            >
              Contact Support
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // STEP 5: DISPLAY SUCCESS STATE WITH BOOKING REFERENCE
  if (booking) {
    const passengers = JSON.parse(booking.passengers_data || '[]');
    const primaryPassenger = passengers[0];

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="max-w-4xl w-full p-8 md:p-12 shadow-2xl">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
              <svg
                className="w-16 h-16 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-2">
              Booking Confirmed! ✨
            </h1>
            <p className="text-xl text-gray-600">
              Your reservation is complete
            </p>
          </div>

          {/* Booking Reference - Celebratory */}
          <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 rounded-2xl p-8 mb-8 shadow-2xl">
            <div className="text-center">
              <h2 className="text-white text-2xl font-semibold mb-4">
                Your Booking Reference
              </h2>
              <div className="bg-white rounded-xl p-6 mb-4">
                <div className="text-6xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  {booking.booking_reference}
                </div>
              </div>
              <p className="text-white text-sm">
                Keep this reference for check-in and support
              </p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Booking Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-sm font-semibold">{booking.duffel_order_id}</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                <span className="text-gray-600">Passengers:</span>
                <span className="font-semibold">{booking.passenger_count}</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                <span className="text-gray-600">Total Paid:</span>
                <span className="font-bold text-green-600 text-xl">
                  ${booking.amount.toFixed(2)} {booking.currency}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                <span className="text-gray-600">Confirmation Email:</span>
                <span className="font-semibold text-sm">{primaryPassenger?.email}</span>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">What's Next?</h3>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="text-3xl">📧</div>
                  <div>
                    <div className="font-semibold text-lg">Confirmation email sent to {primaryPassenger?.email}</div>
                    <div className="text-sm text-gray-600">Check your inbox for booking details and e-tickets</div>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="text-3xl">✈️</div>
                  <div>
                    <div className="font-semibold text-lg">E-tickets attached in email</div>
                    <div className="text-sm text-gray-600">Download and save your tickets for travel</div>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="text-3xl">🎟️</div>
                  <div>
                    <div className="font-semibold text-lg">Use booking reference <span className="font-mono text-purple-600">{booking.booking_reference}</span> for check-in</div>
                    <div className="text-sm text-gray-600">Present this at the airport counter or online check-in</div>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="text-3xl">💎</div>
                  <div>
                    <div className="font-semibold text-lg">Rewards points awarded to your account</div>
                    <div className="text-sm text-gray-600">Earn points on every booking</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              onClick={() => setLocation('/')}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-6 text-lg font-bold shadow-lg"
            >
              Book Another Trip
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation('/find-booking')}
              className="px-8 py-6 text-lg font-semibold border-2"
            >
              View My Bookings
            </Button>
          </div>

          {/* Support Info */}
          <div className="text-center pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@eventescapes.com" className="text-blue-600 hover:underline font-semibold">
                support@eventescapes.com
              </a>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}

