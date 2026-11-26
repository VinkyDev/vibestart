import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("the home page renders while its health request is pending", async ({ browser, screen }) => {
  const pending = Promise.withResolvers<undefined>();
  const release = Promise.withResolvers<undefined>();
  const health = "**/api/health";

  await browser.route(health, async (route) => {
    pending.resolve(undefined);
    await release.promise;
    await route.continue();
  });

  try {
    await browser.goto("/", { waitUntil: "domcontentloaded" });
    await pending.promise;
    await expect(screen.getByRole("heading", { name: "my-app" })).toBeVisible();
  } finally {
    release.resolve(undefined);
    await browser.unroute(health);
  }
});
