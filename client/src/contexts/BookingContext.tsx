import { createContext, useContext, useState, ReactNode } from 'react';
import type { SelectedSeat } from '@/types/flights';

interface Hotel {
  id: string;
  name: string;
  price: number;
  rating: number;
  image: string;
  location: string;
  distance?: string;
}

interface Flight {
  id: string;
  airline: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  stops: number;
}

interface Event {
  id: string;
  title: string;
  venue: string;
  date: string;
  price: number;
  image: string;
}

interface BookingState {
  selectedEvent?: Event;
  selectedHotel?: Hotel;
  selectedOutboundFlight?: Flight;
  selectedReturnFlight?: Flight;
  selectedSeats?: {
    outbound: SelectedSeat[];
    return: SelectedSeat[];
  };
  totalPrice: number;
}

interface BookingContextType {
  booking: BookingState;
  updateSelectedEvent: (event: Event) => void;
  updateSelectedHotel: (hotel: Hotel) => void;
  updateSelectedOutboundFlight: (flight: Flight) => void;
  updateSelectedReturnFlight: (flight: Flight) => void;
  updateSelectedSeats: (seats: { outbound: SelectedSeat[]; return: SelectedSeat[] }) => void;
  clearBooking: () => void;
  calculateTotal: () => number;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<BookingState>({
    totalPrice: 0,
  });

  const updateSelectedEvent = (event: Event) => {
    setBooking(prev => ({ ...prev, selectedEvent: event }));
  };

  const updateSelectedHotel = (hotel: Hotel) => {
    setBooking(prev => ({ ...prev, selectedHotel: hotel }));
  };

  const updateSelectedOutboundFlight = (flight: Flight) => {
    setBooking(prev => ({ ...prev, selectedOutboundFlight: flight }));
  };

  const updateSelectedReturnFlight = (flight: Flight) => {
    setBooking(prev => ({ ...prev, selectedReturnFlight: flight }));
  };

  const updateSelectedSeats = (seats: { outbound: SelectedSeat[]; return: SelectedSeat[] }) => {
    setBooking(prev => ({ ...prev, selectedSeats: seats }));
  };

  const calculateTotal = () => {
    const eventPrice = booking.selectedEvent?.price || 0;
    const hotelPrice = booking.selectedHotel?.price || 0;
    const outboundPrice = booking.selectedOutboundFlight?.price || 0;
    const returnPrice = booking.selectedReturnFlight?.price || 0;
    const seatPrice = (
      (booking.selectedSeats?.outbound.reduce((sum, seat) => sum + seat.price, 0) || 0) +
      (booking.selectedSeats?.return.reduce((sum, seat) => sum + seat.price, 0) || 0)
    );
    return eventPrice + hotelPrice + outboundPrice + returnPrice + seatPrice;
  };

  const clearBooking = () => {
    setBooking({ totalPrice: 0 });
  };

  return (
    <BookingContext.Provider value={{
      booking,
      updateSelectedEvent,
      updateSelectedHotel,
      updateSelectedOutboundFlight,
      updateSelectedReturnFlight,
      updateSelectedSeats,
      clearBooking,
      calculateTotal,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}