import { ModeToggle } from "#src/components/mode-toggle.tsx";
import { NavLinks } from "#src/components/nav-links.tsx";

export const Header = () => (
  <header className="border-b">
    <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
      <NavLinks />
      <ModeToggle />
    </div>
  </header>
);
