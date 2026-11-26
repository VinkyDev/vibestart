import { test } from "@e2e-dev/web";
import { expect } from "e2e";

import { password, signUp } from "../support/api.ts";

test("a revoked session is checked again before opening private todos", async ({ browser, screen }) => {
  const { email } = await signUp();

  await browser.goto("/login");
  await screen.getByLabel("Email").fill(email);
  await screen.getByLabel("Password").fill(password);
  await screen.getByRole("main").getByRole("button", { name: "Sign in" }).tap();
  await expect(browser).toHaveURL("/todos");
  await screen.getByRole("link", { name: "Home" }).tap();
  await expect(screen.getByRole("button", { name: "Test User" })).toBeVisible();

  const status = await browser.evaluate<number>(
    'fetch("/api/auth/sign-out", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }).then(response => response.status)'
  );

  expect(status).toBe(200);
  await screen.getByRole("link", { name: "Todos" }).tap();
  await expect(browser).toHaveURL("/login?redirect=%2Ftodos");
  await expect(screen.getByRole("banner").getByText("Sign in")).toBeVisible();
});
