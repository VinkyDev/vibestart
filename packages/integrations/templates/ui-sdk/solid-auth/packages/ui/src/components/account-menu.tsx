import { Menu, MenuContent, MenuItem, MenuTrigger } from "@ui-sdk/solid/menu";

const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map(
      (word) =>
        graphemes.segment(word).containing(0)?.segment.toUpperCase() ?? ""
    )
    .join("");

export const AccountMenu = (props: { name: string; onSignOut: () => void }) => (
  <Menu>
    <MenuTrigger aria-label={props.name} class="rounded-full border p-2">
      {initials(props.name)}
    </MenuTrigger>
    <MenuContent class="bg-background text-foreground z-50 rounded-lg border p-1 shadow-lg">
      <MenuItem onSelect={props.onSignOut}>Sign out</MenuItem>
    </MenuContent>
  </Menu>
);
