import { Link } from "@tanstack/react-router";
import { LayersIcon } from "lucide-react";

import { ModeToggle } from "#src/components/mode-toggle.tsx";
import { UserMenu } from "#src/components/user-menu.tsx";

const links = [
  { to: "/", label: "Home" },
  { to: "/todos", label: "Todos" },
] as const;

export const Header = () => (
  <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur-lg">
    <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-5 sm:gap-6 sm:px-8">
      <Link
        className="flex items-center gap-2.5 font-semibold tracking-tight"
        to="/"
      >
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-lg [&_svg]:size-4"
        >
          <LayersIcon />
        </span>
        <span className="sr-only sm:not-sr-only">my-app</span>
      </Link>
      <nav className="flex gap-1 text-sm">
        {links.map(({ to, label }) => (
          <Link
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-muted text-foreground" }}
            className="hover:text-foreground rounded-md px-2.5 py-1.5 font-medium transition-colors"
            inactiveProps={{ className: "text-muted-foreground" }}
            key={to}
            to={to}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-1.5">
        <UserMenu />
        <ModeToggle />
      </div>
    </div>
  </header>
);
