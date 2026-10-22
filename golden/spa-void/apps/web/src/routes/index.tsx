import { createFileRoute } from "@tanstack/react-router";

const HomePage = () => (
  <section className="grid gap-10 sm:py-8">
    <div className="grid gap-5">
      <h1 className="text-5xl font-semibold tracking-tighter text-balance break-words sm:text-7xl">
        my-app
      </h1>
      <p className="text-muted-foreground max-w-xl text-lg text-pretty">
        React on Vite+.
      </p>
    </div>
    <p className="text-muted-foreground border-t pt-6 text-sm">
      Edit{" "}
      <code className="text-foreground font-mono">
        apps/web/src/routes/index.tsx
      </code>{" "}
      and save to see it change.
    </p>
  </section>
);

export const Route = createFileRoute("/")({
  component: HomePage,
});
