import { motion } from "motion/react";

import { cn } from "@my-app/ui/lib/utils";

const labels = {
  checking: "Checking the API",
  connected: "API connected",
  disconnected: "API unreachable",
} as const;

export const StatusLight = ({ status }: { status: keyof typeof labels }) => (
  <output className="flex items-center gap-2.5 text-sm font-medium">
    <span aria-hidden="true" className="relative flex size-2">
      {status === "connected" && (
        <motion.span
          animate={{ opacity: [0.6, 0], scale: [1, 3] }}
          className="bg-success absolute inset-0 rounded-full motion-reduce:hidden"
          transition={{
            duration: 2,
            ease: "easeOut",
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 1,
          }}
        />
      )}
      <span
        className={cn(
          "relative size-full rounded-full transition-colors duration-300",
          status === "checking" &&
            "bg-muted-foreground motion-safe:animate-pulse",
          status === "connected" && "bg-success",
          status === "disconnected" && "bg-destructive"
        )}
      />
    </span>
    <span
      className={cn(
        "transition-colors duration-300",
        status === "checking" && "text-muted-foreground",
        status === "disconnected" && "text-destructive"
      )}
    >
      {labels[status]}
    </span>
  </output>
);
