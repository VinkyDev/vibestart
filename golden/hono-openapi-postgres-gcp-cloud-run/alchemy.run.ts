import * as GCP from "@alchemy.run/gcp";
import * as Alchemy from "alchemy";
import type { Layer } from "effect";
import { Config, Effect } from "effect";

import { releaseImage } from "./infra/image.ts";
import { migrate } from "./infra/migration.ts";

// The beta.87 provider bundle erases its service types. Keep that boundary local.
const providers: Layer.Layer<unknown> = GCP.providers();

export default Alchemy.Stack(
  "my-app",
  {
    providers,
    state: GCP.state({ prefix: "cloud-run" }),
  },
  Effect.gen(function* deploy() {
    const location = yield* Config.String("RUN_REGION");
    const image = yield* releaseImage;

    const migration = yield* migrate(image, location);

    const service = yield* GCP.Run.Service("Api", {
      location,
      invokerIamDisabled: true,
      template: {
        serviceAccount: migration.serviceAccount,
        containers: [
          {
            image: migration.image,
            env: migration.env,
            ports: [{ containerPort: 3000 }],
            startupProbe: { httpGet: { path: "/api/health", port: 3000 } },
          },
        ],
      },
    });

    return { url: service.uri };
  })
);
