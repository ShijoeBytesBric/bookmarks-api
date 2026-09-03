# syntax=docker/dockerfile:1

# Stage 1: production dependencies (cached separately from the build stage,
# so a lockfile-only change doesn't re-run the TypeScript build)
FROM node:24-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: compile TypeScript -> dist/
FROM node:24-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npm run build

# Stage 3: runtime (no dev deps, no TS toolchain, non-root user)
FROM node:24-alpine AS runtime

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Install only production deps, then purge the npm cache in the same layer so
# it doesn't get baked into the image.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# The app's compiled output + source maps.
COPY --from=build /app/dist ./dist

# Run as the non-root `node` user (matches the k8s runAsNonRoot securityContext).
RUN chown -R node:node /app
USER node

EXPOSE 3000

# Same /health endpoint the k8s probes and the CI smoke test use.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "dist/server.js"]
