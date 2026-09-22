# Stage 1: Build the Vite React app
FROM node:24-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the code
COPY . .

# Pass build-time environment variables for Vite
ARG VITE_API_BASE_URL
ARG VITE_NEON_AUTH_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_NEON_AUTH_URL=$VITE_NEON_AUTH_URL

# Build the frontend
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Copy the compiled output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy the custom routing config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]