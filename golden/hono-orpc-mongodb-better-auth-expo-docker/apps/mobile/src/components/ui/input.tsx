import { cn } from "cn";
import { TextInput } from "react-native";
import type { TextInputProps } from "react-native";

export const Input = ({ className, ...props }: TextInputProps) => (
  <TextInput
    className={cn(
      "border-border bg-card text-foreground h-12 rounded-xl border px-4 text-base",
      className
    )}
    placeholderTextColorClassName="accent-muted-foreground"
    {...props}
  />
);
