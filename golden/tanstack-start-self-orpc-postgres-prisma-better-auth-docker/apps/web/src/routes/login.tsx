import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";

import { AuthForm } from "#src/components/auth-form.tsx";

const sameOriginPath = /^\/(?!\/)/u;

const isSameOriginRedirect = (value: unknown): value is string =>
  typeof value === "string" && sameOriginPath.test(value);

const validateSearch = (search: {
  redirect?: unknown;
}): { redirect?: string } =>
  isSameOriginRedirect(search.redirect) ? { redirect: search.redirect } : {};

const LoginPage = () => {
  const router = useRouter();
  const search = Route.useSearch();

  const handleSuccess = async () => {
    await router.invalidate();
    await router.navigate({ href: search.redirect ?? "/todos" });
  };

  return <AuthForm onSuccess={handleSuccess} />;
};

export const Route = createFileRoute("/login")({
  validateSearch,
  beforeLoad: ({ context, search }) => {
    if (context.session) {
      throw redirect({ href: search.redirect ?? "/todos" });
    }
  },
  component: LoginPage,
});
