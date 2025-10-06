import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ConfirmationPage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<'loading' | 'confirmed' | 'failed' | 'pending' | 'not_found'>('loading');
  const [bookingData, setBookingData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startPolling = (isRefresh = false) => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id');

    if (!sid) {
      navigate('/');
      return;
    }

    setSessionId(sid);
    
    // Only set to loading on initial load, not on refresh
    if (!isRefresh) {
      setStatus('loading');
    }

    let attempts = 0;
    const maxAttempts = 24; // 60 seconds (24 * 2.5 seconds)

    const checkStatus = async () => {
      try {
        console.log('🔍 Polling booking status for session:', sid);
        
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
            body: JSON.stringify({ sessionId: sid })
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
          setIsRefreshing(false);
        } else if (data.status === 'failed') {
          console.log('❌ Booking failed:', data.error);
          setStatus('failed');
          setError(data.error || 'Booking creation failed');
          setIsRefreshing(false);
        } else if (data.status === 'pending' || data.status === 'processing') {
          // Still processing, check again
          console.log('⏳ Booking still processing, attempt', attempts + 1);
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 2500); // Poll every 2.5 seconds
          } else {
            // Timeout after 60 seconds - show pending state, not failure
            console.log('⏰ Timeout reached, showing pending confirmation state');
            setStatus('pending');
            setIsRefreshing(false);
          }
        } else {
          setStatus('not_found');
          setIsRefreshing(false);
        }
      } catch (err: any) {
        console.error('Error checking status:', err);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2500);
        } else {
          setStatus('pending');
          setIsRefreshing(false);
        }
      }
    };

    checkStatus();
  };

  useEffect(() => {
    startPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefreshStatus = () => {
    setIsRefreshing(true);
    startPolling(true); // Pass true to indicate this is a refresh
  };

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

  if (status === 'pending') {
    const deepLink = `${window.location.origin}/booking/status?sessionId=${sessionId}`;
    
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Clock className="w-20 h-20 text-amber-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-pending-title">
              Pending Confirmation
            </h1>
            <p className="text-gray-600 mb-8">
              We're waiting on the airline to finalize your ticket. Your payment is secured. 
              We'll email you as soon as it's confirmed.
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
              <p className="text-amber-900 font-medium mb-2">Your booking is being processed</p>
              <p className="text-amber-800 text-sm">
                This can take a few minutes. Your payment has been received and your reservation is being confirmed with the airline.
              </p>
            </div>

            <div className="mb-6">
              <Button
                onClick={handleRefreshStatus}
                disabled={isRefreshing}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                data-testid="button-refresh-status"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Status
                  </>
                )}
              </Button>
            </div>

            <div className="bg-gray-50 rounded p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Check status later:</p>
              <p className="text-xs text-gray-500 font-mono break-all">
                {deepLink}
              </p>
            </div>

            <p className="text-sm text-gray-500">
              If you have questions, contact support@eventescapes.com
            </p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-failed-title">
              Booking Failed
            </h1>
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
              data-testid="button-search-again"
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
