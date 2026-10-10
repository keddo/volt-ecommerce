import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ProductListItem } from "@personal-ecommerce/shared";
import { ProductCard } from "../ProductCard";
import { LocaleProvider } from "../../../context/LocaleContext";

const toggle = vi.fn();
const addItem = vi.fn();
const showToast = vi.fn();
let wishlisted = false;

vi.mock("../../../context/WishlistContext", () => ({
  useWishlist: () => ({ isWishlisted: () => wishlisted, toggle }),
}));
vi.mock("../../../context/CartContext", () => ({
  useCart: () => ({ addItem }),
}));
vi.mock("../../../context/ToastContext", () => ({
  useToast: () => ({ showToast }),
}));

const baseProduct: ProductListItem = {
  id: "p1",
  name: "Test Headphones",
  slug: "test-headphones",
  sku: "TH-1",
  image: null,
  categoryId: "c1",
  categoryName: "Headphones",
  price: 100,
  discountPrice: null,
  stock: 10,
  minStock: 2,
  published: true,
  featured: false,
  createdAt: new Date().toISOString(),
};

function renderCard(product: Partial<ProductListItem> = {}) {
  return render(
    <LocaleProvider>
      <MemoryRouter>
        <ProductCard product={{ ...baseProduct, ...product }} />
      </MemoryRouter>
    </LocaleProvider>
  );
}

beforeEach(() => {
  toggle.mockClear();
  addItem.mockClear();
  showToast.mockClear();
  wishlisted = false;
});

describe("ProductCard", () => {
  it("shows the plain price with no discount badge when there's no discount", () => {
    renderCard({ price: 100, discountPrice: null });
    expect(screen.getByText("ETB 100")).toBeInTheDocument();
    expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
  });

  it("computes and shows the discount percentage badge", () => {
    renderCard({ price: 200, discountPrice: 150 });
    expect(screen.getByText("-25%")).toBeInTheDocument();
    expect(screen.getByText("ETB 150")).toBeInTheDocument();
    expect(screen.getByText("ETB 200")).toBeInTheDocument(); // struck-through original price
  });

  it("shows Out of stock and disables Add to Cart at zero stock", () => {
    renderCard({ stock: 0 });
    // "Out of stock" legitimately appears twice: the status label and the disabled button text.
    expect(screen.getAllByText("Out of stock")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Out of stock" })).toBeDisabled();
  });

  it("shows Low stock when stock is at or below minStock but above zero", () => {
    renderCard({ stock: 2, minStock: 2 });
    expect(screen.getByText("Low stock")).toBeInTheDocument();
  });

  it("shows In stock otherwise", () => {
    renderCard({ stock: 50, minStock: 2 });
    expect(screen.getByText("In stock")).toBeInTheDocument();
  });

  it("calls addItem and shows a toast when Add to cart is clicked", async () => {
    addItem.mockResolvedValueOnce(undefined);
    renderCard({ stock: 5 });

    await userEvent.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(addItem).toHaveBeenCalledWith("p1", 1);
    expect(showToast).toHaveBeenCalledWith("Added to cart");
  });

  it("toggles wishlist and reflects the wishlisted state in the button label", async () => {
    wishlisted = true;
    renderCard();

    const button = screen.getByRole("button", { name: "Remove from wishlist" });
    await userEvent.click(button);

    expect(toggle).toHaveBeenCalledWith(expect.objectContaining({ id: "p1" }));
    expect(showToast).toHaveBeenCalledWith("Removed from wishlist");
  });
});
