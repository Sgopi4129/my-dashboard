# Use a specific digest for node:18-alpine to ensure consistency and check for vulnerabilities
FROM node:18-alpine@sha256:4580c24f98e6a7f7e3f4945fa049a93e0927b53bea2da75b78838d51678bf68d

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.8.1

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the Next.js app
RUN pnpm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["pnpm", "start"]