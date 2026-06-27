# Stage 1: Build the React client app
FROM node:20-alpine AS client-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Set up the production Express backend
FROM node:20-alpine
WORKDIR /app

# Set production environment defaults
ENV NODE_ENV=production
ENV PORT=5000

# Copy and install backend dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy server code
COPY server/ ./server/

# Copy compiled static assets from client build stage
COPY --from=client-builder /app/dist ./dist

# Expose port
EXPOSE 5000

# Start command
WORKDIR /app/server
CMD ["node", "server.js"]
