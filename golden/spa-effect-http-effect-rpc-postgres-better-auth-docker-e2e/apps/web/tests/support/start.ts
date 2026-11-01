import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Effect } from "effect";

import { testServer } from "./server.ts";

NodeRuntime.runMain(
  testServer.pipe(
    Effect.andThen(Effect.never),
    Effect.scoped,
    Effect.provide(NodeServices.layer)
  )
);
