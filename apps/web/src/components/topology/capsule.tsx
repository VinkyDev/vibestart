import type { ReactNode } from "react";

import { cn } from "@vibestart/ui/lib/utils";

export const capsuleClass =
  "flex h-8 items-center gap-2 rounded-full px-3.5 text-xs font-medium whitespace-nowrap";

export const Capsule = ({
  children,
  label,
}: {
  readonly children: ReactNode;
  readonly label: string;
}) => (
  <span className={cn(capsuleClass, "bg-card text-foreground shadow-rest")}>
    <span className="bg-tint size-1.5 rounded-full" />
    <span className="text-muted-foreground">{label}</span>
    {children}
  </span>
);
