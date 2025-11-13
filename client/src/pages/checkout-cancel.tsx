import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CheckoutCancel() {
  const [, setLocation] = useLocation();
  const [cancelled, setCancelled] = useState(false);
  const [failed, setFailed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    console.log('❌ CHECKOUT CANCELLED/FAILED');
    
    // Check URL params for error type
    const searchParams = new URLSearchParams(window.location.search);
    const cancelledParam = searchParams.get('cancelled');
    const failedParam = searchParams.get('failed');
    
    setCancelled(!!cancelledParam);
    setFailed(!!failedParam);
    
    console.log('Cancelled by user:', !!cancelledParam);
    console.log('Booking failed:', !!failedParam);
    console.log('User will be refunded if charged');
    
    // Try to get user email from localStorage
    try {
      const passengerData = localStorage.getItem('passenger_data');
      if (passengerData) {
        const passengers = JSON.parse(passengerData);
        if (passengers && passengers.length > 0) {
          setUserEmail(passengers[0].email);
        }
      }
    } catch (error) {
      console.error('Error loading passenger data:', error);
    }
  }, []);

  // SCENARIO 1: User cancelled during Stripe checkout
  if (cancelled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-8 md:p-12 text-center shadow-2xl">
          <div className="mb-6">
            <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-6xl">⚠️</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Payment Cancelled
            </h1>
            <p className="text-xl text-gray-700 mb-2">
              You cancelled the payment process.
            </p>
            <p className="text-lg text-gray-600">
              No charge was made to your card.
            </p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
            <p className="text-lg font-semibold text-blue-900 mb-2">
              Ready to try again?
            </p>
            <p className="text-sm text-gray-700">
              Your flight selection and passenger details are still saved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setLocation('/checkout')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              ← Return to Checkout
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation('/')}
              className="px-8"
            >
              🏠 Back to Home
            </Button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Need help? Contact{' '}
              <a href="mailto:support@eventescapes.com" className="text-blue-600 hover:underline font-semibold">
                support@eventescapes.com
              </a>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // SCENARIO 2: Payment went through but booking failed
  if (failed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-8 md:p-12 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-6xl">❌</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Booking Failed
            </h1>
            <p className="text-xl text-gray-700 mb-2">
              We couldn't complete your booking,
            </p>
            <p className="text-lg text-gray-600">
              but don't worry:
            </p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div className="text-left">
                  <p className="text-lg font-semibold text-green-800">
                    Your payment has been automatically refunded
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-2xl">💳</span>
                <div className="text-left">
                  <p className="text-sm text-gray-700">
                    Refunds typically appear in your account within <strong>5-10 business days</strong>
                  </p>
                </div>
              </div>
              
              {userEmail && (
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📧</span>
                  <div className="text-left">
                    <p className="text-sm text-gray-700">
                      You'll receive confirmation at: <strong>{userEmail}</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-lg text-gray-900 mb-3">
              Common reasons for booking failure:
            </h3>
            <ul className="text-left space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Flight offer expired (offers are valid for limited time)</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Seats no longer available on selected flight</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Airline system temporarily unavailable</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Price changed since initial search</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              onClick={() => {
                // Clear old data and start fresh search
                localStorage.removeItem('selected_outbound');
                localStorage.removeItem('selected_return');
                localStorage.removeItem('selected_seats');
                localStorage.removeItem('selected_seat_services');
                localStorage.removeItem('selected_seat_details');
                localStorage.removeItem('selected_baggage');
                localStorage.removeItem('passenger_data');
                setLocation('/');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              🔄 Search New Flights
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.location.href = 'mailto:support@eventescapes.com'}
              className="px-8"
            >
              📧 Contact Support
            </Button>
          </div>

          <div className="text-center pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Need immediate assistance?{' '}
              <a href="mailto:support@eventescapes.com" className="text-blue-600 hover:underline font-semibold">
                support@eventescapes.com
              </a>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // DEFAULT: Generic error
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center shadow-2xl">
        <div className="mb-6">
          <div className="w-24 h-24 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-6xl">⚠️</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Something Went Wrong
          </h1>
          <p className="text-xl text-gray-700 mb-2">
            We encountered an issue processing your booking.
          </p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
          <p className="text-lg font-semibold text-blue-900 mb-2">
            Don't worry about charges
          </p>
          <p className="text-sm text-gray-700">
            If you were charged, your refund will be processed automatically within 5-10 business days.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button
            size="lg"
            onClick={() => setLocation('/checkout')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            ← Try Again
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setLocation('/')}
            className="px-8"
          >
            🏠 Home
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => window.location.href = 'mailto:support@eventescapes.com'}
            className="px-8"
          >
            📧 Contact Support
          </Button>
        </div>

        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Need help? Contact{' '}
            <a href="mailto:support@eventescapes.com" className="text-blue-600 hover:underline font-semibold">
              support@eventescapes.com
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}

