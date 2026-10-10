import { describe, expect, it } from "vitest";
import { slugify, uniqueSlug } from "../../src/lib/slugify";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("VOLT Pulse Smartphone")).toBe("volt-pulse-smartphone");
  });

  it("collapses non-alphanumeric runs into a single hyphen", () => {
    expect(slugify("Air  Laptop — 14\"")).toBe("air-laptop-14");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  !Edge Phone!  ")).toBe("edge-phone");
  });

  it("handles an already-clean slug unchanged", () => {
    expect(slugify("wave-headphones")).toBe("wave-headphones");
  });
});

describe("uniqueSlug", () => {
  it("returns the base slug when nothing conflicts", async () => {
    const slug = await uniqueSlug("New Product", async () => false);
    expect(slug).toBe("new-product");
  });

  it("appends -2, -3, ... until a free slug is found", async () => {
    const taken = new Set(["new-product", "new-product-2", "new-product-3"]);
    const slug = await uniqueSlug("New Product", async (candidate) => taken.has(candidate));
    expect(slug).toBe("new-product-4");
  });

  it("checks exactly once per candidate, stopping at the first free one", async () => {
    const calls: string[] = [];
    const taken = new Set(["x"]);
    const slug = await uniqueSlug("X", async (candidate) => {
      calls.push(candidate);
      return taken.has(candidate);
    });
    expect(slug).toBe("x-2");
    expect(calls).toEqual(["x", "x-2"]);
  });
});
