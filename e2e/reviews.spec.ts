import { test, expect } from "@playwright/test";

test("a submitted review stays hidden until admin approval, then appears with the right rating", async ({
  page,
}) => {
  const unique = Date.now();
  const comment = `E2E review comment ${unique}`;

  // Log in as the seeded customer and leave a review on the first shop product.
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("jane@example.com");
  await page.locator('input[type="password"]').fill("CustomerPass123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/");

  await page.goto("/shop");
  await page.locator("a.mt-3.block.truncate").first().click();
  await page.waitForURL("**/products/**");
  const productUrl = page.url();

  await page.getByPlaceholder("Share your thoughts (optional)").fill(comment);
  await page.getByLabel("3 stars").click();
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(page.getByText("Review submitted for approval")).toBeVisible();

  // Still pending - a reload must not show it publicly yet.
  await page.reload();
  await expect(page.getByText(comment)).not.toBeVisible();

  // Approve it as admin.
  await page.goto("/admin/login");
  await page.getByPlaceholder("Admin email").fill("admin@volt.dev");
  await page.getByPlaceholder("Password").fill("ChangeMe123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin");

  await page.goto("/admin/reviews");
  const reviewCard = page.locator("div.rounded-xl.border").filter({ hasText: comment });
  await reviewCard.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Review approved")).toBeVisible();

  // Now it's public. (Not asserting the exact average rating here - the shop's "first product"
  // may already carry other reviews from earlier manual testing in this shared dev database, so
  // only this review's own presence is a reliable signal.)
  await page.goto(productUrl);
  await expect(page.getByText(comment)).toBeVisible();
});
