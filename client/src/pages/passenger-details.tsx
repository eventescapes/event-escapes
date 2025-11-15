import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Select from "react-select";
import { countries } from "@/lib/countries";
import ImprovedTripSummary from "@/components/ImprovedTripSummary";
import { supabase } from "@/lib/supabase";
// ========================================
// CONSTANTS - Must be defined before component
// ========================================
const DEFAULT_PHONE_COUNTRY_CODE = "";
const COUNTRIES = [
  { code: "+93", name: "Afghanistan", flag: "🇦🇫" },
  { code: "+355", name: "Albania", flag: "🇦🇱" },
  { code: "+213", name: "Algeria", flag: "🇩🇿" },
  { code: "+1-684", name: "American Samoa", flag: "🇦🇸" },
  { code: "+376", name: "Andorra", flag: "🇦🇩" },
  { code: "+244", name: "Angola", flag: "🇦🇴" },
  { code: "+1-264", name: "Anguilla", flag: "🇦🇮" },
  { code: "+672", name: "Antarctica", flag: "🇦🇶" },
  { code: "+1-268", name: "Antigua and Barbuda", flag: "🇦🇬" },
  { code: "+54", name: "Argentina", flag: "🇦🇷" },
  { code: "+374", name: "Armenia", flag: "🇦🇲" },
  { code: "+297", name: "Aruba", flag: "🇦🇼" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+43", name: "Austria", flag: "🇦🇹" },
  { code: "+994", name: "Azerbaijan", flag: "🇦🇿" },
  { code: "+1-242", name: "Bahamas", flag: "🇧🇸" },
  { code: "+973", name: "Bahrain", flag: "🇧🇭" },
  { code: "+880", name: "Bangladesh", flag: "🇧🇩" },
  { code: "+1-246", name: "Barbados", flag: "🇧🇧" },
  { code: "+375", name: "Belarus", flag: "🇧🇾" },
  { code: "+32", name: "Belgium", flag: "🇧🇪" },
  { code: "+501", name: "Belize", flag: "🇧🇿" },
  { code: "+229", name: "Benin", flag: "🇧🇯" },
  { code: "+1-441", name: "Bermuda", flag: "🇧🇲" },
  { code: "+975", name: "Bhutan", flag: "🇧🇹" },
  { code: "+591", name: "Bolivia", flag: "🇧🇴" },
  { code: "+387", name: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { code: "+267", name: "Botswana", flag: "🇧🇼" },
  { code: "+55", name: "Brazil", flag: "🇧🇷" },
  { code: "+246", name: "British Indian Ocean Territory", flag: "🇮🇴" },
  { code: "+1-284", name: "British Virgin Islands", flag: "🇻🇬" },
  { code: "+673", name: "Brunei", flag: "🇧🇳" },
  { code: "+359", name: "Bulgaria", flag: "🇧🇬" },
  { code: "+226", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "+257", name: "Burundi", flag: "🇧🇮" },
  { code: "+855", name: "Cambodia", flag: "🇰🇭" },
  { code: "+237", name: "Cameroon", flag: "🇨🇲" },
  { code: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "+238", name: "Cape Verde", flag: "🇨🇻" },
  { code: "+1-345", name: "Cayman Islands", flag: "🇰🇾" },
  { code: "+236", name: "Central African Republic", flag: "🇨🇫" },
  { code: "+235", name: "Chad", flag: "🇹🇩" },
  { code: "+56", name: "Chile", flag: "🇨🇱" },
  { code: "+86", name: "China", flag: "🇨🇳" },
  { code: "+61", name: "Christmas Island", flag: "🇨🇽" },
  { code: "+61", name: "Cocos Islands", flag: "🇨🇨" },
  { code: "+57", name: "Colombia", flag: "🇨🇴" },
  { code: "+269", name: "Comoros", flag: "🇰🇲" },
  { code: "+682", name: "Cook Islands", flag: "🇨🇰" },
  { code: "+506", name: "Costa Rica", flag: "🇨🇷" },
  { code: "+385", name: "Croatia", flag: "🇭🇷" },
  { code: "+53", name: "Cuba", flag: "🇨🇺" },
  { code: "+599", name: "Curacao", flag: "🇨🇼" },
  { code: "+357", name: "Cyprus", flag: "🇨🇾" },
  { code: "+420", name: "Czech Republic", flag: "🇨🇿" },
  { code: "+243", name: "Democratic Republic of the Congo", flag: "🇨🇩" },
  { code: "+45", name: "Denmark", flag: "🇩🇰" },
  { code: "+253", name: "Djibouti", flag: "🇩🇯" },
  { code: "+1-767", name: "Dominica", flag: "🇩🇲" },
  { code: "+1-809", name: "Dominican Republic", flag: "🇩🇴" },
  { code: "+670", name: "East Timor", flag: "🇹🇱" },
  { code: "+593", name: "Ecuador", flag: "🇪🇨" },
  { code: "+20", name: "Egypt", flag: "🇪🇬" },
  { code: "+503", name: "El Salvador", flag: "🇸🇻" },
  { code: "+240", name: "Equatorial Guinea", flag: "🇬🇶" },
  { code: "+291", name: "Eritrea", flag: "🇪🇷" },
  { code: "+372", name: "Estonia", flag: "🇪🇪" },
  { code: "+251", name: "Ethiopia", flag: "🇪🇹" },
  { code: "+500", name: "Falkland Islands", flag: "🇫🇰" },
  { code: "+298", name: "Faroe Islands", flag: "🇫🇴" },
  { code: "+679", name: "Fiji", flag: "🇫🇯" },
  { code: "+358", name: "Finland", flag: "🇫🇮" },
  { code: "+33", name: "France", flag: "🇫🇷" },
  { code: "+689", name: "French Polynesia", flag: "🇵🇫" },
  { code: "+241", name: "Gabon", flag: "🇬🇦" },
  { code: "+220", name: "Gambia", flag: "🇬🇲" },
  { code: "+995", name: "Georgia", flag: "🇬🇪" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "+233", name: "Ghana", flag: "🇬🇭" },
  { code: "+350", name: "Gibraltar", flag: "🇬🇮" },
  { code: "+30", name: "Greece", flag: "🇬🇷" },
  { code: "+299", name: "Greenland", flag: "🇬🇱" },
  { code: "+1-473", name: "Grenada", flag: "🇬🇩" },
  { code: "+1-671", name: "Guam", flag: "🇬🇺" },
  { code: "+502", name: "Guatemala", flag: "🇬🇹" },
  { code: "+44-1481", name: "Guernsey", flag: "🇬🇬" },
  { code: "+224", name: "Guinea", flag: "🇬🇳" },
  { code: "+245", name: "Guinea-Bissau", flag: "🇬🇼" },
  { code: "+592", name: "Guyana", flag: "🇬🇾" },
  { code: "+509", name: "Haiti", flag: "🇭🇹" },
  { code: "+504", name: "Honduras", flag: "🇭🇳" },
  { code: "+852", name: "Hong Kong", flag: "🇭🇰" },
  { code: "+36", name: "Hungary", flag: "🇭🇺" },
  { code: "+354", name: "Iceland", flag: "🇮🇸" },
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+62", name: "Indonesia", flag: "🇮🇩" },
  { code: "+98", name: "Iran", flag: "🇮🇷" },
  { code: "+964", name: "Iraq", flag: "🇮🇶" },
  { code: "+353", name: "Ireland", flag: "🇮🇪" },
  { code: "+44-1624", name: "Isle of Man", flag: "🇮🇲" },
  { code: "+972", name: "Israel", flag: "🇮🇱" },
  { code: "+39", name: "Italy", flag: "🇮🇹" },
  { code: "+225", name: "Ivory Coast", flag: "🇨🇮" },
  { code: "+1-876", name: "Jamaica", flag: "🇯🇲" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "+44-1534", name: "Jersey", flag: "🇯🇪" },
  { code: "+962", name: "Jordan", flag: "🇯🇴" },
  { code: "+7", name: "Kazakhstan", flag: "🇰🇿" },
  { code: "+254", name: "Kenya", flag: "🇰🇪" },
  { code: "+686", name: "Kiribati", flag: "🇰🇮" },
  { code: "+383", name: "Kosovo", flag: "🇽🇰" },
  { code: "+965", name: "Kuwait", flag: "🇰🇼" },
  { code: "+996", name: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "+856", name: "Laos", flag: "🇱🇦" },
  { code: "+371", name: "Latvia", flag: "🇱🇻" },
  { code: "+961", name: "Lebanon", flag: "🇱🇧" },
  { code: "+266", name: "Lesotho", flag: "🇱🇸" },
  { code: "+231", name: "Liberia", flag: "🇱🇷" },
  { code: "+218", name: "Libya", flag: "🇱🇾" },
  { code: "+423", name: "Liechtenstein", flag: "🇱🇮" },
  { code: "+370", name: "Lithuania", flag: "🇱🇹" },
  { code: "+352", name: "Luxembourg", flag: "🇱🇺" },
  { code: "+853", name: "Macau", flag: "🇲🇴" },
  { code: "+389", name: "Macedonia", flag: "🇲🇰" },
  { code: "+261", name: "Madagascar", flag: "🇲🇬" },
  { code: "+265", name: "Malawi", flag: "🇲🇼" },
  { code: "+60", name: "Malaysia", flag: "🇲🇾" },
  { code: "+960", name: "Maldives", flag: "🇲🇻" },
  { code: "+223", name: "Mali", flag: "🇲🇱" },
  { code: "+356", name: "Malta", flag: "🇲🇹" },
  { code: "+692", name: "Marshall Islands", flag: "🇲🇭" },
  { code: "+222", name: "Mauritania", flag: "🇲🇷" },
  { code: "+230", name: "Mauritius", flag: "🇲🇺" },
  { code: "+262", name: "Mayotte", flag: "🇾🇹" },
  { code: "+52", name: "Mexico", flag: "🇲🇽" },
  { code: "+691", name: "Micronesia", flag: "🇫🇲" },
  { code: "+373", name: "Moldova", flag: "🇲🇩" },
  { code: "+377", name: "Monaco", flag: "🇲🇨" },
  { code: "+976", name: "Mongolia", flag: "🇲🇳" },
  { code: "+382", name: "Montenegro", flag: "🇲🇪" },
  { code: "+1-664", name: "Montserrat", flag: "🇲🇸" },
  { code: "+212", name: "Morocco", flag: "🇲🇦" },
  { code: "+258", name: "Mozambique", flag: "🇲🇿" },
  { code: "+95", name: "Myanmar", flag: "🇲🇲" },
  { code: "+264", name: "Namibia", flag: "🇳🇦" },
  { code: "+674", name: "Nauru", flag: "🇳🇷" },
  { code: "+977", name: "Nepal", flag: "🇳🇵" },
  { code: "+31", name: "Netherlands", flag: "🇳🇱" },
  { code: "+599", name: "Netherlands Antilles", flag: "🇧🇶" },
  { code: "+687", name: "New Caledonia", flag: "🇳🇨" },
  { code: "+64", name: "New Zealand", flag: "🇳🇿" },
  { code: "+505", name: "Nicaragua", flag: "🇳🇮" },
  { code: "+227", name: "Niger", flag: "🇳🇪" },
  { code: "+234", name: "Nigeria", flag: "🇳🇬" },
  { code: "+683", name: "Niue", flag: "🇳🇺" },
  { code: "+850", name: "North Korea", flag: "🇰🇵" },
  { code: "+1-670", name: "Northern Mariana Islands", flag: "🇲🇵" },
  { code: "+47", name: "Norway", flag: "🇳🇴" },
  { code: "+968", name: "Oman", flag: "🇴🇲" },
  { code: "+92", name: "Pakistan", flag: "🇵🇰" },
  { code: "+680", name: "Palau", flag: "🇵🇼" },
  { code: "+970", name: "Palestine", flag: "🇵🇸" },
  { code: "+507", name: "Panama", flag: "🇵🇦" },
  { code: "+675", name: "Papua New Guinea", flag: "🇵🇬" },
  { code: "+595", name: "Paraguay", flag: "🇵🇾" },
  { code: "+51", name: "Peru", flag: "🇵🇪" },
  { code: "+63", name: "Philippines", flag: "🇵🇭" },
  { code: "+64", name: "Pitcairn", flag: "🇵🇳" },
  { code: "+48", name: "Poland", flag: "🇵🇱" },
  { code: "+351", name: "Portugal", flag: "🇵🇹" },
  { code: "+1-787", name: "Puerto Rico", flag: "🇵🇷" },
  { code: "+974", name: "Qatar", flag: "🇶🇦" },
  { code: "+242", name: "Republic of the Congo", flag: "🇨🇬" },
  { code: "+262", name: "Reunion", flag: "🇷🇪" },
  { code: "+40", name: "Romania", flag: "🇷🇴" },
  { code: "+7", name: "Russia", flag: "🇷🇺" },
  { code: "+250", name: "Rwanda", flag: "🇷🇼" },
  { code: "+590", name: "Saint Barthelemy", flag: "🇧🇱" },
  { code: "+290", name: "Saint Helena", flag: "🇸🇭" },
  { code: "+1-869", name: "Saint Kitts and Nevis", flag: "🇰🇳" },
  { code: "+1-758", name: "Saint Lucia", flag: "🇱🇨" },
  { code: "+590", name: "Saint Martin", flag: "🇲🇫" },
  { code: "+508", name: "Saint Pierre and Miquelon", flag: "🇵🇲" },
  { code: "+1-784", name: "Saint Vincent and the Grenadines", flag: "🇻🇨" },
  { code: "+685", name: "Samoa", flag: "🇼🇸" },
  { code: "+378", name: "San Marino", flag: "🇸🇲" },
  { code: "+239", name: "Sao Tome and Principe", flag: "🇸🇹" },
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+221", name: "Senegal", flag: "🇸🇳" },
  { code: "+381", name: "Serbia", flag: "🇷🇸" },
  { code: "+248", name: "Seychelles", flag: "🇸🇨" },
  { code: "+232", name: "Sierra Leone", flag: "🇸🇱" },
  { code: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "+1-721", name: "Sint Maarten", flag: "🇸🇽" },
  { code: "+421", name: "Slovakia", flag: "🇸🇰" },
  { code: "+386", name: "Slovenia", flag: "🇸🇮" },
  { code: "+677", name: "Solomon Islands", flag: "🇸🇧" },
  { code: "+252", name: "Somalia", flag: "🇸🇴" },
  { code: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "+82", name: "South Korea", flag: "🇰🇷" },
  { code: "+211", name: "South Sudan", flag: "🇸🇸" },
  { code: "+34", name: "Spain", flag: "🇪🇸" },
  { code: "+94", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "+249", name: "Sudan", flag: "🇸🇩" },
  { code: "+597", name: "Suriname", flag: "🇸🇷" },
  { code: "+47", name: "Svalbard and Jan Mayen", flag: "🇸🇯" },
  { code: "+268", name: "Swaziland", flag: "🇸🇿" },
  { code: "+46", name: "Sweden", flag: "🇸🇪" },
  { code: "+41", name: "Switzerland", flag: "🇨🇭" },
  { code: "+963", name: "Syria", flag: "🇸🇾" },
  { code: "+886", name: "Taiwan", flag: "🇹🇼" },
  { code: "+992", name: "Tajikistan", flag: "🇹🇯" },
  { code: "+255", name: "Tanzania", flag: "🇹🇿" },
  { code: "+66", name: "Thailand", flag: "🇹🇭" },
  { code: "+228", name: "Togo", flag: "🇹🇬" },
  { code: "+690", name: "Tokelau", flag: "🇹🇰" },
  { code: "+676", name: "Tonga", flag: "🇹🇴" },
  { code: "+1-868", name: "Trinidad and Tobago", flag: "🇹🇹" },
  { code: "+216", name: "Tunisia", flag: "🇹🇳" },
  { code: "+90", name: "Turkey", flag: "🇹🇷" },
  { code: "+993", name: "Turkmenistan", flag: "🇹🇲" },
  { code: "+1-649", name: "Turks and Caicos Islands", flag: "🇹🇨" },
  { code: "+688", name: "Tuvalu", flag: "🇹🇻" },
  { code: "+1-340", name: "U.S. Virgin Islands", flag: "🇻🇮" },
  { code: "+256", name: "Uganda", flag: "🇺🇬" },
  { code: "+380", name: "Ukraine", flag: "🇺🇦" },
  { code: "+971", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+598", name: "Uruguay", flag: "🇺🇾" },
  { code: "+998", name: "Uzbekistan", flag: "🇺🇿" },
  { code: "+678", name: "Vanuatu", flag: "🇻🇺" },
  { code: "+379", name: "Vatican", flag: "🇻🇦" },
  { code: "+58", name: "Venezuela", flag: "🇻🇪" },
  { code: "+84", name: "Vietnam", flag: "🇻🇳" },
  { code: "+681", name: "Wallis and Futuna", flag: "🇼🇫" },
  { code: "+212", name: "Western Sahara", flag: "🇪🇭" },
  { code: "+967", name: "Yemen", flag: "🇾🇪" },
  { code: "+260", name: "Zambia", flag: "🇿🇲" },
  { code: "+263", name: "Zimbabwe", flag: "🇿🇼" },
].sort((a, b) => a.name.localeCompare(b.name));

// ========================================
// COMPONENT STARTS HERE
// ========================================

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
  const [loading, setLoading] = useState(true);
  const [showSpecialRequests, setShowSpecialRequests] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [storedOffer, setStoredOffer] = useState<any | null>(null);
  const [flightTotalAmount, setFlightTotalAmount] = useState<number>(0);
  const [flightCurrency, setFlightCurrency] = useState<string>('AUD');
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>(DEFAULT_PHONE_COUNTRY_CODE);
  const [phoneLocal, setPhoneLocal] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<boolean>(false);

  // Show all countries in dropdown (search removed)
  const filteredCountries = COUNTRIES;

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
      const seatDetailsData = localStorage.getItem('selected_seat_details');
      const seatsData = localStorage.getItem('selected_seats');
      const baggageData = localStorage.getItem('selected_baggage');
      const seatsTotalData = localStorage.getItem('seats_total');
      const baggageTotalData = localStorage.getItem('baggage_total');
      
      console.log('LocalStorage contents:');
      console.log('- selected_outbound:', outboundData ? 'EXISTS' : 'MISSING');
      console.log('- selected_return:', returnData ? 'EXISTS' : 'MISSING');
      console.log('- selected_seat_details:', seatDetailsData ? 'EXISTS' : 'MISSING');
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
      
      if (seatDetailsData) {
        setSelectedSeats(JSON.parse(seatDetailsData));
      } else if (seatsData) {
        const parsedSeats = JSON.parse(seatsData);
        setSelectedSeats(parsedSeats);
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const offerData = sessionStorage.getItem('flightOfferData');
      if (offerData) {
        try {
          const parsed = JSON.parse(offerData);
          setStoredOffer(parsed);
          console.log('💰 Stored offer loaded for passenger details:', parsed);
        } catch (error) {
          console.error('⚠️ Failed to parse stored offer data:', error);
        }
      }
    }
  }, []);

  useEffect(() => {
    let total: number | null = null;
    let currency = flightCurrency;

    if (storedOffer?.total_amount) {
      const parsedTotal = parseFloat(storedOffer.total_amount);
      if (!Number.isNaN(parsedTotal)) {
        total = parsedTotal;
        currency = storedOffer.total_currency || currency;
      }
    }

    if (total === null) {
      if (outbound) {
        const outboundAmount = parseFloat(outbound.total_amount || outbound.price?.toString() || '0');
        const returnAmount = returnFlight ? parseFloat(returnFlight.total_amount || returnFlight.price?.toString() || '0') : 0;
        total = outboundAmount + returnAmount;
        currency = outbound.total_currency || outbound.currency || returnFlight?.total_currency || returnFlight?.currency || currency;
      } else {
        total = 0;
      }
    }

    const safeTotal = total ?? 0;
    setFlightTotalAmount(safeTotal);
    setFlightCurrency(currency || 'AUD');

  }, [storedOffer, outbound, returnFlight]);

  useEffect(() => {
    if (passengersData.length === 0) return;

    const primaryPassenger = passengersData[0];
    const initialCode = primaryPassenger.country_code || DEFAULT_PHONE_COUNTRY_CODE;

    const derivedLocal =
      primaryPassenger.phone_number ||
      (primaryPassenger.phone_number_full && primaryPassenger.phone_number_full.startsWith(initialCode)
        ? primaryPassenger.phone_number_full.slice(initialCode.length)
        : primaryPassenger.phone_number_full || '');

    setPhoneCountryCode(initialCode);
    setPhoneLocal(derivedLocal);

    const digitsOnly = derivedLocal.replace(/[^\d]/g, '');
    const normalizedLocal = digitsOnly.startsWith('0') ? digitsOnly.substring(1) : digitsOnly;
    const combined = `${initialCode}${normalizedLocal}`;

    setPassengersData((prev) => {
      if (prev.length === 0) return prev;
      const current = prev[0];
      if (
        current.country_code === initialCode &&
        current.phone_number === derivedLocal &&
        current.phone_number_full === combined
      ) {
        return prev;
      }

      const updated = [...prev];
      updated[0] = {
        ...current,
        country_code: initialCode,
        phone_number: derivedLocal,
        phone_number_full: combined,
      };
      return updated;
    });
  }, [passengersData]);

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
        if (!passenger.country_code || passenger.country_code.trim() === '') {
          newErrors[`passenger_${index}_country_code`] = 'Country/territory code required';
        }

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
    console.log('🟢 ========== HANDLE CONTINUE STARTED ==========');

    const selectedOffer = storedOffer || outbound;

    if (!selectedOffer || !selectedOffer.id) {
      alert('Flight offer data missing. Please restart your booking.');
      return;
    }

    if (!phoneCountryCode || phoneCountryCode.trim() === '') {
      const message = 'Please select a country/territory code for Passenger 1.';
      setCheckoutError(message);
      alert(message);
      console.warn('🔴 Phone validation failed: missing country code');
      return;
    }

    if (!phoneLocal || phoneLocal.trim() === '') {
      const message = 'Please enter a phone number for Passenger 1.';
      setCheckoutError(message);
      alert(message);
      console.warn('🔴 Phone validation failed: missing local number');
      return;
    }

    const sanitizedLocalNumber = phoneLocal.replace(/[^\d]/g, '');
    if (sanitizedLocalNumber.length < 8) {
      const message = 'Please enter a valid phone number (at least 8 digits).';
      setCheckoutError(message);
      alert(message);
      console.warn('🔴 Phone validation failed:', {
        phoneCountryCode,
        phoneLocal,
        sanitizedLocalNumber,
        sanitizedLength: sanitizedLocalNumber.length,
      });
      return;
    }

    const fullPhoneNumber = combinePhoneNumber(phoneCountryCode, phoneLocal);

    try {
      setCheckoutError(null);
      setIsCheckoutLoading(true);

      const primaryEmail = passengersData?.[0]?.email?.trim() || '';

      console.log('🟢 STEP 1: Initial Values', {
        phoneCountryCode,
        phoneLocal,
        passengersCount: passengersData?.length || 0,
        primaryEmail,
        fullPhoneNumber,
      });

      console.log('🟢 STEP 2: Phone After Combine', {
        input_country: phoneCountryCode,
        input_local: phoneLocal,
        output: fullPhoneNumber,
        length: fullPhoneNumber.length,
        hasPlus: fullPhoneNumber.startsWith('+'),
        onlyDigitsAfterPlus: /^\+\d+$/.test(fullPhoneNumber),
      });

      // Read seats and baggage from localStorage
      let seatsData: any[] = [];
      let baggageData: any[] = [];

      try {
        const storedSeatServices = localStorage.getItem('selected_seat_services');
        if (storedSeatServices) {
          const parsed = JSON.parse(storedSeatServices);
          if (Array.isArray(parsed)) {
            seatsData = parsed;
          } else if (parsed && typeof parsed === 'object') {
            seatsData = Object.values(parsed);
          }
        } else {
          const storedSeats = localStorage.getItem('selected_seats');
          if (storedSeats) {
            const parsedSeats = JSON.parse(storedSeats);
            if (Array.isArray(parsedSeats)) {
              seatsData = parsedSeats;
            } else if (parsedSeats && typeof parsedSeats === 'object') {
              seatsData = Object.values(parsedSeats).flatMap((flightSeats: any) =>
                Object.values(flightSeats || {})
              ).map((seat: any) => ({
                id: seat.serviceId,
                type: 'seat',
                amount: parseFloat(seat.price || seat.amount || seat.total_amount || 0) || 0,
                quantity: 1,
                passenger_id: seat.passengerId || seat.passenger_id || null,
              }));
            }
          }
        }
      } catch (e) {
        console.warn('Failed to parse seats:', e);
        seatsData = [];
      }

      try {
        const storedBaggage = localStorage.getItem('selected_baggage');
        if (storedBaggage) {
          const parsed = JSON.parse(storedBaggage);
          baggageData = Array.isArray(parsed) ? parsed : [];
        }
      } catch (e) {
        console.warn('Failed to parse baggage');
      }

      const allServices = [...seatsData, ...baggageData];

      if (!primaryEmail) {
        setCheckoutError('Primary passenger must include an email address before continuing.');
        setIsCheckoutLoading(false);
        console.warn('🔴 Missing primary email.');
        return;
      }

      console.log('✅ Primary contact info:', {
        email: primaryEmail,
        phone: fullPhoneNumber,
        phoneFull: fullPhoneNumber,
      });
      console.log('📞 Combined phone number:', fullPhoneNumber);

      const passengersForCheckout = (passengersData || []).map((passenger, index) => {
        const prepared = {
          ...passenger,
          email: index === 0 ? (passenger.email?.trim() || primaryEmail) : primaryEmail,
          country_code: phoneCountryCode,
          phone_number: fullPhoneNumber,
          phone_number_full: fullPhoneNumber,
        };

        console.log(`🟢 STEP 3.${index}: Passenger ${index + 1} prepared`, {
          name: prepared.given_name,
          email: prepared.email,
          phone: prepared.phone_number_full || prepared.phone_number,
          has_all_fields: !!(
            prepared.given_name &&
            prepared.family_name &&
            prepared.born_on
          ),
        });

        return prepared;
      });

      const passengerPhoneErrors: string[] = [];
      passengersForCheckout.forEach((passenger, index) => {
        const code = passenger.country_code || '';
        const fullPhone = passenger.phone_number_full || passenger.phone_number || '';
        if (!code) {
          passengerPhoneErrors.push(`Passenger ${index + 1}: Please select country/territory code`);
        }
        if (!fullPhone) {
          passengerPhoneErrors.push(`Passenger ${index + 1}: Please enter phone number`);
        } else if (!/^\+\d{10,15}$/.test(fullPhone)) {
          passengerPhoneErrors.push(`Passenger ${index + 1}: Invalid phone number format`);
        }
      });

      if (passengerPhoneErrors.length > 0) {
        const message = 'Please fix the following phone details:\n\n' + passengerPhoneErrors.join('\n');
        alert(message);
        setCheckoutError(message);
        setIsCheckoutLoading(false);
        console.warn('🔴 Phone validation errors:', passengerPhoneErrors);
        return;
      }

      console.log('🟢 STEP 4: All Passengers Ready', {
        count: passengersForCheckout.length,
        phones: passengersForCheckout.map((p) => p.phone_number_full || p.phone_number),
        allSamePhone: passengersForCheckout.every(
          (p) => (p.phone_number_full || p.phone_number) === fullPhoneNumber
        ),
      });

      console.log('📋 Passengers payload:', passengersForCheckout);
      console.log('✅ All have email?', passengersForCheckout.every((p) => !!p.email));
      console.log('✅ All have phone?', passengersForCheckout.every((p) => !!p.phone_number));
      console.log(
        '📞 All passengers with phone:',
        passengersForCheckout.map((p: any) => ({
          name: `${p.given_name || ''} ${p.family_name || ''}`.trim(),
          phone: p.phone_number_full || p.phone_number,
        }))
      );

      const roundedTotalAmount = parseFloat(grandTotal.toFixed(2));
      console.log('💰 Amount Precision Fix:', {
        original: grandTotal,
        rounded: roundedTotalAmount,
        difference: grandTotal - roundedTotalAmount,
        matchesWebhook: roundedTotalAmount === parseFloat(grandTotal.toFixed(2))
      });

      console.log('🟢 STEP 5: Checkout Data', {
        offerId: selectedOffer.id,
        passengerCount: passengersForCheckout.length,
        servicesCount: allServices.length,
        totalAmount: roundedTotalAmount,
        currency: 'AUD',
        appBaseUrl: window?.location?.origin || 'http://localhost:3000',
      });

      console.log('🚀 CHECKOUT DATA:');
      console.log('Offer ID:', selectedOffer?.id);
      console.log('Passengers:', passengersData?.length);
      console.log('Services:', allServices);
      console.log('Total Amount:', grandTotal);
      console.log('Passengers payload:', passengersForCheckout);

      console.log('🟢 STEP 6: Calling API...');

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          offerId: selectedOffer.id,
          passengers: passengersForCheckout,
          services: allServices,
          totalAmount: roundedTotalAmount,
          currency: 'AUD',
          appBaseUrl: window?.location?.origin || 'http://localhost:3000'
        }
      });

      console.log('🟢 STEP 7: API Response', {
        error,
        hasData: !!data,
      });

      if (error) {
        console.error('API Error:', error);
        throw error;
      }

      console.log('✅ Success, redirecting to:', data?.url);

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error: any) {
      console.error('💥 Checkout failed:', error);
      setCheckoutError(error.message || 'Failed to create checkout. Please try again.');
    } finally {
      setIsCheckoutLoading(false);
      console.log('🟢 ========== HANDLE CONTINUE ENDED ==========');
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

  const combinePhoneNumber = (countryCode: string, localNumber: string): string => {
    console.log('📞 ========== COMBINE PHONE START ==========');
    console.log('📞 INPUT:', { countryCode, localNumber });

    const cleaned = localNumber.replace(/[^\d]/g, '');
    console.log('📞 After removing non-digits:', cleaned);

    const withoutLeadingZero = cleaned.startsWith('0') ? cleaned.substring(1) : cleaned;
    console.log('📞 After removing leading 0:', withoutLeadingZero);

    const result = `${countryCode}${withoutLeadingZero}`;
    console.log('📞 FINAL RESULT:', result);
    console.log('📞 Result analysis:', {
      length: result.length,
      startsWithPlus: result.startsWith('+'),
      hasOnlyValidChars: /^[+\d]+$/.test(result),
      hasSpaces: result.includes(' '),
      hasDashes: result.includes('-'),
      hasLetters: /[a-zA-Z]/.test(result),
    });
    console.log('📞 ========== COMBINE PHONE END ==========');

    return result;
  };

  const primaryEmail = passengersData[0]?.email || '';
  const primaryPhone =
    passengersData[0]?.phone_number_full ||
    passengersData[0]?.phone_number ||
    '';

  const isFormComplete =
    passengersData.length > 0 &&
    passengersData.every((passenger, index) => {
      const email = passenger.email || primaryEmail;
      const phone = passenger.phone_number_full || passenger.phone_number || primaryPhone;

      return (
        Boolean(passenger.title) &&
        Boolean(passenger.given_name) &&
        Boolean(passenger.family_name) &&
        Boolean(passenger.gender) &&
        Boolean(passenger.born_on) &&
        Boolean(email) &&
        Boolean(phone)
      );
    });

  if (loading && !isCheckoutLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12">
          <div className="text-6xl mb-4 animate-bounce">✈️</div>
          <div className="text-2xl font-semibold mb-2">Preparing your secure checkout...</div>
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

        {checkoutError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{checkoutError}</p>
          </div>
        )}

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
                      
                      <div data-error={`passenger_${passengerIndex}_phone_number_full`}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country/Territory Code <span className="text-red-500">*</span>
                        </label>

                        <select
                          value={phoneCountryCode}
                          onChange={(e) => {
                            const newCode = e.target.value;
                            setPhoneCountryCode(newCode);

                            handlePassengerInput(passengerIndex, 'country_code', newCode);
                            handlePassengerInput(passengerIndex, 'phone_number', phoneLocal);
                            handlePassengerInput(
                              passengerIndex,
                              'phone_number_full',
                              combinePhoneNumber(newCode, phoneLocal)
                            );
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                          required
                        >
                          <option value="" disabled>Select country code</option>
                          {filteredCountries.map((country) => (
                            <option key={`${country.code}-${country.name}`} value={country.code}>
                              {country.flag} {country.name} {country.code}
                            </option>
                          ))}
                        </select>

                        <p className="text-xs text-gray-500 mt-1">
                          240 of 240 countries
                        </p>

                        {errors[`passenger_${passengerIndex}_country_code`] && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors[`passenger_${passengerIndex}_country_code`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                          <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium min-w-[110px] flex items-center justify-center">
                            {phoneCountryCode || 'Select code'}
                          </div>
                          <input
                            type="tel"
                            value={phoneLocal}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/[^\d\s-]/g, '');
                              setPhoneLocal(cleaned);
                              handlePassengerInput(passengerIndex, 'phone_number', cleaned);
                              handlePassengerInput(
                                passengerIndex,
                                'phone_number_full',
                                combinePhoneNumber(phoneCountryCode, cleaned)
                              );
                            }}
                            placeholder="412 345 678"
                            className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white ${
                              errors[`passenger_${passengerIndex}_phone_number_full`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            required
                            minLength={8}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Enter phone number without country code (e.g., 412 345 678)
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
                {passengerIndex > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      📞 Contact phone will be copied from Passenger 1
                    </p>
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
                const totalAmountNumber = flightTotalAmount > 0
                  ? flightTotalAmount
                  : parseFloat(outbound.total_amount || outbound.price?.toString() || '0') +
                    (returnFlight ? parseFloat(returnFlight.total_amount || returnFlight.price?.toString() || '0') : 0);

                const currency = flightCurrency || outbound.total_currency || outbound.currency || 'AUD';

                const seatsArray = Object.values(selectedSeats)
                  .flatMap((flightSeats: any) => Object.values(flightSeats))
                  .filter(Boolean);

                const baggageArray = selectedBaggage || [];

                const normalizedSlices = (storedOffer?.slices || []).map((slice: any, idx: number) => {
                  const relatedFlight = idx === 0 ? outbound : returnFlight;
                  return {
                    id: slice.id || relatedFlight?.sliceId || `slice_${idx}`,
                    origin: { iata_code: slice.origin?.iata_code || slice.origin?.city_name || relatedFlight?.origin || (idx === 0 ? outbound?.origin : returnFlight?.origin) || 'Origin' },
                    destination: { iata_code: slice.destination?.iata_code || slice.destination?.city_name || relatedFlight?.destination || (idx === 0 ? outbound?.destination : returnFlight?.destination) || 'Destination' },
                    departure_time: slice.departure_time || relatedFlight?.departure_datetime,
                    arrival_time: slice.arrival_time || relatedFlight?.arrival_datetime,
                    duration: slice.duration || relatedFlight?.duration
                  };
                });

                if (normalizedSlices.length === 0 && outbound) {
                  normalizedSlices.push({
                    id: outbound.sliceId || 'outbound',
                    origin: { iata_code: outbound.origin },
                    destination: { iata_code: outbound.destination },
                    departure_time: outbound.departure_datetime,
                    arrival_time: outbound.arrival_datetime,
                    duration: outbound.duration
                  });
                  if (returnFlight) {
                    normalizedSlices.push({
                      id: returnFlight.sliceId || 'return',
                      origin: { iata_code: returnFlight.origin },
                      destination: { iata_code: returnFlight.destination },
                      departure_time: returnFlight.departure_datetime,
                      arrival_time: returnFlight.arrival_datetime,
                      duration: returnFlight.duration
                    });
                  }
                }

                const passengerSummaryData = passengersData.length > 0
                  ? passengersData.map(p => ({
                      id: p.id,
                      type: p.type as 'adult' | 'child' | 'infant_without_seat' | 'infant_with_seat'
                    }))
                  : (outbound.passengers || []).map(p => ({
                      id: p.id,
                      type: p.type as 'adult' | 'child' | 'infant_without_seat' | 'infant_with_seat'
                    }));

                const totalAmountString = totalAmountNumber.toFixed(2);
                const baseAmounts: number[] = [];
                const taxAmounts: number[] = [];

                if (storedOffer?.base_amount) baseAmounts.push(parseFloat(storedOffer.base_amount));
                if (outbound.base_amount) baseAmounts.push(parseFloat(outbound.base_amount));
                if (returnFlight?.base_amount) baseAmounts.push(parseFloat(returnFlight.base_amount));

                if (storedOffer?.tax_amount) taxAmounts.push(parseFloat(storedOffer.tax_amount));
                if (outbound.tax_amount) taxAmounts.push(parseFloat(outbound.tax_amount));
                if (returnFlight?.tax_amount) taxAmounts.push(parseFloat(returnFlight.tax_amount));

                const baseAmountNumber = baseAmounts.length
                  ? baseAmounts.reduce((sum, value) => sum + value, 0)
                  : null;
                const taxAmountNumber = taxAmounts.length
                  ? taxAmounts.reduce((sum, value) => sum + value, 0)
                  : null;

                const offer = {
                  id: storedOffer?.id || outbound.id || outbound.offerId || '',
                  total_amount: totalAmountNumber.toFixed(2),
                  total_currency: currency,
                  base_amount: baseAmountNumber !== null ? baseAmountNumber.toFixed(2) : '',
                  tax_amount: taxAmountNumber !== null ? taxAmountNumber.toFixed(2) : '',
                  passengers: passengerSummaryData,
                  slices: normalizedSlices
                };

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
                <button
                  onClick={handleContinue}
                  disabled={!isFormComplete || loading || isCheckoutLoading}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    !isFormComplete || loading || isCheckoutLoading
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}
                >
                  {isCheckoutLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Continue to Payment'
                  )}
                </button>

                {isCheckoutLoading ? (
                  <p className="text-xs text-center text-gray-500 mt-3">
                    🔒 Redirecting to Stripe Checkout...
                  </p>
                ) : (
                  <p className="text-xs text-center text-gray-500 mt-3">
                    All passenger details must be completed before payment
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

