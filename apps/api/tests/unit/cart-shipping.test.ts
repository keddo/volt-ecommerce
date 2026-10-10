import { describe, expect, it } from "vitest";
import { calculateShipping } from "../../src/modules/cart/cart.service";

describe("calculateShipping", () => {
  it("is free for an empty cart (subtotal 0)", () => {
    expect(calculateShipping(0)).toBe(0);
  });

  it("is free at or above the $100 threshold", () => {
    expect(calculateShipping(100)).toBe(0);
    expect(calculateShipping(250)).toBe(0);
  });

  it("charges the flat $9.99 rate below $100", () => {
    expect(calculateShipping(1)).toBe(9.99);
    expect(calculateShipping(99.99)).toBe(9.99);
  });
});
