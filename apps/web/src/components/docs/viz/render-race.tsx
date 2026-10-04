import { Eye, MousePointerClick, RotateCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@vibestart/ui/components/button";
import { cn } from "@vibestart/ui/lib/utils";

import { Demo } from "#/components/demo/frame.tsx";
import { useSteps } from "#/lib/use-steps.ts";
import { m } from "#/paraglide/messages.js";

const duration = 3000;
const frame = 50;
const frames = duration / frame;
const seconds = 2;

const modes = [
  {
    hint: "TanStack Router",
    id: "spa",
    phases: [
      { at: 0, label: () => m.viz_phase_download() },
      { at: 0.35, label: () => m.viz_phase_fetch() },
    ],
    seen: 0.7,
    shell: 0.35,
    title: () => m.viz_render_spa(),
    usable: 0.7,
  },
  {
    hint: "TanStack Start · Next.js",
    id: "ssr",
    phases: [
      { at: 0, label: () => m.viz_phase_server() },
      { at: 0.3, label: () => m.viz_phase_hydrate() },
    ],
    seen: 0.3,
    shell: 0.3,
    title: () => m.viz_render_ssr(),
    usable: 0.62,
  },
] as const;

type Mode = (typeof modes)[number];

const Page = ({
  mode,
  progress,
}: {
  readonly mode: Mode;
  readonly progress: number;
}) => {
  const seen = progress >= mode.seen;
  return (
    <div className="bg-background/60 border-border flex h-36 flex-col overflow-hidden rounded-xl border">
      <div className="border-border flex h-6 shrink-0 items-center gap-1 border-b px-2.5">
        <span className="bg-foreground/15 size-1.5 rounded-full" />
        <span className="bg-foreground/15 size-1.5 rounded-full" />
        <span className="bg-foreground/15 size-1.5 rounded-full" />
        <span className="bg-foreground/[0.05] ml-2 h-3 flex-1 rounded-full" />
      </div>
      <motion.div
        animate={{ opacity: progress >= mode.shell ? 1 : 0 }}
        className="flex flex-1 flex-col gap-2.5 p-3"
        initial={false}
        transition={{ duration: 0.25 }}
      >
        <span
          className={cn(
            "h-2.5 w-2/5 rounded-full transition-colors duration-300",
            seen ? "bg-foreground/70" : "bg-foreground/10"
          )}
        />
        {["w-4/5", "w-3/5", "w-2/3"].map((width) => (
          <span className="flex items-center gap-2" key={width}>
            <span
              className={cn(
                "size-3 shrink-0 rounded-xs border transition-colors duration-300",
                seen ? "border-foreground/40" : "border-foreground/10"
              )}
            />
            <span
              className={cn(
                "h-2 rounded-full transition-colors duration-300",
                width,
                seen ? "bg-foreground/30" : "bg-foreground/[0.07] animate-pulse"
              )}
            />
          </span>
        ))}
      </motion.div>
    </div>
  );
};

const Metric = ({
  at,
  icon: Icon,
  label,
  progress,
}: {
  readonly at: number;
  readonly icon: LucideIcon;
  readonly label: string;
  readonly progress: number;
}) => {
  const reached = progress >= at;
  return (
    <li
      className={cn(
        "flex items-center gap-2 text-xs transition-colors duration-300",
        reached ? "text-foreground" : "text-muted-foreground/60"
      )}
    >
      <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
      <span className="flex-1">{label}</span>
      <span className="font-mono tabular-nums">
        {reached ? `${(at * seconds).toFixed(1)}s` : "…"}
      </span>
    </li>
  );
};

const Lane = ({
  mode,
  progress,
}: {
  readonly mode: Mode;
  readonly progress: number;
}) => {
  const phase = mode.phases.findLast((candidate) => progress >= candidate.at);
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h4 className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{mode.title()}</span>
        <span className="text-muted-foreground text-fine truncate font-mono">
          {mode.hint}
        </span>
      </h4>
      <Page mode={mode} progress={progress} />
      <span className="bg-foreground/[0.07] relative h-1 overflow-hidden rounded-full">
        <motion.span
          animate={{ width: `${progress * 100}%` }}
          className="bg-foreground/60 absolute inset-y-0 left-0 rounded-full"
          initial={false}
          transition={{ duration: frame / 1000, ease: "linear" }}
        />
      </span>
      <p className="text-muted-foreground min-h-4 text-xs">
        {progress < mode.usable ? phase?.label() : m.viz_phase_done()}
      </p>
      <ul className="flex flex-col gap-1.5">
        <Metric
          at={mode.seen}
          icon={Eye}
          label={m.viz_seen()}
          progress={progress}
        />
        <Metric
          at={mode.usable}
          icon={MousePointerClick}
          label={m.viz_usable()}
          progress={progress}
        />
      </ul>
    </section>
  );
};

export const RenderRace = () => {
  // The race runs frame by frame, and opens on its finish until it is replayed.
  const [played, replay] = useSteps({
    count: frames,
    first: frame,
    from: frames,
  });
  const progress = played / frames;

  return (
    <div className="my-8">
      <Demo
        actions={
          <Button
            disabled={progress < 1}
            onClick={() => {
              replay();
            }}
            size="sm"
            variant="secondary"
          >
            <RotateCw />
            {m.viz_reload()}
          </Button>
        }
        caption={m.viz_render_caption()}
        status={
          <p className="text-muted-foreground text-xs">
            {m.viz_render_status()}
          </p>
        }
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {modes.map((mode) => (
            <Lane key={mode.id} mode={mode} progress={progress} />
          ))}
        </div>
      </Demo>
    </div>
  );
};
