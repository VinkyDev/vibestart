import { motion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@vibestart/ui/lib/utils";

interface Segment<T extends string> {
  readonly label: ReactNode;
  readonly lang?: string;
  readonly value: T;
}

export const Segmented = <T extends string>({
  className,
  id,
  label,
  onChange,
  options,
  value,
}: {
  readonly className?: string;
  readonly id: string;
  readonly label: string;
  readonly onChange: (value: T) => void;
  readonly options: readonly Segment<T>[];
  readonly value: T;
}) => (
  <fieldset
    aria-label={label}
    className={cn(
      "bg-foreground/5 flex items-center rounded-full p-0.5",
      className
    )}
  >
    {options.map((option) => {
      const current = option.value === value;
      return (
        <button
          aria-pressed={current}
          className={cn(
            "focus-visible:ring-foreground/30 relative rounded-full px-3 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2",
            current
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          key={option.value}
          lang={option.lang}
          onClick={() => {
            if (!current) {
              onChange(option.value);
            }
          }}
          type="button"
        >
          {current && (
            <motion.span
              className="bg-card shadow-rest absolute inset-0 rounded-full"
              layoutId={id}
              transition={{ damping: 30, stiffness: 400, type: "spring" }}
            />
          )}
          <span className="relative">{option.label}</span>
        </button>
      );
    })}
  </fieldset>
);
