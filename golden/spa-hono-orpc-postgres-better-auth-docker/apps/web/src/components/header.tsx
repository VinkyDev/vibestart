import { Link } from "@tanstack/react-router";

import { ModeToggle } from "#src/components/mode-toggle.tsx";
import { UserMenu } from "#src/components/user-menu.tsx";

const links = [
  { to: "/", label: "Home" },
  { to: "/todos", label: "Todos" },
] as const;

export const Header = () => (
  <header className="border-b">
    <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
      <nav className="flex gap-4 text-sm">
        {links.map(({ to, label }) => (
          <Link
            activeOptions={{ exact: true }}
            activeProps={{ className: "font-medium text-foreground" }}
            className="hover:text-foreground transition-colors"
            inactiveProps={{ className: "text-muted-foreground" }}
            key={to}
            to={to}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <UserMenu />
        <ModeToggle />
      </div>
    </div>
  </header>
);
