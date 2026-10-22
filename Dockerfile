# syntax=docker/dockerfile:1

# Stage 1: Base image
FROM node:24-alpine AS base
WORKDIR /app

# Stage 2: Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Stage 3: Development environment
FROM deps AS dev
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Stage 4: Production build
FROM deps AS build
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3000} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-http://localhost:3001}
RUN npm run build

# Stage 5: Production runtime
FROM base AS prod
ENV NODE_ENV=production \
    PORT=3001 \
    HOSTNAME=0.0.0.0

# Non-root user permissions and standalone bundle
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/ || exit 1

CMD ["node", "server.js"]
