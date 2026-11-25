import { cn } from "cn";
import type { ComponentProps } from "react";

export const Badge = ({
  variant,
  className,
  ...props
}: ComponentProps<"span"> & { variant?: "secondary" }) => (
  <span
    {...props}
    data-variant={variant}
    className={cn(
      "bg-muted rounded-full px-2 py-0.5 text-xs font-medium",
      className
    )}
  />
);
