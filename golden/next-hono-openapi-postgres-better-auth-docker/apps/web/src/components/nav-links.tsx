"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/todos", label: "Todos" },
] as const;

export const NavLinks = () => {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 text-sm">
      {links.map(({ href, label }) => (
        <Link
          className={
            pathname === href
              ? "text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground transition-colors"
          }
          href={href}
          key={href}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
};
