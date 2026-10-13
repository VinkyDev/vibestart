import { cn } from "cn";
import { TextInput } from "react-native";
import type { TextInputProps } from "react-native";

export const Input = ({ className, ...props }: TextInputProps) => (
  <TextInput
    className={cn(
      "border-border bg-background text-foreground h-11 rounded-md border px-3 text-base",
      className
    )}
    placeholderTextColorClassName="accent-muted-foreground"
    {...props}
  />
);
