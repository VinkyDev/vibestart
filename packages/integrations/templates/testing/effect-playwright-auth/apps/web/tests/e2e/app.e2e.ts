import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { createTodo, password, signUp, uniqueEmail } from "../support/api.ts";

const visit = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: "networkidle" });
};

const reload = async (page: Page) => {
  await visit(page, page.url());
};

const gate = (): PromiseWithResolvers<void> => Promise.withResolvers();

const signUpThroughUi = async (page: Page) => {
  await visit(page, "/login");
  await page.getByRole("button", { name: "Need an account? Sign up" }).click();
  await page.getByLabel("Name").fill("Ada");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill(password);
  await page.getByRole("main").getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL("/todos");
};

test("the home page reports the API as connected", async ({
  page,
}) => {
  await visit(page, "/");

  await expect(page.getByText("Connected")).toBeVisible();
});

test("visitors are sent to sign in before seeing todos", async ({
  page,
}) => {
  await visit(page, "/todos");

  await expect(page).toHaveURL("/login?redirect=%2Ftodos");
});

test("a new user signs up and manages todos that persist across reloads", async ({
  page,
}) => {
  await signUpThroughUi(page);
  const emptyState = page.getByText("No todos yet.");
  await expect(emptyState).toBeVisible();

  await page.getByLabel("New todo").fill("Buy milk");
  await page.getByRole("button", { name: "Add" }).click();
  const todo = page.getByRole("checkbox", { name: "Buy milk" });
  await todo.click();
  await expect(todo).toBeChecked();

  await reload(page);
  await expect(todo).toBeChecked();

  await page.getByRole("button", { name: "Delete Buy milk" }).click();
  await expect(emptyState).toBeVisible();
});

test("an existing user signs in and returns to the page they asked for", async ({
  page,
}) => {
  const { cookie, email } = await signUp();
  await createTodo(cookie, "Existing todo");

  await visit(page, "/todos");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/todos");
  await expect(page.getByText("Existing todo")).toBeVisible();
});

test("a wrong password is rejected", async ({ page }) => {
  const { email } = await signUp();

  await visit(page, "/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Invalid email or password")).toBeVisible();
  await expect(page).toHaveURL("/login");
});

test("signing out ends the session", async ({ page }) => {
  await signUpThroughUi(page);

  await page.getByRole("button", { name: "Ada" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/");

  await visit(page, "/todos");
  await expect(page).toHaveURL("/login?redirect=%2Ftodos");
});

test("the dark theme survives a reload", async ({ page }) => {
  await visit(page, "/");

  await page.getByRole("button", { name: "Toggle theme" }).click();
  await page.getByRole("menuitemradio", { name: "Dark" }).click();
  const html = page.locator("html");
  await expect(html).toHaveClass(/\bdark\b/u);

  await reload(page);
  await expect(html).toHaveClass(/\bdark\b/u);
});

test("writes to different rows both complete when their requests overlap", async ({
  page,
}) => {
  await signUpThroughUi(page);

  await page.getByLabel("New todo").fill("First task");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(
    page.getByRole("checkbox", { name: "First task" })
  ).toBeVisible();
  await page.getByLabel("New todo").fill("Second task");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(
    page.getByRole("checkbox", { name: "Second task" })
  ).toBeVisible();

  // Hold the first real request until the second arrives; no timing-dependent sleeps.
  const bothStarted = gate();
  let writes = 0;
  await page.route("**/rpc/", async (route) => {
    if (route.request().postData()?.includes('"tag":"todos.update"') === true) {
      writes += 1;

      if (writes === 2) {
        bothStarted.resolve();
      }

      await bothStarted.promise;
    }

    await route.continue();
  });

  await page.getByRole("checkbox", { name: "First task" }).click();
  await page.getByRole("checkbox", { name: "Second task" }).click();
  await bothStarted.promise;
  await expect(
    page.getByRole("checkbox", { name: "First task" })
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Second task" })
  ).toBeChecked();
  await reload(page);
  await expect(
    page.getByRole("checkbox", { name: "First task" })
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Second task" })
  ).toBeChecked();
});

test("a failed sign-out keeps the session and allows retry", async ({
  page,
}) => {
  await signUpThroughUi(page);
  // Model an unavailable upstream, without replacing the successful auth path.
  await page.route("**/api/auth/sign-out", async (route) => {
    await route.fulfill({ status: 503, json: { message: "Unavailable" } });
  });
  await page.getByRole("button", { name: "Ada" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(
    page.getByText("Could not sign out. Please try again.")
  ).toBeVisible();
  await expect(page).toHaveURL("/todos");
  await expect(page.getByRole("button", { name: "Ada" })).toBeVisible();

  await page.unroute("**/api/auth/sign-out");
  await page.getByRole("button", { name: "Ada" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/");
});

test("a new session never sees the previous user's cached todos", async ({
  page,
}) => {
  await signUpThroughUi(page);
  await page.getByLabel("New todo").fill("Private to the first account");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Private to the first account")).toBeVisible();
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page.getByText("Connected")).toBeVisible();
  await page.getByRole("button", { name: "Ada" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByRole("button", { name: "Ada" })).not.toBeVisible();
  await expect(page.getByText("Connected")).toBeVisible();

  await signUpThroughUi(page);
  await expect(page.getByText("No todos yet.")).toBeVisible();
  await expect(
    page.getByText("Private to the first account")
  ).not.toBeVisible();
});

test("login redirects stay on the app origin after URL normalization", async ({
  page,
}) => {
  const { email } = await signUp();
  const redirect = "/\\example.com";
  await visit(page, `/login?redirect=${encodeURIComponent(redirect)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/todos");

  const expectInternalRedirect = async (value: string) => {
    await visit(page, `/login?redirect=${encodeURIComponent(value)}`);
    await expect(page).toHaveURL("/todos");
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
  test(`creating a todo preserves the draft: ${edit}`, async ({ page }) => {
    await signUpThroughUi(page);
    const input = page.getByLabel("New todo");
    const add = page.getByRole("button", { name: "Add" });
    const started = gate();
    const release = gate();

    await page.route("**/rpc/", async (route) => {
      if (route.request().postData()?.includes('"tag":"todos.create"') === true) {
        started.resolve();
        await release.promise;
      }

      await route.continue();
    });

    try {
      await input.fill("First task");
      await add.click();
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

    await expect(page.getByRole("checkbox", { name: "First task" })).toBeVisible();
    await expect(input).toHaveValue(expected);

    if (edit !== "unchanged") {
      await add.click();
      await expect(page.getByRole("checkbox")).toHaveCount(2);
      await expect(input).toHaveValue("");
    }
  });
}
