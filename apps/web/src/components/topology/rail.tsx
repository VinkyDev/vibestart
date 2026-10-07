import {
  ChevronsUpDown,
  FlaskConical,
  MousePointerClick,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Fragment } from "react";

import type { IntegrationInfo, Stack } from "@vibestart/core";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@vibestart/ui/components/popover";
import { cn } from "@vibestart/ui/lib/utils";

import type { Choosing } from "#/components/topology/decision.tsx";
import { DecisionTrigger } from "#/components/topology/decision.tsx";
import { Extensions } from "#/components/topology/extensions.tsx";
import {
  CardHeading,
  IntegrationCard,
} from "#/components/topology/integration-card.tsx";
import { placedClass, rail } from "#/components/topology/layout.ts";
import { Swatch, Tile } from "#/components/topology/tile.tsx";
import { ToolDetails } from "#/components/topology/tool-details.tsx";
import { focusesGroup, useFocus, useFocusTarget } from "#/lib/focus.ts";
import { ease } from "#/lib/motion.ts";
import { addLabel, groupOf, roles } from "#/lib/roles.ts";
import { chosen, e2eRunner, selected } from "#/lib/stack.ts";
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

const FoundationFace = ({
  empty = false,
  icon,
  kind,
  name,
  trailing,
}: {
  readonly empty?: boolean;
  readonly icon: LucideIcon;
  readonly kind: string;
  readonly name: string;
  readonly trailing?: ReactNode;
}) => (
  <span className="bg-card shadow-rest transition-surface group-hover/trigger:shadow-lift group-data-popup-open/trigger:shadow-lift group-hover/card:shadow-lift group-data-[focused]/card:shadow-lift group-data-popup-open/card:shadow-lift group-focus-visible/card:focus-ring flex size-full min-w-0 items-center gap-2 rounded-2xl px-2.5">
    <Swatch icon={icon} />
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="text-muted-foreground truncate text-xs">{kind}</span>
      <span
        className={cn(
          "truncate text-sm font-medium",
          empty ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {name}
      </span>
    </span>
    {trailing}
  </span>
);

const chooser = (
  <ChevronsUpDown className="text-muted-foreground size-3.5 shrink-0 opacity-60 transition-opacity group-hover/trigger:opacity-100" />
);

// Equal shares keep the rail balanced and prevent option changes from moving adjacent cards.
const cardClass = "h-full min-w-0 flex-1";

const Toolchain = ({
  integration,
  stack,
}: {
  readonly integration: IntegrationInfo;
  readonly stack: Stack;
}) => (
  <IntegrationCard
    className={cardClass}
    details={<ToolDetails id={integration.id} stack={stack} />}
    integration={integration}
    side="top"
    stack={stack}
  >
    <FoundationFace
      icon={Wrench}
      kind={m.kind_toolchain()}
      name={integration.name}
    />
  </IntegrationCard>
);

const UnitTests = ({ stack }: { readonly stack: Stack }) => (
  <Popover>
    <PopoverTrigger
      className={cn("group/card flex text-left", cardClass)}
      closeDelay={120}
      delay={180}
      openOnHover
    >
      <FoundationFace
        icon={FlaskConical}
        kind={m.tests_layer_unit()}
        name="Vitest"
      />
    </PopoverTrigger>
    <PopoverContent
      className="w-72"
      initialFocus={(openType) => openType === "keyboard"}
      side="top"
      sideOffset={8}
    >
      <div className="tint-foundation flex flex-col gap-2 p-2.5 text-xs leading-relaxed">
        <CardHeading homepage="https://vitest.dev" name="Vitest" />
        <ToolDetails id="vitest" stack={stack} />
      </div>
    </PopoverContent>
  </Popover>
);

const EndToEndTests = ({
  choosing,
  integration,
  stack,
}: {
  readonly choosing: Choosing;
  readonly integration: IntegrationInfo;
  readonly stack: Stack;
}) => {
  const runner = e2eRunner(stack);
  return (
    <DecisionTrigger
      choosing={choosing}
      className={cardClass}
      details={<ToolDetails id={integration.id} stack={stack} />}
      kind="testing"
      side="top"
    >
      <FoundationFace
        empty={runner === undefined}
        icon={MousePointerClick}
        kind={m.kind_testing()}
        name={runner?.name ?? m.testing_none()}
        trailing={chooser}
      />
    </DecisionTrigger>
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
        {foundation.map((integration) =>
          integration.kind === "testing" ? (
            <Fragment key={integration.kind}>
              <UnitTests stack={stack} />
              <EndToEndTests
                choosing={choosing}
                integration={integration}
                stack={stack}
              />
            </Fragment>
          ) : (
            <Toolchain
              integration={integration}
              key={integration.kind}
              stack={stack}
            />
          )
        )}
        <div
          className={cn(
            "bg-card shadow-rest transition-surface hover:shadow-lift has-data-popup-open:shadow-lift flex min-w-0 rounded-2xl",
            cardClass
          )}
        >
          <Extensions choosing={choosing} />
        </div>
      </Frame>
      <Frame
        className="tint-deployment w-[228px]"
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
