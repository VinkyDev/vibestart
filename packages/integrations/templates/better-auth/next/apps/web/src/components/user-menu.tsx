"use client";

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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { toast } from "sonner";

import { authClient } from "#src/lib/auth-client.ts";

interface UserMenuProps {
  user: { name: string; email: string } | null;
}

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
      <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
        {user.name}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signOut.isPending}
          onClick={() => {
            signOut.mutate();
          }}
          variant="destructive"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
