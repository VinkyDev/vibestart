import { ModeToggle } from "#src/components/mode-toggle.tsx";
import { NavLinks } from "#src/components/nav-links.tsx";

export const Header = () => (
  <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur-md">
    <div className="mx-auto flex h-14 max-w-2xl items-center gap-6 px-4">
      <span className="hidden items-center gap-2 text-sm font-semibold tracking-tight sm:flex">
        <span aria-hidden="true" className="bg-primary size-2.5 rounded-sm" />
        my-app
      </span>
      <NavLinks />
      <div className="ml-auto">
        <ModeToggle />
      </div>
    </div>
  </header>
);
