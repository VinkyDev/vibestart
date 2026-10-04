import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { SubmitEvent } from "react";

import { Button } from "@my-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-app/ui/components/card";
import { Input } from "@my-app/ui/components/input";
import { Label } from "@my-app/ui/components/label";

import { authClient } from "#src/lib/auth.ts";

type Mode = "sign-in" | "sign-up";

const copy = {
  "sign-in": {
    title: "Sign in",
    description: "Welcome back.",
    submit: "Sign in",
    switchLabel: "Need an account? Sign up",
  },
  "sign-up": {
    title: "Create an account",
    description: "Sign up with your email and a password.",
    submit: "Sign up",
    switchLabel: "Already have an account? Sign in",
  },
} as const;

const formValue = (form: FormData, name: string) => {
  const value = form.get(name);
  if (value === null || value instanceof File) {
    return "";
  }
  return value;
};

const authenticate = async (mode: Mode, form: FormData) => {
  const email = formValue(form, "email");
  const password = formValue(form, "password");
  const { error } =
    mode === "sign-in"
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({
          email,
          password,
          name: formValue(form, "name"),
        });
  if (error) {
    throw new Error(error.message ?? error.statusText);
  }
};

export const AuthForm = ({ onSuccess }: { onSuccess: () => Promise<void> }) => {
  const [mode, setMode] = useState<Mode>("sign-in");
  const text = copy[mode];
  const { mutate, isPending } = useMutation({
    mutationFn: async (form: FormData) => {
      await authenticate(mode, form);
    },
    onSuccess,
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutate(new FormData(event.currentTarget));
  };

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>{text.title}</CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {mode === "sign-up" && (
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input autoComplete="name" id="name" name="name" required />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              autoComplete="email"
              id="email"
              name="email"
              required
              type="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
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
          </div>
          <Button disabled={isPending} type="submit">
            {text.submit}
          </Button>
          <Button
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            }}
            type="button"
            variant="link"
          >
            {text.switchLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
