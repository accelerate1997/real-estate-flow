FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_POCKETBASE_URL
ARG VITE_APP_URL
ENV VITE_POCKETBASE_URL=$VITE_POCKETBASE_URL
ENV VITE_APP_URL=$VITE_APP_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Add custom nginx config for React Router fallback and PocketBase proxy
RUN echo 'server { \
    listen 80; \
    location / { \
    root   /usr/share/nginx/html; \
    index  index.html index.htm; \
    try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
    proxy_pass http://pocketbase-eos80oss0css04wow848wssg.31.97.231.139.sslip.io/api/; \
    proxy_set_header Host pocketbase-eos80oss0css04wow848wssg.31.97.231.139.sslip.io; \
    proxy_set_header X-Real-IP $remote_addr; \
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    location /webhook/ { \
    proxy_pass http://whatsapp_agent:3000/webhook/; \
    proxy_set_header Host $host; \
    proxy_set_header X-Real-IP $remote_addr; \
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
