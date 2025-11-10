FROM node:20-alpine
WORKDIR /usr/src/app
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm install --package-lock-only || true
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 8080
ENV PORT=8080
CMD ["node", "dist/main.js"]
