import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export function ConfirmationPage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<'loading' | 'confirmed' | 'failed' | 'not_found'>('loading');
  const [bookingData, setBookingData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      navigate('/');
      return;
    }

    let attempts = 0;
    const maxAttempts = 60; // 2 minutes (60 * 2 seconds)

    const checkStatus = async () => {
      try {
        console.log('🔍 Polling booking status for session:', sessionId);
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-booking-status`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              'Pragma': 'no-cache'
            },
            cache: 'no-store',
            body: JSON.stringify({ sessionId })
          }
        );

        const data = await response.json();
        console.log('📊 Booking status response:', data);

        if (data.status === 'confirmed') {
          console.log('✅ Booking confirmed!', data.booking_reference);
          setStatus('confirmed');
          setBookingData({
            bookingReference: data.booking_reference,
            duffelOrderId: data.duffel_order_id,
            ...data
          });
        } else if (data.status === 'failed') {
          console.log('❌ Booking failed:', data.error);
          setStatus('failed');
          setError(data.error || 'Booking creation failed');
        } else if (data.status === 'pending' || data.status === 'processing') {
          // Still processing, check again
          console.log('⏳ Booking still processing, attempt', attempts + 1);
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 3000); // Poll every 3 seconds
          } else {
            // Timeout after 3 minutes
            setStatus('failed');
            setError('Booking is taking longer than expected. Please contact support with reference: ' + sessionId);
          }
        } else {
          setStatus('not_found');
        }
      } catch (err: any) {
        console.error('Error checking status:', err);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000);
        } else {
          setStatus('failed');
          setError('Unable to verify booking status');
        }
      }
    };

    checkStatus();
  }, [navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Booking</h1>
          <p className="text-gray-600">Your payment was successful. We're creating your booking now...</p>
          <p className="text-sm text-gray-500 mt-4">This usually takes 10-30 seconds</p>
        </div>
      </div>
    );
  }

  if (status === 'confirmed') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600 mb-8">Your flight has been successfully booked</p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h2 className="font-semibold text-gray-900 mb-4">Booking Details</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking Reference:</span>
                  <span className="font-mono font-semibold text-lg" data-testid="text-booking-reference">
                    {bookingData.bookingReference || bookingData.booking_reference}
                  </span>
                </div>
                {bookingData.duffelOrderId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-mono text-xs text-gray-500">{bookingData.duffelOrderId}</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              A confirmation email has been sent with your booking details and e-tickets.
            </p>

            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Book Another Flight
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Failed</h1>
            <p className="text-gray-600 mb-8">We encountered an issue creating your booking</p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <p className="text-red-800 font-medium mb-2">What happens next?</p>
              <p className="text-red-700 text-sm">
                Your payment was successful, but we couldn't complete the booking. 
                A full refund will be processed to your card within 5-7 business days.
              </p>
            </div>

            {error && (
              <div className="bg-gray-50 rounded p-4 mb-6">
                <p className="text-xs text-gray-600 font-mono">{error}</p>
              </div>
            )}

            <p className="text-sm text-gray-500 mb-6">
              If you have questions, contact support@eventescapes.com
            </p>

            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Search Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
