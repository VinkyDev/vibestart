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

const gate = (): PromiseWithResolvers<void> => Promise.withResolvers();

const signUpThroughUi = async (browser: Browser, screen: Screen) => {
  await visit(browser, "/login");
  await screen.getByRole("button", { name: "Need an account? Sign up" }).tap();
  await screen.getByLabel("Name").fill("Ada");
  await screen.getByLabel("Email").fill(uniqueEmail());
  await screen.getByLabel("Password").fill(password);
  await screen.getByRole("main").getByRole("button", { name: "Sign up" }).tap();
  await expect(browser).toHaveURL("/todos");
};

test("the home page reports the API as connected", async ({
  browser,
  screen,
}) => {
  await visit(browser, "/");

  await expect(screen.getByText("Connected")).toBeVisible();
});

test("visitors are sent to sign in before seeing todos", async ({
  browser,
}) => {
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
  const { cookie, email } = await signUp();
  await createTodo(cookie, "Existing todo");

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

test("writes to different rows both complete when their requests overlap", async ({
  browser,
  screen,
}) => {
  await signUpThroughUi(browser, screen);

  await screen.getByLabel("New todo").fill("First task");
  await screen.getByRole("button", { name: "Add" }).tap();
  await expect(
    screen.getByRole("checkbox", { name: "First task" })
  ).toBeVisible();
  await screen.getByLabel("New todo").fill("Second task");
  await screen.getByRole("button", { name: "Add" }).tap();
  await expect(
    screen.getByRole("checkbox", { name: "Second task" })
  ).toBeVisible();

  // Hold the first real request until the second arrives; no timing-dependent sleeps.
  const bothStarted = gate();
  let writes = 0;
  await browser.route("**/rpc/", async (route) => {
    if (route.request.postData?.includes('"tag":"todos.update"') === true) {
      writes += 1;

      if (writes === 2) {
        bothStarted.resolve();
      }

      await bothStarted.promise;
    }

    await route.continue();
  });

  await screen.getByRole("checkbox", { name: "First task" }).tap();
  await screen.getByRole("checkbox", { name: "Second task" }).tap();
  await bothStarted.promise;
  await expect(
    screen.getByRole("checkbox", { name: "First task" })
  ).toBeChecked();
  await expect(
    screen.getByRole("checkbox", { name: "Second task" })
  ).toBeChecked();
  await reload(browser);
  await expect(
    screen.getByRole("checkbox", { name: "First task" })
  ).toBeChecked();
  await expect(
    screen.getByRole("checkbox", { name: "Second task" })
  ).toBeChecked();
});

test("a failed sign-out keeps the session and allows retry", async ({
  browser,
  screen,
}) => {
  await signUpThroughUi(browser, screen);
  // Model an unavailable upstream, without replacing the successful auth path.
  await browser.route("**/api/auth/sign-out", async (route) => {
    await route.fulfill({ status: 503, json: { message: "Unavailable" } });
  });
  await screen.getByRole("button", { name: "Ada" }).tap();
  await screen.getByRole("menuitem", { name: "Sign out" }).tap();
  await expect(
    screen.getByText("Could not sign out. Please try again.")
  ).toBeVisible();
  await expect(browser).toHaveURL("/todos");
  await expect(screen.getByRole("button", { name: "Ada" })).toBeVisible();

  await browser.unroute("**/api/auth/sign-out");
  await screen.getByRole("button", { name: "Ada" }).tap();
  await screen.getByRole("menuitem", { name: "Sign out" }).tap();
  await expect(browser).toHaveURL("/");
});

test("a new session never sees the previous user's cached todos", async ({
  browser,
  screen,
}) => {
  await signUpThroughUi(browser, screen);
  await screen.getByLabel("New todo").fill("Private to the first account");
  await screen.getByRole("button", { name: "Add" }).tap();
  await expect(screen.getByText("Private to the first account")).toBeVisible();
  await screen.getByRole("link", { name: "Home", exact: true }).tap();
  await expect(screen.getByText("Connected")).toBeVisible();
  await screen.getByRole("button", { name: "Ada" }).tap();
  await screen.getByRole("menuitem", { name: "Sign out" }).tap();
  await expect(screen.getByRole("button", { name: "Ada" })).not.toBeVisible();
  await expect(screen.getByText("Connected")).toBeVisible();

  await signUpThroughUi(browser, screen);
  await expect(screen.getByText("No todos yet.")).toBeVisible();
  await expect(
    screen.getByText("Private to the first account")
  ).not.toBeVisible();
});

test("login redirects stay on the app origin after URL normalization", async ({
  browser,
  screen,
}) => {
  const { email } = await signUp();
  const redirect = "/\\example.com";
  await visit(browser, `/login?redirect=${encodeURIComponent(redirect)}`);
  await screen.getByLabel("Email").fill(email);
  await screen.getByLabel("Password").fill(password);
  await screen.getByRole("main").getByRole("button", { name: "Sign in" }).tap();
  await expect(browser).toHaveURL("/todos");

  const expectInternalRedirect = async (value: string) => {
    await visit(browser, `/login?redirect=${encodeURIComponent(value)}`);
    await expect(browser).toHaveURL("/todos");
  };

  await expectInternalRedirect("https://example.com");
  await expectInternalRedirect("//example.com");
  await expectInternalRedirect("/\\example.com");
  await expectInternalRedirect("/\t/example.com");
  await expectInternalRedirect("/\r/example.com");
  await expectInternalRedirect("/\n/example.com");
});

for (const { edit, expected } of [
  { edit: "unchanged", expected: "" },
  { edit: "next todo", expected: "Next task" },
  { edit: "same title", expected: "First task" },
]) {
  test(`creating a todo preserves the draft: ${edit}`, async ({ browser, screen }) => {
    await signUpThroughUi(browser, screen);
    const input = screen.getByLabel("New todo");
    const add = screen.getByRole("button", { name: "Add" });
    const started = gate();
    const release = gate();

    await browser.route("**/rpc/", async (route) => {
      if (route.request.postData?.includes('"tag":"todos.create"') === true) {
        started.resolve();
        await release.promise;
      }

      await route.continue();
    });

    try {
      await input.fill("First task");
      await add.tap();
      await started.promise;

      if (edit !== "unchanged") {
        await input.fill("Next task");
      }

      if (edit === "same title") {
        await input.fill("First task");
      }
    } finally {
      release.resolve();
    }

    await expect(screen.getByRole("checkbox", { name: "First task" })).toBeVisible();
    await expect(input).toHaveValue(expected);

    if (edit !== "unchanged") {
      await add.tap();
      await expect(screen.getByRole("checkbox")).toHaveCount(2);
      await expect(input).toHaveValue("");
    }
  });
}
