import { expect, test } from "@playwright/test";

test("switches independent modes and restores them through browser history", async ({
  page,
}) => {
  await page.goto("/studio");
  const mode = page.getByRole("group", { name: "Mode", exact: true });
  await expect(
    mode.getByRole("button", { name: "Standard", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await mode.getByRole("button", { name: "Effect", exact: true }).click();
  await expect(page).toHaveURL(/mode=effect/u);
  await expect(
    mode.getByRole("button", { name: "Effect", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("main")).toContainText("--mode effect");
  await expect(page.locator("main")).toContainText("Effect HTTP");
  await expect(page.locator("main")).toContainText("Effect RPC");
  await expect(page.locator("main")).not.toContainText("Hono");
  await expect(page.locator("main")).not.toContainText("Expo");
  await expect(page.locator("main")).not.toContainText("Electron");
  await page.goBack();
  await expect(
    mode.getByRole("button", { name: "Standard", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("main")).toContainText("Hono");
  await page.goForward();
  await expect(
    mode.getByRole("button", { name: "Effect", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({
    path: test.info().outputPath("effect-studio.png"),
    fullPage: true,
    animations: "disabled",
  });
});

test("keeps an incompatible deep link inside Effect mode", async ({ page }) => {
  await page.goto("/studio?mode=effect&api=orpc&framework=next");
  await expect(page.locator("main")).toContainText("Effect RPC");
  await expect(page.locator("main")).not.toContainText("oRPC");
  await expect(page.locator("main")).not.toContainText("Next.js");
});

for (const locale of ["en", "zh"] as const) {
  for (const mode of ["standard", "effect"] as const) {
    test(`recovers from a preview failure in ${mode} mode (${locale})`, async ({
      page,
    }) => {
      await page.addInitScript((language) => {
        localStorage.setItem("PARAGLIDE_LOCALE", language);
      }, locale);

      const text =
        locale === "en"
          ? {
              title: "Could not load the preview",
              retry: "Try again",
              home: "Back to home",
              docs: "Docs",
            }
          : {
              title: "无法加载项目预览",
              retry: "重试",
              home: "回到首页",
              docs: "文档",
            };

      let requests = 0;

      const preview =
        mode === "effect"
          ? "**/previews/spa-effect-http-effect-rpc-postgres-better-auth-e2e.json"
          : "**/previews/*.json";

      if (mode === "effect") {
        await page.goto("/studio?packageManager=bun&addons=knip");
        await expect(
          page.getByRole("group", {
            name: locale === "en" ? "Mode" : "模式",
            exact: true,
          })
        ).toBeVisible();
      }

      // Fail the real preview transport twice; recovery must use the same loader.
      await page.route(preview, async (route) => {
        requests += 1;

        await (requests <= 2
          ? route.fulfill({ status: 503, body: "Unavailable" })
          : route.continue());
      });

      await (mode === "effect"
        ? page
            .getByRole("group", {
              name: locale === "en" ? "Mode" : "模式",
              exact: true,
            })
            .getByRole("button", { name: "Effect", exact: true })
            .click()
        : page.goto("/studio?packageManager=bun&addons=knip"));

      await expect(
        page.getByRole("heading", { name: text.title })
      ).toBeVisible();
      const url = page.url();
      await expect(
        page
          .getByRole("banner")
          .getByRole("link", { name: "vibestart", exact: true })
      ).toBeVisible();
      await expect(
        page
          .getByRole("banner")
          .getByRole("link", { name: text.docs, exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: text.home, exact: true })
      ).toHaveAttribute("href", "/");
      await page.screenshot({
        path: test.info().outputPath("preview-error.png"),
        fullPage: true,
        animations: "disabled",
      });
      await page.getByRole("button", { name: text.retry, exact: true }).click();
      await expect.poll(() => requests).toBe(2);
      await expect(
        page.getByRole("heading", { name: text.title })
      ).toBeVisible();
      await page.getByRole("button", { name: text.retry, exact: true }).click();
      await expect(
        page.getByRole("group", {
          name: locale === "en" ? "Mode" : "模式",
          exact: true,
        })
      ).toBeVisible();
      await expect(page).toHaveURL(url);
      await expect(page.locator("main")).toContainText("bunx");
      await expect(page.getByRole("heading", { name: text.title })).toHaveCount(
        0
      );
    });
  }
}
