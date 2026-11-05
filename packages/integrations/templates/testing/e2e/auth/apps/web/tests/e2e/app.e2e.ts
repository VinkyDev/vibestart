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

const signUpThroughUi = async (
  browser: Browser,
  screen: Screen,
  name = "Ada"
) => {
  await visit(browser, "/login");
  await screen.getByRole("button", { name: "Need an account? Sign up" }).tap();
  await screen.getByLabel("Name").fill(name);
  await screen.getByLabel("Email").fill(uniqueEmail());
  await screen.getByLabel("Password").fill(password);
  await screen.getByRole("main").getByRole("button", { name: "Sign up" }).tap();
  await expect(browser).toHaveURL("/todos");
};

test("the home page reports the API as connected", async ({ browser, screen }) => {
  await visit(browser, "/");

  await expect(screen.getByText("API connected")).toBeVisible();
});

test("visitors are sent to sign in before seeing todos", async ({ browser }) => {
  await visit(browser, "/todos");

  await expect(browser).toHaveURL("/login?redirect=%2Ftodos");
});

test("a new user signs up and manages todos that persist across reloads", async ({
  browser,
  screen,
}) => {
  await browser.setViewport({ height: 667, width: 375 });
  await signUpThroughUi(browser, screen);
  const title = "a".repeat(200);
  const emptyState = screen.getByText("No todos yet.");
  await expect(emptyState).toBeVisible();

  await screen.getByLabel("New todo").fill(title);
  await screen.getByRole("button", { name: "Add" }).tap();
  const todo = screen.getByRole("checkbox", { name: title });
  await todo.tap();
  await expect(todo).toBeChecked();

  await reload(browser);
  await expect(todo).toBeChecked();

  // A string: this test project has no DOM types, and the expression runs in the page.
  const deleteRight = await browser.evaluate<number>(
    `document.querySelector('button[aria-label="Delete ${title}"]').getBoundingClientRect().right`
  );

  expect(deleteRight).toBeLessThanOrEqual(375);

  await screen.getByRole("button", { name: `Delete ${title}` }).tap();
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

  await screen.getByRole("button", { name: "Need an account? Sign up" }).tap();
  await expect(screen.getByText("Invalid email or password")).not.toBeVisible();

  // Validate in the first frame after switching, while an exiting field would still be mounted.
  const valid = await browser.evaluate<boolean>(
    `(async () => {
      const form = document.querySelector("form");
      form.querySelector('button[type="button"]').click();
      await new Promise(requestAnimationFrame);
      return form.checkValidity();
    })()`
  );

  expect(valid).toBe(true);
});

test("signing out ends the session", async ({ browser, screen }) => {
  await signUpThroughUi(browser, screen);

  await screen.getByRole("button", { name: "Ada" }).tap();
  await screen.getByRole("menuitem", { name: "Sign out" }).tap();
  await expect(browser).toHaveURL("/");

  await visit(browser, "/todos");
  await expect(browser).toHaveURL("/login?redirect=%2Ftodos");
});

test("the signed-in header fits a phone", async ({ browser, screen }) => {
  await browser.setViewport({ height: 667, width: 375 });
  await signUpThroughUi(browser, screen, "😀 Ada Augusta King Lovelace");

  await expect(screen.getByRole("button", { name: "😀 Ada Augusta King Lovelace" })).toBeVisible();

  await expect(screen.getByText("😀A", { exact: true })).toBeVisible();

  // A string: this test project has no DOM types, and the expression runs in the page.
  const overflow = await browser.evaluate<number>(
    "document.documentElement.scrollWidth - document.documentElement.clientWidth"
  );

  expect(overflow).toBe(0);
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

for (const redirect of [
  "https://example.com",
  "//example.com",
  "/\\example.com",
  "/\t/example.com",
  "/\r/example.com",
  "/\n/example.com",
]) {
  test.describe(`redirect ${JSON.stringify(redirect)}`, () => {
    test("login redirects stay on the app origin after URL normalization", async ({ browser, screen }) => {
      const { email } = await signUp();
      const path = `/login?redirect=${encodeURIComponent(redirect)}`;
      await visit(browser, path);
      await screen.getByLabel("Email").fill(email);
      await screen.getByLabel("Password").fill(password);
      await screen.getByRole("main").getByRole("button", { name: "Sign in" }).tap();
      await expect(browser).toHaveURL("/todos");
      await expect(screen.getByLabel("New todo")).toBeVisible();

      await visit(browser, path);
      await expect(browser).toHaveURL("/todos");
      // The URL can change while the destination's loader is still running.
      await expect(screen.getByLabel("New todo")).toBeVisible();
    });
  });
}
