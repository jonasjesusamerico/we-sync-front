# Estágio 1: build do Angular (Node da .nvmrc)
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Estágio 2: estáticos no nginx (mesma imagem do proxy da API)
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx/security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/dist/we-sync-front/browser /usr/share/nginx/html
EXPOSE 80
