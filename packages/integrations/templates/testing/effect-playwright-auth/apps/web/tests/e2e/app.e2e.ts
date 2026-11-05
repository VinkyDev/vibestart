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

const signUpThroughUi = async (page: Page, name = "Ada") => {
  await visit(page, "/login");
  await page.getByRole("button", { name: "Need an account? Sign up" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill(password);
  await page.getByRole("main").getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL("/todos");
};

test("the home page reports the API as connected", async ({
  page,
}) => {
  await visit(page, "/");

  await expect(page.getByText("API connected")).toBeVisible();
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
  await page.setViewportSize({ height: 667, width: 375 });
  await signUpThroughUi(page);
  const title = "a".repeat(200);
  const emptyState = page.getByText("No todos yet.");
  await expect(emptyState).toBeVisible();

  await page.getByLabel("New todo").fill(title);
  await page.getByRole("button", { name: "Add" }).click();
  const todo = page.getByRole("checkbox", { name: title });
  await todo.click();
  await expect(todo).toBeChecked();

  await reload(page);
  await expect(todo).toBeChecked();

  // A string: this test project has no DOM types, and the expression runs in the page.
  const deleteRight = await page.evaluate<number>(
    `document.querySelector('button[aria-label="Delete ${title}"]').getBoundingClientRect().right`
  );

  expect(deleteRight).toBeLessThanOrEqual(375);

  await page.getByRole("button", { name: `Delete ${title}` }).click();
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

  await page.getByRole("button", { name: "Need an account? Sign up" }).click();
  await expect(page.getByText("Invalid email or password")).not.toBeVisible();

  // Validate in the first frame after switching, while an exiting field would still be mounted.
  const valid = await page.evaluate<boolean>(
    `(async () => {
      const form = document.querySelector("form");
      form.querySelector('button[type="button"]').click();
      await new Promise(requestAnimationFrame);
      return form.checkValidity();
    })()`
  );

  expect(valid).toBe(true);
});

test("signing out ends the session", async ({ page }) => {
  await signUpThroughUi(page);

  await page.getByRole("button", { name: "Ada" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/");

  await visit(page, "/todos");
  await expect(page).toHaveURL("/login?redirect=%2Ftodos");
});

test("the signed-in header fits a phone", async ({ page }) => {
  await page.setViewportSize({ height: 667, width: 375 });
  await signUpThroughUi(page, "😀 Ada Augusta King Lovelace");

  await expect(page.getByRole("button", { name: "😀 Ada Augusta King Lovelace" })).toBeVisible();

  await expect(page.getByText("😀A", { exact: true })).toBeVisible();

  // A string: this test project has no DOM types, and the expression runs in the page.
  const overflow = await page.evaluate<number>(
    "document.documentElement.scrollWidth - document.documentElement.clientWidth"
  );

  expect(overflow).toBe(0);
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
  await expect(page.getByText("API connected")).toBeVisible();
  await page.getByRole("button", { name: "Ada" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByRole("button", { name: "Ada" })).not.toBeVisible();
  await expect(page.getByText("API connected")).toBeVisible();

  await signUpThroughUi(page);
  await expect(page.getByText("No todos yet.")).toBeVisible();
  await expect(
    page.getByText("Private to the first account")
  ).not.toBeVisible();
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
    test("login redirects stay on the app origin after URL normalization", async ({ page }) => {
      const { email } = await signUp();
      const path = `/login?redirect=${encodeURIComponent(redirect)}`;
      await visit(page, path);
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
      await expect(page).toHaveURL("/todos");
      await expect(page.getByLabel("New todo")).toBeVisible();

      await visit(page, path);
      await expect(page).toHaveURL("/todos");
      // The URL can change while the destination's loader is still running.
      await expect(page.getByLabel("New todo")).toBeVisible();
    });
  });
}

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
