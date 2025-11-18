FROM node:20-alpine
WORKDIR /usr/src/app
RUN apk add --no-cache curl
COPY package*.json ./
COPY . .
RUN npm install --legacy-peer-deps
RUN npm run build
EXPOSE 8080
EXPOSE 9229
ENV PORT=8080
CMD ["node", "dist/main.js"]
