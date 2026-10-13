import { ModeToggle } from "#src/components/mode-toggle.tsx";
import { NavLinks } from "#src/components/nav-links.tsx";
import { UserMenu } from "#src/components/user-menu.tsx";
import { getSession } from "#src/server/session.ts";

export const Header = async () => {
  const session = await getSession();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <NavLinks />
        <div className="flex items-center gap-2">
          <UserMenu user={session?.user ?? null} />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
};
