import { CircleCheck, CircleX, FileCode2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@vibestart/ui/lib/utils";

import { ease } from "#/lib/motion.ts";

export const Demo = ({
  actions,
  caption,
  children,
  status,
}: {
  readonly actions: ReactNode;
  readonly caption: string;
  readonly children: ReactNode;
  readonly status: ReactNode;
}) => (
  <div className="bg-card shadow-sheet rounded-sheet flex min-w-0 flex-col overflow-hidden">
    <div className="flex flex-col gap-4 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-6">
      <div className="grid min-h-10 max-w-md flex-1">
        <AnimatePresence initial={false}>
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="text-muted-foreground col-start-1 row-start-1 text-sm leading-relaxed text-pretty"
            exit={{ opacity: 0, y: -4 }}
            initial={{ opacity: 0, y: 4 }}
            key={caption}
            transition={{ duration: 0.35, ease }}
          >
            {caption}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
    </div>
    <div className="flex flex-col gap-3 p-5 sm:p-6">{children}</div>
    <div className="border-border bg-foreground/[0.02] mt-auto border-t px-5 py-3 sm:px-6">
      {status}
    </div>
  </div>
);

export const Verdict = ({
  children,
  passed,
}: {
  readonly children: ReactNode;
  readonly passed: boolean;
}) => (
  <p className="flex items-center gap-2 font-mono text-xs">
    {passed ? (
      <CircleCheck className="text-added size-4 shrink-0" strokeWidth={1.75} />
    ) : (
      <CircleX className="text-removed size-4 shrink-0" strokeWidth={1.75} />
    )}
    <span className={passed ? "text-foreground/80" : "text-removed"}>
      {children}
    </span>
  </p>
);

export const CodeFile = ({
  below,
  children,
  className,
  path,
}: {
  readonly below?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
  readonly path: string;
}) => (
  <figure
    className={cn(
      "border-border bg-background/50 min-w-0 overflow-hidden rounded-xl border",
      className
    )}
  >
    <figcaption className="text-fine text-muted-foreground border-border flex h-8 items-center gap-2 border-b px-3 font-mono">
      <FileCode2 className="text-tint size-3.5 shrink-0" strokeWidth={1.75} />
      <span className="truncate">{path}</span>
    </figcaption>
    <pre className="text-snippet overflow-x-auto px-4 py-3 font-mono leading-6">
      <code className="flex min-w-max flex-col">{children}</code>
    </pre>
    {below}
  </figure>
);

export const Quiet = ({ children }: { readonly children: ReactNode }) => (
  <span className="text-muted-foreground/70">{children}</span>
);

export const Line = ({
  children,
  className,
}: {
  readonly children?: ReactNode;
  readonly className?: string;
}) => (
  <span className={cn("block min-h-6 whitespace-pre", className)}>
    {children}
  </span>
);
