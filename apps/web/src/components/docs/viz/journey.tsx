import { AppWindow, Database, MousePointerClick, Server } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { cn } from "@vibestart/ui/lib/utils";

import { Demo } from "#/components/demo/frame.tsx";
import { Stepper } from "#/components/demo/stepper.tsx";
import { ease } from "#/lib/motion.ts";
import { m } from "#/paraglide/messages.js";

export const places = {
  browser: {
    icon: AppWindow,
    label: () => m.viz_node_browser(),
    tint: "tint-framework",
  },
  database: {
    icon: Database,
    label: () => m.viz_node_database(),
    tint: "tint-database",
  },
  server: {
    icon: Server,
    label: () => m.viz_node_server(),
    tint: "tint-backend",
  },
  user: {
    icon: MousePointerClick,
    label: () => m.viz_node_user(),
    tint: "tint-foundation",
  },
} as const;

export type Place = keyof typeof places;

type JourneyStep = { readonly text: string; readonly code?: string } & (
  | { readonly from: Place; readonly to: Place }
  | { readonly at: Place }
);

const centre = (index: number, count: number) =>
  `${((index + 0.5) / count) * 100}%`;

const layouts = {
  2: { columns: "grid-cols-2", wire: "inset-x-1/4" },
  3: { columns: "grid-cols-3", wire: "inset-x-[16.667%]" },
  4: { columns: "grid-cols-4", wire: "inset-x-[12.5%]" },
} as const;

const fullPath = ["user", "browser", "server", "database"] as const;

export const Journey = ({
  path = fullPath,
  steps,
}: {
  readonly path?:
    | readonly [Place, Place]
    | readonly [Place, Place, Place]
    | readonly [Place, Place, Place, Place];
  readonly steps: readonly JourneyStep[];
}) => {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  if (step === undefined) {
    return null;
  }
  const active = "at" in step ? [step.at] : [step.from, step.to];
  const layout = layouts[path.length];

  return (
    <div className="my-8">
      <Demo
        actions={
          <Stepper count={steps.length} current={index} onChange={setIndex} />
        }
        caption={step.text}
        status={
          <div className="flex min-h-6 items-center justify-between gap-4">
            <AnimatePresence initial={false} mode="wait">
              <motion.code
                animate={{ opacity: 1 }}
                className="text-foreground/80 min-w-0 truncate font-mono text-xs"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key={index}
                transition={{ duration: 0.2 }}
              >
                {step.code}
              </motion.code>
            </AnimatePresence>
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {m.viz_step({ current: index + 1, total: steps.length })}
            </span>
          </div>
        }
      >
        <div className="relative py-2">
          <span
            className={cn(
              layout.wire,
              "bg-border absolute top-[calc(0.5rem+22px)] h-px"
            )}
          />
          {"from" in step && (
            <motion.span
              animate={{ left: centre(path.indexOf(step.to), path.length) }}
              className={cn(
                places[step.from].tint,
                "bg-tint ring-card absolute top-[calc(0.5rem+22px)] z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4"
              )}
              initial={{ left: centre(path.indexOf(step.from), path.length) }}
              key={index}
              transition={{ duration: 0.9, ease }}
            />
          )}
          <ol className={cn(layout.columns, "relative grid")}>
            {path.map((place) => {
              const { icon: Icon, label, tint } = places[place];
              const on = active.includes(place);
              return (
                <li
                  className={cn(tint, "flex flex-col items-center gap-2.5")}
                  key={place}
                >
                  <motion.span
                    animate={{ scale: on ? 1.08 : 1 }}
                    className={cn(
                      "bg-card grid size-11 place-items-center rounded-2xl transition duration-300",
                      on
                        ? "text-tint shadow-preview"
                        : "text-muted-foreground shadow-rest"
                    )}
                    transition={{ duration: 0.3, ease }}
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                  </motion.span>
                  <span
                    className={cn(
                      "text-center text-xs leading-tight transition-colors",
                      on
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {label()}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </Demo>
    </div>
  );
};
