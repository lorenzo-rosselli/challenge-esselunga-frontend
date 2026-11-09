# --- Stage 1: build dell'applicazione Angular ---
FROM node:24-alpine AS build
WORKDIR /app

# Prima le sole dipendenze, per sfruttare la cache di Docker
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: file statici serviti da nginx ---
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/project-angular/browser /usr/share/nginx/html
EXPOSE 80
