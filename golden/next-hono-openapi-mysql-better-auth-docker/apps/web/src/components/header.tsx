import { LayersIcon } from "lucide-react";
import Link from "next/link";

import { ModeToggle } from "#src/components/mode-toggle.tsx";
import { NavLinks } from "#src/components/nav-links.tsx";
import { UserMenu } from "#src/components/user-menu.tsx";
import { getSession } from "#src/server/session.ts";

export const Header = async () => {
  const session = await getSession();

  return (
    <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-5 sm:gap-6 sm:px-8">
        <Link
          className="flex items-center gap-2.5 font-semibold tracking-tight"
          href="/"
        >
          <span
            aria-hidden="true"
            className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-lg [&_svg]:size-4"
          >
            <LayersIcon />
          </span>
          <span className="sr-only sm:not-sr-only">my-app</span>
        </Link>
        <NavLinks />
        <div className="ml-auto flex items-center gap-1.5">
          <UserMenu user={session?.user ?? null} />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
};
