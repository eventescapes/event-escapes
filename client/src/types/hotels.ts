export type HotelCard = {
  hotelId: number | string;
  name: string;
  stars?: number;
  thumbnail?: string | null;
  locality?: string;
  price: number;
  currency: string;
  board?: string;
  refundable?: boolean;
  paymentType?: 'AT_HOTEL' | 'AT_WEB' | string;
  rateKey: string;
};

export type HotelsResponse = { 
  total: number; 
  cards: HotelCard[] 
};
