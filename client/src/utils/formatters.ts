// Format ISO time to HH:MM format
export function fmtTime(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (e) {
    return '00:00';
  }
}

// Format ISO duration (PT14H35M) to "14h 35m"
export function fmtIsoDur(duration: string): string {
  if (!duration) return '';
  
  // Parse ISO 8601 duration like PT14H35M
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return duration;
  
  const hours = match[1] || '0';
  const minutes = match[2] || '0';
  
  if (hours === '0' && minutes === '0') return '';
  if (hours === '0') return `${minutes}m`;
  if (minutes === '0') return `${hours}h`;
  
  return `${hours}h ${minutes}m`;
}

// Calculate total journey duration from segments
export function journeyDuration(segments: any[]): string {
  if (!segments || segments.length === 0) return '';
  
  try {
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    
    const start = new Date(firstSegment.departing_at);
    const end = new Date(lastSegment.arriving_at);
    
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  } catch (e) {
    return '';
  }
}

// Get stops label
export function stopsLabel(stops: number): string {
  if (stops === 0) return 'Direct';
  if (stops === 1) return '1 stop';
  return `${stops} stops`;
}

// Check if arrival is next day
export function plusOneDayFlag(departureIso: string, arrivalIso: string): boolean {
  try {
    const depDate = new Date(departureIso);
    const arrDate = new Date(arrivalIso);
    
    return arrDate.getDate() !== depDate.getDate() || 
           arrDate.getMonth() !== depDate.getMonth() || 
           arrDate.getFullYear() !== depDate.getFullYear();
  } catch (e) {
    return false;
  }
}

// Get airline name from owner or segment
export function getAirlineName(offer: any): string {
  return offer?.owner?.name || 
         offer?.slices?.[0]?.segments?.[0]?.marketing_carrier?.name || 
         'Unknown Airline';
}

// Get airline code
export function getAirlineCode(offer: any): string {
  return offer?.owner?.iata_code || 
         offer?.slices?.[0]?.segments?.[0]?.marketing_carrier?.iata_code || 
         '';
}

// Format cabin class
export function formatCabin(cabin?: string): string {
  if (!cabin) return '';
  return cabin.charAt(0).toUpperCase() + cabin.slice(1).toLowerCase();
}

// Get baggage allowance text
export function getBaggageText(offer: any): string {
  const checkedBags = offer?.available_services?.find((s: any) => 
    s.type === 'baggage'
  );
  
  if (checkedBags) {
    return `${checkedBags.maximum_quantity || 1} checked bag`;
  }
  
  return 'See baggage details';
}
