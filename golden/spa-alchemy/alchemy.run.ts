import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Alchemy from "alchemy";
import { Effect } from "effect";

export default Alchemy.Stack(
  "my-app",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* website() {
    const site = yield* Cloudflare.Website.StaticSite("Website", {
      command: "vp run --filter @my-app/web build",
      outdir: "apps/web/dist",
      assets: { notFoundHandling: "single-page-application" },
    });

    return { url: site.url };
  })
);
