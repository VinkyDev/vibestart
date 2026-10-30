import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Config, Layer } from "effect";
import { HttpRouter, HttpStaticServer } from "effect/http";

import { Routes } from "@my-app/api";
import { Auth } from "@my-app/auth";
import { Database } from "@my-app/db";

const publicDir = fileURLToPath(new URL("public", import.meta.url));

// The production image serves the web build beside the API; in development Vite serves it and proxies here.
const StaticRoutes = existsSync(publicDir)
  ? HttpStaticServer.layer({ root: publicDir, spa: true })
  : Layer.empty;

const HttpLive = HttpRouter.serve(Layer.mergeAll(Routes, StaticRoutes)).pipe(
  Layer.provide([Database.layerConfig, Auth.layerConfig]),
  Layer.provide(
    NodeHttpServer.layerConfig(createServer, {
      port: Config.Port("PORT").pipe(Config.withDefault(3000)),
    })
  )
);

NodeRuntime.runMain(Layer.launch(HttpLive));
