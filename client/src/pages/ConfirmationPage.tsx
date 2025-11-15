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
    const flightData = bookingData.offer_data || bookingData.offerData;
    const passengersData = bookingData.passengers_data || bookingData.passengersData || [];
    const servicesData = bookingData.services_data || bookingData.servicesData || [];
    
    // Robust amount fetching - try multiple sources
    let totalAmount = 0;
    if (bookingData.amount && bookingData.amount > 0) {
      totalAmount = bookingData.amount;
    } else if (bookingData.total_amount && bookingData.total_amount > 0) {
      totalAmount = bookingData.total_amount;
    } else if (flightData?.total_amount) {
      totalAmount = parseFloat(flightData.total_amount);
    } else if (flightData?.base_amount) {
      totalAmount = parseFloat(flightData.base_amount);
    }
    
    const currency = bookingData.currency || flightData?.total_currency || 'AUD';
    
    console.log('💰 Confirmation page - Amount details:', {
      bookingAmount: bookingData.amount,
      totalAmount: bookingData.total_amount,
      flightAmount: flightData?.total_amount,
      finalAmount: totalAmount,
      currency
    });
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          
          {/* Success Header */}
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-700 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="bg-green-500 rounded-full p-3 mr-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-green-700 dark:text-green-400">Booking Confirmed!</h1>
                <p className="text-green-600 dark:text-green-500">Your flight has been successfully booked</p>
              </div>
            </div>
          </div>
          
          {/* Booking Reference */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Booking Reference</h2>
            <p className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400" data-testid="text-booking-reference">
              {bookingData.bookingReference || bookingData.booking_reference}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Confirmation sent to {bookingData.primary_email || (passengersData[0]?.email) || 'your email'}
            </p>
          </div>
          
          {/* Flight Details */}
          {flightData?.slices && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Flight Details</h2>
              
              {flightData.slices.map((slice: any, index: number) => (
                <div key={index} className="mb-4 pb-4 border-b last:border-b-0 last:pb-0 border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {slice.departure_time ? new Date(slice.departure_time).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Flight Date'}
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                        {slice.origin?.iata_code || slice.origin} → {slice.destination?.iata_code || slice.destination}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {slice.segments?.[0]?.airline || 'Airline'} • Flight {slice.segments?.[0]?.flight_number || ''}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {slice.duration || ''} • {slice.segments?.length === 1 ? 'Direct' : `${slice.segments?.length - 1} stop(s)`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Departure</p>
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {slice.departure_time ? new Date(slice.departure_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '--:--'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Passengers */}
          {passengersData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Passengers</h2>
              {passengersData.map((passenger: any, index: number) => (
                <div key={index} className="mb-2">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {passenger.title}. {passenger.givenName || passenger.given_name} {passenger.familyName || passenger.family_name}
                  </p>
                  {passenger.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{passenger.email}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Services (Seats & Baggage) */}
          {servicesData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Additional Services</h2>
              {servicesData.map((service: any, index: number) => (
                <div key={index} className="flex justify-between mb-2 text-gray-900 dark:text-gray-100">
                  <p>Service {index + 1}</p>
                  <p>Quantity: {service.quantity}</p>
                </div>
              ))}
            </div>
          )}
          
          {/* Total Amount */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total Paid</h2>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {currency.toUpperCase()} ${(typeof totalAmount === 'number' ? totalAmount : parseFloat(totalAmount || '0')).toFixed(2)}
              </p>
            </div>
          </div>
          
          {/* Rewards Earned */}
          {totalAmount > 0 && (
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 text-white mb-6">
              <h2 className="text-lg font-semibold mb-2">🎉 Rewards Earned!</h2>
              <p className="text-3xl font-bold mb-2">
                {Math.floor(typeof totalAmount === 'number' ? totalAmount : parseFloat(totalAmount || '0'))} points
              </p>
              <p className="text-sm opacity-90">
                You earned 1 point per dollar spent on this flight
              </p>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/')}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              data-testid="button-book-another"
            >
              Book Another Trip
            </button>
            <button 
              onClick={() => window.print()}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg font-semibold"
              data-testid="button-print"
            >
              Print Confirmation
            </button>
          </div>
          
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Need help? Contact support@eventescapes.com
          </p>
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
