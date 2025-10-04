import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Mail, Plane, User, FileText, AlertCircle } from 'lucide-react';

export function ConfirmationPage() {
  const [, navigate] = useLocation();
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('order_confirmation');
    if (!data) {
      navigate('/');
      return;
    }

    try {
      const parsed = JSON.parse(data);
      setOrderData(parsed);
      console.log('📋 Order confirmation:', parsed);
    } catch (err) {
      console.error('Error parsing order confirmation:', err);
      navigate('/');
    }
  }, [navigate]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    alert('Email confirmation feature coming soon!');
  };

  const handleBookAnother = () => {
    sessionStorage.clear();
    navigate('/');
  };

  if (!orderData) return null;

  const order = orderData.order;

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:bg-white">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-6">Your flight has been successfully booked</p>
          
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 inline-block">
            <p className="text-sm text-gray-600 mb-1">Booking Reference:</p>
            <p className="text-2xl font-bold text-blue-600" data-testid="booking-reference">
              {order.bookingReference || order.id}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center mb-8 print:hidden">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="border-2 border-gray-300"
            data-testid="button-print"
          >
            <Download className="w-4 h-4 mr-2" />
            Print / Save PDF
          </Button>
          <Button
            onClick={handleEmail}
            variant="outline"
            className="border-2 border-gray-300"
            data-testid="button-email"
          >
            <Mail className="w-4 h-4 mr-2" />
            Email Confirmation
          </Button>
        </div>

        {/* Flight Details */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Plane className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Flight Details</h2>
          </div>

          {order.slices?.map((slice: any, sliceIndex: number) => (
            <div key={sliceIndex} className={sliceIndex > 0 ? 'mt-6 pt-6 border-t' : ''}>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {slice.origin?.city_name || slice.origin} → {slice.destination?.city_name || slice.destination}
                </h3>
                <span className="text-sm text-gray-600">
                  ({slice.duration || 'N/A'})
                </span>
              </div>

              {slice.segments?.map((segment: any, segIndex: number) => (
                <div key={segIndex} className={`relative pl-6 ${segIndex > 0 ? 'mt-4 pt-4 border-t border-dashed' : ''}`}>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-200"></div>
                  
                  <div className="flex items-start gap-4 mb-4">
                    {segment.marketing_carrier?.logo_symbol_url && (
                      <img
                        src={segment.marketing_carrier.logo_symbol_url}
                        alt={segment.marketing_carrier.name}
                        className="w-12 h-12 object-contain"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {segment.marketing_carrier?.name || segment.airline} {segment.marketing_carrier_flight_number || segment.flight_number}
                      </div>
                      <div className="text-sm text-gray-600">
                        {segment.aircraft?.name || segment.aircraft || 'Aircraft info unavailable'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatTime(segment.departing_at)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(segment.departing_at)}
                      </div>
                      <div className="text-sm font-medium text-gray-900 mt-1">
                        {segment.origin?.city_name || segment.origin} ({segment.origin?.iata_code || segment.origin})
                      </div>
                      {segment.origin_terminal && (
                        <div className="text-xs text-gray-500">Terminal {segment.origin_terminal}</div>
                      )}
                    </div>

                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatTime(segment.arriving_at)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(segment.arriving_at)}
                      </div>
                      <div className="text-sm font-medium text-gray-900 mt-1">
                        {segment.destination?.city_name || segment.destination} ({segment.destination?.iata_code || segment.destination})
                      </div>
                      {segment.destination_terminal && (
                        <div className="text-xs text-gray-500">Terminal {segment.destination_terminal}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Passenger Information */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Passenger Information</h2>
          </div>

          <div className="space-y-4">
            {order.passengers?.map((passenger: any, index: number) => (
              <div key={index} className="pb-4 border-b last:border-b-0">
                <div className="font-bold text-gray-900 mb-1" data-testid={`passenger-name-${index}`}>
                  {passenger.title}. {passenger.given_name} {passenger.family_name}
                </div>
                <div className="text-sm text-gray-600">
                  {passenger.email} • {passenger.phone_number}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  DOB: {passenger.born_on} • Gender: {passenger.gender === 'm' ? 'Male' : 'Female'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* E-Tickets */}
        {order.documents && order.documents.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">E-Tickets</h2>
            </div>

            <div className="space-y-3">
              {order.documents.map((doc: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-mono text-lg font-semibold text-gray-900" data-testid={`eticket-${index}`}>
                      {doc.unique_identifier}
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.passengers?.[index] ? 
                        `${order.passengers[index].given_name} ${order.passengers[index].family_name}` : 
                        'Passenger'}
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    {doc.type?.replace('_', ' ').toUpperCase() || 'E-TICKET'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Summary</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Order ID</span>
              <span className="font-medium text-gray-900">{order.id}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Booking Date</span>
              <span className="font-medium text-gray-900">
                {order.created_at ? formatDate(order.created_at) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-3 bg-blue-50 -mx-3 px-3 rounded-lg">
              <span className="text-lg font-semibold text-gray-900">Total Paid</span>
              <span className="text-2xl font-bold text-blue-600" data-testid="total-paid">
                {order.total_currency?.toUpperCase() || 'USD'} ${parseFloat(order.total_amount || '0').toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-700 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-yellow-900 mb-3">Important Information</h3>
              <ul className="space-y-2 text-yellow-900">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Arrive 2-3 hours before departure for international flights</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Online check-in opens 24 hours before your flight</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Bring valid ID/passport as shown on your booking</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Download the airline app for mobile boarding pass</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Keep your booking reference handy for check-in</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Book Another Flight Button */}
        <div className="text-center print:hidden">
          <Button
            onClick={handleBookAnother}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 text-lg"
            data-testid="button-book-another"
          >
            Book Another Flight
          </Button>
        </div>
      </div>
    </div>
  );
}
