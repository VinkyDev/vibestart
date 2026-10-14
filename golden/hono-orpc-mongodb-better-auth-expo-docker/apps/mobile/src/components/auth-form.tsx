import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { View } from "react-native";

import { Button } from "#src/components/ui/button.tsx";
import { Input } from "#src/components/ui/input.tsx";
import { Text } from "#src/components/ui/text.tsx";
import { authClient } from "#src/lib/auth-client.ts";

export const AuthForm = () => {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { error, isPending, mutate, reset } = useMutation({
    mutationFn: async () => {
      const result =
        mode === "sign-in"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ email, name, password });

      if (result.error) {
        throw new Error(result.error.message ?? result.error.statusText);
      }
    },
  });

  return (
    <View className="gap-3">
      <View className="mb-3 gap-1">
        <Text className="text-3xl font-semibold tracking-tight">
          {mode === "sign-in" ? "Welcome back" : "Create your account"}
        </Text>
        <Text className="text-muted-foreground">
          {mode === "sign-in"
            ? "Sign in with your email and password."
            : "Sign up with your email and a password."}
        </Text>
      </View>
      {mode === "sign-up" && (
        <Input
          autoComplete="name"
          onChangeText={setName}
          placeholder="Name"
          value={name}
        />
      )}
      <Input
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email"
        value={email}
      />
      <Input
        autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        value={password}
      />
      {error !== null && (
        <Text className="text-destructive">{error.message}</Text>
      )}
      <Button
        disabled={isPending}
        label={mode === "sign-in" ? "Sign in" : "Create account"}
        onPress={() => {
          mutate();
        }}
      />
      <Button
        disabled={isPending}
        label={
          mode === "sign-in" ? "Create an account instead" : "Sign in instead"
        }
        onPress={() => {
          reset();
          setMode(mode === "sign-in" ? "sign-up" : "sign-in");
        }}
        variant="outline"
      />
    </View>
  );
};
