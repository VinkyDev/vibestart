import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("a linked Solid route survives a deep-link reload", async ({ browser, screen }) => {
  await browser.goto("/");
  await screen.getByRole("link", { name: "About" }).tap();
  await expect(screen.getByRole("heading", { name: "About my-app" })).toBeVisible();
  await browser.goto(await browser.url());
  await expect(screen.getByRole("heading", { name: "About my-app" })).toBeVisible();
});

test("an unknown route offers a way home even while the API is pending", async ({ browser, screen }) => {
  await browser.goto("/missing-page");
  await expect(screen.getByRole("heading", { name: "Page not found" })).toBeVisible();

  const release = Promise.withResolvers<undefined>();

  await browser.route("**/api/health", async (route) => {
    await release.promise;
    await route.continue();
  });

  try {
    await screen.getByRole("link", { name: "Home" }).tap();
    await expect(screen.getByRole("heading", { name: "my-app" })).toBeVisible();
  } finally {
    release.resolve(undefined);
    await browser.unroute("**/api/health");
  }
});
