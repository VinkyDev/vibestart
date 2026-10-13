import type { Route } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "#src/components/auth-form.tsx";
import { getSession } from "#src/server/session.ts";

const redirectTargets: Route[] = ["/", "/todos"];

const safeRedirect = (value: string | string[] | undefined) =>
  redirectTargets.find((target) => target === value) ?? "/todos";

const LoginPage = async ({ searchParams }: PageProps<"/login">) => {
  const { redirect: target } = await searchParams;
  const redirectTo = safeRedirect(target);

  if (await getSession()) {
    redirect(redirectTo);
  }

  return <AuthForm redirectTo={redirectTo} />;
};

export default LoginPage;
