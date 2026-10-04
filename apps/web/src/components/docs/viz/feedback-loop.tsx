import {
  Blocks,
  Braces,
  Check,
  LoaderCircle,
  MonitorPlay,
  ScanLine,
  Wand2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { Button } from "@vibestart/ui/components/button";
import { cn } from "@vibestart/ui/lib/utils";

import { Demo, Verdict } from "#/components/demo/frame.tsx";
import { ease } from "#/lib/motion.ts";
import { useSteps } from "#/lib/use-steps.ts";
import { m } from "#/paraglide/messages.js";

const gates = [
  {
    icon: Braces,
    id: "types",
    label: () => m.viz_gate_types(),
    tool: "TypeScript 7",
  },
  {
    icon: ScanLine,
    id: "lint",
    label: () => m.viz_gate_lint(),
    tool: "Oxlint",
  },
  {
    icon: Blocks,
    id: "integration",
    label: () => m.viz_gate_integration(),
    tool: "Vitest",
  },
  {
    icon: MonitorPlay,
    id: "e2e",
    label: () => m.viz_gate_e2e(),
    tool: "Playwright",
  },
] as const;

type GateId = (typeof gates)[number]["id"];

interface Mistake {
  readonly label: string;
  readonly text: string;
  readonly gate: GateId;
  readonly error: string;
  readonly fix: string;
}

const pace = 520;

type GateState = "idle" | "running" | "passed" | "failed" | "skipped";

const Gate = ({
  gate,
  state,
}: {
  readonly gate: (typeof gates)[number];
  readonly state: GateState;
}) => {
  const Icon = gate.icon;
  return (
    <li
      className={cn(
        "bg-card flex min-w-0 flex-col items-center gap-2 rounded-xl px-1.5 py-3 text-center transition duration-300 sm:px-2",
        state === "failed" ? "ring-removed ring-2" : "shadow-rest",
        state === "skipped" && "opacity-40"
      )}
    >
      <span className="relative">
        <Icon className="text-muted-foreground size-5" strokeWidth={1.75} />
        <span
          className={cn(
            "ring-card absolute -right-2 -bottom-1.5 grid size-4 place-items-center rounded-full ring-2 transition-colors",
            state === "passed" && "bg-added text-white",
            state === "failed" && "bg-removed text-white",
            (state === "idle" || state === "skipped") && "bg-muted",
            state === "running" && "bg-card"
          )}
        >
          {state === "passed" && <Check className="size-2.5" strokeWidth={3} />}
          {state === "failed" && <X className="size-2.5" strokeWidth={3} />}
          {state === "running" && (
            <LoaderCircle className="text-muted-foreground size-3 animate-spin" />
          )}
        </span>
      </span>
      <span className="flex max-w-full min-w-0 flex-col">
        <span className="text-xs font-medium">{gate.label()}</span>
        <span className="text-muted-foreground text-micro sm:text-fine truncate">
          {gate.tool}
        </span>
      </span>
    </li>
  );
};

export const FeedbackLoop = ({
  mistakes,
}: {
  readonly mistakes: readonly Mistake[];
}) => {
  const [chosen, setChosen] = useState(0);
  const [fixed, setFixed] = useState(false);
  const mistake = mistakes[chosen];
  const catcher = gates.findIndex((gate) => gate.id === mistake?.gate);
  const stop = fixed ? gates.length : catcher + 1;
  const [settled, rerun] = useSteps({ count: stop, first: pace });
  const running = settled < stop;

  if (mistake === undefined) {
    return null;
  }

  const stateOf = (index: number): GateState => {
    if (index < settled) {
      return index === catcher && !fixed ? "failed" : "passed";
    }
    if (index === settled && running) {
      return "running";
    }
    return running ? "idle" : "skipped";
  };
  const caught = !fixed && !running;

  return (
    <div className="my-8">
      <Demo
        actions={
          <Button
            disabled={!caught}
            onClick={() => {
              setFixed(true);
              rerun();
            }}
            size="sm"
            variant="secondary"
          >
            <Wand2 />
            {m.viz_fix_rerun()}
          </Button>
        }
        caption={fixed ? mistake.fix : mistake.text}
        status={
          running ? (
            <p className="text-muted-foreground flex items-center gap-2 font-mono text-xs">
              <LoaderCircle
                className="size-4 animate-spin"
                strokeWidth={1.75}
              />
              vp run ready
            </p>
          ) : (
            <Verdict passed={fixed}>
              {fixed
                ? m.viz_all_passed()
                : m.viz_caught_by({ gate: gates[catcher]?.label() ?? "" })}
            </Verdict>
          )
        }
      >
        <div className="flex flex-wrap gap-1.5">
          {mistakes.map((item, index) => (
            <button
              className={cn(
                "rounded-full px-3 py-1 text-xs transition-colors",
                index === chosen
                  ? "bg-foreground text-background"
                  : "bg-foreground/[0.05] text-muted-foreground hover:text-foreground"
              )}
              key={item.label}
              onClick={() => {
                setChosen(index);
                setFixed(false);
                rerun();
              }}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
        <ol className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {gates.map((gate, index) => (
            <Gate gate={gate} key={gate.id} state={stateOf(index)} />
          ))}
        </ol>
        <div className="grid min-h-16">
          <AnimatePresence initial={false}>
            {caught && (
              <motion.pre
                animate={{ opacity: 1, y: 0 }}
                className="border-removed/25 bg-removed/[0.06] text-removed col-start-1 row-start-1 overflow-x-auto rounded-lg border px-3 py-2.5 font-mono text-xs leading-5 [overflow-wrap:anywhere] whitespace-pre-wrap"
                exit={{ opacity: 0, y: -4 }}
                initial={{ opacity: 0, y: 4 }}
                key={chosen}
                transition={{ duration: 0.35, ease }}
              >
                {mistake.error}
              </motion.pre>
            )}
          </AnimatePresence>
        </div>
      </Demo>
    </div>
  );
};
