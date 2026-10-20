import { RegistryContext } from "@effect/atom-react";
import { Link, useRouteContext, useRouter } from "@tanstack/react-router";
import { startTransition, useContext } from "react";

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
  const registry = useContext(RegistryContext);
  const { session } = useRouteContext({ from: "__root__" });

  const signOut = async () => {
    await authClient.signOut();
    // Drops every cached query, so the next user starts from nothing.
    registry.reset();
    await router.invalidate();
    await router.navigate({ to: "/" });
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
