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
    const item = sessionStorage.getItem('checkout_item');
    if (!item) {
      navigate('/');
      return;
    }

    try {
      const parsed = JSON.parse(item);
      setCheckoutItem(parsed);
      
      const passportRequired = parsed.offer?.passenger_identity_documents_required || false;
      setRequiresPassport(passportRequired);

      const passengerCount = parsed.offer?.passengers?.length || 1;
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
    if (!validateForm()) return;

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

      const bookingData = {
        offerId: checkoutItem.offer.id,
        passengers,
        services,
        totalAmount: checkoutItem.offer.total_amount,
        currency: checkoutItem.offer.total_currency,
      };

      console.log('📋 Booking data:', bookingData);

      const response = await fetch('https://jxrrlhsffnxzlszhccg.supabase.co/functions/v1/flights-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();
      console.log('✅ Booking response:', result);

      if (result.success) {
        sessionStorage.setItem('order_confirmation', JSON.stringify(result));
        sessionStorage.removeItem('checkout_item');
        navigate('/booking-confirmation');
      } else {
        alert(`Booking failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Booking error:', error);
      alert('An error occurred while booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!checkoutItem) return null;

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'JP', name: 'Japan' },
    { code: 'CN', name: 'China' },
    { code: 'IN', name: 'India' },
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
            onClick={() => navigate(-1)}
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
                Booking...
              </>
            ) : (
              'Complete Booking'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
