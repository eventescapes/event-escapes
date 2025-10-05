export type SelectedService = { 
  id: string; 
  quantity?: number;
  amount?: string;
  designator?: string;
  passengerId?: string;
  segmentId?: string;
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
};
