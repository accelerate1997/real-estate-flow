FROM node:20-alpine
WORKDIR /app
COPY whatsapp-agent/package*.json ./
RUN npm install
COPY whatsapp-agent/ .

EXPOSE 80
CMD ["node", "index.js"]
