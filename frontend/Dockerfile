FROM node:20-alpine AS builder

WORKDIR /app

# Copy đúng file của Yarn
COPY package.json yarn.lock ./

# Cài dependency bằng Yarn
RUN yarn install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN yarn build

# ===== NGINX =====
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]