# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.1 --activate
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm exec turbo run build --filter=@moonwitness/api...

FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app /app
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]