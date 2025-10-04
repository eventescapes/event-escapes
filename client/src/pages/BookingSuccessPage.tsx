import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BookingSuccessPage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (!sessionId) {
      setStatus('error');
      setError('No session ID found');
      return;
    }

    console.log('💳 Payment completed! Session ID:', sessionId);

    const timer = setTimeout(() => {
      setStatus('success');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing your booking...</h2>
          <p className="text-gray-600">
            Please wait while we confirm your flight reservation.
          </p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-lg text-gray-600">Your flight has been booked</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">What happens next?</h2>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>You'll receive a confirmation email with your booking reference within 5-10 minutes</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Your e-tickets will be sent to your email address</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Check your spam folder if you don't see the email</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Important Information</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Arrive at the airport at least 2 hours before domestic flights</li>
            <li>• Arrive at least 3 hours before international flights</li>
            <li>• Bring a valid photo ID and your passport (for international travel)</li>
            <li>• Check airline baggage policies before your flight</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="flex-1"
          >
            Book Another Flight
          </Button>
          <Button
            onClick={() => window.print()}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Print Confirmation
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Need help? Contact our support team at support@eventescapes.com
        </p>
      </div>
    </div>
  );
}
