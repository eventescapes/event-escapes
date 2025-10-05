import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, Plane, Loader2 } from 'lucide-react';

interface PassengerForm {
  title: string;
  givenName: string;
  familyName: string;
  gender: string;
  bornOn: string;
  email: string;
  phoneNumber: string;
  passportNumber: string;
  passportCountry: string;
  passportExpiry: string;
  loyaltyAirline: string;
  loyaltyNumber: string;
}

export function PassengerDetailsPage() {
  const [, navigate] = useLocation();
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [requiresPassport, setRequiresPassport] = useState(false);
  const [passengerForms, setPassengerForms] = useState<PassengerForm[]>([]);
  const [showPassportSection, setShowPassportSection] = useState<boolean[]>([]);
  const [showLoyaltySection, setShowLoyaltySection] = useState<boolean[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    console.log('🎫 === PASSENGER DETAILS PAGE LOADED ===');
    const item = sessionStorage.getItem('checkout_item');
    
    if (!item) {
      console.error('❌ No checkout_item found in sessionStorage');
      navigate('/');
      return;
    }

    try {
      console.log('🎫 Raw checkout_item from sessionStorage:', item);
      const parsed = JSON.parse(item);
      console.log('🎫 Parsed checkout data:');
      console.log('🎫 - Offer ID:', parsed.offer?.id);
      console.log('🎫 - Total Amount:', parsed.offer?.total_amount, parsed.offer?.total_currency);
      console.log('🎫 - Passengers:', parsed.offer?.passengers?.length || 0);
      console.log('🎫 - Selected Seats:', parsed.selectedSeats?.length || 0);
      console.log('🎫 - Selected Baggage:', parsed.selectedBaggage?.length || 0);
      console.log('🎫 Complete parsed data:', parsed);
      
      setCheckoutItem(parsed);
      
      const passportRequired = parsed.offer?.passenger_identity_documents_required || false;
      setRequiresPassport(passportRequired);

      const passengerCount = parsed.offer?.passengers?.length || 1;
      console.log('🎫 Creating forms for', passengerCount, 'passenger(s)');
      const initialForms = Array.from({ length: passengerCount }, () => ({
        title: '',
        givenName: '',
        familyName: '',
        gender: '',
        bornOn: '',
        email: '',
        phoneNumber: '',
        passportNumber: '',
        passportCountry: '',
        passportExpiry: '',
        loyaltyAirline: '',
        loyaltyNumber: '',
      }));
      
      setPassengerForms(initialForms);
      setShowPassportSection(Array(passengerCount).fill(passportRequired));
      setShowLoyaltySection(Array(passengerCount).fill(false));
    } catch (err) {
      console.error('Error parsing checkout item:', err);
      navigate('/');
    }
  }, [navigate]);

  const updatePassengerForm = (index: number, field: string, value: string) => {
    setPassengerForms(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    
    // Clear error for this field
    setErrors(prev => {
      const updated = { ...prev };
      delete updated[`${index}-${field}`];
      return updated;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    passengerForms.forEach((form, index) => {
      // Required fields
      if (!form.title) newErrors[`${index}-title`] = 'Title is required';
      if (!form.givenName) newErrors[`${index}-givenName`] = 'First name is required';
      if (!form.familyName) newErrors[`${index}-familyName`] = 'Last name is required';
      if (!form.gender) newErrors[`${index}-gender`] = 'Gender is required';
      if (!form.bornOn) newErrors[`${index}-bornOn`] = 'Date of birth is required';
      if (!form.email) {
        newErrors[`${index}-email`] = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        newErrors[`${index}-email`] = 'Invalid email format';
      }
      if (!form.phoneNumber) {
        newErrors[`${index}-phoneNumber`] = 'Phone number is required';
      } else if (!/^\+[1-9][0-9]{7,14}$/.test(form.phoneNumber)) {
        newErrors[`${index}-phoneNumber`] = 'Invalid phone format (use +1234567890)';
      }

      // Date validations
      if (form.bornOn && new Date(form.bornOn) >= new Date()) {
        newErrors[`${index}-bornOn`] = 'Date of birth must be in the past';
      }

      // Passport validation
      const passportFilled = form.passportNumber || form.passportCountry || form.passportExpiry;
      
      if (requiresPassport) {
        // International flight - passport required
        if (!form.passportNumber) newErrors[`${index}-passportNumber`] = 'Passport number is required';
        if (!form.passportCountry) newErrors[`${index}-passportCountry`] = 'Issuing country is required';
        if (!form.passportExpiry) {
          newErrors[`${index}-passportExpiry`] = 'Expiry date is required';
        } else if (new Date(form.passportExpiry) <= new Date()) {
          newErrors[`${index}-passportExpiry`] = 'Passport must not be expired';
        }
      } else if (passportFilled) {
        // Domestic flight but passport partially filled - all fields required
        if (!form.passportNumber) newErrors[`${index}-passportNumber`] = 'Complete all passport fields';
        if (!form.passportCountry) newErrors[`${index}-passportCountry`] = 'Complete all passport fields';
        if (!form.passportExpiry) {
          newErrors[`${index}-passportExpiry`] = 'Complete all passport fields';
        } else if (new Date(form.passportExpiry) <= new Date()) {
          newErrors[`${index}-passportExpiry`] = 'Passport must not be expired';
        }
      }

      // Loyalty validation (if one is filled, both required)
      if (form.loyaltyAirline && !form.loyaltyNumber) {
        newErrors[`${index}-loyaltyNumber`] = 'Membership number required';
      }
      if (form.loyaltyNumber && !form.loyaltyAirline) {
        newErrors[`${index}-loyaltyAirline`] = 'Airline code required';
      }
    });

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorKey);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);

    try {
      const passengers = passengerForms.map((form, index) => {
        const passenger: any = {
          id: checkoutItem.offer.passengers[index].id,
          title: form.title,
          givenName: form.givenName,
          familyName: form.familyName,
          gender: form.gender,
          bornOn: form.bornOn,
          email: form.email,
          phoneNumber: form.phoneNumber,
        };

        if (form.passportNumber && form.passportCountry && form.passportExpiry) {
          passenger.identityDocuments = [{
            uniqueIdentifier: form.passportNumber,
            type: 'passport',
            issuingCountryCode: form.passportCountry,
            expiresOn: form.passportExpiry,
          }];
        }

        if (form.loyaltyAirline && form.loyaltyNumber) {
          passenger.loyaltyProgrammeAccounts = [{
            airlineIataCode: form.loyaltyAirline,
            accountNumber: form.loyaltyNumber,
          }];
        }

        return passenger;
      });

      const services = [
        ...(checkoutItem.selectedSeats || []).map((s: any) => ({ 
          id: s.serviceId || s.id, 
          quantity: 1 
        })),
        ...(checkoutItem.selectedBaggage || []).map((b: any) => ({ 
          id: b.serviceId || b.id, 
          quantity: b.quantity 
        })),
      ];

      console.log('💳 Creating Stripe checkout session...');

      const response = await fetch(
        'https://jxrrlhsffnxzlszhccg.supabase.co/functions/v1/create-checkout-session',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            offerId: checkoutItem.offer.id,
            passengers,
            services,
            totalAmount: checkoutItem.offer.total_amount,
            currency: checkoutItem.offer.total_currency,
            offerData: checkoutItem.offer,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create checkout session');
      }

      console.log('✅ Checkout session created, redirecting to Stripe...');
      
      window.location.href = result.url;

    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      alert(`Payment initialization failed: ${error.message}`);
      setSubmitting(false);
    }
  };

  if (!checkoutItem) return null;

  const countries = [
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AL', name: 'Albania' },
    { code: 'DZ', name: 'Algeria' },
    { code: 'AD', name: 'Andorra' },
    { code: 'AO', name: 'Angola' },
    { code: 'AG', name: 'Antigua and Barbuda' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AM', name: 'Armenia' },
    { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' },
    { code: 'AZ', name: 'Azerbaijan' },
    { code: 'BS', name: 'Bahamas' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BB', name: 'Barbados' },
    { code: 'BY', name: 'Belarus' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BZ', name: 'Belize' },
    { code: 'BJ', name: 'Benin' },
    { code: 'BT', name: 'Bhutan' },
    { code: 'BO', name: 'Bolivia' },
    { code: 'BA', name: 'Bosnia and Herzegovina' },
    { code: 'BW', name: 'Botswana' },
    { code: 'BR', name: 'Brazil' },
    { code: 'BN', name: 'Brunei' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'BF', name: 'Burkina Faso' },
    { code: 'BI', name: 'Burundi' },
    { code: 'KH', name: 'Cambodia' },
    { code: 'CM', name: 'Cameroon' },
    { code: 'CA', name: 'Canada' },
    { code: 'CV', name: 'Cape Verde' },
    { code: 'CF', name: 'Central African Republic' },
    { code: 'TD', name: 'Chad' },
    { code: 'CL', name: 'Chile' },
    { code: 'CN', name: 'China' },
    { code: 'CO', name: 'Colombia' },
    { code: 'KM', name: 'Comoros' },
    { code: 'CG', name: 'Congo' },
    { code: 'CD', name: 'Congo (Democratic Republic)' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'HR', name: 'Croatia' },
    { code: 'CU', name: 'Cuba' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'DK', name: 'Denmark' },
    { code: 'DJ', name: 'Djibouti' },
    { code: 'DM', name: 'Dominica' },
    { code: 'DO', name: 'Dominican Republic' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'EG', name: 'Egypt' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'GQ', name: 'Equatorial Guinea' },
    { code: 'ER', name: 'Eritrea' },
    { code: 'EE', name: 'Estonia' },
    { code: 'SZ', name: 'Eswatini' },
    { code: 'ET', name: 'Ethiopia' },
    { code: 'FJ', name: 'Fiji' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' },
    { code: 'GA', name: 'Gabon' },
    { code: 'GM', name: 'Gambia' },
    { code: 'GE', name: 'Georgia' },
    { code: 'DE', name: 'Germany' },
    { code: 'GH', name: 'Ghana' },
    { code: 'GR', name: 'Greece' },
    { code: 'GD', name: 'Grenada' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'GN', name: 'Guinea' },
    { code: 'GW', name: 'Guinea-Bissau' },
    { code: 'GY', name: 'Guyana' },
    { code: 'HT', name: 'Haiti' },
    { code: 'HN', name: 'Honduras' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'HU', name: 'Hungary' },
    { code: 'IS', name: 'Iceland' },
    { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'IR', name: 'Iran' },
    { code: 'IQ', name: 'Iraq' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IL', name: 'Israel' },
    { code: 'IT', name: 'Italy' },
    { code: 'CI', name: 'Ivory Coast' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'JP', name: 'Japan' },
    { code: 'JO', name: 'Jordan' },
    { code: 'KZ', name: 'Kazakhstan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KI', name: 'Kiribati' },
    { code: 'XK', name: 'Kosovo' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'KG', name: 'Kyrgyzstan' },
    { code: 'LA', name: 'Laos' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LB', name: 'Lebanon' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'LR', name: 'Liberia' },
    { code: 'LY', name: 'Libya' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MO', name: 'Macao' },
    { code: 'MG', name: 'Madagascar' },
    { code: 'MW', name: 'Malawi' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MV', name: 'Maldives' },
    { code: 'ML', name: 'Mali' },
    { code: 'MT', name: 'Malta' },
    { code: 'MH', name: 'Marshall Islands' },
    { code: 'MR', name: 'Mauritania' },
    { code: 'MU', name: 'Mauritius' },
    { code: 'MX', name: 'Mexico' },
    { code: 'FM', name: 'Micronesia' },
    { code: 'MD', name: 'Moldova' },
    { code: 'MC', name: 'Monaco' },
    { code: 'MN', name: 'Mongolia' },
    { code: 'ME', name: 'Montenegro' },
    { code: 'MA', name: 'Morocco' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'MM', name: 'Myanmar' },
    { code: 'NA', name: 'Namibia' },
    { code: 'NR', name: 'Nauru' },
    { code: 'NP', name: 'Nepal' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'NE', name: 'Niger' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'KP', name: 'North Korea' },
    { code: 'MK', name: 'North Macedonia' },
    { code: 'NO', name: 'Norway' },
    { code: 'OM', name: 'Oman' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PW', name: 'Palau' },
    { code: 'PS', name: 'Palestine' },
    { code: 'PA', name: 'Panama' },
    { code: 'PG', name: 'Papua New Guinea' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'PE', name: 'Peru' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'PR', name: 'Puerto Rico' },
    { code: 'QA', name: 'Qatar' },
    { code: 'RO', name: 'Romania' },
    { code: 'RU', name: 'Russia' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'KN', name: 'Saint Kitts and Nevis' },
    { code: 'LC', name: 'Saint Lucia' },
    { code: 'VC', name: 'Saint Vincent and the Grenadines' },
    { code: 'WS', name: 'Samoa' },
    { code: 'SM', name: 'San Marino' },
    { code: 'ST', name: 'Sao Tome and Principe' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SN', name: 'Senegal' },
    { code: 'RS', name: 'Serbia' },
    { code: 'SC', name: 'Seychelles' },
    { code: 'SL', name: 'Sierra Leone' },
    { code: 'SG', name: 'Singapore' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'SB', name: 'Solomon Islands' },
    { code: 'SO', name: 'Somalia' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'KR', name: 'South Korea' },
    { code: 'SS', name: 'South Sudan' },
    { code: 'ES', name: 'Spain' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'SD', name: 'Sudan' },
    { code: 'SR', name: 'Suriname' },
    { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'SY', name: 'Syria' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TJ', name: 'Tajikistan' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TL', name: 'Timor-Leste' },
    { code: 'TG', name: 'Togo' },
    { code: 'TO', name: 'Tonga' },
    { code: 'TT', name: 'Trinidad and Tobago' },
    { code: 'TN', name: 'Tunisia' },
    { code: 'TR', name: 'Turkey' },
    { code: 'TM', name: 'Turkmenistan' },
    { code: 'TV', name: 'Tuvalu' },
    { code: 'UG', name: 'Uganda' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'UZ', name: 'Uzbekistan' },
    { code: 'VU', name: 'Vanuatu' },
    { code: 'VA', name: 'Vatican City' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'YE', name: 'Yemen' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'ZW', name: 'Zimbabwe' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Passenger Details</h1>

        {requiresPassport && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Plane className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-blue-900 font-medium">International Flight: Passport information is required for all passengers.</p>
            </div>
          </div>
        )}

        {passengerForms.map((form, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Passenger {index + 1} {index === 0 && '(Primary Contact)'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <select
                  id={`${index}-title`}
                  value={form.title}
                  onChange={(e) => updatePassengerForm(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  data-testid={`input-title-${index}`}
                >
                  <option value="">Select title</option>
                  <option value="mr">Mr</option>
                  <option value="ms">Ms</option>
                  <option value="mrs">Mrs</option>
                  <option value="miss">Miss</option>
                  <option value="dr">Dr</option>
                </select>
                {errors[`${index}-title`] && (
                  <p className="text-red-500 text-sm mt-1">{errors[`${index}-title`]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  id={`${index}-gender`}
                  value={form.gender}
                  onChange={(e) => updatePassengerForm(index, 'gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  data-testid={`input-gender-${index}`}
                >
                  <option value="">Select gender</option>
                  <option value="m">Male</option>
                  <option value="f">Female</option>
                </select>
                <p className="text-xs text-gray-500 mt-1 italic">
                  Gender selection is based on your travel document. Airlines currently only accept Male or Female in their booking systems.
                </p>
                {errors[`${index}-gender`] && (
                  <p className="text-red-500 text-sm mt-1">{errors[`${index}-gender`]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id={`${index}-givenName`}
                  value={form.givenName}
                  onChange={(e) => updatePassengerForm(index, 'givenName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  data-testid={`input-first-name-${index}`}
                />
                {errors[`${index}-givenName`] && (
                  <p className="text-red-500 text-sm mt-1">{errors[`${index}-givenName`]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id={`${index}-familyName`}
                  value={form.familyName}
                  onChange={(e) => updatePassengerForm(index, 'familyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  data-testid={`input-last-name-${index}`}
                />
                {errors[`${index}-familyName`] && (
                  <p className="text-red-500 text-sm mt-1">{errors[`${index}-familyName`]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id={`${index}-bornOn`}
                  value={form.bornOn}
                  onChange={(e) => updatePassengerForm(index, 'bornOn', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  data-testid={`input-dob-${index}`}
                />
                {errors[`${index}-bornOn`] && (
                  <p className="text-red-500 text-sm mt-1">{errors[`${index}-bornOn`]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id={`${index}-email`}
                  value={form.email}
                  onChange={(e) => updatePassengerForm(index, 'email', e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  data-testid={`input-email-${index}`}
                />
                {errors[`${index}-email`] && (
                  <p className="text-red-500 text-sm mt-1">{errors[`${index}-email`]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id={`${index}-phoneNumber`}
                  value={form.phoneNumber}
                  onChange={(e) => updatePassengerForm(index, 'phoneNumber', e.target.value)}
                  placeholder="+14155551234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  data-testid={`input-phone-${index}`}
                />
                {errors[`${index}-phoneNumber`] && (
                  <p className="text-red-500 text-sm mt-1">{errors[`${index}-phoneNumber`]}</p>
                )}
              </div>
            </div>

            {/* Passport Section */}
            <div className="border-t pt-4 mt-4">
              {requiresPassport ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Passport Information <span className="text-red-500">*</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Passport Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id={`${index}-passportNumber`}
                        value={form.passportNumber}
                        onChange={(e) => updatePassengerForm(index, 'passportNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        data-testid={`input-passport-number-${index}`}
                      />
                      {errors[`${index}-passportNumber`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`${index}-passportNumber`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Issuing Country <span className="text-red-500">*</span>
                      </label>
                      <select
                        id={`${index}-passportCountry`}
                        value={form.passportCountry}
                        onChange={(e) => updatePassengerForm(index, 'passportCountry', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        data-testid={`input-passport-country-${index}`}
                      >
                        <option value="">Select country</option>
                        {countries.map(c => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                      {errors[`${index}-passportCountry`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`${index}-passportCountry`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id={`${index}-passportExpiry`}
                        value={form.passportExpiry}
                        onChange={(e) => updatePassengerForm(index, 'passportExpiry', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        data-testid={`input-passport-expiry-${index}`}
                      />
                      {errors[`${index}-passportExpiry`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`${index}-passportExpiry`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setShowPassportSection(prev => {
                      const updated = [...prev];
                      updated[index] = !updated[index];
                      return updated;
                    })}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    data-testid={`button-toggle-passport-${index}`}
                  >
                    {showPassportSection[index] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Add Passport Information (Optional)
                  </button>

                  {showPassportSection[index] && (
                    <div className="mt-4">
                      <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2 mb-4">
                        If you enter passport info, all passport fields must be completed
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                          <input
                            type="text"
                            id={`${index}-passportNumber`}
                            value={form.passportNumber}
                            onChange={(e) => updatePassengerForm(index, 'passportNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            data-testid={`input-passport-number-${index}`}
                          />
                          {errors[`${index}-passportNumber`] && (
                            <p className="text-red-500 text-sm mt-1">{errors[`${index}-passportNumber`]}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Country</label>
                          <select
                            id={`${index}-passportCountry`}
                            value={form.passportCountry}
                            onChange={(e) => updatePassengerForm(index, 'passportCountry', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            data-testid={`input-passport-country-${index}`}
                          >
                            <option value="">Select country</option>
                            {countries.map(c => (
                              <option key={c.code} value={c.code}>{c.name}</option>
                            ))}
                          </select>
                          {errors[`${index}-passportCountry`] && (
                            <p className="text-red-500 text-sm mt-1">{errors[`${index}-passportCountry`]}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                          <input
                            type="date"
                            id={`${index}-passportExpiry`}
                            value={form.passportExpiry}
                            onChange={(e) => updatePassengerForm(index, 'passportExpiry', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            data-testid={`input-passport-expiry-${index}`}
                          />
                          {errors[`${index}-passportExpiry`] && (
                            <p className="text-red-500 text-sm mt-1">{errors[`${index}-passportExpiry`]}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Loyalty Section */}
            <div className="border-t pt-4 mt-4">
              <button
                onClick={() => setShowLoyaltySection(prev => {
                  const updated = [...prev];
                  updated[index] = !updated[index];
                  return updated;
                })}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                data-testid={`button-toggle-loyalty-${index}`}
              >
                {showLoyaltySection[index] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Add Frequent Flyer Program (Optional)
              </button>

              {showLoyaltySection[index] && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Airline Code</label>
                    <input
                      type="text"
                      id={`${index}-loyaltyAirline`}
                      value={form.loyaltyAirline}
                      onChange={(e) => updatePassengerForm(index, 'loyaltyAirline', e.target.value.toUpperCase())}
                      placeholder="e.g., BA, AA, DL"
                      maxLength={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      data-testid={`input-loyalty-airline-${index}`}
                    />
                    {errors[`${index}-loyaltyAirline`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`${index}-loyaltyAirline`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Membership Number</label>
                    <input
                      type="text"
                      id={`${index}-loyaltyNumber`}
                      value={form.loyaltyNumber}
                      onChange={(e) => updatePassengerForm(index, 'loyaltyNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      data-testid={`input-loyalty-number-${index}`}
                    />
                    {errors[`${index}-loyaltyNumber`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`${index}-loyaltyNumber`]}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Bottom Action Bar */}
        <div className="sticky bottom-0 bg-white border-t shadow-lg p-4 -mx-4 px-8 flex gap-3 items-center justify-between">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="border-2 border-gray-300"
            data-testid="button-back"
          >
            Back
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-semibold min-w-[200px]"
            data-testid="button-submit"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Proceed to Payment'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
