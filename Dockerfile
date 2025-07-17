# syntax=docker/dockerfile:1

### ---------- Build stage ----------
FROM node:22-slim AS build
WORKDIR /workspace

# Root manifests first (better layer caching)
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.base.json ./

# Full workspace sources
COPY apps ./apps
COPY packages ./packages

# Install all workspace deps & build
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
RUN pnpm install --frozen-lockfile

# build everything (shared types, qloo client, api)
RUN pnpm -r build

# create a *production* deployable copy of the API (includes built local pkgs)
# This writes a self-contained /app dir (node_modules pruned, symlinks resolved)
RUN pnpm deploy --filter @tasteloop/api --prod /app

### ---------- Runtime stage ----------
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# copy the prepared /app from build stage
COPY --from=build /app ./

# Cloud Run sets PORT; Fastify reads process.env.PORT in your code.
CMD ["node", "dist/server.js"]
