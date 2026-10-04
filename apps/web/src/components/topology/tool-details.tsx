import type { Stack } from "@vibestart/core";

import { m } from "#/paraglide/messages.js";

const Commands = ({
  commands,
}: {
  readonly commands: readonly {
    readonly run: string;
    readonly label: string;
  }[];
}) => (
  <dl className="border-border mt-1 grid gap-2 border-t pt-3">
    {commands.map(({ run, label }) => (
      <div className="flex items-baseline justify-between gap-3" key={run}>
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="text-foreground font-mono text-xs">{run}</dd>
      </div>
    ))}
  </dl>
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
    case "vitest-playwright": {
      // Integration tests pin the todo example, which needs both an API and a database.
      const integration =
        stack.api !== undefined && stack.database !== undefined;
      const scope = () => {
        if (stack.framework === undefined) {
          return integration
            ? m.tests_scope_api_integration()
            : m.tests_scope_api();
        }
        if (stack.backend === undefined) {
          return m.tests_scope_static();
        }
        return integration
          ? m.tests_scope_web_integration()
          : m.tests_scope_web();
      };
      return (
        <>
          <p>{scope()}</p>
          <Commands
            commands={[
              {
                label: integration ? m.tool_test_integration() : m.tool_test(),
                run: "vp test",
              },
              ...(stack.framework === undefined
                ? []
                : [{ label: m.tool_e2e(), run: "vp run test:e2e" }]),
            ]}
          />
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
