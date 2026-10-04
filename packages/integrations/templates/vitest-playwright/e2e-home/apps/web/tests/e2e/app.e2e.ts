import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const visit = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: "networkidle" });
};

test("the home page names the stack", async ({ page }) => {
  await visit(page, "/");

  await expect(page.getByText("on Vite+.")).toBeVisible();
});

test("the theme can be switched to dark", async ({ page }) => {
  await visit(page, "/");

  await page.getByRole("button", { name: "Toggle theme" }).click();
  await page.getByRole("menuitemradio", { name: "Dark" }).click();

  await expect(page.locator("html")).toHaveClass(/\bdark\b/u);
});
