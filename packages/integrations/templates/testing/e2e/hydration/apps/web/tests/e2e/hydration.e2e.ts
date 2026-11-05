import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("the theme control waits for hydration", async ({ browser, screen }) => {
  // Both drivers need an active page before the gated navigation.
  await browser.goto("/", { waitUntil: "networkidle" });
  const assets = Promise.withResolvers<undefined>();

  // Hold the real assets so the server-rendered control is checked before hydration.
  await browser.route("**/*", async (route) => {
    if (route.request.headers["sec-fetch-dest"] === "script") {
      await assets.promise;
    }

    await route.continue();
  });

  const navigation = browser.goto("/", { waitUntil: "networkidle" });
  const toggle = screen.getByRole("button", { name: "Toggle theme" });

  try {
    await expect(toggle).toBeDisabled();
  } finally {
    assets.resolve(undefined);

    try {
      await navigation;
    } finally {
      await browser.unroute("**/*");
    }
  }

  await expect(toggle).toBeEnabled();
});
