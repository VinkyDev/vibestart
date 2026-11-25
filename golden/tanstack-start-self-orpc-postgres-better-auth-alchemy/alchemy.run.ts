import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Alchemy from "alchemy";
import { Config, Effect } from "effect";

export default Alchemy.Stack(
  "my-app",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* website() {
    const site = yield* Cloudflare.Worker("Website", {
      main: "apps/web/dist/server/index.js",
      bundle: false,
      compatibility: {
        date: "2026-10-01",
        flags: ["nodejs_compat", "enable_request_signal"],
      },
      assets: { directory: "apps/web/dist/client" },
      env: {
        HYPERDRIVE: Cloudflare.Hyperdrive.Connection.lookup({
          hyperdriveId: yield* Config.String("HYPERDRIVE_ID"),
        }),
        BETTER_AUTH_SECRET: yield* Config.Redacted("BETTER_AUTH_SECRET"),
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? Cloudflare.Worker.URL,
      },
    });

    return { url: site.url };
  })
);
