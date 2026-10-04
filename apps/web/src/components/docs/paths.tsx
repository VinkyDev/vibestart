import { ArrowRight, Sparkles, SquareTerminal } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@vibestart/ui/lib/utils";

import { DocLink } from "#/components/docs/doc-link.tsx";

const readers = {
  agent: { icon: Sparkles, tint: "tint-api" },
  developer: { icon: SquareTerminal, tint: "tint-framework" },
} as const;

export const Paths = ({ children }: { readonly children: ReactNode }) => (
  <div className="my-8 grid gap-4 md:grid-cols-2">{children}</div>
);

export const Path = ({
  children,
  reader,
  steps,
  title,
}: {
  readonly children: ReactNode;
  readonly reader: keyof typeof readers;
  readonly steps: readonly { readonly href: string; readonly title: string }[];
  readonly title: string;
}) => {
  const { icon: Icon, tint } = readers[reader];
  return (
    <section
      className={cn(
        tint,
        "bg-card shadow-rest flex flex-col gap-4 rounded-xl p-5 sm:p-6"
      )}
    >
      <span className="bg-tint-soft text-tint grid size-9 place-items-center rounded-xl">
        <Icon className="size-4.5" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-foreground text-base font-semibold">{title}</h3>
        <div className="text-muted-foreground text-sm leading-relaxed text-pretty [&>p]:my-0">
          {children}
        </div>
      </div>
      <ol className="border-border mt-auto flex flex-col border-t pt-2">
        {steps.map((step, index) => (
          <li key={step.href}>
            <DocLink
              className="group hover:bg-tint-soft -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors"
              url={step.href}
            >
              <span className="text-tint w-4 shrink-0 font-mono text-xs tabular-nums">
                {index + 1}
              </span>
              <span className="text-foreground min-w-0 flex-1">
                {step.title}
              </span>
              <ArrowRight className="text-muted-foreground group-hover:text-foreground size-3.5 shrink-0 transition group-hover:translate-x-0.5" />
            </DocLink>
          </li>
        ))}
      </ol>
    </section>
  );
};
