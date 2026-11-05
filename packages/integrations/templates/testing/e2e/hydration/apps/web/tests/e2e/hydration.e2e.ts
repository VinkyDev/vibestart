import { test } from "@e2e-dev/web";
import { expect } from "e2e";

const paths: readonly string[] = ["/"];

for (const path of paths) {
  test.describe(path, () => {
    test("interactive controls wait for hydration", async ({
      browser,
      screen,
    }) => {
      // Both drivers need an active page before the gated navigation.
      await browser.goto("/", { waitUntil: "networkidle" });
      const assets = Promise.withResolvers<undefined>();

      // Hold real scripts so these assertions reach the server-rendered controls.
      await browser.route("**/*", async (route) => {
        if (route.request.headers["sec-fetch-dest"] === "script") {
          await assets.promise;
        }

        await route.continue();
      });

      const navigation = browser.goto(path, { waitUntil: "networkidle" });

      const controls = [
        screen.getByRole("button", { name: "Toggle theme" }),
        ...(path === "/login"
          ? [
              screen.getByLabel("Email"),
              screen.getByLabel("Password"),
              screen
                .getByRole("main")
                .getByRole("button", { exact: true, name: "Sign in" }),
              screen.getByRole("button", { name: "Need an account? Sign up" }),
            ]
          : []),
        ...(path === "/todos" ? [screen.getByLabel("New todo")] : []),
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
          await browser.unroute("**/*");
        }
      }

      await Promise.all(
        controls.map(async (control) => {
          await expect(control).toBeEnabled();
        })
      );

      if (path === "/todos") {
        await screen.getByLabel("New todo").fill("Hydrated input");
        await expect(
          screen.getByRole("button", { exact: true, name: "Add" })
        ).toBeEnabled();
        await screen.getByLabel("New todo").fill("");
      }
    });
  });
}
