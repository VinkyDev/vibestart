import type {
  AddonInfo,
  GettingStartedNote,
  IntegrationInfo,
} from "@vibestart/core";

import { m } from "#/paraglide/messages.js";
import { getLocale } from "#/paraglide/runtime.js";

export const list = (
  type: Intl.ListFormatType,
  items: readonly string[]
): string => new Intl.ListFormat(getLocale(), { type }).format(items);

const translate = (
  messages: Readonly<Record<string, () => string>>,
  id: string
) => {
  const message = Object.hasOwn(messages, id) ? messages[id] : undefined;
  if (message === undefined) {
    throw new Error(`No message for ${id}`);
  }
  return message();
};

const capabilityPhrases = {
  "frontend-framework": () => m.cap_frontend_framework(),
  "fullstack-framework": () => m.cap_fullstack_framework(),
  "hono-server": () => m.cap_hono_server(),
  "http-server": () => m.cap_http_server(),
  "node-runtime": () => m.cap_node_runtime(),
  react: () => m.cap_react(),
  router: () => m.cap_router(),
  rpc: () => m.cap_rpc(),
  "single-page-app": () => m.cap_single_page_app(),
  "sql-database": () => m.cap_sql_database(),
  "sql-orm": () => m.cap_sql_orm(),
  "ui-components": () => m.cap_ui_components(),
};

export const capabilityText = (id: string) => translate(capabilityPhrases, id);

const kindLabels = {
  api: () => m.kind_api(),
  auth: () => m.kind_auth(),
  backend: () => m.kind_backend(),
  database: () => m.kind_database(),
  deployment: () => m.kind_deployment(),
  desktop: () => m.kind_desktop(),
  framework: () => m.kind_framework(),
  frontend: () => m.kind_frontend(),
  orm: () => m.kind_orm(),
  router: () => m.kind_router(),
  runtime: () => m.kind_runtime(),
  testing: () => m.kind_testing(),
  toolchain: () => m.kind_toolchain(),
  ui: () => m.kind_ui(),
};

export const kindLabel = (kind: string) => translate(kindLabels, kind);

const descriptions = {
  "better-auth": () => m.desc_better_auth(),
  bun: () => m.desc_bun(),
  docker: () => m.desc_docker(),
  drizzle: () => m.desc_drizzle(),
  electron: () => m.desc_electron(),
  hono: () => m.desc_hono(),
  next: () => m.desc_next(),
  node: () => m.desc_node(),
  openapi: () => m.desc_openapi(),
  orpc: () => m.desc_orpc(),
  postgres: () => m.desc_postgres(),
  react: () => m.desc_react(),
  self: () => m.desc_self(),
  shadcn: () => m.desc_shadcn(),
  spa: () => m.desc_spa(),
  sqlite: () => m.desc_sqlite(),
  "tanstack-router": () => m.desc_tanstack_router(),
  "tanstack-start": () => m.desc_tanstack_start(),
  "vite-plus": () => m.desc_vite_plus(),
  "vitest-playwright": () => m.desc_vitest_playwright(),
};

export const integrationDescription = (integration: IntegrationInfo) =>
  translate(descriptions, integration.id);

export const addonDescription = (addon: AddonInfo) =>
  translate(
    {
      knip: () => m.addon_desc_knip(),
      ultracite: () => m.addon_desc_ultracite(),
    },
    addon.id
  );

export const noteText = ({ id, values }: GettingStartedNote) =>
  translate(
    {
      "any-postgres": () => m.note_any_postgres(),
      "auth-secret": () => m.note_auth_secret(),
      "sqlite-file": () => m.note_sqlite_file({ path: values?.path ?? "" }),
    },
    id
  );

const units = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
] as const;

export const relativeTime = (iso: string) => {
  const elapsed = Date.parse(iso) - Date.now();
  const format = new Intl.RelativeTimeFormat(getLocale(), { numeric: "auto" });
  for (const [unit, milliseconds] of units) {
    if (Math.abs(elapsed) >= milliseconds) {
      return format.format(Math.round(elapsed / milliseconds), unit);
    }
  }
  return m.just_now();
};
