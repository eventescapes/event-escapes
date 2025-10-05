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
    }),
    {
      name: 'eventescapes-flight-cart',
    }
  )
);
