## Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build SSR output
COPY . .
RUN npm run build

## Runtime stage
FROM node:20-alpine
WORKDIR /app

# Install only production dependencies for runtime
COPY package*.json ./
RUN npm install --omit=dev

# Copy built app from builder
COPY --from=build /app/dist ./dist

ENV PORT=4200
EXPOSE 4200

CMD ["node","dist/MiniSocialNetwork_Fe/server/server.mjs"]