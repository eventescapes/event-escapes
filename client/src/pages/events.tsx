import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

type EventCard = {
  id: string;
  name: string;
  segment: string;
  genre: string | null;
  event_start_date: string;
  venue_city: string;
  venue_country_code: string;
  images: string | null;
  url: string;
  price_min: number | null;
  price_max: number | null;
  currency: string | null;
};

const COUNTRIES = ["US", "CA", "AU", "GB"] as const;
const FOUR_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 4;

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso.split("T")[0];
  }
}

function getEventImage(imagesJson: string | null): string {
  try {
    if (!imagesJson) return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop";
    
    const images = JSON.parse(imagesJson);
    if (Array.isArray(images) && images.length > 0) {
      const highResImage = images.find((img: any) => img.width > 500) || images[0];
      return highResImage.url || highResImage;
    }
    return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop";
  } catch {
    return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop";
  }
}

async function fetchEvents(segment: "Music" | "Sports") {
  const now = new Date();
  const future = new Date(now.getTime() + FOUR_MONTHS_MS);

  const { data, error } = await supabase
    .from("ticketmaster_events")
    .select("id, name, segment, genre, event_start_date, venue_city, venue_country_code, images, url, price_min, price_max, currency")
    .in("venue_country_code", COUNTRIES)
    .eq("segment", segment)
    .gte("event_start_date", now.toISOString())
    .lte("event_start_date", future.toISOString())
    .order("price_min", { ascending: true, nullsFirst: false })
    .limit(100);

  if (error) {
    console.error("Error fetching events:", error);
    return [];
  }

  // Sort by price (nulls last), then by date
  const sorted = (data ?? []).sort((a: any, b: any) => {
    const av = a.price_min ?? Number.POSITIVE_INFINITY;
    const bv = b.price_min ?? Number.POSITIVE_INFINITY;
    if (av !== bv) return av - bv;
    return new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime();
  });

  return sorted as EventCard[];
}

function Rail({
  title,
  items,
  autoScrollMs = 6000,
}: {
  title: string;
  items: EventCard[];
  autoScrollMs?: number;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Smooth auto-scroll with pause on hover
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let paused = false;
    const stop = () => (paused = true);
    const start = () => (paused = false);

    el.addEventListener("mouseenter", stop);
    el.addEventListener("mouseleave", start);
    el.addEventListener("focusin", stop);
    el.addEventListener("focusout", start);

    const tick = () => {
      if (!el || paused) return;
      const next = el.scrollLeft + el.clientWidth;
      el.scrollTo({ left: next, behavior: "smooth" });

      if (next + 20 >= el.scrollWidth) {
        setTimeout(() => el.scrollTo({ left: 0, behavior: "smooth" }), 400);
      }
    };

    const id = setInterval(tick, autoScrollMs);
    return () => {
      clearInterval(id);
      el.removeEventListener("mouseenter", stop);
      el.removeEventListener("mouseleave", start);
      el.removeEventListener("focusin", stop);
      el.removeEventListener("focusout", start);
    };
  }, [autoScrollMs]);

  return (
    <section className="mb-10">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-2xl font-semibold text-white dark:text-white">{title}</h2>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ scrollBehavior: "smooth" }}
        data-testid={`rail-${title}`}
      >
        <style>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>

        {items.map((ev) => (
          <Card
            key={ev.id}
            className="min-w-[280px] max-w-[280px] bg-[#0e0f1a] dark:bg-[#0e0f1a] border border-white/10 rounded-2xl text-white dark:text-white snap-start hover:shadow-lg transition-all"
            data-testid={`event-card-${ev.id}`}
          >
            <CardContent className="p-3">
              <div className="h-40 w-full overflow-hidden rounded-xl bg-black/20">
                <img
                  src={getEventImage(ev.images)}
                  alt={ev.name}
                  className="h-40 w-full object-cover"
                  loading="lazy"
                  data-testid={`event-image-${ev.id}`}
                />
              </div>
              <div className="mt-3">
                <h3 className="text-base font-medium line-clamp-2" data-testid={`event-name-${ev.id}`}>
                  {ev.name}
                </h3>
                <p className="text-sm text-white/70 dark:text-white/70 mt-1" data-testid={`event-location-${ev.id}`}>
                  {ev.venue_city} • {formatDate(ev.event_start_date)}
                </p>

                {typeof ev.price_min === "number" && ev.price_min > 0 ? (
                  <p className="text-emerald-400 dark:text-emerald-400 mt-2 font-semibold" data-testid={`event-price-${ev.id}`}>
                    From ${Math.round(ev.price_min)}
                  </p>
                ) : (
                  <p className="text-white/60 dark:text-white/60 mt-2 text-sm">See ticket options</p>
                )}

                <Button
                  className="mt-3 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={() => window.open(ev.url, "_blank", "noopener")}
                  data-testid={`button-view-tickets-${ev.id}`}
                >
                  View Tickets →
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default function EventsRailsPage() {
  const [segment, setSegment] = useState<"Music" | "Sports">("Music");
  const [music, setMusic] = useState<EventCard[]>([]);
  const [sports, setSports] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch both rails
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [m, s] = await Promise.all([fetchEvents("Music"), fetchEvents("Sports")]);
      if (!alive) return;
      setMusic(m);
      setSports(s);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Auto-switch between rails every 15 seconds
  useEffect(() => {
    const id = setInterval(
      () => setSegment((prev) => (prev === "Music" ? "Sports" : "Music")),
      15000
    );
    return () => clearInterval(id);
  }, []);

  const active = useMemo(
    () => (segment === "Music" ? music : sports),
    [segment, music, sports]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 dark:from-black dark:via-gray-900 dark:to-black px-4 md:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white dark:text-white mb-4">Live Events</h1>
          <p className="text-white/70 dark:text-white/70 mb-6">
            Discover upcoming events from Ticketmaster in the next 4 months
          </p>

          <div className="flex items-center gap-2">
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                segment === "Music" 
                  ? "bg-white text-black" 
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
              onClick={() => setSegment("Music")}
              data-testid="button-music-tab"
            >
              🎵 Music (next 4 months)
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                segment === "Sports" 
                  ? "bg-white text-black" 
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
              onClick={() => setSegment("Sports")}
              data-testid="button-sports-tab"
            >
              🏟️ Sports (next 4 months)
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <p className="text-white/70 dark:text-white/70 mt-4">Loading live Ticketmaster events…</p>
          </div>
        ) : active.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/70 dark:text-white/70">No events found for this category.</p>
          </div>
        ) : (
          <Rail
            title={segment === "Music" ? "🎵 Upcoming Music Events" : "🏟️ Upcoming Sports Events"}
            items={active}
            autoScrollMs={6000}
          />
        )}
      </div>
    </div>
  );
}
