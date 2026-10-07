import { test } from "@e2e-dev/web";
import type { Browser } from "@e2e-dev/web";
import { expect } from "e2e";

const visit = async (browser: Browser, path: string) => {
  await browser.goto(path, { waitUntil: "networkidle" });
};

// `browser.reload()` takes no `waitUntil`, so a reload is a visit to the current URL.
const reload = async (browser: Browser) => {
  await visit(browser, await browser.url());
};

test("the home page reports the API as connected", async ({ browser, screen }) => {
  await visit(browser, "/");

  await expect(screen.getByText("Connected")).toBeVisible();
});

test("navigates from home to todos", async ({ browser, screen }) => {
  await visit(browser, "/");

  await screen.getByRole("link", { name: "Todos" }).tap();

  await expect(browser).toHaveURL("/todos");
  await expect(screen.getByLabel("New todo")).toBeVisible();
});

test("creates, completes, persists and deletes a todo", async ({ browser, screen }) => {
  const title = `Write e2e test ${crypto.randomUUID()}`;
  await visit(browser, "/todos");

  await screen.getByLabel("New todo").fill(title);
  await screen.getByRole("button", { name: "Add" }).tap();
  const todo = screen.getByRole("checkbox", { name: title });
  await expect(todo).not.toBeChecked();
  await todo.tap();
  await expect(todo).toBeChecked();

  await reload(browser);
  await expect(todo).toBeChecked();

  await screen.getByRole("button", { name: `Delete ${title}` }).tap();
  await expect(todo).toHaveCount(0);
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
