# Use uma imagem base adequada para seu projeto
FROM node:23-alpine

# Define o diretório de trabalho
WORKDIR /app

# Instala o pnpm globalmente
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copia os arquivos de configuração
COPY pnpm-lock.yaml package.json ./

# Instala as dependências usando pnpm
RUN pnpm install

# Copia o restante do código
COPY . .

# Expõe a porta que seu aplicativo usa
EXPOSE 3000

# Comando para iniciar o aplicativo em modo de desenvolvimento
CMD ["pnpm", "run", "dev"]
