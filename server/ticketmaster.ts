import type { TicketmasterEvent } from "@shared/schema";

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const TICKETMASTER_BASE_URL = "https://app.ticketmaster.com/discovery/v2";

interface TicketmasterAPIEvent {
  id: string;
  name: string;
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
      dateTime?: string;
    };
  };
  images?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  priceRanges?: Array<{
    min: number;
    max: number;
    currency: string;
  }>;
  classifications?: Array<{
    segment?: { name: string };
    genre?: { name: string };
    subGenre?: { name: string };
  }>;
  info?: string;
  pleaseNote?: string;
  url: string;
  _embedded?: {
    venues?: Array<{
      name: string;
      city?: { name: string };
      country?: { countryCode: string };
      address?: { line1?: string };
      location?: { latitude?: string; longitude?: string };
    }>;
  };
}

interface TicketmasterAPIResponse {
  _embedded?: {
    events?: TicketmasterAPIEvent[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface TicketmasterFetchOptions {
  countryCode?: string;
  startDateTime?: string;
  endDateTime?: string;
  size?: number;
  page?: number;
  classificationName?: string;
  classificationId?: string;
  sort?: string;
}

/**
 * Fetch events from Ticketmaster Discovery API v2
 */
export async function fetchTicketmasterEvents(
  options: TicketmasterFetchOptions = {}
): Promise<{ events: TicketmasterEvent[]; totalEvents: number; totalPages: number }> {
  if (!TICKETMASTER_API_KEY) {
    console.error('❌ TICKETMASTER_API_KEY not found in environment variables');
    throw new Error('Ticketmaster API key not configured. Please add TICKETMASTER_API_KEY to your environment.');
  }

  // Build query parameters
  const params = new URLSearchParams({
    apikey: TICKETMASTER_API_KEY,
    size: (options.size || 20).toString(),
    sort: options.sort || 'date,asc'
  });

  if (options.countryCode) {
    params.append('countryCode', options.countryCode);
  }

  if (options.startDateTime) {
    params.append('startDateTime', options.startDateTime);
  }

  if (options.endDateTime) {
    params.append('endDateTime', options.endDateTime);
  }

  if (options.classificationName) {
    params.append('classificationName', options.classificationName);
  }

  if (options.classificationId) {
    params.append('classificationId', options.classificationId);
  }

  if (options.page !== undefined) {
    params.append('page', options.page.toString());
  }

  const url = `${TICKETMASTER_BASE_URL}/events.json?${params.toString()}`;

  console.log('🎫 Fetching Ticketmaster events...');
  console.log('📍 Country:', options.countryCode || 'ALL');
  console.log('📅 Date range:', options.startDateTime, 'to', options.endDateTime);
  console.log('🔗 URL:', url.replace(TICKETMASTER_API_KEY || '', 'API_KEY_HIDDEN'));

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Ticketmaster API error:', response.status, errorText);
      throw new Error(`Ticketmaster API returned ${response.status}: ${errorText}`);
    }

    const data: TicketmasterAPIResponse = await response.json();

    console.log('📦 Ticketmaster API response:', {
      eventsCount: data._embedded?.events?.length || 0,
      totalElements: data.page?.totalElements || 0,
      totalPages: data.page?.totalPages || 0,
      currentPage: data.page?.number || 0
    });

    // Transform API response to our schema
    const events: TicketmasterEvent[] = (data._embedded?.events || []).map(transformEvent);

    console.log('✅ Successfully fetched', events.length, 'events from Ticketmaster');

    return {
      events,
      totalEvents: data.page?.totalElements || 0,
      totalPages: data.page?.totalPages || 0
    };
  } catch (error: any) {
    console.error('❌ Error fetching from Ticketmaster:', error.message);
    throw error;
  }
}

/**
 * Transform Ticketmaster API event to our database schema
 */
function transformEvent(apiEvent: TicketmasterAPIEvent): TicketmasterEvent {
  const venue = apiEvent._embedded?.venues?.[0];
  const priceRange = apiEvent.priceRanges?.[0];
  const classification = apiEvent.classifications?.[0];

  // Parse date
  let eventDate: Date;
  if (apiEvent.dates?.start?.dateTime) {
    eventDate = new Date(apiEvent.dates.start.dateTime);
  } else if (apiEvent.dates?.start?.localDate) {
    const timeStr = apiEvent.dates.start.localTime || '19:00:00';
    eventDate = new Date(`${apiEvent.dates.start.localDate}T${timeStr}`);
  } else {
    eventDate = new Date();
  }

  return {
    id: apiEvent.id,
    name: apiEvent.name,
    event_start_date: eventDate,
    venue_name: venue?.name || 'TBA',
    venue_city: venue?.city?.name || 'TBA',
    venue_country_code: venue?.country?.countryCode || 'US',
    venue_address: venue?.address?.line1 || null,
    venue_latitude: venue?.location?.latitude || null,
    venue_longitude: venue?.location?.longitude || null,
    price_min: priceRange?.min?.toString() || null,
    price_max: priceRange?.max?.toString() || null,
    currency: priceRange?.currency || 'USD',
    segment: classification?.segment?.name || 'Other',
    genre: classification?.genre?.name || null,
    sub_genre: classification?.subGenre?.name || null,
    info: apiEvent.info || null,
    please_note: apiEvent.pleaseNote || null,
    images: apiEvent.images ? JSON.stringify(apiEvent.images) : null,
    url: apiEvent.url,
    is_major_event: false,
    filter_reason: null,
    created_at: new Date()
  };
}

/**
 * Fetch events from multiple regions
 */
export async function fetchTicketmasterEventsMultiRegion(
  regions: string[],
  options: Omit<TicketmasterFetchOptions, 'countryCode'> = {}
): Promise<TicketmasterEvent[]> {
  console.log('🌍 Fetching events from', regions.length, 'regions:', regions.join(', '));

  const results = await Promise.allSettled(
    regions.map(countryCode => 
      fetchTicketmasterEvents({ ...options, countryCode })
    )
  );

  const allEvents: TicketmasterEvent[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allEvents.push(...result.value.events);
      console.log(`✅ ${regions[index]}: ${result.value.events.length} events`);
    } else {
      console.error(`❌ ${regions[index]}: ${result.reason.message}`);
    }
  });

  console.log('📊 Total events from all regions:', allEvents.length);

  return allEvents;
}

/**
 * Ticketmaster Classification IDs
 */
const CLASSIFICATIONS = [
  { id: 'KZFzniwnSyZfZ7v7nJ', name: 'Music' },
  { id: 'KZFzniwnSyZfZ7v7nE', name: 'Sports' },
  { id: 'KZFzniwnSyZfZ7v7na', name: 'Arts & Theatre' },
  { id: 'KZFzniwnSyZfZ7v7n1', name: 'Family' }
];

/**
 * Helper to delay execution (for rate limiting)
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch events with classification IDs across multiple regions
 * Implements rate limiting to avoid Ticketmaster's 5 requests/second limit
 */
export async function fetchTicketmasterEventsWithClassifications(
  regions: string[],
  options: Omit<TicketmasterFetchOptions, 'countryCode' | 'classificationId'> = {}
): Promise<TicketmasterEvent[]> {
  console.log('🚀 Starting comprehensive event fetch...');
  console.log(`📍 Regions: ${regions.join(', ')}`);
  console.log(`📊 Classifications: ${CLASSIFICATIONS.map(c => c.name).join(', ')}`);
  
  const allEvents: TicketmasterEvent[] = [];
  const eventIds = new Set<string>(); // Track unique event IDs
  
  // Fetch sequentially to respect rate limits (5 requests/second max)
  // We'll do one request every 250ms to stay safe
  for (const region of regions) {
    for (const classification of CLASSIFICATIONS) {
      try {
        console.log(`🎯 Fetching ${classification.name} events for ${region}...`);
        
        const result = await fetchTicketmasterEvents({
          ...options,
          countryCode: region,
          classificationId: classification.id
        });
        
        // Only add unique events (avoid duplicates)
        let newEventsCount = 0;
        for (const event of result.events) {
          if (!eventIds.has(event.id)) {
            eventIds.add(event.id);
            allEvents.push(event);
            newEventsCount++;
          }
        }
        
        console.log(`✅ ${region} / ${classification.name}: ${result.events.length} events (${newEventsCount} new)`);
        
        // Rate limiting: wait 250ms between requests (4 requests/second)
        await delay(250);
      } catch (error: any) {
        console.error(`❌ ${region} / ${classification.name}: ${error.message}`);
        // Continue with other requests even if one fails
      }
    }
  }
  
  console.log(`\n🎉 TOTAL UNIQUE EVENTS FETCHED: ${allEvents.length}`);
  console.log(`📦 Breakdown by segment:`);
  
  // Log breakdown
  const segmentCounts: Record<string, number> = {};
  allEvents.forEach(event => {
    const segment = event.segment || 'Other';
    segmentCounts[segment] = (segmentCounts[segment] || 0) + 1;
  });
  
  Object.entries(segmentCounts).forEach(([segment, count]) => {
    console.log(`   - ${segment}: ${count} events`);
  });
  
  return allEvents;
}
