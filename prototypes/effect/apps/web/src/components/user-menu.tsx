import { Link, useRouteContext, useRouter } from "@tanstack/react-router";
import { useTransition } from "react";
import { toast } from "sonner";

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

import { authClient } from "#src/lib/auth.ts";

export const UserMenu = () => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { session } = useRouteContext({ from: "__root__" });

  const signOut = async () => {
    try {
      const { error } = await authClient.signOut();

      if (error) {
        toast.error("Could not sign out. Please try again.");

        return;
      }

      await router.invalidate();
      await router.navigate({ to: "/" });
    } catch {
      toast.error("Could not sign out. Please try again.");
    }
  };

  if (!session) {
    return (
      <Button
        nativeButton={false}
        render={<Link to="/login" />}
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
        {session.user.name}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{session.user.email}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pending}
          onClick={() => {
            startTransition(signOut);
          }}
          variant="destructive"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
