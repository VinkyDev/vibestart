import { expect, test } from "@playwright/test";

const paths: readonly string[] = ["/"];

for (const path of paths) {
  test.describe(path, () => {
    test("interactive controls wait for hydration", async ({ page }) => {
      // Both drivers need an active page before the gated navigation.
      await page.goto("/", { waitUntil: "networkidle" });
      const assets = Promise.withResolvers<undefined>();

      // Hold real scripts so these assertions reach the server-rendered controls.
      await page.route("**/*", async (route) => {
        if (route.request().resourceType() === "script") {
          await assets.promise;
        }

        await route.continue();
      });

      const navigation = page.goto(path, { waitUntil: "networkidle" });

      const controls = [
        page.getByRole("button", { name: "Toggle theme" }),
        ...(path === "/login"
          ? [
              page.getByLabel("Email"),
              page.getByLabel("Password"),
              page
                .getByRole("main")
                .getByRole("button", { exact: true, name: "Sign in" }),
              page.getByRole("button", { name: "Need an account? Sign up" }),
            ]
          : []),
        ...(path === "/todos" ? [page.getByLabel("New todo")] : []),
      ];

      try {
        await Promise.all(
          controls.map(async (control) => {
            await expect(control).toBeDisabled();
          })
        );
      } finally {
        assets.resolve(undefined);

        try {
          await navigation;
        } finally {
          await page.unroute("**/*");
        }
      }

      await Promise.all(
        controls.map(async (control) => {
          await expect(control).toBeEnabled();
        })
      );

      if (path === "/todos") {
        await page.getByLabel("New todo").fill("Hydrated input");
        await expect(
          page.getByRole("button", { exact: true, name: "Add" })
        ).toBeEnabled();
        await page.getByLabel("New todo").fill("");
      }
    });
  });
}
