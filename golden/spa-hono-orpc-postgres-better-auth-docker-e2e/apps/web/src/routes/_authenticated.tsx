import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => {
    if (!context.session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    return { session: context.session };
  },
});
