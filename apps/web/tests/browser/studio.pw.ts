import { expect, test } from "@playwright/test";

test("switches independent modes and restores them through browser history", async ({
  page,
}) => {
  await page.goto("/studio");
  const mode = page.getByRole("group", { name: "Mode", exact: true });
  await expect(
    mode.getByRole("button", { name: "Standard", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await mode.getByRole("button", { name: "Effect", exact: true }).click();
  await expect(page).toHaveURL(/mode=effect/u);
  await expect(
    mode.getByRole("button", { name: "Effect", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("main")).toContainText("--mode effect");
  await expect(page.locator("main")).toContainText("Effect HTTP");
  await expect(page.locator("main")).toContainText("Effect RPC");
  await expect(page.locator("main")).not.toContainText("Hono");
  await expect(page.locator("main")).not.toContainText("Expo");
  await expect(page.locator("main")).not.toContainText("Electron");
  await page.goBack();
  await expect(
    mode.getByRole("button", { name: "Standard", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("main")).toContainText("Hono");
  await page.goForward();
  await expect(
    mode.getByRole("button", { name: "Effect", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({
    path: test.info().outputPath("effect-studio.png"),
    fullPage: true,
  });
});

test("keeps an incompatible deep link inside Effect mode", async ({ page }) => {
  await page.goto("/studio?mode=effect&api=orpc&framework=next");
  await expect(page.locator("main")).toContainText("Effect RPC");
  await expect(page.locator("main")).not.toContainText("oRPC");
  await expect(page.locator("main")).not.toContainText("Next.js");
});
