import * as Fly from "@alchemy.run/fly";
import { state } from "@alchemy.run/gcp/StateStore";
import * as Alchemy from "alchemy";
import { Config, Effect } from "effect";

import { releaseImage } from "./infra/image.ts";

export default Alchemy.Stack("my-app", {
  providers: Fly.providers(),
  state: state({ prefix: "fly-machines" }),
}, Effect.gen(function* deploy() {
  const app = yield* Fly.App("App", { orgSlug: yield* Config.String("FLY_ORG") });

  yield* Fly.IpAssignment("PublicIPv4", { app, type: "shared_v4" });

  yield* Fly.Machine("Api", {
    app,
    image: yield* releaseImage,
    region: yield* Config.String("FLY_REGION"),
    services: [{
      protocol: "tcp",
      internalPort: 3000,
      ports: [
        { port: 80, handlers: ["http"], forceHttps: true },
        { port: 443, handlers: ["tls", "http"] },
      ],
      checks: [{ type: "http", path: "/api/health", interval: "15s", timeout: "2s", gracePeriod: "10s" }],
    }],
  });

  return { url: app.url };
}));
