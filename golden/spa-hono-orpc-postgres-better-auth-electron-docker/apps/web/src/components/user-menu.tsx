import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useRouteContext, useRouter } from "@tanstack/react-router";
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
  const queryClient = useQueryClient();
  const { session } = useRouteContext({ from: "__root__" });

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
    onSuccess: async () => {
      queryClient.clear();
      await router.invalidate();
      await router.navigate({ to: "/" });
    },
  });

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
