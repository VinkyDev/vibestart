import { expect, test } from "@playwright/test";

test("the theme control waits for hydration", async ({ page }) => {
  // Both drivers need an active page before the gated navigation.
  await page.goto("/", { waitUntil: "networkidle" });
  const assets = Promise.withResolvers<undefined>();

  // Hold the real assets so the server-rendered control is checked before hydration.
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script") {
      await assets.promise;
    }

    await route.continue();
  });

  const navigation = page.goto("/", { waitUntil: "networkidle" });
  const toggle = page.getByRole("button", { name: "Toggle theme" });

  try {
    await expect(toggle).toBeDisabled();
  } finally {
    assets.resolve(undefined);

    try {
      await navigation;
    } finally {
      await page.unroute("**/*");
    }
  }

  await expect(toggle).toBeEnabled();
});
