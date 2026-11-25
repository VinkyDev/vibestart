import { createMemo } from "solid-js";

const checkHealth = async () => {
  try {
    const response = await fetch("/api/health");

    return response.ok ? "API connected" : "API unreachable";
  } catch {
    return "API unreachable";
  }
};

export const ApiStatus = () => {
  const status = createMemo(checkHealth);

  return <output>{status()}</output>;
};
