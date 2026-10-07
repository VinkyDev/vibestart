import { ArrowUpRight } from "lucide-react";

import type { Stack } from "@vibestart/core";

import { optionsOf } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

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

const Sites = ({ kind }: { readonly kind: string }) => (
  <p className="flex flex-wrap gap-x-4 gap-y-1">
    {optionsOf(kind).flatMap((integration) =>
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
              { label: m.tool_dev(), run: "vp run dev" },
              { label: m.tool_check(), run: "vp check" },
              { label: m.tool_build(), run: "vp run build" },
            ]}
          />
        </>
      );
    }
    case "vitest": {
      // Integration tests pin the todo example, which needs both an API and a database.
      const integration =
        stack.api !== undefined && stack.database !== undefined;
      return (
        <>
          <p>
            {integration ? m.tests_scope_integration() : m.tests_scope_unit()}
          </p>
          <Commands
            commands={[
              {
                label: integration ? m.tool_test_integration() : m.tool_test(),
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
          {stack.framework === undefined ? (
            <p>{m.tests_scope_e2e_none()}</p>
          ) : (
            <Commands
              commands={[{ label: m.tool_e2e(), run: "vp run test:e2e" }]}
            />
          )}
          <Sites kind="testing" />
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
          <p>
            {stack.desktop === "electron"
              ? m.knip_scope_desktop()
              : m.knip_scope_default()}
          </p>
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
