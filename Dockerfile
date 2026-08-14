FROM node:20-alpine

WORKDIR /app

# Instala só as dependências de produção primeiro (melhor cache)
COPY package.json ./
RUN npm install --omit=dev

COPY . .

# Pasta de uploads (montada como volume no docker-compose)
RUN mkdir -p storage

ENV NODE_ENV=production
# No container, escuta em todas as interfaces (o isolamento fica na rede/porta do Docker)
ENV BIND_HOST=0.0.0.0
EXPOSE 3210

CMD ["node", "src/server.js"]
