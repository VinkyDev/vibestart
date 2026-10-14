import { Link } from "@tanstack/react-router";

import { ModeToggle } from "#src/components/mode-toggle.tsx";

const links = [
  { to: "/", label: "Home" },
  { to: "/todos", label: "Todos" },
] as const;

export const Header = () => (
  <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur-md">
    <div className="mx-auto flex h-14 max-w-2xl items-center gap-6 px-4">
      <span className="hidden items-center gap-2 text-sm font-semibold tracking-tight sm:flex">
        <span aria-hidden="true" className="bg-primary size-2.5 rounded-sm" />
        my-app
      </span>
      <nav className="flex gap-1 text-sm">
        {links.map(({ to, label }) => (
          <Link
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-muted text-foreground" }}
            className="hover:text-foreground rounded-md px-2.5 py-1 font-medium transition-colors"
            inactiveProps={{ className: "text-muted-foreground" }}
            key={to}
            to={to}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto">
        <ModeToggle />
      </div>
    </div>
  </header>
);
