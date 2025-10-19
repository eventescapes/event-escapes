type EventCardProps = {
  title: string;
  dateLabel: string;
  venueLabel?: string;
  imageUrl: string;
  ctaHref: string;
  ctaText?: string;

  // Strictly from Ticketmaster API:
  priceFrom?: number;          // e.g. priceRanges[0].min
  currencyCode?: string;       // e.g. priceRanges[0].currency ("USD","AUD","GBP",...)
  formattedPriceText?: string; // if TM already provides a formatted string, we render it verbatim
};

function formatMoneyExact(amount: number, currencyCode: string) {
  try {
    // No conversion; just format with the code supplied by TM.
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback (still exact): plain number + ISO code
    return `${amount.toFixed(2)} ${currencyCode}`;
  }
}

export default function EventCard({
  title,
  dateLabel,
  venueLabel,
  imageUrl,
  ctaHref,
  ctaText = "Get Tickets & Earn $20",
  priceFrom,
  currencyCode,
  formattedPriceText,
}: EventCardProps) {
  return (
    <article 
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 shadow-md backdrop-blur transition-transform hover:scale-[1.015] hover:shadow-lg"
      data-testid={`event-card-${title}`}
    >
      {/* Image with fixed ratio */}
      <div className="relative w-full aspect-[16/9] bg-slate-800">
        <img 
          src={imageUrl} 
          alt={title} 
          className="absolute inset-0 h-full w-full object-cover" 
          loading="lazy"
          data-testid={`event-image-${title}`}
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold text-white/95 line-clamp-2" data-testid={`event-title-${title}`}>
          {title}
        </h3>

        <div className="mt-2 text-xs text-white/70">
          <div data-testid={`event-date-${title}`}>{dateLabel}</div>
          {venueLabel ? <div className="truncate" data-testid={`event-venue-${title}`}>{venueLabel}</div> : null}
        </div>

        {(priceFrom ?? 0) > 0 && currencyCode && (
          <div className="mt-3 text-sm" data-testid={`event-price-${title}`}>
            <span className="text-white/60">Starting from </span>
            <span className="font-semibold text-white">
              {/* If TM gives a preformatted string, use it verbatim. Otherwise format strictly by ISO code. */}
              {formattedPriceText ?? formatMoneyExact(priceFrom!, currencyCode)}
            </span>
          </div>
        )}

        <div className="mt-auto" />

        <a
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold bg-fuchsia-600 text-white hover:bg-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/60 transition-colors"
          data-testid={`button-get-tickets-${title}`}
        >
          {ctaText}
        </a>
      </div>
    </article>
  );
}
