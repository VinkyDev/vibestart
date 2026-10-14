import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Pressable } from "react-native";
import type { PressableProps } from "react-native";

import { Text } from "#src/components/ui/text.tsx";

const buttonVariants = cva(
  "h-12 flex-row items-center justify-center rounded-xl px-5 active:opacity-80 disabled:opacity-40",
  {
    defaultVariants: { variant: "default" },
    variants: {
      variant: {
        default: "bg-primary",
        outline: "border-border bg-card border",
      },
    },
  }
);

const labelVariants = cva("text-base font-semibold", {
  defaultVariants: { variant: "default" },
  variants: {
    variant: {
      default: "text-primary-foreground",
      outline: "text-foreground",
    },
  },
});

type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & { readonly label: string };

export const Button = ({
  className,
  label,
  variant,
  ...props
}: ButtonProps) => (
  <Pressable
    accessibilityRole="button"
    className={cn(buttonVariants({ variant }), className)}
    {...props}
  >
    <Text className={labelVariants({ variant })}>{label}</Text>
  </Pressable>
);
