import { cn } from "cn";
import { Text as NativeText } from "react-native";
import type { TextProps } from "react-native";

export const Text = ({ className, ...props }: TextProps) => (
  <NativeText
    className={cn("text-foreground text-base", className)}
    {...props}
  />
);
