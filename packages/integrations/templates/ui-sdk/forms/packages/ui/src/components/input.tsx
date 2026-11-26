"use client";

import { Input as Primitive } from "@ui-sdk/react/input";
import { cn } from "cn";
import type { ComponentProps } from "react";

export const Input = ({
  className,
  ...props
}: Omit<ComponentProps<typeof Primitive>, "className"> & {
  className?: string;
}) => (
  <Primitive
    {...props}
    className={cn("bg-background h-9 w-full rounded-md border px-3", className)}
  />
);
