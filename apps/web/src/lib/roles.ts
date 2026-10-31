import type { Change } from "@vibestart/core";

import { kindLabel } from "#/lib/i18n.ts";
import type { Decision, OptionalDecision } from "#/lib/stack.ts";
import {
  addonOf,
  integrationOf,
  isDecision,
  isOptionalDecision,
} from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

export type Group = Decision | "foundation";

interface Role {
  readonly role: string;
  readonly question: string;
  readonly about: string;
}

export const roles = {
  testing: {
    get role() {
      return m.kind_testing();
    },
    get question() {
      return m.testing_question();
    },
    get about() {
      return m.testing_about();
    },
  },
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
  orm: {
    get role() {
      return m.kind_orm();
    },
    get question() {
      return m.orm_question();
    },
    get about() {
      return m.orm_about();
    },
    get none() {
      return m.orm_none();
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
  mobile: {
    get about() {
      return m.role_mobile_about();
    },
    get none() {
      return m.role_mobile_none();
    },
    get question() {
      return m.role_mobile_question();
    },
    get role() {
      return m.role_mobile();
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
} satisfies Record<Decision, Role> &
  Record<OptionalDecision, { readonly none: string }>;

const noneNames: Record<OptionalDecision, () => string> = {
  runtime: () => m.runtime_none(),
  orm: () => m.orm_none(),
  api: () => m.none_api(),
  auth: () => m.none_auth(),
  backend: () => m.none_backend(),
  database: () => m.none_database(),
  desktop: () => m.none_desktop(),
  mobile: () => m.none_mobile(),
  deployment: () => m.none_deployment(),
  framework: () => m.none_framework(),
};

const optional = (kind: Decision): OptionalDecision => {
  if (!isOptionalDecision(kind)) {
    throw new Error(`Every stack chooses a ${kind}`);
  }

  return kind;
};

export const noneName = (kind: Decision) => noneNames[optional(kind)]();

export const changeText = ({ kind, to }: Change) => {
  if (isDecision(kind)) {
    return to === null
      ? noneName(kind)
      : `${roles[kind].role} → ${integrationOf(to).name}`;
  }

  return `${kindLabel(kind)} → ${to === null ? m.none_token() : integrationOf(to).name}`;
};

const addLabels: Record<OptionalDecision, () => string> = {
  runtime: () => m.runtime_none(),
  orm: () => m.orm_none(),
  api: () => m.add_api(),
  auth: () => m.add_auth(),
  backend: () => m.add_backend(),
  database: () => m.add_database(),
  desktop: () => m.add_desktop(),
  mobile: () => m.add_mobile(),
  deployment: () => m.add_deployment(),
  framework: () => m.add_framework(),
};

export const addLabel = (kind: Decision) => addLabels[optional(kind)]();

const fits = {
  "effect-http": () => m.fit_effect_http(),
  "effect-rpc": () => m.fit_effect_rpc(),
  bun: () => m.fit_bun(),
  drizzle: () => m.fit_drizzle(),
  mongodb: () => m.fit_mongodb(),
  mongoose: () => m.fit_mongoose(),
  prisma: () => m.fit_prisma(),
  node: () => m.fit_node(),
  "better-auth": () => m.fit_better_auth(),
  docker: () => m.fit_docker(),
  void: () => m.fit_void(),
  workers: () => m.fit_workers(),
  electron: () => m.fit_electron(),
  expo: () => m.fit_expo(),
  hono: () => m.fit_hono(),
  mysql: () => m.fit_mysql(),
  next: () => m.fit_next(),
  openapi: () => m.fit_openapi(),
  orpc: () => m.fit_orpc(),
  postgres: () => m.fit_postgres(),
  self: () => m.fit_self(),
  spa: () => m.fit_spa(),
  sqlite: () => m.fit_sqlite(),
  "tanstack-start": () => m.fit_tanstack_start(),
  e2e: () => m.desc_e2e(),
  playwright: () => m.desc_playwright(),
} satisfies Record<string, () => string>;

const noneFits: Record<OptionalDecision, () => string> = {
  runtime: () => m.runtime_none(),
  orm: () => m.orm_none(),
  api: () => m.fit_none_api(),
  auth: () => m.fit_none_auth(),
  backend: () => m.fit_none_backend(),
  database: () => m.fit_none_database(),
  desktop: () => m.fit_none_desktop(),
  mobile: () => m.fit_none_mobile(),
  deployment: () => m.fit_none_deployment(),
  framework: () => m.fit_none_framework(),
};

const hasFit = (id: string): id is keyof typeof fits => Object.hasOwn(fits, id);

export const fitOf = (kind: Decision, id: string | null): string => {
  if (id === null) {
    return noneFits[optional(kind)]();
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
  mobile: "mobile",
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
  mobile: "tint-mobile",
  runtime: "tint-backend",
  orm: "tint-database",
  framework: "tint-framework",
  testing: "tint-foundation",
};

export const flagTintClass = (
  kind: Decision | "mode" | "addons" | "package-manager"
) =>
  tintClass[
    kind === "mode" || kind === "addons" || kind === "package-manager"
      ? "foundation"
      : kind
  ];
