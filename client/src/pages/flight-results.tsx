// Replace the existing searchFlights function with this updated version
const searchFlights = async (e?: React.MouseEvent) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  console.log('=== FLIGHT SEARCH STARTING ===');
  console.log('Search params:', searchParams);

  setLoading(true);
  setError(null);
  setSelectedFlights({ outbound: null, return: null });
  setSelectedOffers({}); // Clear selected offers

  try {
    // Build the NEW request format that matches your backend
    let searchRequest;

    switch (searchParams.tripType) {
      case 'one-way':
        searchRequest = {
          tripType: 'one-way',
          slices: [{
            origin: searchParams.from,
            destination: searchParams.to,
            departureDate: searchParams.departDate
          }],
          passengers: {
            adults: searchParams.passengers
          },
          cabinClass: searchParams.cabinClass
        };
        break;

      case 'return':
        if (!searchParams.returnDate) {
          throw new Error('Return date is required for return trips');
        }
        searchRequest = {
          tripType: 'return',
          slices: [
            {
              origin: searchParams.from,
              destination: searchParams.to,
              departureDate: searchParams.departDate
            },
            {
              origin: searchParams.to, // Return origin = outbound destination
              destination: searchParams.from, // Return destination = outbound origin
              departureDate: searchParams.returnDate
            }
          ],
          passengers: {
            adults: searchParams.passengers
          },
          cabinClass: searchParams.cabinClass
        };
        break;

      case 'multi-city':
        if (!searchParams.multiCitySlices || searchParams.multiCitySlices.length < 2) {
          throw new Error('Multi-city trips require at least 2 slices');
        }
        searchRequest = {
          tripType: 'multi-city',
          slices: searchParams.multiCitySlices.map(slice => ({
            origin: slice.origin,
            destination: slice.destination,
            departureDate: slice.departureDate
          })),
          passengers: {
            adults: searchParams.passengers
          },
          cabinClass: searchParams.cabinClass
        };
        break;

      default:
        throw new Error('Invalid trip type selected');
    }

    console.log('[Flight Search] Request payload:', searchRequest);

    // Call Supabase Edge Function with correct format
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/flights-search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      },
      body: JSON.stringify(searchRequest)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Flight Search] Response:', data);

    if (!data.success) {
      throw new Error(data.error || 'Search failed');
    }

    if (!data.offers || data.offers.length === 0) {
      console.log('[Flight Search] No offers returned');
      setFlights({ outbound: [], inbound: [] });
      return;
    }

    // Convert backend response to frontend format
    const convertedOffers = data.offers.map(offer => ({
      id: offer.id,
      total_amount: offer.total_amount.toString(),
      total_currency: offer.total_currency,
      expires_at: offer.expires_at,
      slices: offer.slices.map(slice => ({
        id: `slice-${slice.slice_index}`,
        origin: { iata_code: slice.origin },
        destination: { iata_code: slice.destination },
        departure_datetime: slice.departure_time,
        arrival_datetime: slice.arrival_time,
        duration: slice.duration,
        segments: slice.segments.map(segment => ({
          id: `segment-${Math.random()}`,
          marketing_carrier: { 
            name: segment.airline,
            iata_code: segment.airline_code 
          },
          operating_carrier: { 
            name: segment.airline,
            iata_code: segment.airline_code 
          },
          flight_number: segment.flight_number,
          aircraft: { name: segment.aircraft },
          origin: { iata_code: segment.origin },
          destination: { iata_code: segment.destination },
          departing_at: segment.departing_at,
          arriving_at: segment.arriving_at,
          duration: segment.duration
        }))
      }))
    }));

    console.log(`[Flight Search] Converted ${convertedOffers.length} offers for display`);

    // Store the converted offers
    setFlights({ 
      outbound: convertedOffers,
      inbound: [] // Legacy structure, data is now in outbound
    });

  } catch (err) {
    console.error('Flight search error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    setError(`Flight search failed: ${errorMessage}`);
  } finally {
    setLoading(false);
  }
};
