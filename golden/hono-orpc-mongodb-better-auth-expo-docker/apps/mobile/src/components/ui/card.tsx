import { cn } from "cn";
import { View } from "react-native";
import type { ViewProps } from "react-native";

export const Card = ({ className, ...props }: ViewProps) => (
  <View
    className={cn(
      "border-border bg-card gap-3 rounded-2xl border p-4",
      className
    )}
    {...props}
  />
);
