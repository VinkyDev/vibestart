"use client";

import { Avatar as Primitive } from "@ui-sdk/react/avatar";
import type { ComponentProps } from "react";

export { AvatarFallback } from "@ui-sdk/react/avatar";

export const Avatar = ({
  size = "sm",
  ...props
}: ComponentProps<typeof Primitive> & { size?: "sm" }) => (
  <Primitive
    {...props}
    data-size={size}
    className="bg-muted inline-grid size-7 place-items-center rounded-full text-xs"
  />
);
