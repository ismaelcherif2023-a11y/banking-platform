# ---------- Étape 1 : build Angular ----------
FROM node:24-alpine AS build
WORKDIR /app

# Dépendances d'abord (cache Docker tant que les locks ne changent pas)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Code source puis build de production
COPY . .
RUN npm run build -- --configuration production

# ---------- Étape 2 : service statique via nginx ----------
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
# 127.0.0.1 et non « localhost » : dans l'image, localhost résout en ::1 (IPv6)
# alors que nginx n'écoute qu'en IPv4 (listen 80), ce qui ferait échouer le test.
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
