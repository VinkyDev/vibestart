import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { createTodo, password, signUp, uniqueEmail } from "../support/api.ts";

const visit = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: "networkidle" });
};

const signUpThroughUi = async (page: Page) => {
  await visit(page, "/login");
  await page.getByRole("button", { name: "Need an account? Sign up" }).click();
  await page.getByLabel("Name").fill("Ada");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill(password);
  await page.getByRole("main").getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL("/todos");
};

test("the home page reports the API as connected", async ({ page }) => {
  await visit(page, "/");

  await expect(page.getByText("Connected")).toBeVisible();
});

test("visitors are sent to sign in before seeing todos", async ({ page }) => {
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

  await page.reload({ waitUntil: "networkidle" });
  await expect(todo).toBeChecked();

  await page.getByRole("button", { name: "Delete Buy milk" }).click();
  await expect(emptyState).toBeVisible();
});

test("an existing user signs in and returns to the page they asked for", async ({
  page,
}) => {
  const { email, client } = await signUp();
  await createTodo(client, "Existing todo");

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
  await expect(page.locator("html")).toHaveClass(/\bdark\b/u);

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveClass(/\bdark\b/u);
});
