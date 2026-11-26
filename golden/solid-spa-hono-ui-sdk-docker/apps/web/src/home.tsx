import { ApiStatus } from "#src/api-status.tsx";

export const Home = () => (
  <main class="mx-auto grid max-w-3xl gap-4 px-6 py-16">
    <h1 class="text-4xl font-semibold">my-app</h1>
    <p>Solid 2 and UI SDK on Vite+.</p>
    <ApiStatus />
  </main>
);
