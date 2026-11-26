import {
  Menu,
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@ui-sdk/react/menu";

export const ThemeMenu = ({
  disabled,
  value,
  onValueChange,
}: {
  disabled: boolean;
  value: string | undefined;
  onValueChange: (theme: string) => void;
}) => (
  <Menu>
    <MenuTrigger className="rounded-md border px-3 py-1" disabled={disabled}>
      Toggle theme
    </MenuTrigger>
    <MenuContent className="bg-background text-foreground z-50 rounded-lg border p-1 shadow-lg">
      <MenuRadioGroup name="Theme" onValueChange={onValueChange} value={value}>
        {["Light", "Dark", "System"].map((theme) => (
          <MenuRadioItem
            className="data-[highlighted]:bg-muted data-[checked]:font-bold rounded px-3 py-1"
            key={theme}
            value={theme.toLowerCase()}
          >
            {theme}
          </MenuRadioItem>
        ))}
      </MenuRadioGroup>
    </MenuContent>
  </Menu>
);
