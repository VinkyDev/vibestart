import { useTheme } from "next-themes";

import { ThemeMenu } from "@my-app/ui/components/theme-menu";

import { useHydrated } from "#src/hooks/use-hydrated.ts";

export const ModeToggle = () => {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();

  return (
    <ThemeMenu disabled={!hydrated} onValueChange={setTheme} value={theme} />
  );
};
