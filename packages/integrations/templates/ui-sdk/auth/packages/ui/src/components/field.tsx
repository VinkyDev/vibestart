"use client";

import type { ComponentProps } from "react";

export { Field, FieldDescription, FieldLabel } from "@ui-sdk/react/field";

export const FieldGroup = (props: ComponentProps<"div">) => (
  <div className="grid gap-4" {...props} />
);
