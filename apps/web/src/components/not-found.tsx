import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useId } from "react";

import { buttonVariants } from "@vibestart/ui/components/button";
import { cn } from "@vibestart/ui/lib/utils";

import { backInk, clearing, strokes, strokeWidth } from "#/components/logo.tsx";
import { m } from "#/paraglide/messages.js";

const action =
  "h-10 rounded-full px-5 text-sm font-medium sm:h-11 sm:px-6 sm:text-base";

export const notFoundAction = {
  primary: cn(buttonVariants(), action),
  secondary: cn(
    "bg-card shadow-rest hover:shadow-lift focus-visible:ring-foreground/30 flex items-center transition-shadow outline-none focus-visible:ring-2",
    action
  ),
} as const;

const parted = { x: 2.6, y: -6.8 } as const;

const PartedMark = () => {
  const clip = useId();
  const slide = {
    animate: parted,
    initial: { x: 0, y: 0 },
    transition: { damping: 14, delay: 0.5, stiffness: 90, type: "spring" },
  } as const;
  return (
    <svg
      aria-hidden
      className="size-28 overflow-visible sm:size-36"
      fill="none"
      strokeLinecap="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 32 32"
    >
      <clipPath id={clip}>
        <motion.path clipRule="evenodd" d={clearing} {...slide} />
      </clipPath>
      <path
        className="stroke-foreground"
        clipPath={`url(#${clip})`}
        d={strokes.back}
        strokeOpacity={backInk}
      />
      <motion.path className="stroke-foreground" d={strokes.front} {...slide} />
    </svg>
  );
};

export const NotFound = ({ children }: { readonly children: ReactNode }) => (
  <main className="flex flex-1 items-center justify-center px-6 py-24">
    <div className="flex max-w-lg flex-col items-center gap-10 text-center">
      <PartedMark />
      <div className="flex flex-col gap-4">
        <h1 className="font-headline text-section text-balance">
          {m.not_found_title()}
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed text-pretty">
          {m.not_found_body()}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {children}
      </div>
    </div>
  </main>
);
