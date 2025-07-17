cd /Users/wesamabed/Documents/tasteloop

cat > Dockerfile <<'EOF'
# syntax=docker/dockerfile:1
### ---- Build stage -------------------------------------------------- ###
FROM node:22-slim AS build
WORKDIR /workspace

# root manifests
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.base.json ./
# sources
COPY apps ./apps
COPY packages ./packages

# install & build
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @tasteloop/shared-types run build
RUN pnpm --filter @tasteloop/qloo-client   run build
RUN pnpm --filter @tasteloop/api           run build

### ---- Runtime stage ----------------------------------------------- ###
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# app code
COPY --from=build /workspace/apps/api/dist ./dist
COPY --from=build /workspace/apps/api/package.json ./package.json

# ALL resolved dependencies (root + any package-level)
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/api/node_modules ./node_modules

# Start
CMD ["node","dist/server.js"]
EOF
