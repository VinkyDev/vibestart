import { Switch as Root, SwitchThumb } from "@ui-sdk/react/switch";
import type { ComponentProps } from "react";

export function Switch(props: Omit<ComponentProps<typeof Root>, "children" | "className">) {
  return (
    <Root {...props} className="switch">
      <SwitchThumb className="thumb" />
    </Root>
  );
}
