import { expect, test } from "@playwright/test";

test("a linked Solid route survives a deep-link reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\/about$/u);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "About my-app" })
  ).toBeVisible();
});
