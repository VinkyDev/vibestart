# syntax=docker/dockerfile:1

FROM ghcr.io/voidzero-dev/vite-plus:1.1.0 AS build
WORKDIR /app

COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml .node-version ./
COPY --chown=vp:vp apps/desktop/package.json apps/desktop/
COPY --chown=vp:vp apps/server/package.json apps/server/
COPY --chown=vp:vp apps/web/package.json apps/web/
COPY --chown=vp:vp packages/api/package.json packages/api/
COPY --chown=vp:vp packages/auth/package.json packages/auth/
COPY --chown=vp:vp packages/config/package.json packages/config/
COPY --chown=vp:vp packages/db/package.json packages/db/
COPY --chown=vp:vp packages/electron/package.json packages/electron/
COPY --chown=vp:vp packages/ui/package.json packages/ui/
RUN vp install --frozen-lockfile

COPY --chown=vp:vp . .
RUN vp run build
RUN cp "$(vp env which node | head -1)" /tmp/node

FROM debian:trixie-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000

COPY --from=build /tmp/node /usr/local/bin/node
COPY --from=build /app/apps/server/dist ./dist
COPY --from=build /app/apps/web/dist ./dist/public

USER nobody
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "dist/index.mjs"]
