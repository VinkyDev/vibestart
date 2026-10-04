import type { Change } from "@vibestart/core";

import { kindLabel } from "#/lib/i18n.ts";
import type { Decision } from "#/lib/stack.ts";
import { addonOf, integrationOf, isDecision } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

export type Group = Decision | "foundation";

export const roles: Record<
  Decision,
  {
    readonly role: string;
    readonly question: string;
    readonly about: string;
    readonly none: string;
  }
> = {
  runtime: {
    get role() {
      return m.kind_runtime();
    },
    get question() {
      return m.runtime_question();
    },
    get about() {
      return m.runtime_about();
    },
    get none() {
      return m.runtime_none();
    },
  },
  api: {
    get about() {
      return m.role_api_about();
    },
    get none() {
      return m.role_api_none();
    },
    get question() {
      return m.role_api_question();
    },
    get role() {
      return m.role_api();
    },
  },
  auth: {
    get about() {
      return m.role_auth_about();
    },
    get none() {
      return m.role_auth_none();
    },
    get question() {
      return m.role_auth_question();
    },
    get role() {
      return m.role_auth();
    },
  },
  backend: {
    get about() {
      return m.role_backend_about();
    },
    get none() {
      return m.role_backend_none();
    },
    get question() {
      return m.role_backend_question();
    },
    get role() {
      return m.role_backend();
    },
  },
  database: {
    get about() {
      return m.role_database_about();
    },
    get none() {
      return m.role_database_none();
    },
    get question() {
      return m.role_database_question();
    },
    get role() {
      return m.role_database();
    },
  },
  desktop: {
    get about() {
      return m.role_desktop_about();
    },
    get none() {
      return m.role_desktop_none();
    },
    get question() {
      return m.role_desktop_question();
    },
    get role() {
      return m.role_desktop();
    },
  },
  deployment: {
    get about() {
      return m.role_deployment_about();
    },
    get none() {
      return m.role_deployment_none();
    },
    get question() {
      return m.role_deployment_question();
    },
    get role() {
      return m.role_deployment();
    },
  },
  framework: {
    get about() {
      return m.role_framework_about();
    },
    get none() {
      return m.role_framework_none();
    },
    get question() {
      return m.role_framework_question();
    },
    get role() {
      return m.role_framework();
    },
  },
};

const noneNames: Record<Decision, () => string> = {
  runtime: () => m.runtime_none(),
  api: () => m.none_api(),
  auth: () => m.none_auth(),
  backend: () => m.none_backend(),
  database: () => m.none_database(),
  desktop: () => m.none_desktop(),
  deployment: () => m.none_deployment(),
  framework: () => m.none_framework(),
};

export const noneName = (kind: Decision) => noneNames[kind]();

export const changeText = ({ kind, to }: Change) => {
  if (isDecision(kind)) {
    return to === null
      ? noneName(kind)
      : `${roles[kind].role} → ${integrationOf(to).name}`;
  }
  return `${kindLabel(kind)} → ${to === null ? m.none_token() : integrationOf(to).name}`;
};

const addLabels: Record<Decision, () => string> = {
  runtime: () => m.runtime_none(),
  api: () => m.add_api(),
  auth: () => m.add_auth(),
  backend: () => m.add_backend(),
  database: () => m.add_database(),
  desktop: () => m.add_desktop(),
  deployment: () => m.add_deployment(),
  framework: () => m.add_framework(),
};

export const addLabel = (kind: Decision) => addLabels[kind]();

const fits = {
  bun: () => m.fit_bun(),
  node: () => m.fit_node(),
  "better-auth": () => m.fit_better_auth(),
  docker: () => m.fit_docker(),
  electron: () => m.fit_electron(),
  hono: () => m.fit_hono(),
  next: () => m.fit_next(),
  openapi: () => m.fit_openapi(),
  orpc: () => m.fit_orpc(),
  postgres: () => m.fit_postgres(),
  self: () => m.fit_self(),
  spa: () => m.fit_spa(),
  sqlite: () => m.fit_sqlite(),
  "tanstack-start": () => m.fit_tanstack_start(),
} satisfies Record<string, () => string>;

const noneFits: Record<Decision, () => string> = {
  runtime: () => m.runtime_none(),
  api: () => m.fit_none_api(),
  auth: () => m.fit_none_auth(),
  backend: () => m.fit_none_backend(),
  database: () => m.fit_none_database(),
  desktop: () => m.fit_none_desktop(),
  deployment: () => m.fit_none_deployment(),
  framework: () => m.fit_none_framework(),
};

const hasFit = (id: string): id is keyof typeof fits => Object.hasOwn(fits, id);

export const fitOf = (kind: Decision, id: string | null): string => {
  if (id === null) {
    return noneFits[kind]();
  }
  if (!hasFit(id)) {
    throw new Error(`No fit for ${id}`);
  }
  return fits[id]();
};

const groupOfKind = {
  api: "api",
  auth: "auth",
  backend: "backend",
  database: "database",
  deployment: "deployment",
  desktop: "desktop",
  framework: "framework",
  frontend: "framework",
  orm: "database",
  router: "framework",
  runtime: "backend",
  testing: "foundation",
  toolchain: "foundation",
  ui: "framework",
} as const satisfies Record<string, Group>;

const isMappedKind = (kind: string): kind is keyof typeof groupOfKind =>
  Object.hasOwn(groupOfKind, kind);

export const groupOf = (owner: string): Group => {
  if (owner === "core" || addonOf(owner) !== undefined) {
    return "foundation";
  }
  const { kind } = integrationOf(owner);
  if (isMappedKind(kind)) {
    return groupOfKind[kind];
  }
  return "foundation";
};

export const ownerName = (owner: string) =>
  owner === "core"
    ? "vibestart"
    : (addonOf(owner)?.name ?? integrationOf(owner).name);

export const tintClass: Record<Group, string> = {
  api: "tint-api",
  auth: "tint-auth",
  backend: "tint-backend",
  database: "tint-database",
  deployment: "tint-deployment",
  desktop: "tint-desktop",
  foundation: "tint-foundation",
  runtime: "tint-backend",
  framework: "tint-framework",
};

export const flagTintClass = (kind: Decision | "addons" | "package-manager") =>
  tintClass[
    kind === "addons" || kind === "package-manager" ? "foundation" : kind
  ];
