"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOutIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@my-app/ui/components/avatar";
import { Button } from "@my-app/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@my-app/ui/components/dropdown-menu";

import { authClient } from "#src/lib/auth-client.ts";

interface UserMenuProps {
  user: { name: string; email: string } | null;
}

// The first letter of each of the first two words: "Ada Lovelace" is "AL".
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

export const UserMenu = ({ user }: UserMenuProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();

  const signOut = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut();

      if (error) {
        throw new Error("Could not sign out. Please try again.");
      }
    },
    onError: () => {
      toast.error("Could not sign out. Please try again.");
    },
    onSuccess: () => {
      queryClient.clear();
      router.push("/");
      router.refresh();
    },
  });

  if (!user) {
    return pathname === "/login" ? null : (
      <Button
        nativeButton={false}
        render={<Link href="/login" />}
        size="sm"
        variant="outline"
      >
        Sign in
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" variant="ghost" />}>
        <Avatar aria-hidden="true" data-icon="inline-start" size="sm">
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
        <span className="sr-only sm:not-sr-only sm:max-w-40 sm:truncate">
          {user.name}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <span className="text-foreground font-medium">{user.name}</span>
            <span className="truncate">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signOut.isPending}
          onClick={() => {
            signOut.mutate();
          }}
          variant="destructive"
        >
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
