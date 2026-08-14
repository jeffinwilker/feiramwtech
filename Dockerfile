FROM node:20-alpine

WORKDIR /app

# Instala só as dependências de produção primeiro (melhor cache)
COPY package.json ./
RUN npm install --omit=dev

COPY . .

# Pasta de uploads (montada como volume no docker-compose)
RUN mkdir -p storage

ENV NODE_ENV=production
EXPOSE 3210

CMD ["node", "src/server.js"]
