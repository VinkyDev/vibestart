import { RegistryProvider } from "@effect/atom-react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

const AuthenticatedLayout = () => {
  const { session } = Route.useRouteContext();

  return (
    <RegistryProvider key={session.session.id}>
      <Outlet />
    </RegistryProvider>
  );
};

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  beforeLoad: ({ context, location }) => {
    if (!context.session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }

    return { session: context.session };
  },
});
