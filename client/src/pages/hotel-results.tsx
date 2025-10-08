import { HeroSearch } from '@/components/HeroSearch';
import { FiltersBar } from '@/components/FiltersBar';
import { ResultsGrid } from '@/components/ResultsGrid';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Map } from 'lucide-react';
import { useState } from 'react';
import { fetchHotels, type HotelsResponse } from '@/lib/hotels';

export default function HotelResults() {
  const [data, setData] = useState<HotelsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async (params: Record<string, string | number>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchHotels(params);
      setData(result);
    } catch (e: any) {
      setError(e.message ?? 'Error loading hotels');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleHotelSelect = (rateKey: string) => {
    console.log(rateKey);
    
    toast({
      title: "Room Saved",
      description: "Your selection is ready for the checkout step.",
      duration: 3000,
    });
  };

  const handleRetry = () => {
    // Re-run the search with default params
    handleSearch({
      dest: 'DXB',
      checkIn: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      adults: 2,
      rooms: 1,
      maxHotels: 24,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Search */}
      <HeroSearch onSearch={handleSearch} initialSearch={true} />
      
      {/* Filters Bar */}
      <FiltersBar />

      {/* Optional Map Modal Button */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8">
        <div className="flex justify-end">
          <Button
            variant="outline"
            disabled
            className="rounded-full cursor-not-allowed opacity-50"
            data-testid="button-map-modal"
          >
            <Map className="mr-2 h-4 w-4" />
            Show Map (Coming Soon)
          </Button>
        </div>
      </div>
      
      {/* Results Grid */}
      <ResultsGrid
        hotels={data?.cards || []}
        loading={loading}
        error={error}
        onRetry={handleRetry}
        onSelectHotel={handleHotelSelect}
      />
    </div>
  );
}
