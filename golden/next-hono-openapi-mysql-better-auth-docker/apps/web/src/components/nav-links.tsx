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
    <nav className="flex gap-1 text-sm">
      {links.map(({ href, label }) => (
        <Link
          className={
            pathname === href
              ? "bg-muted text-foreground rounded-md px-2.5 py-1 font-medium"
              : "text-muted-foreground hover:text-foreground rounded-md px-2.5 py-1 font-medium transition-colors"
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
