"use client";

import { MenuContent, MenuItem } from "@ui-sdk/react/menu";
import { cn } from "cn";
import type { ComponentProps } from "react";
import { useId } from "react";

export {
  Menu as DropdownMenu,
  MenuGroup as DropdownMenuGroup,
  MenuGroupLabel as DropdownMenuLabel,
  MenuSeparator as DropdownMenuSeparator,
  MenuTrigger as DropdownMenuTrigger,
} from "@ui-sdk/react/menu";

export const DropdownMenuContent = ({
  className,
  ...props
}: Omit<ComponentProps<typeof MenuContent>, "className"> & {
  className?: string;
}) => (
  <MenuContent
    {...props}
    className={cn(
      "bg-background text-foreground z-50 rounded-md border p-2 shadow-lg",
      className
    )}
  />
);

export const DropdownMenuItem = ({
  value,
  variant,
  ...props
}: Omit<ComponentProps<typeof MenuItem>, "value"> & {
  value?: string;
  variant?: "destructive";
}) => {
  const id = useId();

  return (
    <MenuItem
      value={value ?? id}
      destructive={variant === "destructive"}
      className="data-[highlighted]:bg-muted flex items-center gap-2 rounded p-2"
      {...props}
    />
  );
};
