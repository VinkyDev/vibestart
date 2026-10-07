import { test } from "@e2e-dev/web";
import type { Browser } from "@e2e-dev/web";
import { expect } from "e2e";
import type { Screen } from "e2e";

import { createTodo, password, signUp, uniqueEmail } from "../support/api.ts";

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
  await expect(browser).toHaveURL("/todos");
};

test("the home page reports the API as connected", async ({ browser, screen }) => {
  await visit(browser, "/");

  await expect(screen.getByText("Connected")).toBeVisible();
});

test("visitors are sent to sign in before seeing todos", async ({ browser }) => {
  await visit(browser, "/todos");

  await expect(browser).toHaveURL("/login?redirect=%2Ftodos");
});

test("a new user signs up and manages todos that persist across reloads", async ({
  browser,
  screen,
}) => {
  await signUpThroughUi(browser, screen);
  const emptyState = screen.getByText("No todos yet.");
  await expect(emptyState).toBeVisible();

  await screen.getByLabel("New todo").fill("Buy milk");
  await screen.getByRole("button", { name: "Add" }).tap();
  const todo = screen.getByRole("checkbox", { name: "Buy milk" });
  await todo.tap();
  await expect(todo).toBeChecked();

  await reload(browser);
  await expect(todo).toBeChecked();

  await screen.getByRole("button", { name: "Delete Buy milk" }).tap();
  await expect(emptyState).toBeVisible();
});

test("an existing user signs in and returns to the page they asked for", async ({
  browser,
  screen,
}) => {
  const { email, client } = await signUp();
  await createTodo(client, "Existing todo");

  await visit(browser, "/todos");
  await screen.getByLabel("Email").fill(email);
  await screen.getByLabel("Password").fill(password);
  await screen.getByRole("main").getByRole("button", { name: "Sign in" }).tap();

  await expect(browser).toHaveURL("/todos");
  await expect(screen.getByText("Existing todo")).toBeVisible();
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
  await expect(browser).toHaveURL("/");

  await visit(browser, "/todos");
  await expect(browser).toHaveURL("/login?redirect=%2Ftodos");
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
