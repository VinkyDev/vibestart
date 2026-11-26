import { expect, test } from "@playwright/test";

test("the home page renders while its health request is pending", async ({
  page,
}) => {
  const pending = Promise.withResolvers<undefined>();
  const release = Promise.withResolvers<undefined>();
  const health = "**/api/health";

  await page.route(health, async (route) => {
    pending.resolve(undefined);
    await release.promise;
    await route.continue();
  });

  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await pending.promise;
    await expect(page.getByRole("heading", { name: "my-app" })).toBeVisible();
  } finally {
    release.resolve(undefined);
    await page.unrouteAll({ behavior: "wait" });
  }
});
