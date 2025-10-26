export type SelectedService = { 
  id: string; 
  type?: 'seat' | 'baggage';
  quantity?: number;
  amount?: string;
  currency?: string;
  designator?: string;
  passengerId?: string;
  segmentId?: string;
  segmentIndex?: number;
};

export type CartItem = {
  offerId: string;
  offer: any;
  services: SelectedService[];
  searchParams?: any;
};

export type CartState = {
  items: CartItem[];
  addOffer: (offer: any, searchParams?: any) => void;
  setServicesForOffer: (offerId: string, services: SelectedService[]) => void;
  clearOffer: (offerId: string) => void;
  clearAll: () => void;
  getTotal: (offerId: string) => number;
  getSeats: (offerId: string) => SelectedService[];
  getBaggage: (offerId: string) => SelectedService[];
};
