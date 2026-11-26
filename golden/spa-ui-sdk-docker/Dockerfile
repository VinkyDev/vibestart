# syntax=docker/dockerfile:1

FROM ghcr.io/voidzero-dev/vite-plus:1.8.0 AS build
WORKDIR /app

COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=vp:vp apps/web/package.json apps/web/
COPY --chown=vp:vp packages/config/package.json packages/config/
COPY --chown=vp:vp packages/ui/package.json packages/ui/
RUN vp install --frozen-lockfile --filter "@my-app/web..."

COPY --chown=vp:vp . .
RUN vp run --filter "@my-app/web..." build

FROM nginxinc/nginx-unprivileged:1.30-alpine AS runtime
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
  listen 3000;
  root /usr/share/nginx/html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
EOF
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:3000/ || exit 1
