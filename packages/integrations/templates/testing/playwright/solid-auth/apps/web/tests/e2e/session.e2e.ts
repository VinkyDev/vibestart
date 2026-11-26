import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { password, signUp } from "../support/api.ts";

const signInAndVisitHome = async (page: Page) => {
  const { email } = await signUp();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/todos");
  await page.getByRole("link", { name: "Home" }).click();
  await expect(page.getByRole("button", { name: "Test User" })).toBeVisible();
};

test("a revoked session is checked again before opening private todos", async ({
  page,
}) => {
  await signInAndVisitHome(page);

  const status = await page.evaluate<number>(
    'fetch("/api/auth/sign-out", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }).then(response => response.status)'
  );

  expect(status).toBe(200);
  await page.getByRole("link", { name: "Todos" }).click();
  await expect(page).toHaveURL("/login?redirect=%2Ftodos");
  await expect(page.getByRole("banner").getByText("Sign in")).toBeVisible();
});

test("sign-out in another tab supersedes a pending route session check", async ({
  page,
  context,
}) => {
  await signInAndVisitHome(page);
  const other = await context.newPage();
  await other.goto("/");
  await other.getByRole("button", { name: "Test User" }).click();

  const first = Promise.withResolvers<undefined>();
  const replacement = Promise.withResolvers<undefined>();
  const release = Promise.withResolvers<undefined>();
  let requests = 0;

  await page.route("**/api/auth/get-session*", async (route) => {
    requests += 1;
    (requests === 1 ? first : replacement).resolve(undefined);
    await release.promise;
    await route.continue();
  });

  try {
    await page.getByRole("link", { name: "Todos" }).click();
    await first.promise;
    await other.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(other.getByRole("banner").getByText("Sign in")).toBeVisible();
    await replacement.promise;
    await expect(page.getByText("Checking session…")).toBeVisible();
    await expect(page.getByLabel("New todo")).toHaveCount(0);
  } finally {
    release.resolve(undefined);
    await page.unrouteAll({ behavior: "wait" });
    await other.close();
  }

  await expect(page).toHaveURL("/login?redirect=%2Ftodos");
});
