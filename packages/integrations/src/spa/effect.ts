import type { Context } from "@vibestart/core";
import { contribute, file } from "@vibestart/core";

import { replaceOnce, templateContent, templateFiles } from "#/templates.ts";
import { agentsMap, readmeLayers, readmeTagline } from "#/vite-plus/slots.ts";
import { homePage } from "#/web-pages.ts";

const spaFiles = (ctx: Context) => {
  const router = "apps/web/src/router.tsx";
  const home = "apps/web/src/routes/index.tsx";

  return [
    ...templateFiles(ctx, "spa/effect", { except: [router] }),
    ...templateFiles(
      ctx,
      ctx.has("better-auth") ? "spa/effect-auth" : "spa/effect-public"
    ),
    file(
      router,
      ctx.has("better-auth")
        ? templateContent(ctx, "spa/effect", router)
        : replaceOnce(
            templateContent(ctx, "spa/effect", router),
            "    context: { session: null },\n",
            "",
            router
          )
    ),
    ...homePage(ctx, home, true),
  ];
};

export const effectSpa = (ctx: Context) => [
  ...templateFiles(ctx, "spa/common", {
    except: ["apps/web/src/router.tsx"],
  }),
  ...spaFiles(ctx),
  contribute(agentsMap, {
    path: "apps/web",
    owns: `React SPA: TanStack Router file routes, Effect Atom clients${ctx.has("better-auth") ? ", Better Auth" : ""}, and browser tests`,
  }),
  contribute(readmeLayers, {
    layer: "Frontend",
    choice: "React 19, TanStack Router, Effect Atom, Tailwind CSS 4",
  }),
  contribute(readmeTagline, "Effect"),
];
