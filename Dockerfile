# Multistage Build for DevLaunch AI Production Container

# --- STAGE 1: Compilation ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency graphs
COPY package.json package-lock.json* ./

# Install development dependencies
RUN npm install

# Copy application source code
COPY . .

# Compile frontend bundle and backend production CJS bundle
RUN npm run build

# --- STAGE 2: Secure Execution Image ---
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts and runtime packages
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist

# Install production-only dependencies
RUN npm install --omit=dev

# Open port 3000 for ingress traffic
EXPOSE 3000

# Run standalone compiled CommonJS server
CMD ["npm", "start"]
