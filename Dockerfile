# Use uma imagem base adequada para seu projeto
FROM node:24-alpine AS base

# Define o diretório de trabalho
WORKDIR /app

# Instala o pnpm globalmente
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# Use uma imagem base adequada para seu projeto
FROM base AS builder

ARG NEXT_PUBLIC_HOST_API=https://zion-api.fly.dev
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YmlnLW1hY2F3LTgyLmNsZXJrLmFjY291bnRzLmRldiQ

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

# Copia os arquivos necessários da etapa de build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expõe a porta que seu aplicativo usa
EXPOSE 3000

# Comando para iniciar o aplicativo
CMD ["node", "server.js"]
