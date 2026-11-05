# Production image for AWS (ECS / App Runner / EC2) or any Docker host.
# Uses Next's "standalone" output: a minimal server.js with only the node_modules it needs.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# public/ holds no files yet, and git doesn't keep empty folders: make sure it exists for the COPY below.
RUN mkdir -p public
# The /api proxy target is baked in at build time (Next evaluates rewrites during the build).
ARG BACKEND_URL=http://express-api:4000
# SEO: canonical links, sitemap.xml and the Google Search Console tag are built from these.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3001
ARG GOOGLE_SITE_VERIFICATION=
ARG NEXT_PUBLIC_GA_ID=
ENV BACKEND_URL=$BACKEND_URL NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL GOOGLE_SITE_VERIFICATION=$GOOGLE_SITE_VERIFICATION NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID NEXT_OUTPUT=standalone NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ARG BACKEND_URL=http://express-api:4000
ENV BACKEND_URL=$BACKEND_URL NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3001 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3001
CMD ["node", "server.js"]
