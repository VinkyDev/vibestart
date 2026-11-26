import { test } from "@e2e-dev/web";
import type { Browser } from "@e2e-dev/web";
import { expect } from "e2e";
import type { Screen } from "e2e";

import { password, signUp } from "../support/api.ts";

const signInAndVisitHome = async (browser: Browser, screen: Screen) => {
  const { email } = await signUp();

  await browser.goto("/login");
  await screen.getByLabel("Email").fill(email);
  await screen.getByLabel("Password").fill(password);
  await screen.getByRole("main").getByRole("button", { name: "Sign in" }).tap();
  await expect(browser).toHaveURL("/todos");
  await screen.getByRole("link", { name: "Home" }).tap();
  await expect(screen.getByRole("button", { name: "Test User" })).toBeVisible();
};

test("a revoked session is checked again before opening private todos", async ({
  browser,
  screen,
}) => {
  await signInAndVisitHome(browser, screen);

  const status = await browser.evaluate<number>(
    'fetch("/api/auth/sign-out", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }).then(response => response.status)'
  );

  expect(status).toBe(200);
  await screen.getByRole("link", { name: "Todos" }).tap();
  await expect(browser).toHaveURL("/login?redirect=%2Ftodos");
  await expect(screen.getByRole("banner").getByText("Sign in")).toBeVisible();
});

test("sign-out in another tab supersedes a pending route session check", async ({
  browser,
  screen,
}) => {
  await signInAndVisitHome(browser, screen);
  const [original] = browser.tabs();

  if (!original) {
    throw new Error("Missing original tab");
  }

  const other = await browser.newTab();
  await browser.goto("/about");
  await screen.getByRole("button", { name: "Test User" }).tap();
  await original.activate();

  const first = Promise.withResolvers<undefined>();
  const replacement = Promise.withResolvers<undefined>();
  const release = Promise.withResolvers<undefined>();
  const path = "**/api/auth/get-session*";
  let requests = 0;

  await browser.route(path, async (route) => {
    requests += 1;
    (requests === 1 ? first : replacement).resolve(undefined);
    await release.promise;
    await route.continue();
  });

  try {
    await screen.getByRole("link", { name: "Todos" }).tap();
    await first.promise;
    await other.activate();
    await screen.getByRole("menuitem", { name: "Sign out" }).tap();
    await expect(browser).toHaveURL("/");
    await replacement.promise;
    await original.activate();
    await expect(screen.getByText("Checking session…")).toBeVisible();
    await expect(screen.getByLabel("New todo")).toHaveCount(0);
  } finally {
    release.resolve(undefined);
    await browser.unroute(path);
    await other.close();
  }

  await expect(browser).toHaveURL("/login?redirect=%2Ftodos");
});
