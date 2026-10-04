import { range } from "es-toolkit/math";
import { ArrowDown, ArrowRight, Box, FileCode2, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useState } from "react";

import { cn } from "@vibestart/ui/lib/utils";

import { Demo } from "#/components/demo/frame.tsx";
import { Stepper } from "#/components/demo/stepper.tsx";
import { ease } from "#/lib/motion.ts";
import { m } from "#/paraglide/messages.js";

interface Stage {
  readonly text: string;
  readonly code?: string;
}

const files = ["apps/web/", "apps/server/", "packages/", "Dockerfile"];

const layers = [
  { detail: "debian:trixie-slim", label: () => m.viz_layer_system() },
  { detail: "node", label: () => m.viz_layer_runtime() },
  { detail: "dist/", label: () => m.viz_layer_app() },
  {
    detail: 'CMD ["node", "dist/index.mjs"]',
    label: () => m.viz_layer_start(),
  },
];

const containersAt = [0, 0, 1, 3];

const Column = ({
  children,
  icon: Icon,
  on,
  title,
}: {
  readonly children: ReactNode;
  readonly icon: LucideIcon;
  readonly on: boolean;
  readonly title: string;
}) => (
  <section
    className={cn(
      "bg-card flex min-h-48 min-w-0 flex-col gap-3 rounded-xl p-3 transition-shadow duration-300",
      on ? "shadow-preview" : "shadow-rest"
    )}
  >
    <h4
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium transition-colors",
        on ? "text-tint" : "text-muted-foreground"
      )}
    >
      <Icon className="size-3.5" strokeWidth={2} />
      {title}
    </h4>
    {children}
  </section>
);

const Arrow = ({
  command,
  on,
}: {
  readonly command: string;
  readonly on: boolean;
}) => (
  <span
    className={cn(
      "text-micro flex items-center justify-center gap-1.5 font-mono transition-colors sm:flex-col",
      on ? "text-foreground" : "text-muted-foreground/60"
    )}
  >
    <ArrowRight className="hidden size-4 sm:block" strokeWidth={1.75} />
    <ArrowDown className="size-4 sm:hidden" strokeWidth={1.75} />
    {command}
  </span>
);

export const ImageBuild = ({
  steps,
}: {
  readonly steps: readonly [Stage, Stage, Stage, Stage];
}) => {
  const [index, setIndex] = useState(0);
  const step = steps[index] ?? steps[0];
  const built = index >= 1;
  const running = containersAt[index] ?? 0;

  return (
    <div className="tint-deployment my-8">
      <Demo
        actions={
          <Stepper count={steps.length} current={index} onChange={setIndex} />
        }
        caption={step.text}
        status={
          <div className="flex min-h-6 items-center justify-between gap-4">
            <code className="text-foreground/80 min-w-0 truncate font-mono text-xs">
              {step.code}
            </code>
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {m.viz_step({ current: index + 1, total: steps.length })}
            </span>
          </div>
        }
      >
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_1.15fr_auto_1fr] sm:gap-3">
          <Column icon={FileCode2} on={index === 0} title={m.viz_docker_code()}>
            <ul className="flex flex-col gap-1.5">
              {files.map((file) => (
                <li
                  className="text-muted-foreground bg-foreground/[0.04] text-fine truncate rounded-md px-2 py-1 font-mono"
                  key={file}
                >
                  {file}
                </li>
              ))}
            </ul>
          </Column>
          <Arrow command="docker build" on={index === 1} />
          <Column icon={Layers} on={index === 1} title={m.viz_docker_image()}>
            <ol className="flex flex-col-reverse gap-1">
              {layers.map((layer, position) => (
                <motion.li
                  animate={{ opacity: built ? 1 : 0.25, y: built ? 0 : 6 }}
                  className={cn(
                    "flex flex-col rounded-md px-2 py-1 transition-colors",
                    built ? "bg-tint-soft" : "bg-foreground/[0.04]"
                  )}
                  initial={false}
                  key={layer.detail}
                  transition={{
                    delay: built ? position * 0.12 : 0,
                    duration: 0.35,
                    ease,
                  }}
                >
                  <span className="text-fine font-medium">{layer.label()}</span>
                  <span className="text-muted-foreground text-micro truncate font-mono">
                    {layer.detail}
                  </span>
                </motion.li>
              ))}
            </ol>
          </Column>
          <Arrow command="docker run" on={index >= 2} />
          <Column icon={Box} on={index >= 2} title={m.viz_docker_containers()}>
            <ul className="flex flex-col gap-1.5">
              <AnimatePresence initial={false}>
                {range(running).map((container) => (
                  <motion.li
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-tint-soft flex items-center gap-2 rounded-md px-2 py-1.5"
                    exit={{ opacity: 0, scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    // The containers are interchangeable copies, told apart only by their place.
                    // oxlint-disable-next-line react/no-array-index-key
                    key={container}
                    transition={{
                      delay: container * 0.15,
                      duration: 0.3,
                      ease,
                    }}
                  >
                    <span className="bg-added size-1.5 shrink-0 animate-pulse rounded-full" />
                    <span className="text-fine min-w-0 flex-1 truncate font-mono">
                      app-{container + 1}
                    </span>
                    <span className="text-muted-foreground text-micro font-mono">
                      :3000
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
              {running === 0 && (
                <li className="text-muted-foreground/60 text-fine">
                  {m.viz_docker_none()}
                </li>
              )}
            </ul>
          </Column>
        </div>
      </Demo>
    </div>
  );
};
