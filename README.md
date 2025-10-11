# 🍝 Zion Dashboard - LaBuonapasta

Sistema completo de gestão comercial desenvolvido para a LaBuonapasta, uma empresa de alimentação especializada em massas e pratos italianos. O dashboard oferece controle total sobre clientes, produtos, pedidos e logística de entrega.

![Next.js](https://img.shields.io/badge/Next.js-15.0.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4)

## 🎯 Visão Geral

O Zion Dashboard é uma solução completa de ERP/CRM focada no ramo alimentício, oferecendo:

-   **Gestão de Clientes**: Cadastro completo com múltiplos endereços e validação de CEP
-   **Catálogo de Produtos**: Controle de produtos, categorias e unidades de medida
-   **Sistema de Pedidos**: Gerenciamento completo do ciclo de pedidos com tracking
-   **Logística**: Cálculo automático de distância e controle de entrega
-   **Dashboard Analítico**: Métricas e relatórios em tempo real
-   **Autenticação Segura**: Sistema de login integrado com Clerk

## 🏗️ Arquitetura Técnica

### Stack Principal

-   **Frontend**: Next.js 15 com App Router
-   **UI Framework**: React 18 + TypeScript
-   **Styling**: Tailwind CSS + shadcn/ui components
-   **State Management**: Zustand para estado global
-   **Formulários**: React Hook Form + Zod para validação
-   **Autenticação**: Clerk (OAuth, JWT)
-   **Tabelas**: TanStack Table com paginação
-   **Containerização**: Docker + Docker Compose

### Estrutura de Domínios

```
src/domains/
├── customer.ts     # Clientes e validações
├── address.ts      # Endereços com validação CEP
├── product.ts      # Produtos e categorias
├── order.ts        # Pedidos e sub-produtos
└── category.ts     # Categorias de produtos
```

### Componentes Principais

-   **DataTable**: Tabelas reutilizáveis com filtros
-   **Forms**: Formulários inteligentes com validação
-   **Sidebar**: Navegação responsiva
-   **AddressForm**: Formulário com busca automática por CEP

## 🚀 Setup e Desenvolvimento

### Pré-requisitos

-   Node.js 18+
-   pnpm (recomendado)
-   Docker (opcional)

### Instalação Local

```bash
# Clonar o repositório
git clone <repository-url>
cd zion-dashboard

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Configurar NEXT_PUBLIC_HOST_API e chaves do Clerk

# Iniciar em modo desenvolvimento
pnpm dev
```

### Docker Development

```bash
# Iniciar com Docker
pnpm run dev:docker

# Acessar em http://localhost:3001
```

### Build para Produção

```bash
pnpm build
pnpm start
```

## 📱 Funcionalidades Implementadas

### ✅ Sistema de Clientes

-   [x] CRUD completo de clientes
-   [x] Gestão de múltiplos endereços por cliente
-   [x] Validação automática de CEP via API
-   [x] Cálculo de distância da loja
-   [x] Máscara para telefones e CEP
-   [x] Validação de endereço padrão único

### ✅ Gestão de Produtos

-   [x] Cadastro de produtos com categorias
-   [x] Controle de unidades (UN, KG, LT)
-   [x] Sistema de categorias
-   [x] Validação de preços e quantidades
-   [x] Interface responsiva

### ✅ Sistema de Pedidos

-   [x] Listagem com filtros avançados
-   [x] Filtro por data de pickup
-   [x] Busca por cliente/produto
-   [x] Visualização detalhada de pedidos
-   [x] Controle de status (entregue/pendente)

### ✅ Interface e UX

-   [x] Design system com shadcn/ui
-   [x] Sidebar responsiva e colapsível
-   [x] Tema consistente e moderno
-   [x] Toasts para feedback
-   [x] Loading states
-   [x] Navegação breadcrumb dinâmica

### ✅ Autenticação e Segurança

-   [x] Login seguro com Clerk
-   [x] Proteção de rotas
-   [x] Gerenciamento de sessão
-   [x] Validação de formulários

## 🎨 Screenshots

### Dashboard Principal

_Interface clean e moderna com navegação intuitiva_

### Gestão de Clientes

_Listagem com busca e filtros + Formulário de edição com endereços_

### Sistema de Pedidos

_Controle completo do ciclo de pedidos com filtros por data_

## 🔧 Configuração de Ambiente

### Variáveis Obrigatórias

```env
NEXT_PUBLIC_HOST_API=http://localhost:8000/api
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

## 📦 Scripts Disponíveis

```bash
pnpm dev           # Desenvolvimento local
pnpm dev:docker    # Desenvolvimento com Docker
pnpm build         # Build para produção
pnpm start         # Iniciar produção
pnpm lint          # Linting
pnpm commit        # Commit com Conventional Commits
```

## 🌐 Deploy

### Vercel (Recomendado)

1. Conectar repositório no Vercel
2. Configurar variáveis de ambiente
3. Deploy automático

### Docker Production

```bash
docker build -t zion-dashboard .
docker run -p 3000:3000 zion-dashboard
```

## TODO

### 🔥 Urgente

-   [ ] **Os endereços não estão sendo salvos** - Investigar problema na função `onSubmitAddress` no `address-section.tsx`
-   [ ] Validar se o customer.id está sendo passado corretamente para a API

### 🎯 Funcionalidades Core

-   [ ] **Melhorar UX de Endereços**
    -   [ ] Loading indicator ao pesquisar endereço por CEP
    -   [ ] Validação: impedir endereços duplicados no mesmo CEP para o mesmo cliente
    -   [ ] Confirmação visual quando endereço for salvo com sucesso
-   [ ] **Sistema de Pedidos**
    -   [ ] Implementar criação de novos pedidos (página `/orders/new`)
    -   [ ] Melhorar filtros e busca na listagem de pedidos
    -   [ ] Adicionar status de entrega/pickup nos pedidos
-   [ ] **Dashboard Principal**
    -   [ ] Implementar homepage com métricas e widgets
    -   [ ] Gráficos de vendas por período
    -   [ ] Resumo de pedidos pendentes

### 🔧 Melhorias Técnicas

-   [ ] **Performance**
    -   [ ] Implementar paginação server-side nas listagens
    -   [ ] Otimizar queries e carregamento de dados
    -   [ ] Adicionar cache para dados estáticos (categorias, etc.)
-   [ ] **UX/UI**

    -   [ ] Implementar skeleton loading em todas as páginas
    -   [ ] Melhorar responsividade mobile
    -   [ ] Adicionar dark mode
    -   [ ] Implementar breadcrumbs dinâmicos

-   [ ] **Validações e Segurança**
    -   [ ] Validação de formulários mais robusta
    -   [ ] Tratamento de erro global
    -   [ ] Logs de auditoria para ações críticas

### 📱 Funcionalidades Futuras

-   [ ] **Relatórios**
    -   [ ] Relatório de vendas por período
    -   [ ] Relatório de clientes mais ativos
    -   [ ] Análise de produtos mais vendidos
-   [ ] **Integração**
    -   [ ] API de correios para frete automático
    -   [ ] Integração com WhatsApp para notificações
    -   [ ] Sistema de backup automático

### ✅ Concluído

-   [x] Criar categoria de produtos
-   [x] Select field para categoria do produto
-   [x] Select field para unidade de produto
-   [x] Máscara para CEP
-   [x] Busca automática de endereço por CEP
-   [x] Validação: apenas um endereço default por cliente
-   [x] Sistema de autenticação com Clerk
-   [x] CRUD completo de clientes
-   [x] CRUD completo de produtos
-   [x] Listagem e detalhes de pedidos

---

**Legenda:**

-   🔥 Urgente: Bugs críticos que afetam funcionalidade principal
-   🎯 Core: Funcionalidades essenciais para o negócio
-   🔧 Melhorias: Otimizações e melhorias de experiência
-   📱 Futuras: Funcionalidades planejadas para próximas versões
