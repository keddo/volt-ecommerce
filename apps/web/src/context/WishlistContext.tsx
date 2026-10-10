import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ProductListItem } from "@personal-ecommerce/shared";

const STORAGE_KEY = "volt_wishlist";

interface WishlistContextValue {
  items: ProductListItem[];
  isWishlisted: (productId: string) => boolean;
  toggle: (product: ProductListItem) => void;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

function readStoredWishlist(): ProductListItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ProductListItem[]>(() => readStoredWishlist());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage unavailable (private window, quota) - wishlist just won't persist
    }
  }, [items]);

  function isWishlisted(productId: string) {
    return items.some((item) => item.id === productId);
  }

  function toggle(product: ProductListItem) {
    setItems((prev) =>
      prev.some((item) => item.id === product.id)
        ? prev.filter((item) => item.id !== product.id)
        : [...prev, product]
    );
  }

  return (
    <WishlistContext.Provider value={{ items, isWishlisted, toggle }}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
