import { cn } from "cn";
import { View } from "react-native";
import type { ViewProps } from "react-native";

export const Card = ({ className, ...props }: ViewProps) => (
  <View
    className={cn(
      "border-border bg-background gap-3 rounded-xl border p-4",
      className
    )}
    {...props}
  />
);
