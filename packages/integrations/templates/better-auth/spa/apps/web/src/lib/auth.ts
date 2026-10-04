import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export type Session = typeof authClient.$Infer.Session;

export const getSession = async (): Promise<Session | null> => {
  const { data, error } = await authClient.getSession();
  if (error) {
    throw new Error(error.message ?? error.statusText);
  }
  return data;
};
