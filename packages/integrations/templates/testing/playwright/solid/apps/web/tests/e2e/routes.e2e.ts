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

test("an unknown route offers a way home", async ({ page }) => {
  await page.goto("/missing-page");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.getByRole("link", { name: "Home" }).click();
  await expect(page.getByRole("heading", { name: "my-app" })).toBeVisible();
});
