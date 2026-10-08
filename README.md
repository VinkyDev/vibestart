# Verification store

Written only by the `record` job of `.github/workflows/ci.yml` on `main`. Do not push here by hand.

Each passing verification is `<platform>/<fingerprint>.json`, where the platform is `linux` or `windows` and the fingerprint is the SHA-256 of the stack's generated output. A record is never rewritten, so a fingerprint that recurs reuses its record.

`vp run stacks pull` reads this branch and writes the records for the current output to `packages/integrations/verification.json`. See `docs/architecture.md` on `main`.
