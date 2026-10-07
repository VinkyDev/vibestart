import { Server } from "lucide-react";
import { registry } from "virtual:vibestart";

import { cn } from "@vibestart/ui/lib/utils";

import { DocLink } from "#/components/docs/doc-link.tsx";
import type { TechIcon } from "#/components/docs/tech-icons.ts";
import { TechMark } from "#/components/docs/tech.tsx";
import { integrationDescription, kindLabel } from "#/lib/i18n.ts";
import type { Group } from "#/lib/roles.ts";
import { groupOf, roles, tintClass } from "#/lib/roles.ts";
import { m } from "#/paraglide/messages.js";

const groups: readonly Group[] = [
  "framework",
  "desktop",
  "api",
  "backend",
  "database",
  "auth",
  "deployment",
  "foundation",
];

const groupName = (group: Group) =>
  group === "foundation" ? m.viz_group_foundation() : roles[group].role;

const pages = new Map([
  ["better-auth", "stack/data"],
  ["docker", "stack/delivery"],
  ["drizzle", "stack/data"],
  ["electron", "stack/delivery"],
  ["hono", "stack/backend"],
  ["next", "stack/frontend"],
  ["node", "stack/toolchain"],
  ["bun", "stack/toolchain"],
  ["openapi", "stack/backend"],
  ["orpc", "stack/backend"],
  ["postgres", "stack/data"],
  ["react", "stack/frontend"],
  ["self", "stack/backend"],
  ["shadcn", "stack/frontend"],
  ["spa", "stack/frontend"],
  ["sqlite", "stack/data"],
  ["tanstack-router", "stack/frontend"],
  ["tanstack-start", "stack/frontend"],
  ["vite-plus", "stack/toolchain"],
  ["playwright", "stack/testing"],
  ["e2e", "stack/testing"],
]);

const marks = new Map<string, TechIcon>([
  ["better-auth", "better-auth"],
  ["bun", "bun"],
  ["docker", "docker"],
  ["drizzle", "drizzle"],
  ["electron", "electron"],
  ["hono", "hono"],
  ["next", "next"],
  ["node", "node"],
  ["openapi", "openapi"],
  ["orpc", "orpc"],
  ["postgres", "postgres"],
  ["react", "react"],
  ["shadcn", "shadcn"],
  ["spa", "vite"],
  ["sqlite", "sqlite"],
  ["tanstack-router", "tanstack"],
  ["tanstack-start", "tanstack"],
  ["vite-plus", "vite-plus"],
  ["playwright", "playwright"],
  ["e2e", "e2e"],
]);

const Mark = ({ id }: { readonly id: string }) => {
  const icon = marks.get(id);
  return icon === undefined ? (
    <Server
      className="text-muted-foreground size-4 shrink-0"
      strokeWidth={1.75}
    />
  ) : (
    <TechMark className="size-4 shrink-0 object-contain" icon={icon} />
  );
};

const pageOf = (id: string) => {
  const page = pages.get(id);
  if (page === undefined) {
    throw new Error(`No docs page explains ${id}`);
  }
  return page;
};

export const StackMap = () => (
  <div className="bg-card shadow-sheet rounded-sheet divide-border my-8 flex flex-col divide-y overflow-hidden">
    {groups.map((group) => {
      const integrations = registry.integrations.filter(
        (integration) => groupOf(integration.id) === group
      );
      return (
        <section
          className={cn(
            tintClass[group],
            "grid gap-3 px-5 py-4 sm:grid-cols-[7rem_1fr] sm:px-6"
          )}
          key={group}
        >
          <h4 className="flex items-center gap-2 text-sm font-medium sm:h-9">
            <span className="bg-tint size-2 shrink-0 rounded-full" />
            {groupName(group)}
          </h4>
          <ul className="grid gap-2 sm:grid-cols-2">
            {integrations.map((integration) => (
              <li className="min-w-0" key={integration.id}>
                <DocLink
                  className="hover:bg-tint-soft group/chip flex min-w-0 flex-col rounded-lg px-3 py-2 transition-colors"
                  url={`/docs/${pageOf(integration.id)}#${integration.id}`}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 self-center">
                      <Mark id={integration.id} />
                      <span className="truncate text-sm font-medium">
                        {integration.name}
                      </span>
                    </span>
                    <span className="text-muted-foreground text-fine shrink-0">
                      {kindLabel(integration.kind)}
                    </span>
                  </span>
                  <span className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                    {integrationDescription(integration)}
                  </span>
                </DocLink>
              </li>
            ))}
          </ul>
        </section>
      );
    })}
  </div>
);
