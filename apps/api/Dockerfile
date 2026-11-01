# syntax=docker/dockerfile:1
FROM node:22-alpine AS base

WORKDIR /app

# Install dependencies only (cached layer)
FROM base AS deps
RUN npm install -g pnpm@10.33.1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/
RUN pnpm install --frozen-lockfile --prod

# Build stage
FROM base AS build
RUN npm install -g pnpm@10.33.1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm@10.33.1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/packages ./packages
COPY --from=build /app/tsconfig.base.json ./
COPY --from=build /app/apps/api/tsconfig.json ./apps/api/
COPY .env.example ./.env

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/index.js"]