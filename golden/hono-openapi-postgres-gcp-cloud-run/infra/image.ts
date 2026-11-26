import { Config, Effect } from "effect";

export const releaseImage = Effect.gen(function* releaseImage() {
  const image = yield* Config.String("DEPLOY_IMAGE");

  if (!/^[^\s@]+\/[^\s@]+@sha256:[a-f0-9]{64}$/u.test(image)) {
    throw new Error(
      "Set DEPLOY_IMAGE to the full registry path and sha256 digest of the published linux/amd64 image"
    );
  }

  return image;
});
