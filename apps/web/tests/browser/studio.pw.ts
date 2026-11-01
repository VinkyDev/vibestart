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
  await page.getByRole("button", { name: /When to use Effect\?/u }).click();
  await expect(
    page.getByRole("dialog", { name: "Standard vs. Effect" })
  ).toBeVisible();
  await page
    .getByRole("link", { name: "See full comparison", exact: true })
    .click();
  await expect(page).toHaveURL(/\/docs\/stack\/effect$/u);
  await expect(
    page.getByRole("heading", { level: 1, name: "Effect mode" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "How to choose: Standard vs. Effect",
    })
  ).toBeVisible();
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
          ? "**/previews/spa-effect-http-effect-rpc-*.json"
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

test("selects Effect testing and removes persistence through the picker", async ({
  page,
}) => {
  await page.goto(
    "/studio?mode=effect&database=sqlite&auth=better-auth&testing=e2e"
  );
  await page
    .getByRole("button", { name: /End-to-end tests.*TesterArmy e2e/u })
    .click();
  await page.getByRole("button", { name: /^Playwright/u }).click();
  await expect(
    page.getByRole("button", { name: /End-to-end tests.*Playwright/u })
  ).toBeVisible();
  await page.getByRole("button", { name: /Auth.*Better Auth/u }).click();
  await page.getByRole("button", { name: /^No auth/u }).click();
  await expect(
    page.getByRole("button", { name: /Auth.*Better Auth/u })
  ).toHaveCount(0);
  await page.getByRole("button", { name: /Database.*SQLite/u }).click();
  await page.getByRole("button", { name: /^No database/u }).click();
  await expect(
    page.getByRole("button", { name: /Database.*SQLite/u })
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Database.*SQLite/u })
  ).toHaveCount(0);
  await expect(page.locator("main")).toContainText("Effect RPC");
  await page.screenshot({
    path: test.info().outputPath("effect-stateless.png"),
    fullPage: true,
    animations: "disabled",
  });
});

test("composes Effect on the home page and opens it in Studio", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("radiogroup", { name: "Backend", exact: true })
    .getByText("Effect HTTP", { exact: true })
    .click();
  await expect(page).toHaveURL(/mode=effect/u);
  await expect(page.locator("main")).toContainText("--mode effect");
  await expect(page.locator("main")).toContainText(
    "Adjusted to fit: Mode → Effect and API → Effect RPC"
  );
  await page.getByRole("link", { name: "Open in Studio", exact: true }).click();
  await expect(page).toHaveURL(/\/studio\?.*mode=effect/u);
  await expect(
    page
      .getByRole("group", { name: "Mode", exact: true })
      .getByRole("button", { name: "Effect", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
});
