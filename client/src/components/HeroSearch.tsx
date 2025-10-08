import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Users, MapPin, Search } from 'lucide-react';

interface HeroSearchProps {
  onSearch: (params: Record<string, string | number>) => void;
  initialSearch?: boolean;
}

export function HeroSearch({ onSearch, initialSearch = true }: HeroSearchProps) {
  const getDefaultCheckIn = () => {
    const date = new Date();
    date.setDate(date.getDate() + 21);
    return date.toISOString().split('T')[0];
  };

  const getDefaultCheckOut = () => {
    const date = new Date();
    date.setDate(date.getDate() + 23);
    return date.toISOString().split('T')[0];
  };

  const [destination, setDestination] = useState('DXB');
  const [checkIn, setCheckIn] = useState(getDefaultCheckIn());
  const [checkOut, setCheckOut] = useState(getDefaultCheckOut());
  const [adults, setAdults] = useState('2');
  const [rooms, setRooms] = useState('1');

  useEffect(() => {
    if (initialSearch) {
      handleSearch();
    }
  }, []);

  const handleSearch = () => {
    onSearch({
      dest: destination,
      checkIn,
      checkOut,
      adults: parseInt(adults),
      rooms: parseInt(rooms),
      maxHotels: 24,
    });
  };

  return (
    <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop)',
          filter: 'blur(8px)',
        }}
      />
      
      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-6xl font-bold mb-4 tracking-tight" data-testid="text-hero-title">
            Find Your Perfect Stay
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto" data-testid="text-hero-subtitle">
            Discover luxury hotels for your next event adventure
          </p>
        </div>

        {/* Search Panel */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 lg:p-8 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-1">
              <Label htmlFor="destination" className="text-slate-700 font-semibold mb-2 block">
                Destination
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="pl-10 rounded-full h-12 border-slate-300"
                  placeholder="City code (e.g., DXB)"
                  data-testid="input-destination"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="checkIn" className="text-slate-700 font-semibold mb-2 block">
                Check-in
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="checkIn"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="pl-10 rounded-full h-12 border-slate-300"
                  data-testid="input-checkin"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="checkOut" className="text-slate-700 font-semibold mb-2 block">
                Check-out
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="checkOut"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="pl-10 rounded-full h-12 border-slate-300"
                  data-testid="input-checkout"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="adults" className="text-slate-700 font-semibold mb-2 block">
                Guests
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="adults"
                  type="number"
                  min="1"
                  value={adults}
                  onChange={(e) => setAdults(e.target.value)}
                  className="pl-10 rounded-full h-12 border-slate-300"
                  data-testid="input-adults"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="rooms" className="text-slate-700 font-semibold mb-2 block">
                Rooms
              </Label>
              <Input
                id="rooms"
                type="number"
                min="1"
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                className="rounded-full h-12 border-slate-300"
                data-testid="input-rooms"
              />
            </div>
          </div>

          <div className="mt-6">
            <Button
              onClick={handleSearch}
              className="w-full lg:w-auto lg:px-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-lg shadow-lg"
              data-testid="button-search-hotels"
            >
              <Search className="mr-2 h-5 w-5" />
              Search Hotels
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
