import { ChevronsUpDown, FlaskConical, Wrench } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import type { IntegrationInfo, Stack } from "@vibestart/core";
import { cn } from "@vibestart/ui/lib/utils";

import type { Choosing } from "#/components/topology/decision.tsx";
import { DecisionTrigger } from "#/components/topology/decision.tsx";
import { Extensions } from "#/components/topology/extensions.tsx";
import { IntegrationCard } from "#/components/topology/integration-card.tsx";
import { placedClass, rail } from "#/components/topology/layout.ts";
import { Swatch, Tile } from "#/components/topology/tile.tsx";
import { ToolDetails } from "#/components/topology/tool-details.tsx";
import { focusesGroup, useFocus, useFocusTarget } from "#/lib/focus.ts";
import { ease } from "#/lib/motion.ts";
import { addLabel, groupOf, roles } from "#/lib/roles.ts";
import { chosen, selected } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

const Frame = ({
  children,
  className,
  focused = false,
  label,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly focused?: boolean;
  readonly label: string;
}) => (
  <section
    aria-label={label}
    className={cn(
      "rounded-process bg-process data-[focused]:bg-tint-soft flex min-w-0 flex-col transition-colors duration-300",
      className
    )}
    data-focused={focused ? "" : undefined}
  >
    <h2 className="text-foreground/70 flex h-7 shrink-0 items-end px-5 text-xs font-medium">
      <span className="flex items-center gap-2">
        <span className="bg-tint size-1.5 rounded-full" />
        {label}
      </span>
    </h2>
    <div className="flex min-h-0 flex-1 gap-1.5 p-2 pt-1.5">{children}</div>
  </section>
);

const FoundationItem = ({
  integration,
  stack,
}: {
  readonly integration: IntegrationInfo;
  readonly stack: Stack;
}) => {
  const testing = integration.kind === "testing";
  return (
    <IntegrationCard
      className="h-full flex-1"
      details={<ToolDetails id={integration.id} stack={stack} />}
      integration={integration}
      side="top"
      stack={stack}
    >
      <span className="bg-card shadow-rest transition-surface group-hover/card:shadow-lift group-data-[focused]/card:shadow-lift group-data-popup-open/card:shadow-lift group-focus-visible/card:focus-ring flex size-full min-w-0 items-center gap-3 rounded-2xl px-3">
        <Swatch icon={testing ? FlaskConical : Wrench} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-muted-foreground text-xs">
            {testing ? m.kind_testing() : m.kind_toolchain()}
          </span>
          <span className="text-foreground truncate text-sm font-medium">
            {integration.name}
          </span>
        </span>
        <span className="text-muted-foreground bg-foreground/[0.04] text-fine shrink-0 rounded-full px-2 py-0.5">
          {m.tool_builtin()}
        </span>
      </span>
    </IntegrationCard>
  );
};

export const Rail = ({
  choosing,
  stack,
}: {
  readonly choosing: Choosing;
  readonly stack: Stack;
}) => {
  const { focus } = useFocus();
  const { enter: enterDeployment, leave: leaveDeployment } = useFocusTarget({
    group: "deployment",
  });
  const foundation = selected(stack).filter(
    (integration) => groupOf(integration.id) === "foundation"
  );
  const deployment = chosen(stack, "deployment");
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3", placedClass)}
      initial={{ opacity: 0, y: 10 }}
      style={{
        "--h": `${rail.height}px`,
        "--w": `${rail.width}px`,
        "--x": `${rail.x}px`,
        "--y": `${rail.y}px`,
      }}
      transition={{ delay: 0.5, duration: 0.8, ease }}
    >
      <Frame
        className="tint-foundation flex-1"
        focused={focusesGroup(focus, "foundation")}
        label={m.engineering_capabilities()}
      >
        {foundation.map((integration) => (
          <FoundationItem
            integration={integration}
            key={integration.id}
            stack={stack}
          />
        ))}
        <div className="bg-card shadow-rest transition-surface hover:shadow-lift has-data-popup-open:shadow-lift flex min-w-0 flex-1 rounded-2xl">
          <Extensions choosing={choosing} />
        </div>
      </Frame>
      <Frame
        className="tint-deployment w-[248px]"
        focused={focusesGroup(focus, "deployment")}
        label={roles.deployment.role}
      >
        <div
          className="flex min-w-0 flex-1"
          onPointerEnter={enterDeployment}
          onPointerLeave={leaveDeployment}
        >
          <DecisionTrigger
            choosing={choosing}
            className="h-full flex-1"
            kind="deployment"
            side="top"
          >
            <span
              className={cn(
                "transition-surface flex size-full min-w-0 items-center gap-3 rounded-2xl px-3",
                deployment === undefined
                  ? "border-foreground/15 group-hover/trigger:border-foreground/25 border border-dashed"
                  : "bg-card shadow-rest group-hover/trigger:shadow-lift group-data-popup-open/trigger:shadow-lift",
                stack.deployment !== choosing.baseline.deployment &&
                  "shadow-preview"
              )}
            >
              <Tile empty={deployment === undefined} kind="deployment" />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm font-medium transition-colors",
                  deployment === undefined
                    ? "text-muted-foreground group-hover/trigger:text-foreground"
                    : "text-foreground"
                )}
              >
                {deployment?.name ?? addLabel("deployment")}
              </span>
              <ChevronsUpDown className="text-muted-foreground size-3.5 shrink-0 opacity-60 transition-opacity group-hover/trigger:opacity-100" />
            </span>
          </DecisionTrigger>
        </div>
      </Frame>
    </motion.div>
  );
};
