import { cn } from "cn";
import type { ComponentProps } from "react";

export const Alert = ({
  variant,
  className,
  ...props
}: ComponentProps<"div"> & { variant?: "destructive" }) => (
  <div
    {...props}
    role="alert"
    data-variant={variant}
    className={cn(
      "data-[variant=destructive]:text-destructive relative rounded-lg border p-3",
      className
    )}
  />
);

export const AlertTitle = ({ className, ...props }: ComponentProps<"p">) => (
  <p {...props} className={cn("font-medium", className)} />
);

export const AlertDescription = ({
  className,
  ...props
}: ComponentProps<"div">) => (
  <div {...props} className={cn("text-sm", className)} />
);

export const AlertAction = ({ className, ...props }: ComponentProps<"div">) => (
  <div {...props} className={cn("mt-2", className)} />
);
