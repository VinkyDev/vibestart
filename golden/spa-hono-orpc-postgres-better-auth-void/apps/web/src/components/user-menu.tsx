import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Link,
  useLocation,
  useRouteContext,
  useRouter,
} from "@tanstack/react-router";
import { LogOutIcon } from "lucide-react";
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

import { useHydrated } from "#src/hooks/use-hydrated.ts";
import { authClient } from "#src/lib/auth.ts";

const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

// The first letter of each of the first two words: "Ada Lovelace" is "AL".
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map(
      (word) =>
        graphemes.segment(word).containing(0)?.segment.toUpperCase() ?? ""
    )
    .join("");

export const UserMenu = () => {
  const hydrated = useHydrated();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useRouteContext({ from: "__root__" });
  const pathname = useLocation({ select: (location) => location.pathname });

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
    return pathname === "/login" ? null : (
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
      <DropdownMenuTrigger
        disabled={!hydrated}
        render={<Button size="sm" variant="ghost" />}
      >
        <Avatar aria-hidden="true" data-icon="inline-start" size="sm">
          <AvatarFallback>{initials(session.user.name)}</AvatarFallback>
        </Avatar>
        <span className="sr-only sm:not-sr-only sm:max-w-40 sm:truncate">
          {session.user.name}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <span className="text-foreground font-medium">
              {session.user.name}
            </span>
            <span className="truncate">{session.user.email}</span>
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
