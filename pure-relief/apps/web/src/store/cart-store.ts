import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartLineItem } from '@pure-relief/shared';

type CartStore = {
  items: CartLineItem[];
  couponCode: string | null;
  addItem: (item: CartLineItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  setCouponCode: (code: string | null) => void;
  clear: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,

      addItem: (item) => {
        const existing = get().items.find((i) => i.variantId === item.variantId);
        if (existing) {
          set({
            items: get().items.map((i) => (i.variantId === item.variantId ? { ...i, quantity: i.quantity + item.quantity } : i)),
          });
        } else {
          set({ items: [...get().items, item] });
        }
      },

      removeItem: (variantId) => set({ items: get().items.filter((i) => i.variantId !== variantId) }),

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({ items: get().items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)) });
      },

      setCouponCode: (code) => set({ couponCode: code }),

      clear: () => set({ items: [], couponCode: null }),
    }),
    { name: 'pure-relief-cart' },
  ),
);

export function useCartItemCount(): number {
  return useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
}
