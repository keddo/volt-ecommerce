import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { CartSummary } from "@personal-ecommerce/shared";
import { api } from "../lib/apiClient";
import { useAuth } from "./AuthContext";

const EMPTY_CART: CartSummary = {
  items: [],
  subtotal: 0,
  shippingCost: 0,
  discount: 0,
  couponCode: null,
  total: 0,
};

interface CartContextValue {
  cart: CartSummary;
  loading: boolean;
  itemCount: number;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<CartSummary>(EMPTY_CART);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await api.get<CartSummary>("/cart");
    setCart(data);
  }, []);

  // Re-fetch whenever auth settles or the user logs in/out - login merges any guest cart
  // server-side, and logout drops back to a (now separate) guest cart.
  useEffect(() => {
    if (authLoading) return;
    refresh().finally(() => setLoading(false));
  }, [authLoading, user, refresh]);

  const addItem = useCallback(async (productId: string, quantity = 1) => {
    const data = await api.post<CartSummary>("/cart/items", { productId, quantity });
    setCart(data);
  }, []);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    const data = await api.patch<CartSummary>(`/cart/items/${productId}`, { quantity });
    setCart(data);
  }, []);

  const removeItem = useCallback(async (productId: string) => {
    const data = await api.delete<CartSummary>(`/cart/items/${productId}`);
    setCart(data);
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    const data = await api.post<CartSummary>("/cart/coupon", { code });
    setCart(data);
  }, []);

  const removeCoupon = useCallback(async () => {
    const data = await api.delete<CartSummary>("/cart/coupon");
    setCart(data);
  }, []);

  const clearCart = useCallback(async () => {
    const data = await api.delete<CartSummary>("/cart");
    setCart(data);
  }, []);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, loading, itemCount, addItem, updateQuantity, removeItem, applyCoupon, removeCoupon, clearCart, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
