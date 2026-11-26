import { expect, test } from "@playwright/test";

import { password, signUp } from "../support/api.ts";

test("a revoked session is checked again before opening private todos", async ({
  page,
}) => {
  const { email } = await signUp();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/todos");
  await page.getByRole("link", { name: "Home" }).click();
  await expect(page.getByRole("button", { name: "Test User" })).toBeVisible();

  const status = await page.evaluate<number>(
    'fetch("/api/auth/sign-out", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }).then(response => response.status)'
  );

  expect(status).toBe(200);
  await page.getByRole("link", { name: "Todos" }).click();
  await expect(page).toHaveURL("/login?redirect=%2Ftodos");
  await expect(page.getByRole("banner").getByText("Sign in")).toBeVisible();
});
