# Imagem do app em três etapas: só a última vai para o container final.

# 1. dependências (o postinstall roda o prisma generate)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts ./
COPY src/database/schema.prisma src/database/schema.prisma
RUN npm ci

# 2. build do Next (gera .next/standalone). Também é usada pelo serviço
#    `migrate` do compose, que precisa do CLI do Prisma.
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# 3. imagem final: só o servidor e os arquivos estáticos, rodando sem root
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /app/public ./public
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3000
CMD ["node", "server.js"]
