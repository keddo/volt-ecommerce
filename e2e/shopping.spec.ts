import { test, expect } from "@playwright/test";

test("guest browses, adds to cart, registers (cart merges), and checks out", async ({ page }) => {
  const unique = Date.now();
  const email = `e2e-shopper-${unique}@example.com`;

  await page.goto("/shop");
  await expect(page.getByText(/\d+ products/)).toBeVisible();

  // Add the first product to cart as a guest.
  await page.locator('button:has-text("Add to cart")').first().click();
  await expect(page.locator('a[aria-label="Cart"] span')).toHaveText("1");

  // Register a new account - the guest cart should merge in automatically on login.
  await page.goto("/register");
  await page.getByPlaceholder("Full name").fill("E2E Shopper");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder(/Password/).fill("SecurePass123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("/");

  await page.goto("/cart");
  await expect(page.getByText("Your Cart")).toBeVisible();
  await expect(page.locator("text=/ETB\\s?[\\d,]+/").first()).toBeVisible(); // a line item total is showing

  await page.getByRole("button", { name: "Proceed to Checkout" }).click();
  await page.waitForURL("**/checkout");

  await page.locator("#shipping-phone").fill("555-0100");
  await page.locator("#shipping-address").fill("1 E2E Street");
  await page.locator("#shipping-city").fill("Austin");
  await page.locator("#shipping-country").fill("USA");
  await page.getByRole("button", { name: "Place order" }).click();

  await page.waitForURL("**/orders/**");
  await expect(page.getByText(/Order #/)).toBeVisible();

  // Confirm it shows up in the order history too.
  await page.goto("/orders");
  await expect(page.getByText(/Order #/).first()).toBeVisible();
});
