"use client";

import { cn } from "@my-app/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/todos", label: "Todos" },
] as const;

export const NavLinks = () => {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 text-sm">
      {links.map(({ href, label }) => (
        <Link
          aria-current={pathname === href ? "page" : undefined}
          className={cn(
            "hover:text-foreground rounded-md px-2.5 py-1.5 font-medium transition-colors",
            pathname === href ? "bg-muted text-foreground" : "text-muted-foreground"
          )}
          href={href}
          key={href}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
};
