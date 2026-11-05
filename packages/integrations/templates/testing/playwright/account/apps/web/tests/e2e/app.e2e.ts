import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { password, signUp, uniqueEmail } from "../support/api.ts";

const visit = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: "networkidle" });
};

const signUpThroughUi = async (page: Page, name = "Ada") => {
  await visit(page, "/login");
  await page.getByRole("button", { name: "Need an account? Sign up" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill(password);
  await page.getByRole("main").getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL("/");
};

test("the home page reports the API as connected", async ({ page }) => {
  await visit(page, "/");

  await expect(page.getByText("API connected")).toBeVisible();
});

test("a new user signs up and is signed in", async ({ page }) => {
  await signUpThroughUi(page);

  await expect(page.getByRole("button", { name: "Ada" })).toBeVisible();
});

test("an existing user signs in", async ({ page }) => {
  const { email } = await signUp();

  await visit(page, "/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Test User" })).toBeVisible();
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
  await expect(page.getByRole("banner").getByText("Sign in")).toBeVisible();

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("banner").getByText("Sign in")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ada" })).toBeHidden();
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
  await expect(page.locator("html")).toHaveClass(/\bdark\b/u);

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveClass(/\bdark\b/u);
});
