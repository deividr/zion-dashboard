# Use uma imagem base adequada para seu projeto
FROM node:23-alpine AS base

# Instala o pnpm globalmente
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# Use uma imagem base adequada para seu projeto
FROM base AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de configuração
COPY pnpm-lock.yaml package.json ./

# Instala as dependências usando pnpm
RUN pnpm install --frozen-lockfile

# Copia o restante do código
COPY . .

# Construir o app
RUN pnpm build

# Remove as dependências de desenvolvimento
RUN pnpm prune --prod

# Use uma imagem base adequada para seu projeto
FROM base AS runner

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos necessários da etapa de build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expõe a porta que seu aplicativo usa
EXPOSE 3000

# Comando para iniciar o aplicativo em modo de desenvolvimento
CMD ["pnpm", "start"]
