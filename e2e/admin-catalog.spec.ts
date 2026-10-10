import path from "path";
import { test, expect } from "@playwright/test";

test("admin creates a published product and it appears in the public shop", async ({ page }) => {
  const unique = Date.now();
  const productName = `E2E Test Gadget ${unique}`;

  await page.goto("/admin/login");
  await page.getByPlaceholder("Admin email").fill("admin@volt.dev");
  await page.getByPlaceholder("Password").fill("ChangeMe123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin");

  await page.goto("/admin/products/new");
  await page.getByLabel("Product name").fill(productName);
  await page.getByLabel("SKU").fill(`E2E-${unique}`);
  await page.getByLabel("Category").selectOption({ index: 1 });
  await page.getByLabel("Price", { exact: true }).fill("42.50");
  await page.getByLabel("Stock quantity").fill("15");
  await page.getByLabel("Minimum stock level").fill("3");

  await page.locator('input[type="file"]').setInputFiles(path.join(__dirname, "fixtures/test-image.png"));
  await page.waitForTimeout(300);

  await page.getByLabel("Published").check();
  await page.getByRole("button", { name: "Create product" }).click();

  await page.waitForURL("**/admin/products");
  await expect(page.getByText(productName)).toBeVisible();

  // Now confirm it's visible to an actual shopper.
  await page.goto("/shop");
  await page.locator("#shop-search").fill(productName);
  await expect(page.getByText(productName)).toBeVisible();
});
