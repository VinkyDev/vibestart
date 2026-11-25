import { cn } from "cn";
import type { ComponentProps } from "react";

export const Card = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    {...props}
    className={cn("bg-card rounded-lg border p-5 shadow-sm", className)}
  />
);

export const CardContent = ({ className, ...props }: ComponentProps<"div">) => (
  <div {...props} className={cn("grid gap-4", className)} />
);
