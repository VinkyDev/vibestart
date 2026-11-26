import { defineSlot } from "@vibestart/core";

/** The runtime stage of the image. Exactly one contribution sets `cmd`. */
export const dockerRuntime = defineSlot<{
  env?: readonly (readonly [string, string])[];
  copies?: readonly (readonly [from: string, to: string])[];
  runs?: readonly string[];
  volumes?: readonly string[];
  cmd?: readonly string[];
}>("docker/runtime");

export const composeServices = defineSlot<{
  name: string;
  readyWhen: "service_healthy";
  yaml: string;
}>("docker/compose-services");

export const composeEnv = defineSlot<{ name: string; value: string }>(
  "docker/compose-env"
);

export const composeAppVolumes = defineSlot<string>(
  "docker/compose-app-volumes"
);

export const composeVolumes = defineSlot<string>("docker/compose-volumes");

/** The `app` service waits for it to be healthy and gets `appEnv` to reach it. */
export const composeServers = defineSlot<{
  name: string;
  command: readonly string[];
  appEnv: readonly (readonly [name: string, value: string])[];
}>("docker/compose-servers");
