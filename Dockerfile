
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY tsconfig.json ./
COPY index.ts ./
COPY src/ ./src/

RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

COPY src/utils/web/speechbubble/speechbubble.png ./src/utils/web/speechbubble/speechbubble.png

CMD ["node", "dist/index.js"]
