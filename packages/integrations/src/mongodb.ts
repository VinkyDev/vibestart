import {
  contribute,
  defineIntegration,
  gettingStarted,
  renderFile,
} from "@vibestart/core";

import { ormRelease, serverEnv, stackHeadline } from "#/app.ts";
import {
  composeEnv,
  composeServices,
  composeVolumes,
  renderDevCompose,
} from "#/docker.ts";
import { readmeLayers, readmeTagline } from "#/vite-plus/slots.ts";

export const mongodb = defineIntegration({
  contribute: (ctx) => {
    const database = ctx.name.replaceAll("-", "_");

    return [
      contribute(serverEnv, {
        example: `mongodb://localhost:27017/${database}`,
        name: "DATABASE_URL",
        schema: "z.url()",
      }),
      contribute(composeEnv, {
        name: "DATABASE_URL",
        value: `mongodb://db:27017/${database}`,
      }),
      contribute(composeServices, {
        name: "db",
        readyWhen: "service_healthy",
        yaml: `  db:
    image: mongo:8
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.runCommand({ ping: 1 }).ok"]
      interval: 2s
      timeout: 5s
      retries: 30
    ports:
      - "127.0.0.1:27017:27017"
    volumes:
      - db-data:/data/db`,
      }),
      contribute(composeVolumes, "db-data"),
      ...(ctx.has("docker")
        ? []
        : [
            renderFile("docker-compose.yml", (read) =>
              renderDevCompose(ctx, read)
            ),
          ]),
      contribute(readmeTagline, "MongoDB"),
      contribute(stackHeadline, "MongoDB"),
      contribute(readmeLayers, {
        choice: `MongoDB 8, ${ormRelease(ctx)}`,
        layer: "Database",
      }),
      contribute(gettingStarted, {
        run: "docker compose up -d db",
        note: {
          id: "any-mongodb",
          text: "or point DATABASE_URL at any MongoDB",
        },
      }),
    ];
  },
  id: "mongodb",
  kind: "database",
  name: "MongoDB",
  description: "MongoDB server, run by Docker Compose in development",
  homepage: "https://www.mongodb.com",
  provides: ["document-database"],
  requires: ["http-server", "document-orm", "node-runtime"],
});
