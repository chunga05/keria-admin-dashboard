# Multi-stage Dockerfile for Next.js (Admin Dashboard)
FROM node:22-alpine AS base

# Install libc6-compat for alpine compatibility
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@latest

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
RUN npm install -g pnpm@latest

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build arguments for public variables (Next.js inlines NEXT_PUBLIC_* at build time)
ARG NEXT_PUBLIC_SUPABASE_HOSTNAME=placeholder.supabase.co
ARG NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
ARG NEXT_PUBLIC_USER_URL=http://localhost:3000
ARG NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS=false
ARG NEXT_PUBLIC_ENABLE_BULK_EXPORT=false

ENV NEXT_PUBLIC_SUPABASE_HOSTNAME=$NEXT_PUBLIC_SUPABASE_HOSTNAME
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_USER_URL=$NEXT_PUBLIC_USER_URL
ENV NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS=$NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS
ENV NEXT_PUBLIC_ENABLE_BULK_EXPORT=$NEXT_PUBLIC_ENABLE_BULK_EXPORT

# Dummy placeholders for server secrets during build-time route evaluation (overridden at runtime)
ENV SUPABASE_SERVICE_ROLE_KEY=dummy-build-service-role-key
ENV JWT_SECRET=dummy-build-jwt-secret-at-least-32-chars
ENV ADMIN_JWT_SECRET=dummy-build-admin-jwt-secret-32-chars

RUN pnpm run build

# Production runner image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
