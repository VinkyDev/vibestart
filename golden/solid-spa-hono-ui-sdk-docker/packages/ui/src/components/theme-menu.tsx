import { createLocalStorage } from "@ui-sdk/core";
import {
  Menu,
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@ui-sdk/solid/menu";
import { createSignal } from "solid-js";

const applyTheme = (value: string) => {
  document.documentElement.classList.toggle("dark", value === "dark");
};

export const ThemeMenu = () => {
  const storage = createLocalStorage("theme");
  const initial = storage.get() ?? "light";
  const [theme, setTheme] = createSignal(initial);

  applyTheme(initial);

  return (
    <Menu>
      <MenuTrigger class="rounded-md border px-3 py-1">
        Toggle theme
      </MenuTrigger>
      <MenuContent class="bg-background text-foreground z-50 rounded-lg border p-1 shadow-lg">
        <MenuRadioGroup
          name="Theme"
          value={theme()}
          onValueChange={(value) => {
            setTheme(value);
            storage.set(value);
            applyTheme(value);
          }}
        >
          <MenuRadioItem value="light">Light</MenuRadioItem>
          <MenuRadioItem value="dark">Dark</MenuRadioItem>
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
};
