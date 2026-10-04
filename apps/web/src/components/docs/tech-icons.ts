import betterAuth from "#/assets/tech/better-auth.svg";
import bun from "#/assets/tech/bun.svg";
import docker from "#/assets/tech/docker.svg";
import drizzle from "#/assets/tech/drizzle.svg";
import electron from "#/assets/tech/electron.svg";
import hono from "#/assets/tech/hono.svg";
import knip from "#/assets/tech/knip.svg";
import next from "#/assets/tech/next.svg";
import node from "#/assets/tech/node.svg";
import openapi from "#/assets/tech/openapi.svg";
import orpc from "#/assets/tech/orpc.svg";
import oxc from "#/assets/tech/oxc.svg";
import playwright from "#/assets/tech/playwright.svg";
import pnpm from "#/assets/tech/pnpm.svg";
import postgres from "#/assets/tech/postgres.svg";
import react from "#/assets/tech/react.svg";
import shadcn from "#/assets/tech/shadcn.svg";
import sqlite from "#/assets/tech/sqlite.svg";
import tailwind from "#/assets/tech/tailwind.svg";
import tanstack from "#/assets/tech/tanstack.svg";
import typescript from "#/assets/tech/typescript.svg";
import ultracite from "#/assets/tech/ultracite.svg";
import vitePlus from "#/assets/tech/vite-plus.svg";
import vite from "#/assets/tech/vite.svg";
import vitest from "#/assets/tech/vitest.svg";
import zod from "#/assets/tech/zod.svg";

export const techIcons = {
  "better-auth": betterAuth,
  bun,
  docker,
  drizzle,
  electron,
  hono,
  knip,
  next,
  node,
  openapi,
  orpc,
  oxc,
  playwright,
  pnpm,
  postgres,
  react,
  shadcn,
  sqlite,
  tailwind,
  tanstack,
  typescript,
  ultracite,
  vite,
  "vite-plus": vitePlus,
  vitest,
  zod,
} as const;

export type TechIcon = keyof typeof techIcons;
