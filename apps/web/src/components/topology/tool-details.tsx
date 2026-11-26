import { ArrowUpRight } from "lucide-react";

import type { Stack } from "@vibestart/core";
import { hasWebApp } from "@vibestart/integrations/app-shape";
import { devCommands } from "@vibestart/integrations/dev-commands";
import { integrationExample } from "@vibestart/integrations/example";

import { optionsOf } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

const integrationDescriptions = {
  health: m.tests_scope_health,
  todos: m.tests_scope_integration,
};

const Commands = ({
  commands,
}: {
  readonly commands: readonly {
    readonly run: string;
    readonly label: string;
  }[];
}) => (
  <dl className="border-border mt-1 grid gap-2 border-t pt-3 first:mt-0 first:border-0 first:pt-0">
    {commands.map(({ run, label }) => (
      <div className="flex items-baseline justify-between gap-3" key={run}>
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="text-foreground font-mono text-xs">{run}</dd>
      </div>
    ))}
  </dl>
);

const Sites = ({
  kind,
  mode,
}: {
  readonly kind: string;
  readonly mode: string | undefined;
}) => (
  <p className="flex flex-wrap gap-x-4 gap-y-1">
    {optionsOf(kind, mode).flatMap((integration) =>
      integration?.homepage === undefined
        ? []
        : [
            <a
              aria-label={m.visit_site({ name: integration.name })}
              className="text-foreground/80 hover:text-tint focus-visible:focus-ring inline-flex items-center gap-1 rounded-sm transition-colors outline-none"
              href={integration.homepage}
              key={integration.id}
              rel="noreferrer"
              target="_blank"
            >
              {integration.name}
              <ArrowUpRight className="size-3.5" strokeWidth={1.75} />
            </a>,
          ]
    )}
  </p>
);

export const ToolDetails = ({
  id,
  stack,
}: {
  readonly id: string;
  readonly stack: Stack;
}) => {
  switch (id) {
    case "vite-plus": {
      return (
        <>
          <p>{m.toolchain_scope()}</p>
          <Commands
            commands={[
              ...devCommands(stack).map((run) => ({
                label:
                  run === "vp run dev" ? m.tool_dev() : m.tool_dev_mobile(),
                run,
              })),
              { label: m.tool_check(), run: "vp check" },
              { label: m.tool_build(), run: "vp run build" },
            ]}
          />
        </>
      );
    }

    case "vitest": {
      const example = integrationExample(stack);

      return (
        <>
          <p>
            {example === undefined
              ? m.tests_scope_unit()
              : integrationDescriptions[example]()}
          </p>
          <Commands
            commands={[
              {
                label:
                  example === undefined
                    ? m.tool_test()
                    : m.tool_test_integration(),
                run: "vp test",
              },
            ]}
          />
        </>
      );
    }

    case "e2e":
    case "playwright": {
      return (
        <>
          {hasWebApp(stack) ? (
            <Commands
              commands={[{ label: m.tool_e2e(), run: "vp run test:e2e" }]}
            />
          ) : (
            <p>{m.tests_scope_e2e_none()}</p>
          )}
          {stack.mobile !== undefined && <p>{m.tests_scope_mobile()}</p>}
          <Sites kind="testing" mode={stack.mode} />
        </>
      );
    }

    case "ultracite": {
      return (
        <>
          <p>{m.ultracite_scope()}</p>
          <Commands commands={[{ label: m.tool_check(), run: "vp check" }]} />
        </>
      );
    }

    case "knip": {
      return (
        <>
          {stack.desktop === undefined && stack.mobile === undefined && (
            <p>{m.knip_scope_default()}</p>
          )}
          {stack.desktop !== undefined && <p>{m.knip_scope_desktop()}</p>}
          {stack.mobile !== undefined && <p>{m.knip_scope_mobile()}</p>}
          <Commands
            commands={[{ label: m.tool_analyze(), run: "vp run knip" }]}
          />
        </>
      );
    }

    default: {
      return null;
    }
  }
};
