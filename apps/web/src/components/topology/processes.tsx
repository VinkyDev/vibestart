import { ChevronsUpDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import type { Stack } from "@vibestart/core";
import { cn } from "@vibestart/ui/lib/utils";

import { Chip } from "#/components/topology/chip.tsx";
import type { Choosing } from "#/components/topology/decision.tsx";
import { DecisionTrigger } from "#/components/topology/decision.tsx";
import type { ProcessBox } from "#/components/topology/layout.ts";
import {
  deploymentFrame,
  roundedPath,
  stage,
} from "#/components/topology/layout.ts";
import { spring } from "#/lib/motion.ts";
import { tintClass } from "#/lib/roles.ts";
import { chosen, integrationOf } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

export const Boxes = ({
  boxes,
  stack,
  choosing,
}: {
  readonly choosing: Choosing;
  readonly boxes: readonly ProcessBox[];
  readonly stack: Stack;
}) => {
  const runtime = chosen(stack, "runtime");
  return (
    <AnimatePresence>
      {boxes.map((box) => (
        <motion.div
          animate={{ opacity: 1, ...box.rect }}
          className={cn(
            tintClass[box.group],
            "rounded-process bg-process absolute top-0 left-0"
          )}
          exit={{ opacity: 0, scale: 0.97 }}
          initial={{ opacity: 0, ...box.rect }}
          key={box.id}
          transition={spring}
        >
          <div className="flex h-[30px] items-end justify-between px-5">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                animate={{ opacity: 1 }}
                className="text-foreground/70 flex items-center gap-2 text-xs font-medium"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key={box.label}
              >
                <span className="bg-tint size-1.5 rounded-full" />
                {box.label}
              </motion.span>
            </AnimatePresence>
            {box.node && runtime !== undefined && (
              <span className="translate-y-1">
                {box.id === "server" && stack.backend === "hono" ? (
                  <DecisionTrigger choosing={choosing} kind="runtime">
                    <span className="hover:bg-foreground/10 focus-visible:focus-ring bg-foreground/5 flex items-center gap-1.5 rounded-full px-2 py-1 text-xs">
                      {runtime.name}
                      <ChevronsUpDown className="size-3" />
                    </span>
                  </DecisionTrigger>
                ) : (
                  <Chip
                    compact
                    integration={
                      runtime.id === "bun" ? integrationOf("node") : runtime
                    }
                    stack={stack}
                  />
                )}
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export const DeploymentFrame = ({
  boxes,
  stack,
}: {
  readonly boxes: readonly ProcessBox[];
  readonly stack: Stack;
}) => {
  const points =
    stack.deployment === undefined ? undefined : deploymentFrame(boxes);
  const path = points === undefined ? "" : roundedPath(points, 34);
  const origin = points?.[0];
  const name = chosen(stack, "deployment")?.name ?? "";
  return (
    <AnimatePresence>
      {points !== undefined && origin !== undefined && (
        <motion.div
          animate={{ opacity: 1 }}
          className="tint-deployment pointer-events-none absolute inset-0"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <svg
            className="absolute inset-0 overflow-visible"
            height={stage.height}
            width={stage.width}
          >
            <motion.path
              animate={{ d: path }}
              className="fill-foreground/[0.025] stroke-foreground/25"
              initial={{ d: path }}
              strokeDasharray="1 7"
              strokeLinecap="round"
              strokeWidth={1.5}
              transition={spring}
            />
          </svg>
          <motion.span
            animate={{ left: origin.x + 20, top: origin.y + 8 }}
            className="text-tint absolute text-xs font-medium"
            initial={{ left: origin.x + 20, top: origin.y + 8 }}
            transition={spring}
          >
            {stack.database === "postgres"
              ? m.deployment_postgres({ name })
              : m.deployment_image({ name })}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
