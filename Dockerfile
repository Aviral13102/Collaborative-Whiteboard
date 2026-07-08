# Stage 1: Build client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Server
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --production
COPY server/ ./
COPY --from=client-build /app/client/dist ./public

# Serve static files from /public in production
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
CMD ["node", "index.js"]
