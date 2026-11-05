import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const visit = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: "networkidle" });
};

test("the home page reports the API as connected", async ({ page }) => {
  await visit(page, "/");

  await expect(page.getByText("API connected")).toBeVisible();
});

test("navigates from home to todos", async ({ page }) => {
  await visit(page, "/");

  await page.getByRole("link", { name: "Todos" }).click();

  await expect(page).toHaveURL("/todos");
  await expect(page.getByLabel("New todo")).toBeVisible();
});

test("creates, completes, persists and deletes a todo", async ({ page }) => {
  await page.setViewportSize({ height: 667, width: 375 });
  const title = crypto.randomUUID().replaceAll("-", "").repeat(6);
  await visit(page, "/todos");

  await page.getByLabel("New todo").fill(title);
  await page.getByRole("button", { name: "Add" }).click();
  const todo = page.getByRole("checkbox", { name: title });
  await expect(todo).not.toBeChecked();
  await todo.click();
  await expect(todo).toBeChecked();

  await page.reload({ waitUntil: "networkidle" });
  await expect(todo).toBeChecked();

  // A string: this test project has no DOM types, and the expression runs in the page.
  const deleteRight = await page.evaluate<number>(
    `document.querySelector('button[aria-label="Delete ${title}"]').getBoundingClientRect().right`
  );

  expect(deleteRight).toBeLessThanOrEqual(375);

  await page.getByRole("button", { name: `Delete ${title}` }).click();
  await expect(todo).toHaveCount(0);
});

test("the dark theme survives a reload", async ({ page }) => {
  await visit(page, "/");

  await page.getByRole("button", { name: "Toggle theme" }).click();
  await page.getByRole("menuitemradio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/u);

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveClass(/\bdark\b/u);
});
