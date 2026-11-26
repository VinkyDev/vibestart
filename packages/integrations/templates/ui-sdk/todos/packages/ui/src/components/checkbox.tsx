"use client";

import {
  Checkbox as Primitive,
  CheckboxIndicator,
} from "@ui-sdk/react/checkbox";
import { Check } from "lucide-react";
import type { ComponentProps } from "react";

export const Checkbox = ({
  onCheckedChange,
  ...props
}: Omit<ComponentProps<typeof Primitive>, "onCheckedChange"> & {
  onCheckedChange: (checked: boolean) => void;
}) => (
  <Primitive
    {...props}
    onCheckedChange={(next) => {
      onCheckedChange(next === true);
    }}
    className="inline-grid size-4 shrink-0 place-items-center rounded border"
  >
    <CheckboxIndicator>
      <Check aria-hidden="true" className="size-3" />
    </CheckboxIndicator>
  </Primitive>
);
