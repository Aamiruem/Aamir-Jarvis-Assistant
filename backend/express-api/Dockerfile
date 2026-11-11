FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
# logs/errors.log (and data/, the no-MongoDB fallback) must stay writable for that user.
RUN mkdir -p logs data && chown node:node logs data
# Run as the image's unprivileged "node" user, not root.
USER node
EXPOSE 4000
# Plain "docker run" health check; compose / ECS / Kubernetes use /api/health/ready the same way.
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3   CMD wget -qO- http://127.0.0.1:4000/api/health/ready || exit 1
CMD ["node", "src/index.js"]
