import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const visit = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: "networkidle" });
};

test("the home page reports the API as connected", async ({ page }) => {
  await visit(page, "/");

  await expect(page.getByText("Connected")).toBeVisible();
});

test("navigates from home to todos", async ({ page }) => {
  await visit(page, "/");

  await page.getByRole("link", { name: "Todos" }).click();

  await expect(page).toHaveURL("/todos");
  await expect(page.getByLabel("New todo")).toBeVisible();
});

test("creates, completes, persists and deletes a todo", async ({ page }) => {
  const title = `Write e2e test ${crypto.randomUUID()}`;
  await visit(page, "/todos");

  await page.getByLabel("New todo").fill(title);
  await page.getByRole("button", { name: "Add" }).click();
  const todo = page.getByRole("checkbox", { name: title });
  await expect(todo).not.toBeChecked();
  await todo.click();
  await expect(todo).toBeChecked();

  await page.reload({ waitUntil: "networkidle" });
  await expect(todo).toBeChecked();

  await page.getByRole("button", { name: `Delete ${title}` }).click();
  await expect(todo).toHaveCount(0);
});

test("the theme can be switched to dark", async ({ page }) => {
  await visit(page, "/");

  await page.getByRole("button", { name: "Toggle theme" }).click();
  await page.getByRole("menuitemradio", { name: "Dark" }).click();

  await expect(page.locator("html")).toHaveClass(/\bdark\b/u);
});
