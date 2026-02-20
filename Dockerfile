FROM node:18-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y bash openssh-client && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
