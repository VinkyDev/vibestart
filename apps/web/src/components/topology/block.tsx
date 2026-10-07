import { ChevronsUpDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import type { IntegrationInfo, Stack } from "@vibestart/core";
import { cn } from "@vibestart/ui/lib/utils";

import { Chip } from "#/components/topology/chip.tsx";
import type { Choosing } from "#/components/topology/decision.tsx";
import { DecisionTrigger } from "#/components/topology/decision.tsx";
import type { Rect } from "#/components/topology/layout.ts";
import { Tile } from "#/components/topology/tile.tsx";
import {
  FocusScope,
  focusesGroup,
  useFocus,
  useFocusTarget,
} from "#/lib/focus.ts";
import { integrationDescription } from "#/lib/i18n.ts";
import { ease, spring } from "#/lib/motion.ts";
import { addLabel, roles, tintClass } from "#/lib/roles.ts";
import type { OptionalDecision } from "#/lib/stack.ts";
import { chosen } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

export const Block = ({
  chips,
  choosing,
  delay,
  folded,
  kind,
  rect,
  shown,
}: {
  readonly chips: readonly IntegrationInfo[];
  readonly choosing: Choosing;
  readonly delay: number;
  readonly folded: boolean;
  readonly kind: OptionalDecision;
  readonly rect: Rect;
  readonly shown: Stack;
}) => {
  const { focus } = useFocus();
  const { enter, leave } = useFocusTarget({ group: kind });
  const id = shown[kind];
  const integration = chosen(shown, kind);
  const changing = id !== choosing.baseline[kind];
  const { none, role } = roles[kind];

  const placement = {
    height: rect.height,
    left: rect.x,
    top: rect.y,
    width: rect.width,
  };

  return (
    <motion.div
      animate={{ filter: "blur(0px)", opacity: 1, y: 0, ...placement }}
      className={cn(tintClass[kind], "absolute")}
      initial={{ filter: "blur(6px)", opacity: 0, y: 12, ...placement }}
      onPointerEnter={enter}
      onPointerLeave={leave}
      transition={{
        default: { delay, duration: 0.8, ease },
        height: spring,
        left: spring,
        top: spring,
        width: spring,
      }}
    >
      <div
        className={cn(
          "rounded-block transition-surface flex size-full flex-col",
          integration === undefined
            ? "border-foreground/15 hover:border-foreground/25 border border-dashed"
            : "bg-card",
          changing && "shadow-preview",
          !changing &&
            integration !== undefined &&
            "shadow-rest hover:shadow-lift data-[focused]:shadow-lift"
        )}
        data-focused={focusesGroup(focus, kind) ? "" : undefined}
      >
        <DecisionTrigger
          choosing={choosing}
          className="min-h-0 flex-1"
          kind={kind}
        >
          {folded ? (
            <span className="rounded-block flex size-full min-w-0 items-center gap-3 px-4">
              <Tile empty kind={kind} />
              <span className="text-muted-foreground group-hover/trigger:text-foreground min-w-0 flex-1 truncate text-sm font-medium transition-colors">
                {addLabel(kind)}
              </span>
              <ChevronsUpDown className="text-muted-foreground size-3.5 opacity-0 transition-opacity group-hover/trigger:opacity-100" />
            </span>
          ) : (
            <span className="rounded-block flex size-full min-w-0 flex-col gap-2 p-4.5">
              <span className="flex items-center gap-2.5">
                <Tile empty={integration === undefined} kind={kind} />
                <span className="text-muted-foreground text-sm font-medium">
                  {role}
                </span>
                <span className="text-muted-foreground ml-auto flex items-center gap-2 text-xs">
                  {changing && (
                    <span className="text-tint font-medium">{m.preview()}</span>
                  )}
                  <ChevronsUpDown className="size-3.5 opacity-0 transition-opacity group-hover/trigger:opacity-70" />
                </span>
              </span>
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                  className="flex flex-col gap-1.5"
                  exit={{ filter: "blur(4px)", opacity: 0, y: -8 }}
                  initial={{ filter: "blur(4px)", opacity: 0, y: 8 }}
                  key={id ?? "none"}
                  transition={{ duration: 0.45, ease }}
                >
                  {integration === undefined ? (
                    <>
                      <span className="text-muted-foreground group-hover/trigger:text-foreground text-ui font-medium transition-colors">
                        {addLabel(kind)}
                      </span>
                      <span className="text-muted-foreground/80 text-xs leading-relaxed">
                        {none}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-name text-foreground font-semibold tracking-tight">
                        {integration.name}
                      </span>
                      <span className="text-muted-foreground text-xs leading-relaxed">
                        {integrationDescription(integration)}
                      </span>
                    </>
                  )}
                </motion.span>
              </AnimatePresence>
            </span>
          )}
        </DecisionTrigger>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4.5 pb-4.5">
            <FocusScope value={{ group: kind }}>
              {chips.map((chip) => (
                <Chip integration={chip} key={chip.id} stack={shown} />
              ))}
            </FocusScope>
          </div>
        )}
      </div>
      <motion.span
        animate={{ opacity: 0, scale: 1.05 }}
        className="ring-tint rounded-block pointer-events-none absolute inset-0"
        initial={{ opacity: 0.8, scale: 1 }}
        key={id ?? "none"}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </motion.div>
  );
};
