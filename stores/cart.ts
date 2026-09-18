'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types/shop';

interface CartState {
  items: CartItem[];
  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(persist((set) => ({
  items: [],
  add: (productId, quantity = 1) => set((s) => { const existing = s.items.find((x) => x.productId === productId); if (existing) return { items: s.items.map((x) => x.productId === productId ? { ...x, quantity: Math.min(20, x.quantity + quantity) } : x) }; return { items: [...s.items, { productId, quantity: Math.min(20, quantity) }] }; }),
  setQuantity: (productId, quantity) => set((s) => ({ items: s.items.map((x) => x.productId === productId ? { ...x, quantity: Math.max(1, Math.min(20, quantity)) } : x) })),
  remove: (productId) => set((s) => ({ items: s.items.filter((x) => x.productId !== productId) })),
  clear: () => set({ items: [] }),
}), { name: 'lv-cart' }));
