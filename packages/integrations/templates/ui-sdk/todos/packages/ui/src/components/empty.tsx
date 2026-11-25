import { cn } from "cn";
import type { ComponentProps } from "react";

export const Empty = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    {...props}
    className={cn(
      "grid justify-items-center gap-4 py-10 text-center",
      className
    )}
  />
);

export const EmptyHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    {...props}
    className={cn("grid justify-items-center gap-2", className)}
  />
);

export const EmptyMedia = ({
  variant,
  children,
}: ComponentProps<"div"> & { variant?: "icon" }) => (
  <div data-variant={variant} className="bg-muted rounded-lg p-2">
    {children}
  </div>
);

export const EmptyTitle = ({ className, ...props }: ComponentProps<"p">) => (
  <p {...props} className={cn("font-medium", className)} />
);

export const EmptyDescription = ({
  className,
  ...props
}: ComponentProps<"p">) => (
  <p {...props} className={cn("text-muted-foreground text-sm", className)} />
);
