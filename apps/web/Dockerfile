# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.1 --activate
ARG API_URL=http://api:3000
ENV API_URL=${API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN pnpm install --frozen-lockfile
# pnpm, bukan turbo: turbo v2 menyaring env yang tidak dideklarasikan, sehingga
# API_URL tidak sampai ke next build dan rewrite ter-bake ke localhost.
RUN pnpm --filter "@moonwitness/web..." build

FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build /app /app
WORKDIR /app/apps/web
EXPOSE 3001
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3001", "-H", "0.0.0.0"]