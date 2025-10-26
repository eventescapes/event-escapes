import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartState, SelectedService } from "@/types/cart";

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addOffer: (offer, searchParams) => {
        const exists = get().items.some(i => i.offerId === offer.id);
        if (!exists) {
          set({ 
            items: [...get().items, { 
              offerId: offer.id, 
              offer, 
              services: [],
              searchParams 
            }] 
          });
        }
      },
      
      setServicesForOffer: (offerId, services) => {
        set({ 
          items: get().items.map(i => 
            i.offerId === offerId ? { ...i, services } : i
          ) 
        });
      },
      
      clearOffer: (offerId) => {
        set({ items: get().items.filter(i => i.offerId !== offerId) });
      },
      
      clearAll: () => set({ items: [] }),
      
      getTotal: (offerId) => {
        const item = get().items.find(i => i.offerId === offerId);
        if (!item) return 0;
        
        const flightAmount = parseFloat(item.offer?.total_amount || '0');
        const servicesAmount = item.services.reduce((sum, service) => {
          const amount = parseFloat(service.amount || '0');
          const quantity = service.quantity || 1;
          return sum + (amount * quantity);
        }, 0);
        
        return flightAmount + servicesAmount;
      },
      
      getSeats: (offerId) => {
        const item = get().items.find(i => i.offerId === offerId);
        return item?.services.filter(s => s.type === 'seat') || [];
      },
      
      getBaggage: (offerId) => {
        const item = get().items.find(i => i.offerId === offerId);
        return item?.services.filter(s => s.type === 'baggage') || [];
      },
    }),
    {
      name: 'eventescapes-flight-cart',
    }
  )
);
