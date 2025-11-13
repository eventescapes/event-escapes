import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Select from "react-select";
import { countries } from "@/lib/countries";
import ImprovedTripSummary from "@/components/ImprovedTripSummary";

interface FlightData {
  id: string;
  offerId: string;
  sliceId: string;
  airline: string;
  flight_number?: string;
  origin: string;
  destination: string;
  departure_datetime?: string;
  arrival_datetime?: string;
  duration: string;
  price: number;
  currency: string;
  passengers?: Passenger[];
  passenger_identity_documents_required?: boolean;
  // For fresh offer data from Duffel
  total_amount?: string;
  total_currency?: string;
  base_amount?: string;
  tax_amount?: string;
  expires_at?: string;
}

interface Passenger {
  id: string;
  type: string;
}

interface IdentityDocument {
  type: string;
  unique_identifier: string;
  issuing_country_code: string;
  expires_on: string;
}

interface PassengerData {
  id: string;
  type: string;
  title: string;
  given_name: string;
  middle_name: string;
  family_name: string;
  gender: string;
  born_on: string;
  email: string;
  country_code: string;
  phone_number: string;
  phone_number_full: string;
  // Frequent flyer
  loyalty_airline: string;
  loyalty_number: string;
  // Emergency contact
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_country_code: string;
  emergency_contact_phone: string;
  // Special requests
  special_requests: string;
  identity_documents: IdentityDocument[];
}

interface ValidationErrors {
  [key: string]: string;
}

export default function PassengerDetails() {
  const [outbound, setOutbound] = useState<FlightData | null>(null);
  const [returnFlight, setReturnFlight] = useState<FlightData | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<any>({});
  const [selectedBaggage, setSelectedBaggage] = useState<any[]>([]);
  const [seatsTotal, setSeatsTotal] = useState<number>(0);
  const [baggageTotal, setBaggageTotal] = useState<number>(0);
  const [passengersData, setPassengersData] = useState<PassengerData[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSpecialRequests, setShowSpecialRequests] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [isVerifyingPrice, setIsVerifyingPrice] = useState(false);

  // Helper function to determine if flight is international
  const isInternationalFlight = () => {
    if (!outbound) return false;
    
    // List of common domestic airport codes by country
    const usAirports = ['LAX', 'JFK', 'ORD', 'DFW', 'ATL', 'SFO', 'SEA', 'MIA', 'BOS', 'LAS', 'PHX', 'IAH', 'DEN', 'MCO', 'EWR'];
    const auAirports = ['SYD', 'MEL', 'BNE', 'PER', 'ADL', 'OOL', 'CNS', 'DRW', 'HBA'];
    const caAirports = ['YYZ', 'YVR', 'YUL', 'YYC', 'YEG', 'YOW', 'YHZ'];
    
    const origin = outbound.origin;
    const destination = outbound.destination;
    
    // Check if both airports are in the same country
    const bothUS = usAirports.includes(origin) && usAirports.includes(destination);
    const bothAU = auAirports.includes(origin) && auAirports.includes(destination);
    const bothCA = caAirports.includes(origin) && caAirports.includes(destination);
    
    // If both in same country = domestic, otherwise = international
    return !(bothUS || bothAU || bothCA);
  };

  useEffect(() => {
    console.log('📋 PASSENGER DETAILS PAGE LOADING...');
    console.log('═══════════════════════════════════════════');
    
    try {
      // Load all data from localStorage
      const outboundData = localStorage.getItem('selected_outbound');
      const returnData = localStorage.getItem('selected_return');
      const seatsData = localStorage.getItem('selected_seats');
      const baggageData = localStorage.getItem('selected_baggage');
      const seatsTotalData = localStorage.getItem('seats_total');
      const baggageTotalData = localStorage.getItem('baggage_total');
      
      console.log('LocalStorage contents:');
      console.log('- selected_outbound:', outboundData ? 'EXISTS' : 'MISSING');
      console.log('- selected_return:', returnData ? 'EXISTS' : 'MISSING');
      console.log('- selected_seats:', seatsData ? 'EXISTS' : 'MISSING');
      console.log('- selected_baggage:', baggageData ? 'EXISTS' : 'MISSING');
      
      // Validate outbound flight exists
      if (!outboundData) {
        throw new Error('No outbound flight data found');
      }
      
      // Parse outbound flight
      const outboundFlight = JSON.parse(outboundData);
      console.log('✅ Parsed outbound offer:', outboundFlight.id || outboundFlight.offerId);
      console.log('Full outbound data:', outboundFlight);
      
      setOutbound(outboundFlight);
      
      // Extract passengers from offer - try multiple possible locations
      let passengers = outboundFlight.passengers || [];
      
      // If no passengers array, create default passengers based on search params
      if (!passengers || passengers.length === 0) {
        console.warn('⚠️ No passengers array in offer, checking URL params...');
        const urlParams = new URLSearchParams(window.location.search);
        const passengerCount = parseInt(urlParams.get('passengers') || '1');
        
        console.log('Creating', passengerCount, 'default passenger(s)');
        passengers = Array.from({ length: passengerCount }, (_, i) => ({
          id: `pas_temp_${Date.now()}_${i}`,
          type: 'adult'
        }));
      }
      
      const passengerCount = passengers.length;
      
      console.log('✅ Found passengers:', passengerCount);
      console.log('Passenger IDs:', passengers.map((p: Passenger) => `${p.id} (${p.type})`));
      console.log('Identity docs required:', outboundFlight.passenger_identity_documents_required);
      
      // Initialize passenger data state
      const initialPassengersData = passengers.map((p: Passenger) => ({
        id: p.id,
        type: p.type,
        title: '',
        given_name: '',
        middle_name: '',
        family_name: '',
        gender: '',
        born_on: '',
        email: '',
        country_code: '',
        phone_number: '',
        phone_number_full: '',
        // Frequent flyer
        loyalty_airline: '',
        loyalty_number: '',
        // Emergency contact
        emergency_contact_name: '',
        emergency_contact_relationship: '',
        emergency_contact_country_code: '',
        emergency_contact_phone: '',
        // Special requests
        special_requests: '',
        identity_documents: [{
          type: 'passport',
          unique_identifier: '',
          issuing_country_code: 'US',
          expires_on: ''
        }]
      }));
      
      console.log('✅ Initialized passenger forms:', initialPassengersData.length);
      console.log('═══════════════════════════════════════════');
      
      setPassengersData(initialPassengersData);
      
      if (returnData) {
        setReturnFlight(JSON.parse(returnData));
      }
      
      if (seatsData) {
        setSelectedSeats(JSON.parse(seatsData));
      }
      
      if (baggageData) {
        setSelectedBaggage(JSON.parse(baggageData));
      }
      
      if (seatsTotalData) {
        setSeatsTotal(parseFloat(seatsTotalData));
      }
      
      if (baggageTotalData) {
        setBaggageTotal(parseFloat(baggageTotalData));
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('❌ ERROR LOADING PASSENGER DATA:', error);
      console.error('Error details:', error.message);
      alert(`Error loading passenger form: ${error.message}\n\nPlease go back and select your flights again.`);
      setLoading(false);
    }
  }, []);

  const handlePassengerInput = (passengerIndex: number, field: string, value: string) => {
    setPassengersData(prev => {
      const updated = [...prev];
      updated[passengerIndex] = {
        ...updated[passengerIndex],
        [field]: value
      };
      return updated;
    });
    
    // Clear error for this field
    const errorKey = `passenger_${passengerIndex}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleDocumentInput = (passengerIndex: number, field: string, value: string) => {
    setPassengersData(prev => {
      const updated = [...prev];
      updated[passengerIndex] = {
        ...updated[passengerIndex],
        identity_documents: [{
          ...updated[passengerIndex].identity_documents[0],
          [field]: value
        }]
      };
      return updated;
    });
  };

  const validateForm = () => {
    const newErrors: ValidationErrors = {};
    
    passengersData.forEach((passenger, index) => {
      // Basic info validation
      if (!passenger.title) {
        newErrors[`passenger_${index}_title`] = 'Title required';
      }
      
      if (!passenger.given_name || passenger.given_name.length < 2) {
        newErrors[`passenger_${index}_given_name`] = 'Valid first name required';
      }
      
      if (!passenger.family_name || passenger.family_name.length < 2) {
        newErrors[`passenger_${index}_family_name`] = 'Valid last name required';
      }
      
      if (!passenger.gender) {
        newErrors[`passenger_${index}_gender`] = 'Gender required';
      }
      
      // Date of birth validation
      if (!passenger.born_on) {
        newErrors[`passenger_${index}_born_on`] = 'Date of birth required';
      } else {
        const birthDate = new Date(passenger.born_on);
        const today = new Date();
        const age = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        
        if (passenger.type === 'adult' && age < 18) {
          newErrors[`passenger_${index}_born_on`] = 'Must be 18+ for adult passenger';
        }
      }
      
      // Contact validation (first passenger only)
      if (index === 0) {
        if (!passenger.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.email)) {
          newErrors[`passenger_${index}_email`] = 'Valid email required';
        }
        
        const fullPhone = passenger.phone_number_full || '';
        
        if (!fullPhone || fullPhone.trim() === '') {
          newErrors[`passenger_${index}_phone_number_full`] = 'Phone number required';
        } else if (!fullPhone.startsWith('+')) {
          newErrors[`passenger_${index}_phone_number_full`] = 'Country code must start with +';
        } else if (fullPhone.replace(/\D/g, '').length < 10) {
          newErrors[`passenger_${index}_phone_number_full`] = 'Phone number too short';
        }
      }
      
      // Optional passport validation (if provided)
      if (passenger.identity_documents[0].unique_identifier) {
        if (passenger.identity_documents[0].unique_identifier.length < 6) {
          newErrors[`passenger_${index}_passport`] = 'Invalid passport number';
        }
        
        if (passenger.identity_documents[0].expires_on) {
          const expiryDate = new Date(passenger.identity_documents[0].expires_on);
          const sixMonthsFromNow = new Date();
          sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
          
          if (expiryDate < sixMonthsFromNow) {
            newErrors[`passenger_${index}_passport_expiry`] = 'Passport must be valid for 6+ months';
          }
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    console.log('🔍 VALIDATING ALL PASSENGERS...');
    
    // Step 1: Validate form
    if (!validateForm()) {
      alert('⚠️ Please complete all required fields for all passengers');
      // Scroll to first error
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        const element = document.querySelector(`[data-error="${firstErrorKey}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }
    
    setIsVerifyingPrice(true);
    
    try {
      // Step 2: Verify price with Duffel (if offerId exists)
      if (outbound?.offerId || outbound?.id) {
        const offerId = outbound.offerId || outbound.id;
        console.log('🔄 Verifying current price with Duffel...');
        console.log(`Offer ID: ${offerId}`);
        
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/duffel_get_offer`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify({
                offer_id: offerId
              })
            }
          );
          
          const result = await response.json();
          
          // Handle expired or unavailable offers
          if (!result.success) {
            if (result.error === 'offer_expired') {
              alert('⚠️ This offer has expired. Please search for flights again.');
              window.location.href = '/flights';
              return;
            }
            
            console.warn('⚠️ Could not verify price, proceeding with cached data');
          } else {
            const freshOffer = result.offer;
            
            // Check if offer expired
            const expiresAt = new Date(freshOffer.expires_at);
            const now = new Date();
            
            if (expiresAt < now) {
              alert('⚠️ This offer has expired. Please search for flights again.');
              window.location.href = '/flights';
              return;
            }
            
            // Check for price changes
            const oldPrice = parseFloat(outbound.total_amount || outbound.price?.toString() || '0');
            const newPrice = parseFloat(freshOffer.total_amount || '0');
            const priceDifference = newPrice - oldPrice;
            
            if (Math.abs(priceDifference) > 0.01) {
              console.log(`💰 Price changed: ${oldPrice} → ${newPrice}`);
              
              let message;
              if (priceDifference > 0) {
                message = `⚠️ PRICE INCREASED\n\nThe flight price has increased by $${priceDifference.toFixed(2)}.\n\nOld Price: $${oldPrice.toFixed(2)}\nNew Price: $${newPrice.toFixed(2)}\n\nDo you want to continue with the new price?`;
              } else {
                message = `✅ GOOD NEWS!\n\nThe flight price has decreased by $${Math.abs(priceDifference).toFixed(2)}!\n\nOld Price: $${oldPrice.toFixed(2)}\nNew Price: $${newPrice.toFixed(2)}\n\nContinue with the lower price?`;
              }
              
              if (!confirm(message)) {
                console.log('❌ User declined price change');
                setIsVerifyingPrice(false);
                return;
              }
              
              console.log('✅ User accepted price change');
              
              // Save fresh offer
              localStorage.setItem('fresh_offer', JSON.stringify(freshOffer));
            } else {
              console.log('✅ Price unchanged');
              localStorage.setItem('fresh_offer', JSON.stringify(freshOffer));
            }
          }
        } catch (priceCheckError) {
          console.warn('⚠️ Price verification failed, proceeding with cached data:', priceCheckError);
        }
      }
      
      // Step 3: Format passenger data
      const formattedPassengers = passengersData.map((passenger, index) => {
        const formatted: any = {
          id: passenger.id,  // CRITICAL: Keep original ID from offer
          type: passenger.type,
          title: passenger.title,
          // Combine first and middle name if middle name provided
          given_name: passenger.middle_name?.trim() 
            ? `${passenger.given_name} ${passenger.middle_name}`.trim()
            : passenger.given_name,
          family_name: passenger.family_name,
          gender: passenger.gender,
          born_on: passenger.born_on,
          email: index === 0 ? passenger.email : passengersData[0].email,
          phone_number: index === 0 ? passenger.phone_number_full : passengersData[0].phone_number_full
        };
        
        // Add loyalty programme accounts if provided (SENT TO DUFFEL!)
        if (passenger.loyalty_airline && passenger.loyalty_number) {
          formatted.loyalty_programme_accounts = [{
            airline_iata_code: passenger.loyalty_airline,
            account_number: passenger.loyalty_number
          }];
          
          console.log(`✈️ Loyalty account for Passenger ${index + 1} (${passenger.given_name}):`, {
            airline: passenger.loyalty_airline,
            number: passenger.loyalty_number
          });
        }
        
        // Add identity documents only if passport provided
        const hasPassport = passenger.identity_documents[0].unique_identifier?.trim();
        if (hasPassport) {
          formatted.identity_documents = passenger.identity_documents;
        }
        
        return formatted;
      });
      
      console.log('✅ ALL PASSENGERS FORMATTED FOR DUFFEL:');
      console.log('═══════════════════════════════════════════');
      console.log(JSON.stringify(formattedPassengers, null, 2));
      console.log('═══════════════════════════════════════════');
      
      // Step 4: Save data
      localStorage.setItem('passenger_data', JSON.stringify(formattedPassengers));
      
      // Save emergency contacts for your DB
      localStorage.setItem('passenger_extras', JSON.stringify(
        passengersData.map(p => ({
          emergency_contact_name: p.emergency_contact_name || '',
          emergency_contact_relationship: p.emergency_contact_relationship || '',
          emergency_contact_phone: p.emergency_contact_country_code && p.emergency_contact_phone 
            ? `${p.emergency_contact_country_code}${p.emergency_contact_phone.replace(/\s/g, '')}`
            : '',
          special_requests_notes: p.special_requests || ''
        }))
      ));
      
      // Log complete checkout summary
      const flightsSubtotal = (outbound?.price || 0) + (returnFlight?.price || 0);
      const grandTotal = flightsSubtotal + seatsTotal + baggageTotal;
      
      const checkoutSummary = {
        offer_id: outbound?.offerId || outbound?.id,
        passengers: formattedPassengers,
        seats: selectedSeats,
        baggage: selectedBaggage,
        totals: {
          flights: flightsSubtotal,
          seats: seatsTotal,
          baggage: baggageTotal,
          grand_total: grandTotal
        }
      };
      
      console.log('📦 COMPLETE CHECKOUT DATA:');
      console.log(JSON.stringify(checkoutSummary, null, 2));
      console.log('✅ All data saved, redirecting to checkout...');
      
      // Step 5: Navigate to checkout
      setTimeout(() => {
        window.location.href = '/checkout';
      }, 300);
      
    } catch (error) {
      console.error('❌ Error in handleContinue:', error);
      alert('⚠️ Error processing request. Please try again.');
      setIsVerifyingPrice(false);
    }
  };

  const flightTotal = (outbound?.price || 0) + (returnFlight?.price || 0);
  const grandTotal = flightTotal + seatsTotal + baggageTotal;

  // ═══════════════════════════════════════════════════════════════
  // EXPEDIA-STYLE CALCULATION FUNCTIONS
  // ═══════════════════════════════════════════════════════════════
  
  // Get passenger type for display
  const getPassengerType = (index: number): string => {
    if (!passengersData || !passengersData[index]) return 'Adult';
    
    const passenger = passengersData[index];
    
    switch (passenger.type) {
      case 'adult':
        return 'Adult';
      case 'child':
        return 'Child';
      case 'infant_without_seat':
      case 'infant_with_seat':
        return 'Infant';
      default:
        return 'Adult';
    }
  };

  // Calculate flight cost per person (base fare only)
  const calculateFlightCostPerPerson = (): number => {
    if (!outbound) return 0;
    
    const passengerCount = passengersData.length || 1;
    
    // Try to get base amounts from the offer
    const outboundBase = parseFloat((outbound as any).base_amount || outbound.price?.toString() || '0');
    const returnBase = returnFlight ? parseFloat((returnFlight as any).base_amount || returnFlight.price?.toString() || '0') : 0;
    
    // If we have specific base_amount, use it; otherwise estimate 70% of total as base
    const hasBaseAmount = (outbound as any).base_amount !== undefined;
    
    if (hasBaseAmount) {
      const totalBase = outboundBase + returnBase;
      return totalBase / passengerCount;
    } else {
      // Estimate: approximately 70% is base fare, 30% is taxes
      const totalPrice = outboundBase + returnBase;
      const estimatedBase = totalPrice * 0.7;
      return estimatedBase / passengerCount;
    }
  };

  // Calculate taxes per person
  const calculateTaxesPerPerson = (): number => {
    if (!outbound) return 0;
    
    const passengerCount = passengersData.length || 1;
    
    // Try to get tax amounts from the offer
    const outboundTax = parseFloat((outbound as any).tax_amount || '0');
    const returnTax = returnFlight ? parseFloat((returnFlight as any).tax_amount || '0') : 0;
    
    // If we have specific tax_amount, use it; otherwise estimate 30% of total as taxes
    const hasTaxAmount = (outbound as any).tax_amount !== undefined;
    
    if (hasTaxAmount) {
      const totalTax = outboundTax + returnTax;
      return totalTax / passengerCount;
    } else {
      // Estimate: approximately 30% is taxes & fees
      const outboundPrice = parseFloat(outbound.price?.toString() || '0');
      const returnPrice = returnFlight ? parseFloat(returnFlight.price?.toString() || '0') : 0;
      const totalPrice = outboundPrice + returnPrice;
      const estimatedTax = totalPrice * 0.3;
      return estimatedTax / passengerCount;
    }
  };

  // Calculate subtotal (flights + services, no discount)
  const calculateSubtotal = (): number => {
    const flightsTotal = flightTotal;
    const seatsSum = seatsTotal;
    const baggageSum = baggageTotal;
    
    return flightsTotal + seatsSum + baggageSum;
  };

  // Calculate grand total (same as subtotal for now, can add discount later)
  const calculateGrandTotal = (): number => {
    return calculateSubtotal();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12">
          <div className="text-6xl mb-4 animate-bounce">✈️</div>
          <div className="text-2xl font-semibold mb-2">Loading passenger form...</div>
          <div className="text-gray-600">Preparing details</div>
        </div>
      </div>
    );
  }

  if (!outbound || passengersData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2">No Flight Selected</h3>
          <p className="text-gray-600 mb-4">Please go back to select your flights first.</p>
          <Button onClick={() => window.location.href = '/flights'}>← Back to Flights</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Button 
            onClick={() => window.location.href = '/baggage-selection'} 
            variant="outline"
            className="mb-4"
          >
            ← Back to Baggage Selection
          </Button>
          <h1 className="text-3xl font-bold mb-2">Passenger Information</h1>
          <p className="text-gray-600">Complete details for all travelers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Passenger Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Warning Banner */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <svg className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm text-yellow-800 font-medium">
                  Names must match your government-issued ID exactly
                </p>
              </div>
            </div>

            {passengersData.map((passenger, passengerIndex) => (
              <Card key={passenger.id} className="p-6">
                {/* Passenger Header */}
                <div className="border-b pb-4 mb-6">
                  <h3 className="text-xl font-bold">
                    Passenger {passengerIndex + 1} of {passengersData.length}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    ({passenger.type === 'adult' ? 'Adult' : passenger.type.charAt(0).toUpperCase() + passenger.type.slice(1)})
                  </p>
                </div>

                {/* Personal Information */}
                <div className="mb-6">
                  <h4 className="font-semibold text-lg mb-4">Personal Information</h4>
                  
                  {/* Title & Gender */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div data-error={`passenger_${passengerIndex}_title`}>
                      <label className="block text-sm font-medium mb-2">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={passenger.title}
                        onChange={(e) => handlePassengerInput(passengerIndex, 'title', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors[`passenger_${passengerIndex}_title`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select...</option>
                        <option value="mr">Mr</option>
                        <option value="ms">Ms</option>
                        <option value="mrs">Mrs</option>
                        <option value="miss">Miss</option>
                        <option value="dr">Dr</option>
                      </select>
                      {errors[`passenger_${passengerIndex}_title`] && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors[`passenger_${passengerIndex}_title`]}
                        </p>
                      )}
                    </div>
                    
                    <div data-error={`passenger_${passengerIndex}_gender`}>
                      <label className="block text-sm font-medium mb-2">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-6 pt-3">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            value="m"
                            checked={passenger.gender === 'm'}
                            onChange={(e) => handlePassengerInput(passengerIndex, 'gender', e.target.value)}
                            className="mr-2 w-4 h-4"
                          />
                          <span>Male</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            value="f"
                            checked={passenger.gender === 'f'}
                            onChange={(e) => handlePassengerInput(passengerIndex, 'gender', e.target.value)}
                            className="mr-2 w-4 h-4"
                          />
                          <span>Female</span>
                        </label>
                      </div>
                      {errors[`passenger_${passengerIndex}_gender`] && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors[`passenger_${passengerIndex}_gender`]}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Name Fields - 3 columns with middle name */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div data-error={`passenger_${passengerIndex}_given_name`}>
                      <label className="block text-sm font-medium mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={passenger.given_name}
                        onChange={(e) => handlePassengerInput(passengerIndex, 'given_name', e.target.value)}
                        placeholder="John"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors[`passenger_${passengerIndex}_given_name`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[`passenger_${passengerIndex}_given_name`] && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors[`passenger_${passengerIndex}_given_name`]}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Middle Name <span className="text-gray-400 text-xs font-normal">(if on ID)</span>
                      </label>
                      <input
                        type="text"
                        value={passenger.middle_name || ''}
                        onChange={(e) => handlePassengerInput(passengerIndex, 'middle_name', e.target.value)}
                        placeholder=""
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div data-error={`passenger_${passengerIndex}_family_name`}>
                      <label className="block text-sm font-medium mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={passenger.family_name}
                        onChange={(e) => handlePassengerInput(passengerIndex, 'family_name', e.target.value)}
                        placeholder="Smith"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors[`passenger_${passengerIndex}_family_name`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[`passenger_${passengerIndex}_family_name`] && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors[`passenger_${passengerIndex}_family_name`]}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Date of Birth */}
                  <div className="mb-4" data-error={`passenger_${passengerIndex}_born_on`}>
                    <label className="block text-sm font-medium mb-2">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={passenger.born_on}
                      onChange={(e) => handlePassengerInput(passengerIndex, 'born_on', e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors[`passenger_${passengerIndex}_born_on`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      ℹ️ Must be 18+ for adult passengers
                    </p>
                    {errors[`passenger_${passengerIndex}_born_on`] && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors[`passenger_${passengerIndex}_born_on`]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Information (First Passenger Only) */}
                {passengerIndex === 0 && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-2">Contact Information</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Booking confirmation will be sent here
                    </p>
                    
                    <div className="space-y-4">
                      <div data-error={`passenger_${passengerIndex}_email`}>
                        <label className="block text-sm font-medium mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={passenger.email}
                          onChange={(e) => handlePassengerInput(passengerIndex, 'email', e.target.value)}
                          placeholder="your.email@example.com"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white ${
                            errors[`passenger_${passengerIndex}_email`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`passenger_${passengerIndex}_email`] && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors[`passenger_${passengerIndex}_email`]}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3">
                          {/* Country Code Input */}
                          <input
                            type="text"
                            value={passenger.country_code || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Only allow + and numbers
                              const cleaned = value.replace(/[^\d+]/g, '');
                              handlePassengerInput(passengerIndex, 'country_code', cleaned);
                              
                              // Update full phone number
                              const fullPhone = cleaned + (passenger.phone_number || '').replace(/\s/g, '');
                              handlePassengerInput(passengerIndex, 'phone_number_full', fullPhone);
                            }}
                            placeholder="+61"
                            className={`w-24 px-3 py-3 border rounded-lg text-center font-mono focus:ring-2 focus:ring-blue-500 bg-white ${
                              errors[`passenger_${passengerIndex}_phone_number_full`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            maxLength={4}
                          />
                          
                          {/* Phone Number Input */}
                          <input
                            type="tel"
                            value={passenger.phone_number || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Only allow numbers and spaces
                              const cleaned = value.replace(/[^\d\s]/g, '');
                              handlePassengerInput(passengerIndex, 'phone_number', cleaned);
                              
                              // Update full phone number
                              const fullPhone = (passenger.country_code || '') + cleaned.replace(/\s/g, '');
                              handlePassengerInput(passengerIndex, 'phone_number_full', fullPhone);
                            }}
                            placeholder="412 345 678"
                            className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white ${
                              errors[`passenger_${passengerIndex}_phone_number_full`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Enter country code (e.g., +61, +1, +44) and phone number
                        </p>
                        {errors[`passenger_${passengerIndex}_phone_number_full`] && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors[`passenger_${passengerIndex}_phone_number_full`]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Frequent Flyer Section - Available for All Passengers */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    ✈️ Frequent Flyer Programme
                    <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Add your loyalty account to earn miles and potentially unlock discounted fares, extra baggage, or better seating
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Airline Programme
                      </label>
                      <select
                        value={passenger.loyalty_airline || ''}
                        onChange={(e) => handlePassengerInput(passengerIndex, 'loyalty_airline', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select airline...</option>
                        <option value="QF">Qantas Frequent Flyer</option>
                        <option value="VA">Virgin Australia Velocity</option>
                        <option value="SQ">Singapore Airlines KrisFlyer</option>
                        <option value="EK">Emirates Skywards</option>
                        <option value="QR">Qatar Airways Privilege Club</option>
                        <option value="AA">American Airlines AAdvantage</option>
                        <option value="UA">United MileagePlus</option>
                        <option value="DL">Delta SkyMiles</option>
                        <option value="BA">British Airways Executive Club</option>
                        <option value="AF">Air France Flying Blue</option>
                        <option value="KL">KLM Flying Blue</option>
                        <option value="LH">Lufthansa Miles & More</option>
                        <option value="AC">Air Canada Aeroplan</option>
                        <option value="NZ">Air New Zealand Airpoints</option>
                        <option value="CX">Cathay Pacific Asia Miles</option>
                        <option value="JL">JAL Mileage Bank</option>
                        <option value="NH">ANA Mileage Club</option>
                        <option value="TG">Thai Airways Royal Orchid Plus</option>
                        <option value="MH">Malaysia Airlines Enrich</option>
                        <option value="TK">Turkish Airlines Miles&Smiles</option>
                        <option value="EY">Etihad Guest</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Membership Number
                      </label>
                      <input
                        type="text"
                        value={passenger.loyalty_number || ''}
                        onChange={(e) => handlePassengerInput(passengerIndex, 'loyalty_number', e.target.value)}
                        placeholder="Enter your membership number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-gray-700">
                      💡 <strong>Tip:</strong> Your loyalty account may unlock better prices, additional baggage allowance, or preferred seating on this flight
                    </p>
                  </div>
                </div>

                {/* Emergency Contact & Special Requests - Collapsible, First Passenger Only */}
                {passengerIndex === 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => setShowSpecialRequests(!showSpecialRequests)}
                      className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                    >
                      {showSpecialRequests ? '▼' : '▶'} Emergency contact, special requests and more
                    </button>
                    
                    {showSpecialRequests && (
                      <div className="mt-4 space-y-6 bg-gray-50 p-4 rounded-lg">
                        
                        {/* Emergency Contact */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            🚨 Emergency Contact
                            <span className="text-xs text-gray-500 font-normal">(Optional but recommended)</span>
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Contact Name
                              </label>
                              <input
                                type="text"
                                value={passenger.emergency_contact_name || ''}
                                onChange={(e) => handlePassengerInput(passengerIndex, 'emergency_contact_name', e.target.value)}
                                placeholder="Full name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Relationship
                              </label>
                              <input
                                type="text"
                                value={passenger.emergency_contact_relationship || ''}
                                onChange={(e) => handlePassengerInput(passengerIndex, 'emergency_contact_relationship', e.target.value)}
                                placeholder="e.g., Spouse, Parent"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Phone Number
                            </label>
                            <div className="flex gap-3">
                              <input
                                type="text"
                                value={passenger.emergency_contact_country_code || ''}
                                onChange={(e) => handlePassengerInput(passengerIndex, 'emergency_contact_country_code', e.target.value.replace(/[^\d+]/g, ''))}
                                placeholder="+61"
                                className="w-24 px-3 py-3 border border-gray-300 rounded-lg text-center font-mono focus:ring-2 focus:ring-blue-500"
                                maxLength={4}
                              />
                              <input
                                type="tel"
                                value={passenger.emergency_contact_phone || ''}
                                onChange={(e) => handlePassengerInput(passengerIndex, 'emergency_contact_phone', e.target.value.replace(/[^\d\s]/g, ''))}
                                placeholder="412 345 678"
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Special Requests - Expedia Style */}
                        <div className="pt-4 border-t">
                          <h4 className="font-medium text-gray-900 mb-3">
                            ✈️ Special Requests & Assistance
                          </h4>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-gray-700 mb-3">
                              For special requests including:
                            </p>
                            <ul className="text-sm text-gray-700 space-y-1 ml-4 mb-3">
                              <li>• Wheelchair or mobility assistance</li>
                              <li>• Meal preferences (vegetarian, kosher, etc.)</li>
                              <li>• Medical equipment or oxygen</li>
                              <li>• Traveling with pets</li>
                              <li>• Infant/child needs</li>
                              <li>• Visual or hearing assistance</li>
                            </ul>
                            <p className="text-sm text-gray-700 font-medium">
                              📞 Please contact the airline directly after booking to confirm availability.
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Airlines need advance notice for special services and must confirm they can accommodate your request.
                            </p>
                          </div>
                          
                          <div className="mt-3">
                            <label className="block text-sm font-medium mb-2">
                              Notes for Your Reference
                            </label>
                            <textarea
                              value={passenger.special_requests || ''}
                              onChange={(e) => handlePassengerInput(passengerIndex, 'special_requests', e.target.value)}
                              placeholder="Keep notes here about what you need to request from the airline (for your reference only)"
                              rows={2}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              💡 This is saved for your records - remember to contact the airline directly
                            </p>
                          </div>
                        </div>
                        
                      </div>
                    )}
                  </div>
                )}

                {/* Travel Document Section - Styled based on flight type */}
                <div className={`p-6 rounded-lg transition-all ${
                  isInternationalFlight() 
                    ? 'bg-red-50 border-2 border-red-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-2xl">
                      {isInternationalFlight() ? '🛂' : '✈️'}
                    </span>
                    <div className="flex-1">
                      <h4 className={`font-semibold text-lg ${
                        isInternationalFlight() ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        Travel Document
                        {isInternationalFlight() && (
                          <span className="ml-2 text-red-600 text-sm font-bold">
                            * REQUIRED
                          </span>
                        )}
                        {!isInternationalFlight() && (
                          <span className="ml-2 text-gray-500 text-sm font-normal">
                            (Optional)
                          </span>
                        )}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        isInternationalFlight() ? 'text-red-700 font-medium' : 'text-gray-500'
                      }`}>
                        {isInternationalFlight() ? (
                          <span>
                            ⚠️ Valid passport required for international travel
                          </span>
                        ) : (
                          <span>
                            Not required for domestic flights
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`space-y-4 ${!isInternationalFlight() ? 'opacity-75' : ''}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isInternationalFlight() ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          Passport Number
                          {isInternationalFlight() && <span className="text-red-600"> *</span>}
                        </label>
                        <input
                          type="text"
                          value={passenger.identity_documents[0].unique_identifier}
                          onChange={(e) => handleDocumentInput(passengerIndex, 'unique_identifier', e.target.value)}
                          placeholder="N1234567"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 ${
                            isInternationalFlight() 
                              ? 'bg-white border-gray-300 focus:border-red-500 focus:ring-red-500' 
                              : 'bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                          } ${errors[`passenger_${passengerIndex}_passport`] ? 'border-red-500' : ''}`}
                        />
                        {errors[`passenger_${passengerIndex}_passport`] && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors[`passenger_${passengerIndex}_passport`]}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isInternationalFlight() ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          Issuing Country
                          {isInternationalFlight() && <span className="text-red-600"> *</span>}
                        </label>
                        <Select
                          options={countries}
                          value={countries.find(c => c.value === passenger.identity_documents[0].issuing_country_code) || null}
                          onChange={(selected) => handleDocumentInput(passengerIndex, 'issuing_country_code', selected?.value || '')}
                          placeholder="Search country..."
                          isSearchable
                          isClearable
                          className="react-select-container"
                          classNamePrefix="react-select"
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: '48px',
                              backgroundColor: isInternationalFlight() ? '#fff' : '#f9fafb',
                              borderColor: isInternationalFlight() ? '#d1d5db' : '#e5e7eb',
                              '&:hover': {
                                borderColor: '#9ca3af'
                              }
                            }),
                            menu: (base) => ({
                              ...base,
                              zIndex: 9999
                            })
                          }}
                        />
                        {errors[`passenger_${passengerIndex}_passport_country`] && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors[`passenger_${passengerIndex}_passport_country`]}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isInternationalFlight() ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        Expiry Date
                        {isInternationalFlight() && <span className="text-red-600"> *</span>}
                      </label>
                      <input
                        type="date"
                        value={passenger.identity_documents[0].expires_on}
                        onChange={(e) => handleDocumentInput(passengerIndex, 'expires_on', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 ${
                          isInternationalFlight() 
                            ? 'bg-white border-gray-300 focus:border-red-500 focus:ring-red-500' 
                            : 'bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                        } ${errors[`passenger_${passengerIndex}_passport_expiry`] ? 'border-red-500' : ''}`}
                      />
                      <p className={`text-xs mt-1 ${
                        isInternationalFlight() ? 'text-red-600 font-medium' : 'text-gray-500'
                      }`}>
                        {isInternationalFlight() ? (
                          '⚠️ Must be valid for at least 6 months from travel date'
                        ) : (
                          'ℹ️ If provided, should be valid for at least 6 months'
                        )}
                      </p>
                      {errors[`passenger_${passengerIndex}_passport_expiry`] && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors[`passenger_${passengerIndex}_passport_expiry`]}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Info Box */}
                  {isInternationalFlight() && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-800">
                        🛂 <strong>International Travel:</strong> Valid passport required. Ensure it's valid for at least 6 months beyond your travel dates.
                      </p>
                    </div>
                  )}
                  
                  {!isInternationalFlight() && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-gray-700">
                        💡 <strong>Domestic Flight:</strong> Passport not required. You can use a driver's license or national ID at the airport.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Trip Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* Improved Trip Summary Component */}
              {outbound && (() => {
                // Prepare offer object for ImprovedTripSummary
                const offer = {
                  id: outbound.id || outbound.offerId || '',
                  total_amount: outbound.total_amount || outbound.price?.toString() || '0',
                  total_currency: outbound.total_currency || outbound.currency || 'AUD',
                  base_amount: outbound.base_amount || '',
                  tax_amount: outbound.tax_amount || '',
                  passengers: passengersData.map(p => ({
                    id: p.id,
                    type: p.type as 'adult' | 'child' | 'infant_without_seat' | 'infant_with_seat'
                  })),
                  slices: [{
                    id: outbound.sliceId || '',
                    origin: { iata_code: outbound.origin },
                    destination: { iata_code: outbound.destination },
                    departure_time: outbound.departure_datetime,
                    arrival_time: outbound.arrival_datetime,
                    duration: outbound.duration
                  }]
                };

                // Ensure base_amount and tax_amount exist (estimate if missing)
                if (!offer.base_amount || !offer.tax_amount) {
                  const total = parseFloat(offer.total_amount);
                  offer.base_amount = (total * 0.75).toFixed(2);
                  offer.tax_amount = (total * 0.25).toFixed(2);
                  console.warn('base_amount/tax_amount not in offer, using estimated split');
                }

                // Prepare seats and baggage arrays
                // selectedSeats structure: {0: {0: seat, 1: seat}, 1: {0: seat, 1: seat}}
                // We need to flatten all seats from all flights and passengers
                const seatsArray = Object.values(selectedSeats)
                  .flatMap((flightSeats: any) => Object.values(flightSeats))
                  .filter(Boolean);
                
                const baggageArray = selectedBaggage || [];
                
                console.log('🎫 Trip Summary Data:');
                console.log('- Seats:', seatsArray.length, 'seats');
                console.log('- Seats total:', seatsArray.reduce((sum: number, s: any) => sum + (parseFloat(s.price || s.amount || s.total_amount || 0)), 0));
                console.log('- Baggage:', baggageArray.length, 'items');
                console.log('- Baggage total:', baggageArray.reduce((sum: number, b: any) => sum + (parseFloat(b.total_amount || b.amount || 0)), 0));

                return (
                  <ImprovedTripSummary 
                    offer={offer}
                    selectedSeats={seatsArray}
                    selectedBaggage={baggageArray}
                  />
                );
              })()}
              
              {/* Continue Button Card */}
              <Card className="p-6">
                <Button
                  size="lg"
                  className="w-full py-6 text-lg flex items-center justify-center gap-2"
                  onClick={handleContinue}
                  disabled={isVerifyingPrice}
                >
                  {isVerifyingPrice ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Verifying Price...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Checkout</span>
                      <span>→</span>
                    </>
                  )}
                </Button>
                
                {isVerifyingPrice && (
                  <p className="text-xs text-center text-gray-500 mt-3">
                    🔍 Checking for price changes...
                  </p>
                )}
                
                {!isVerifyingPrice && (
                  <p className="text-xs text-center text-gray-500 mt-3">
                    All passenger details must be completed
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

