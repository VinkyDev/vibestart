import { test } from "@e2e-dev/web";
import type { Browser } from "@e2e-dev/web";
import { expect } from "e2e";
import type { Screen } from "e2e";

import { password, signUp, uniqueEmail } from "../support/api.ts";

const visit = async (browser: Browser, path: string) => {
  await browser.goto(path, { waitUntil: "networkidle" });
};

// `browser.reload()` takes no `waitUntil`, so a reload is a visit to the current URL.
const reload = async (browser: Browser) => {
  await visit(browser, await browser.url());
};

const signUpThroughUi = async (browser: Browser, screen: Screen) => {
  await visit(browser, "/login");
  await screen.getByRole("button", { name: "Need an account? Sign up" }).tap();
  await screen.getByLabel("Name").fill("Ada");
  await screen.getByLabel("Email").fill(uniqueEmail());
  await screen.getByLabel("Password").fill(password);
  await screen.getByRole("main").getByRole("button", { name: "Sign up" }).tap();
  await expect(browser).toHaveURL("/");
};

test("the home page reports the API as connected", async ({ browser, screen }) => {
  await visit(browser, "/");

  await expect(screen.getByText("Connected")).toBeVisible();
});

test("a new user signs up and is signed in", async ({ browser, screen }) => {
  await signUpThroughUi(browser, screen);

  await expect(screen.getByRole("button", { name: "Ada" })).toBeVisible();
});

test("an existing user signs in", async ({ browser, screen }) => {
  const { email } = await signUp();

  await visit(browser, "/login");
  await screen.getByLabel("Email").fill(email);
  await screen.getByLabel("Password").fill(password);
  await screen.getByRole("main").getByRole("button", { name: "Sign in" }).tap();

  await expect(browser).toHaveURL("/");
  await expect(screen.getByRole("button", { name: "Test User" })).toBeVisible();
});

test("a wrong password is rejected", async ({ browser, screen }) => {
  const { email } = await signUp();

  await visit(browser, "/login");
  await screen.getByLabel("Email").fill(email);
  await screen.getByLabel("Password").fill("wrong-password");
  await screen.getByRole("main").getByRole("button", { name: "Sign in" }).tap();

  await expect(screen.getByText("Invalid email or password")).toBeVisible();
  await expect(browser).toHaveURL("/login");
});

test("signing out ends the session", async ({ browser, screen }) => {
  await signUpThroughUi(browser, screen);

  await screen.getByRole("button", { name: "Ada" }).tap();
  await screen.getByRole("menuitem", { name: "Sign out" }).tap();
  await expect(screen.getByRole("banner").getByText("Sign in")).toBeVisible();

  await reload(browser);
  await expect(screen.getByRole("banner").getByText("Sign in")).toBeVisible();
  await expect(screen.getByRole("button", { name: "Ada" })).toBeHidden();
});

test("the dark theme survives a reload", async ({ browser, screen }) => {
  await visit(browser, "/");

  await screen.getByRole("button", { name: "Toggle theme" }).tap();
  await screen.getByRole("menuitemradio", { name: "Dark" }).tap();
  const html = browser.locator("html");
  await expect(browser).toHaveClass(html, /\bdark\b/u);

  await reload(browser);
  await expect(browser).toHaveClass(html, /\bdark\b/u);
});
