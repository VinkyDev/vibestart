import { Check, FileText, Folder, GitMerge, Lock } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@vibestart/ui/lib/utils";

import { kindLabel } from "#/lib/i18n.ts";
import { ease } from "#/lib/motion.ts";
import { tintClass } from "#/lib/roles.ts";
import { chosen, decisions, recommended } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

interface Stage {
  readonly title: string;
  readonly text: string;
}

const dwell = 5200;

const row = (order: number) => ({
  animate: { opacity: 1, x: 0 },
  initial: { opacity: 0, x: -6 },
  transition: { delay: 0.08 * order, duration: 0.35, ease },
});

const Choose = () => (
  <ul className="flex flex-col gap-1.5">
    {decisions
      .flatMap((kind) => {
        const integration = chosen(recommended, kind);
        return integration === undefined ? [] : [{ integration, kind }];
      })
      .map(({ integration, kind }, order) => (
        <motion.li
          className={cn(
            tintClass[kind],
            "bg-background/60 border-border flex items-center gap-3 rounded-lg border px-3 py-1.5"
          )}
          key={kind}
          {...row(order)}
        >
          <span className="bg-tint size-1.5 shrink-0 rounded-full" />
          <span className="text-muted-foreground w-20 shrink-0 text-xs">
            {kindLabel(kind)}
          </span>
          <span className="truncate text-sm font-medium">
            {integration.name}
          </span>
        </motion.li>
      ))}
  </ul>
);

const tree = [
  { depth: 0, folder: true, name: "apps" },
  { depth: 1, folder: true, name: "web" },
  { depth: 1, folder: true, name: "server" },
  { depth: 0, folder: true, name: "packages" },
  { depth: 1, folder: true, name: "api · db · auth · ui" },
  { depth: 0, folder: false, name: "AGENTS.md" },
  { depth: 0, folder: false, name: "vibestart.jsonc" },
  { depth: 0, folder: false, name: "vite.config.ts" },
] as const;

const Generate = () => (
  <ul className="font-mono text-xs">
    {tree.map(({ depth, folder, name }, order) => {
      const Icon = folder ? Folder : FileText;
      return (
        <motion.li
          className={cn(
            "flex h-7 items-center gap-2",
            depth === 1 && "pl-5",
            name === "AGENTS.md" ? "text-foreground" : "text-foreground/75"
          )}
          key={name}
          {...row(order)}
        >
          <Icon
            className="text-muted-foreground size-3.5 shrink-0"
            strokeWidth={1.75}
          />
          {name}
        </motion.li>
      );
    })}
  </ul>
);

const checks = ["vp check", "vp test", "vp run test:e2e", "vp run build"];

const Verify = () => (
  <ul className="flex flex-col gap-1.5 font-mono text-xs">
    {checks.map((command, order) => (
      <motion.li
        className="bg-background/60 border-border flex h-9 items-center justify-between gap-3 rounded-lg border px-3"
        key={command}
        {...row(order)}
      >
        <span>
          <span className="text-muted-foreground">$ </span>
          {command}
        </span>
        <motion.span
          animate={{ opacity: 1, scale: 1 }}
          className="bg-added/10 text-added grid size-5 place-items-center rounded-full"
          initial={{ opacity: 0, scale: 0.6 }}
          transition={{ delay: 0.5 + 0.45 * order, duration: 0.3, ease }}
        >
          <Check className="size-3" strokeWidth={2.5} />
        </motion.span>
      </motion.li>
    ))}
  </ul>
);

const files = [
  { kept: false, path: "package.json" },
  { kept: false, path: "vite.config.ts" },
  { kept: true, path: "apps/web/src/routes/todos.tsx" },
] as const;

const Maintain = () => (
  <div className="flex flex-col gap-2 font-mono text-xs">
    <motion.p className="text-foreground/80 mb-1" {...row(0)}>
      <span className="text-muted-foreground">$ </span>vibestart upgrade
      --dry-run
    </motion.p>
    {files.map(({ kept, path }, order) => (
      <motion.div
        className="bg-background/60 border-border flex h-9 items-center justify-between gap-3 rounded-lg border px-3"
        key={path}
        {...row(order + 1)}
      >
        <span className="truncate">{path}</span>
        {/* The size sits on a wrapper: merged with a colour, it would be read as one and dropped. */}
        <span className="text-fine shrink-0 font-sans">
          <span
            className={cn(
              "flex items-center gap-1 rounded-md px-1.5 py-0.5",
              kept
                ? "bg-foreground/[0.05] text-muted-foreground"
                : "bg-added/10 text-added"
            )}
          >
            {kept ? (
              <Lock className="size-3" strokeWidth={2} />
            ) : (
              <GitMerge className="size-3" strokeWidth={2} />
            )}
            {kept ? m.viz_how_kept() : m.viz_how_merged()}
          </span>
        </span>
      </motion.div>
    ))}
  </div>
);

const panes = [Choose, Generate, Verify, Maintain] as const;

export const HowItWorks = ({
  stages,
}: {
  readonly stages: readonly [Stage, Stage, Stage, Stage];
}) => {
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.5 });
  const reduced = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(false);
  const [held, setHeld] = useState(false);
  const playing = inView && !picked && !held && !reduced;
  const stage = stages[index] ?? stages[0];
  const Pane = panes[index] ?? Choose;

  useEffect(() => {
    const timer = playing
      ? setTimeout(() => {
          setIndex((index + 1) % stages.length);
        }, dwell)
      : undefined;
    return () => {
      clearTimeout(timer);
    };
  }, [index, playing, stages.length]);

  return (
    <div
      className="bg-card shadow-sheet rounded-sheet my-8 overflow-hidden"
      onBlur={() => {
        setHeld(false);
      }}
      onFocus={() => {
        setHeld(true);
      }}
      onPointerEnter={() => {
        setHeld(true);
      }}
      onPointerLeave={() => {
        setHeld(false);
      }}
      ref={root}
    >
      <ol className="border-border grid grid-cols-4 border-b">
        {stages.map((candidate, order) => {
          const on = order === index;
          return (
            <li className="min-w-0" key={candidate.title}>
              <button
                aria-current={on ? "step" : undefined}
                className="group focus-visible:ring-foreground/30 relative flex h-full w-full flex-col gap-1 px-3 pt-4 pb-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset sm:px-5"
                onClick={() => {
                  setIndex(order);
                  setPicked(true);
                }}
                type="button"
              >
                <span className="bg-border absolute inset-x-0 top-0 h-0.5" />
                {on && (
                  <motion.span
                    animate={{ scaleX: 1 }}
                    className="bg-foreground absolute inset-x-0 top-0 h-0.5 origin-left"
                    initial={{ scaleX: playing ? 0 : 1 }}
                    key={`${String(order)}-${String(playing)}`}
                    transition={
                      playing
                        ? { duration: dwell / 1000, ease: "linear" }
                        : { duration: 0 }
                    }
                  />
                )}
                <span className="text-fine font-mono tabular-nums">
                  <span
                    className={cn(
                      "transition-colors",
                      on ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {String(order + 1).padStart(2, "0")}
                  </span>
                </span>
                <span
                  className={cn(
                    "text-xs leading-snug font-medium transition-colors sm:text-sm",
                    on
                      ? "text-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {candidate.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] sm:gap-8 sm:p-7">
        <div className="grid">
          <AnimatePresence initial={false} mode="wait">
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="text-foreground/85 sm:text-ui col-start-1 row-start-1 text-sm leading-relaxed text-pretty sm:leading-relaxed"
              exit={{ opacity: 0, y: -4 }}
              initial={{ opacity: 0, y: 4 }}
              key={index}
              transition={{ duration: 0.3, ease }}
            >
              {stage.text}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="min-h-56">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key={index}
              transition={{ duration: 0.2 }}
            >
              <Pane />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
