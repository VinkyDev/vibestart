import { useHydrated } from "@tanstack/react-router";
import { CircleAlertIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import type { SubmitEvent } from "react";

import { Alert, AlertDescription } from "@my-app/ui/components/alert";
import { Button } from "@my-app/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@my-app/ui/components/field";
import { Input } from "@my-app/ui/components/input";
import { Spinner } from "@my-app/ui/components/spinner";

import { AuthArt } from "#src/components/auth-art.tsx";
import { StackPlate } from "#src/components/stack-plate.tsx";
import { authClient } from "#src/lib/auth.ts";

type Mode = "sign-in" | "sign-up";

const copy = {
  "sign-in": {
    description: "Sign in with your email and password.",
    submit: "Sign in",
    switchLabel: "Need an account? Sign up",
    title: "Welcome back",
  },
  "sign-up": {
    description: "Sign up with your email and a password.",
    submit: "Sign up",
    switchLabel: "Already have an account? Sign in",
    title: "Create an account",
  },
} as const satisfies Record<Mode, Record<string, string>>;

const formValue = (form: FormData, name: string) => {
  const value = form.get(name);

  return value === null || value instanceof File ? "" : value;
};

const request = async (mode: Mode, form: FormData) => {
  const email = formValue(form, "email");
  const password = formValue(form, "password");

  return mode === "sign-in"
    ? await authClient.signIn.email({ email, password })
    : await authClient.signUp.email({
        email,
        name: formValue(form, "name"),
        password,
      });
};

/** Signs in or up, and returns the message to show when that fails. */
const authenticate = async (mode: Mode, form: FormData) => {
  try {
    const { error } = await request(mode, form);

    return error ? (error.message ?? error.statusText) : null;
  } catch {
    return "Could not reach the server. Check your connection and try again.";
  }
};

export const AuthForm = ({ onSuccess }: { onSuccess: () => Promise<void> }) => {
  const hydrated = useHydrated();
  const [mode, setMode] = useState<Mode>("sign-in");
  const text = copy[mode];

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setError(null);
    startTransition(async () => {
      const failure = await authenticate(mode, form);

      if (failure === null) {
        await onSuccess();

        return;
      }

      setError(failure);
    });
  };

  return (
    <div className="grid gap-10 lg:min-h-160 lg:grid-cols-2">
      <div className="mx-auto flex w-full max-w-sm flex-col justify-center gap-8">
        <div className="flex flex-col gap-2">
          <div className="mb-4 w-16 lg:hidden">
            <StackPlate active />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {text.title}
          </h1>
          <p className="text-muted-foreground">{text.description}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <fieldset disabled={!hydrated || isPending}>
            <FieldGroup>
              {error !== null && (
                <Alert variant="destructive">
                  <CircleAlertIcon />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <AnimatePresence initial={false}>
                {mode === "sign-up" && (
                  <motion.div
                    animate={{ height: "auto", opacity: 1 }}
                    className="-m-1 overflow-hidden p-1"
                    exit={{ height: 0, opacity: 0 }}
                    initial={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Field>
                      <FieldLabel htmlFor="name">Name</FieldLabel>
                      <Input
                        autoComplete="name"
                        id="name"
                        name="name"
                        required
                      />
                    </Field>
                  </motion.div>
                )}
              </AnimatePresence>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  autoComplete="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  type="email"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  autoComplete={
                    mode === "sign-in" ? "current-password" : "new-password"
                  }
                  id="password"
                  minLength={8}
                  name="password"
                  required
                  type="password"
                />
                {mode === "sign-up" && (
                  <FieldDescription>At least 8 characters.</FieldDescription>
                )}
              </Field>
              <Field>
                <Button size="lg" type="submit">
                  {isPending && <Spinner data-icon="inline-start" />}
                  {text.submit}
                </Button>
                <Button
                  onClick={() => {
                    setError(null);
                    setMode(mode === "sign-in" ? "sign-up" : "sign-in");
                  }}
                  type="button"
                  variant="link"
                >
                  {text.switchLabel}
                </Button>
              </Field>
            </FieldGroup>
          </fieldset>
        </form>
      </div>
      <AuthArt />
    </div>
  );
};
