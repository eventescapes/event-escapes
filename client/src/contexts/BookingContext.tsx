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

// Cart item represents a complete booking (flight + extras)
interface CartItem {
  id: string;
  type: 'flight' | 'hotel' | 'event';
  outboundFlight?: Flight;
  returnFlight?: Flight;
  selectedSeats?: {
    outbound: SelectedSeat[];
    return: SelectedSeat[];
  };
  selectedBaggage?: any[]; // TODO: Add baggage type
  hotel?: Hotel;
  event?: Event;
  subtotal: number;
  currency: string;
  passengers: number;
  addedAt: Date;
}

// Current booking state for building a cart item
interface BookingState {
  selectedEvent?: Event;
  selectedHotel?: Hotel;
  selectedOutboundFlight?: Flight;
  selectedReturnFlight?: Flight;
  selectedSeats?: {
    outbound: SelectedSeat[];
    return: SelectedSeat[];
  };
  selectedBaggage?: any[];
  totalPrice: number;
}

// Cart state
interface CartState {
  items: CartItem[];
  totalItems: number;
  grandTotal: number;
}

interface BookingContextType {
  // Current booking (for building cart items)
  booking: BookingState;
  updateSelectedEvent: (event: Event) => void;
  updateSelectedHotel: (hotel: Hotel) => void;
  updateSelectedOutboundFlight: (flight: Flight) => void;
  updateSelectedReturnFlight: (flight: Flight) => void;
  updateSelectedSeats: (seats: { outbound: SelectedSeat[]; return: SelectedSeat[] }) => void;
  updateSelectedBaggage: (baggage: any[]) => void;
  clearBooking: () => void;
  calculateTotal: () => number;
  
  // Cart functionality
  cart: CartState;
  addToCart: (passengers: number) => string; // Returns cart item ID
  removeFromCart: (itemId: string) => void;
  updateCartItem: (itemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<BookingState>({
    totalPrice: 0,
  });
  
  const [cart, setCart] = useState<CartState>({
    items: [],
    totalItems: 0,
    grandTotal: 0,
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
  
  const updateSelectedBaggage = (baggage: any[]) => {
    setBooking(prev => ({ ...prev, selectedBaggage: baggage }));
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
    const baggagePrice = booking.selectedBaggage?.reduce((sum, bag) => sum + (bag.price || 0), 0) || 0;
    return eventPrice + hotelPrice + outboundPrice + returnPrice + seatPrice + baggagePrice;
  };
  
  // Cart functions
  const addToCart = (passengers: number): string => {
    const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const subtotal = calculateTotal();
    const currency = 'AUD'; // TODO: Get from flight data
    
    const cartItem: CartItem = {
      id: itemId,
      type: booking.selectedEvent ? 'event' : booking.selectedHotel ? 'hotel' : 'flight',
      outboundFlight: booking.selectedOutboundFlight,
      returnFlight: booking.selectedReturnFlight,
      selectedSeats: booking.selectedSeats,
      selectedBaggage: booking.selectedBaggage,
      hotel: booking.selectedHotel,
      event: booking.selectedEvent,
      subtotal,
      currency,
      passengers,
      addedAt: new Date(),
    };
    
    setCart(prev => ({
      items: [...prev.items, cartItem],
      totalItems: prev.totalItems + 1,
      grandTotal: prev.grandTotal + subtotal,
    }));
    
    // Clear current booking after adding to cart
    clearBooking();
    
    return itemId;
  };
  
  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const itemToRemove = prev.items.find(item => item.id === itemId);
      if (!itemToRemove) return prev;
      
      return {
        items: prev.items.filter(item => item.id !== itemId),
        totalItems: prev.totalItems - 1,
        grandTotal: prev.grandTotal - itemToRemove.subtotal,
      };
    });
  };
  
  const updateCartItem = (itemId: string, updates: Partial<CartItem>) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      ),
    }));
  };
  
  const clearCart = () => {
    setCart({
      items: [],
      totalItems: 0,
      grandTotal: 0,
    });
  };
  
  const getCartTotal = () => cart.grandTotal;
  
  const getCartItemCount = () => cart.totalItems;

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
      updateSelectedBaggage,
      clearBooking,
      calculateTotal,
      cart,
      addToCart,
      removeFromCart,
      updateCartItem,
      clearCart,
      getCartTotal,
      getCartItemCount,
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