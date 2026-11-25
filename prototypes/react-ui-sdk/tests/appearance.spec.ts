import { expect, test } from "@playwright/test";

test("the keyboard switch changes the production theme", async ({ page }) => {
  await page.goto("/");
  const control = page.getByRole("switch", { name: "Dark mode" });
  const surface = page.getByRole("main");
  await expect(control).not.toBeChecked();
  await expect(surface).toHaveCSS("background-color", "rgb(245, 242, 236)");
  await page.keyboard.press("Tab");
  await expect(control).toBeFocused();
  await page.keyboard.press("Space");
  await expect(control).toBeChecked();
  await expect(surface).toHaveCSS("background-color", "rgb(36, 39, 34)");
  await page.keyboard.press("Space");
  await expect(control).not.toBeChecked();
});
