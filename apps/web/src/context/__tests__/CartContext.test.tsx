import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { CartSummary } from "@personal-ecommerce/shared";
import { CartProvider, useCart } from "../CartContext";

vi.mock("../AuthContext", () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));

const apiGet = vi.fn();
const apiPost = vi.fn();
const apiPatch = vi.fn();
const apiDelete = vi.fn();

vi.mock("../../lib/apiClient", () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
    post: (...args: unknown[]) => apiPost(...args),
    patch: (...args: unknown[]) => apiPatch(...args),
    delete: (...args: unknown[]) => apiDelete(...args),
  },
}));

const EMPTY: CartSummary = { items: [], subtotal: 0, shippingCost: 0, discount: 0, couponCode: null, total: 0 };

function cartWith(quantity: number): CartSummary {
  return {
    items: [
      {
        productId: "p1",
        name: "Thing",
        slug: "thing",
        image: null,
        unitPrice: 10,
        quantity,
        stock: 20,
        lineTotal: 10 * quantity,
      },
    ],
    subtotal: 10 * quantity,
    shippingCost: 9.99,
    discount: 0,
    couponCode: null,
    total: 10 * quantity + 9.99,
  };
}

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
  apiPatch.mockReset();
  apiDelete.mockReset();
});

describe("CartContext", () => {
  it("fetches the cart on mount and derives itemCount", async () => {
    apiGet.mockResolvedValueOnce(cartWith(3));
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(apiGet).toHaveBeenCalledWith("/cart");
    expect(result.current.itemCount).toBe(3);
    expect(result.current.cart.total).toBeCloseTo(39.99);
  });

  it("addItem posts to /cart/items and updates state from the response", async () => {
    apiGet.mockResolvedValueOnce(EMPTY);
    apiPost.mockResolvedValueOnce(cartWith(1));
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addItem("p1", 1);
    });

    expect(apiPost).toHaveBeenCalledWith("/cart/items", { productId: "p1", quantity: 1 });
    expect(result.current.itemCount).toBe(1);
  });

  it("updateQuantity patches the specific item and updates state", async () => {
    apiGet.mockResolvedValueOnce(cartWith(1));
    apiPatch.mockResolvedValueOnce(cartWith(5));
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateQuantity("p1", 5);
    });

    expect(apiPatch).toHaveBeenCalledWith("/cart/items/p1", { quantity: 5 });
    expect(result.current.itemCount).toBe(5);
  });

  it("removeItem deletes the item and resets to empty", async () => {
    apiGet.mockResolvedValueOnce(cartWith(2));
    apiDelete.mockResolvedValueOnce(EMPTY);
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.removeItem("p1");
    });

    expect(apiDelete).toHaveBeenCalledWith("/cart/items/p1");
    expect(result.current.itemCount).toBe(0);
  });
});
