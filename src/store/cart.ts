import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Producto } from '@/types';

interface CartState {
  items: CartItem[];
  addItem: (producto: Producto, cantidad: number) => void;
  removeItem: (productoId: string) => void;
  updateQuantity: (productoId: string, cantidad: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (producto, cantidad) => {
        const items = get().items;
        const existingItem = items.find((item) => item.producto.id === producto.id);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.producto.id === producto.id
                ? { ...item, cantidad: item.cantidad + cantidad }
                : item
            ),
          });
        } else {
          set({ items: [...items, { producto, cantidad }] });
        }
      },

      removeItem: (productoId) => {
        set({ items: get().items.filter((item) => item.producto.id !== productoId) });
      },

      updateQuantity: (productoId, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(productoId);
        } else {
          set({
            items: get().items.map((item) =>
              item.producto.id === productoId ? { ...item, cantidad } : item
            ),
          });
        }
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + Number(item.producto.precioVenta) * item.cantidad,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.cantidad, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
