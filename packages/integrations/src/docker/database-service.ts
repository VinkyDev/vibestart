import type { Context, ReadSlot } from "@vibestart/core";
import { contribute, renderFile } from "@vibestart/core";

import { composeEnv, composeServices, composeVolumes } from "#/docker/slots.ts";
import { serverEnv } from "#/server-environment.ts";

const renderDevCompose = (ctx: Context, read: ReadSlot) => {
  const volumes = read(composeVolumes);

  return `${[
    `name: ${ctx.name}`,
    ["services:", ...read(composeServices).map((service) => service.yaml)].join(
      "\n\n"
    ),
    ...(volumes.length > 0
      ? [["volumes:", ...volumes.map((volume) => `  ${volume}:`)].join("\n")]
      : []),
  ].join("\n\n")}\n`;
};

export const databaseService = (
  ctx: Context,
  url: (host: string) => string,
  yaml: string
) => [
  contribute(serverEnv, {
    name: "DATABASE_URL",
    schema: "z.url()",
    example: url("localhost"),
  }),
  contribute(composeEnv, { name: "DATABASE_URL", value: url("db") }),
  contribute(composeServices, {
    name: "db",
    readyWhen: "service_healthy",
    yaml,
  }),
  contribute(composeVolumes, "db-data"),
  ...(ctx.has("docker")
    ? []
    : [
        renderFile("docker-compose.yml", (read) => renderDevCompose(ctx, read)),
      ]),
];
