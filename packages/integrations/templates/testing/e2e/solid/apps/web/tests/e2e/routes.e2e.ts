import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("a linked Solid route survives a deep-link reload", async ({ browser, screen }) => {
  await browser.goto("/");
  await screen.getByRole("link", { name: "About" }).tap();
  await expect(screen.getByRole("heading", { name: "About my-app" })).toBeVisible();
  await browser.goto(await browser.url());
  await expect(screen.getByRole("heading", { name: "About my-app" })).toBeVisible();
});
