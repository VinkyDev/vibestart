import { motion } from "motion/react";

import { cn } from "@vibestart/ui/lib/utils";

import type { Gate } from "#/lib/gate.ts";
import { ease } from "#/lib/motion.ts";
import { useSteps } from "#/lib/use-steps.ts";
import { m } from "#/paraglide/messages.js";

const purpose = (command: string, gate: Gate): string | undefined => {
  if (command.startsWith("vp run db:generate")) {
    return m.gate_migrate();
  }
  const purposes = new Map([
    ["vp build apps/web", () => m.gate_build_web()],
    ["vp check", () => m.gate_check()],
    ["vp install", () => m.gate_install()],
    ["vp run -r build", () => m.gate_build()],
    ["vp run knip", () => m.gate_knip()],
    ["vp run test:e2e", () => m.gate_e2e({ count: gate.journeys })],
    ["vp run typegen", () => m.gate_typegen()],
    ["vp test", () => m.gate_test({ count: gate.tests })],
  ]);
  return purposes.get(command)?.();
};

const firstStep = 500;
const nextStep = 380;

const Node = ({ state }: { readonly state: "done" | "next" | "pending" }) => (
  <span className="relative grid size-5 shrink-0 place-items-center">
    <span
      className={cn(
        "absolute inset-0 rounded-full border transition-colors duration-300",
        state === "done" ? "border-added bg-added" : "border-border"
      )}
    />
    {state === "next" && (
      <span className="border-t-foreground/60 absolute inset-0 animate-spin rounded-full border-2 border-transparent" />
    )}
    {state === "done" && (
      <svg
        aria-hidden
        className="relative size-3.5"
        fill="none"
        viewBox="0 0 16 16"
      >
        <motion.path
          animate={{ pathLength: 1 }}
          d="M3.5 8.5 6.6 11.5 12.5 5"
          initial={{ pathLength: 0 }}
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          transition={{ duration: 0.3, ease }}
        />
      </svg>
    )}
  </span>
);

export const Steps = ({
  gate,
  passed,
}: {
  readonly gate: Gate;
  readonly passed: boolean;
}) => {
  const count = passed ? gate.commands.length : 0;
  const [done] = useSteps({ count, first: firstStep, next: nextStep });
  const replaying = done < count;

  return (
    <ol className="flex flex-col">
      {gate.commands.map((command, index) => {
        let state: "done" | "next" | "pending" = "pending";
        if (index < done) {
          state = "done";
        } else if (index === done && replaying) {
          state = "next";
        }
        const last = index === gate.commands.length - 1;
        const said = purpose(command, gate);
        return (
          <li
            className={cn("relative flex gap-3.5", !last && "pb-3.5")}
            // A command can run twice, in the setup and again in `ready`, so only its place tells it apart.
            // oxlint-disable-next-line react/no-array-index-key
            key={index}
          >
            {!last && (
              <span className="bg-border absolute top-6 bottom-0.5 left-[9.5px] w-px">
                <motion.span
                  animate={{ scaleY: index < done ? 1 : 0 }}
                  className="bg-added absolute inset-0 origin-top"
                  transition={{ duration: 0.4, ease }}
                />
              </span>
            )}
            <Node state={state} />
            <p
              className={cn(
                "flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 transition-opacity duration-500",
                state === "pending" && passed && "opacity-40"
              )}
            >
              {said === undefined ? (
                <code className="text-snippet font-mono leading-5">
                  {command}
                </code>
              ) : (
                <>
                  <span className="text-sm leading-5">{said}</span>
                  <code className="text-muted-foreground/80 text-fine hidden font-mono leading-5 sm:inline">
                    {command}
                  </code>
                </>
              )}
            </p>
          </li>
        );
      })}
    </ol>
  );
};
