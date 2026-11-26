import { Button as Primitive } from "@ui-sdk/react/button";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium focus-visible:outline-2 disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground",
        outline: "border",
        ghost: "hover:bg-muted",
        link: "underline underline-offset-4",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3",
        lg: "h-10 px-5",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

export const Button = ({
  size,
  variant,
  className,
  ...props
}: Omit<ComponentProps<typeof Primitive>, "className"> &
  VariantProps<typeof buttonVariants> & { className?: string }) => (
  <Primitive
    {...props}
    className={buttonVariants({ size, variant, className })}
  />
);
