import { createFileRoute } from "@tanstack/react-router";

import { Baseline } from "#/components/home/baseline.tsx";
import { Finale } from "#/components/home/finale.tsx";
import { Hero } from "#/components/home/hero.tsx";
import { Verification } from "#/components/home/verification.tsx";
import { searchSchema } from "#/lib/stack.ts";

const Home = () => (
  <main className="flex flex-col">
    <Hero />
    <Verification />
    <Baseline />
    <Finale />
  </main>
);

export const Route = createFileRoute("/")({
  component: Home,
  validateSearch: searchSchema,
});
