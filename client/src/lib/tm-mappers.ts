type TMEvent = {
  name: string;
  dates?: { start?: { localDate?: string; localTime?: string; dateTime?: string } };
  _embedded?: { venues?: Array<{ name?: string; city?: { name?: string }; state?: { name?: string }; country?: { name?: string } }> };
  images?: Array<{ url: string; width?: number; height?: number }>;
  url?: string;
  priceRanges?: Array<{ type?: string; currency?: string; min?: number; max?: number }>;
};

export function mapTMEventToCard(e: TMEvent) {
  const venue = e._embedded?.venues?.[0];
  const venueLabel = [venue?.name, venue?.city?.name].filter(Boolean).join(" • ");

  // Choose a decent landscape image
  const img = (e.images ?? []).sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? "/images/placeholder.jpg";

  // Price strictly from TM
  const pr = e.priceRanges?.[0];
  const priceFrom = pr?.min;
  const currencyCode = pr?.currency; // ISO code from TM (e.g., "USD","AUD","GBP")

  // Date label (use local pieces if present; otherwise ISO)
  const dateLabel =
    [e.dates?.start?.localDate, e.dates?.start?.localTime].filter(Boolean).join(" • ") ||
    e.dates?.start?.dateTime ||
    "";

  return {
    title: e.name,
    dateLabel,
    venueLabel,
    imageUrl: img,
    ctaHref: e.url ?? "#",
    priceFrom,
    currencyCode,
    // If TM ever provides a ready-to-render price string, add it here as formattedPriceText.
  };
}
