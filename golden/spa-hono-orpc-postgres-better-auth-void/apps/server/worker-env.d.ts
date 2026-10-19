import "cloudflare:workers";

declare module "cloudflare:workers" {
  interface ProvidedEnv {
    HYPERDRIVE: { connectionString: string };
  }
}
