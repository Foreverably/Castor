# Use official Node LTS slim image
FROM node:20-slim

# Install necessary system dependencies for puppeteer/chromium and fonts
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libasound2 \
    libnss3 \
    chromium \
  && rm -rf /var/lib/apt/lists/*

# Let puppeteer / the app know where chromium is installed
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Create app directory
WORKDIR /usr/src/app

# Copy package manifests first (better layer caching)
COPY package*.json ./

# Install dependencies. Use npm ci when a lockfile exists, otherwise fall back to npm install
RUN npm ci --only=production || npm install

# Copy the rest of the source
COPY . .

# If you use an .env file for tokens/config, mount it at runtime or copy it here (not recommended to bake secrets in image)

# Default command (uses the "start" script from package.json)
CMD ["npm", "start"]

