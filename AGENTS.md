# 🤖 AGENTS.md - Zion Dashboard

Este documento serve como guia completo para desenvolvedores humanos e IA que trabalharão no **Zion Dashboard**, um sistema de gestão comercial para LaBuonapasta desenvolvido em Next.js.

## 📋 Índice

1. [Visão Geral do Projeto](#-visão-geral-do-projeto)
2. [Arquitetura e Stack](#-arquitetura-e-stack)
3. [Estrutura do Projeto](#-estrutura-do-projeto)
4. [Domínios e Modelos](#-domínios-e-modelos)
5. [Padrões de Desenvolvimento](#-padrões-de-desenvolvimento)
6. [Sistema de Design](#-sistema-de-design)
7. [Autenticação e Segurança](#-autenticação-e-segurança)
8. [APIs e Integração](#-apis-e-integração)
9. [Componentes Padrão](#-componentes-padrão)
10. [Fluxos de Desenvolvimento](#-fluxos-de-desenvolvimento)
11. [Regras Críticas](#-regras-críticas)
12. [Troubleshooting](#-troubleshooting)

---

## 🎯 Visão Geral do Projeto

O **Zion Dashboard** é um sistema ERP/CRM completo para gestão comercial no ramo alimentício, especificamente desenvolvido para a LaBuonapasta. O sistema gerencia:

- **Clientes**: CRUD completo com múltiplos endereços e validação de CEP
- **Produtos**: Catálogo com categorias e unidades de medida
- **Pedidos**: Sistema completo de pedidos com tracking
- **Logística**: Cálculo de distância e controle de entrega

### Características Principais

- Interface moderna e responsiva
- Autenticação segura com Clerk
- Validação robusta de formulários
- Sistema de notificações (toasts)
- Navegação por breadcrumbs dinâmicos
- Tabelas interativas com paginação

---

## 🏗️ Arquitetura e Stack

### Stack Principal

```
Frontend Framework: Next.js 15 (App Router)
Language: TypeScript 5
UI Framework: React 18
Styling: Tailwind CSS + shadcn/ui
State Management: Zustand
Forms: React Hook Form + Zod
Authentication: Clerk (OAuth, JWT)
Tables: TanStack Table
HTTP Client: Custom fetch client
Container: Docker + Docker Compose
Package Manager: pnpm
```

### Estrutura de Arquivos

```
src/
├── app/                    # Pages (App Router)
│   ├── customers/         # Gestão de clientes
│   ├── products/          # Gestão de produtos
│   ├── orders/           # Gestão de pedidos
│   └── sign-in/          # Autenticação
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes base (shadcn/ui)
│   └── *.tsx             # Componentes específicos
├── domains/              # Modelos de dados e validação
├── hooks/                # Hooks customizados
├── lib/                  # Utilitários e clientes
├── stores/               # Estado global (Zustand)
└── repository/           # Repositórios de dados
```

---

## 🎲 Domínios e Modelos

### Customer (Cliente)

```typescript
interface Customer {
    id?: string; // UUID
    name: string; // Min 5 caracteres
    email: string; // Email válido ou vazio
    phone: string; // 10-11 dígitos
    phone2: string; // Telefone secundário
}
```

### Product (Produto)

```typescript
interface Product {
    id?: string; // UUID
    name: string; // Min 5 caracteres
    value: number; // Valor em centavos
    unityType: "UN" | "KG" | "LT"; // Unidade de medida
    categoryId: string; // UUID da categoria
}
```

### Order (Pedido)

```typescript
interface Order {
    id?: string; // UUID
    number: number; // Número sequencial
    pickupDate: Date; // Data de retirada
    customerId: string; // UUID do cliente
    employeeId: string; // UUID do funcionário
    orderLocal: string; // Local do pedido
    observations: string; // Observações
    isPickedUp: boolean; // Status de retirada
    products: OrderProducts[]; // Produtos do pedido
}
```

### Address (Endereço)

```typescript
interface Address {
    id?: string; // UUID
    customerId: string; // UUID do cliente
    cep: string; // CEP com máscara
    street: string; // Logradouro
    number: string; // Número
    complement?: string; // Complemento
    neighborhood: string; // Bairro
    city: string; // Cidade
    state: string; // Estado
    isDefault: boolean; // Endereço padrão
}
```

---

## 🎨 Sistema de Design

### Cores (Variáveis CSS)

```css
/* SEMPRE use estas variáveis, NUNCA cores hardcoded */
--primary: 222.2 84% 4.9%;
--primary-foreground: 210 40% 98%;
--secondary: 210 40% 96%;
--muted: 210 40% 96%;
--accent: 210 40% 96%;
--destructive: 0 84.2% 60.2%;
--border: 214.3 31.8% 91.4%;
--input: 214.3 31.8% 91.4%;
--ring: 222.2 84% 4.9%;
```

### Componentes Base

```tsx
// ✅ SEMPRE use estes padrões
<Button variant="default">Ação Principal</Button>
<Button variant="outline">Ação Secundária</Button>
<Button variant="ghost">Ação Sutil</Button>

<Card className="rounded-xl shadow">
  <CardHeader className="p-6">
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent className="p-6">Conteúdo</CardContent>
</Card>
```

### Layout Padrão

```tsx
// Estrutura padrão para páginas de listagem
<div className="flex flex-col gap-10">
    <div className="flex gap-10">
        <div className="grow">
            <Input placeholder="Pesquisar..." icon={Search} value={search} onChange={handleSearch} />
        </div>
        <Button onClick={handleNew}>
            <Plus /> Nova Ação
        </Button>
    </div>
    <DataTable columns={columns} data={data} isLoading={loading} />
    <FullPagination page={page} pageSize={10} totalCount={total} onChangePageAction={handlePageChange} />
</div>
```

---

## 🔐 Autenticação e Segurança

### Clerk Integration

```typescript
// Middleware de autenticação
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)"]);

export default clerkMiddleware(
    async (auth, request) => {
        const { userId, redirectToSignIn } = await auth();
        if (!userId && !isPublicRoute(request)) {
            return redirectToSignIn();
        }
    },
    { signInUrl: "/sign-in" }
);
```

### Fetch Client Autenticado

```typescript
// Hook para requisições autenticadas
const { fetch } = useFetchClient();

// Uso
const data = await fetch<Customer[]>("/api/customers");
```

---

## 🌐 APIs e Integração

### Padrão de Requisições

```typescript
// GET com paginação e busca
const customers = await fetch<PaginatedResponse<Customer>>(`/customers?limit=10&page=${page}&name=${search}`);

// POST para criar
const newCustomer = await fetch<Customer>("/customers", {
    method: "POST",
    body: JSON.stringify(customerData),
});

// PUT para atualizar
const updatedCustomer = await fetch<Customer>(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(customerData),
});
```

### Variáveis de Ambiente

```env
# API
NEXT_PUBLIC_HOST_API=http://localhost:8000/api

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

---

## 🧩 Componentes Padrão

### DataTable

```tsx
// Componente de tabela reutilizável
<DataTable
    columns={columns} // Definição das colunas
    data={data} // Array de dados
    isLoading={loading} // Estado de carregamento
/>
```

### Formulários

```tsx
// Padrão de formulário com React Hook Form + Zod
const form = useForm<Customer>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer,
});

const onSubmit = async (data: Customer) => {
    try {
        await fetch("/api/customers", {
            method: "POST",
            body: JSON.stringify(data),
        });
        toast({ description: "Cliente salvo com sucesso!" });
    } catch (error) {
        // Error handling é automático via useFetchClient
    }
};
```

### Navegação

```tsx
// Hook para gerenciar breadcrumbs
const setTitle = useHeaderStore((state) => state.setTitle);

useEffect(() => {
    setTitle(["Clientes", "Editar Cliente"]);
}, [setTitle]);
```

---

## 🔄 Fluxos de Desenvolvimento

### Criando uma Nova Página

1. **Criar o arquivo da página**: `src/app/nova-secao/page.tsx`
2. **Definir o domínio**: `src/domains/nova-entidade.ts`
3. **Criar as colunas**: `src/app/nova-secao/columns.tsx`
4. **Implementar o formulário**: `src/app/nova-secao/[id]/form.tsx`
5. **Adicionar navegação**: Atualizar sidebar se necessário

### Criando um Novo Componente

1. **Verificar se já existe**: Consultar `src/components/ui/`
2. **Usar shadcn/ui**: `npx shadcn@latest add component-name`
3. **Seguir padrões**: Usar as variáveis CSS do design system
4. **Documentar**: Adicionar exemplo de uso

### Validação de Formulário

```typescript
// 1. Definir schema com Zod
export const entitySchema = z.object({
    name: z.string().min(5, "Nome deve ter pelo menos 5 caracteres"),
    email: z.string().email("Email inválido"),
});

// 2. Usar no formulário
const form = useForm<Entity>({
    resolver: zodResolver(entitySchema),
});

// 3. Implementar submit
const onSubmit = async (data: Entity) => {
    await fetch("/api/entities", {
        method: "POST",
        body: JSON.stringify(data),
    });
};
```

---

## ⚠️ Regras Críticas

### 🚫 NUNCA FAÇA

- ❌ **Cores hardcoded**: `bg-blue-500`, `text-red-600`
- ❌ **Modificar componentes UI**: Alterar arquivos em `src/components/ui/`
- ❌ **Criar componentes UI customizados**: Use shadcn/ui
- ❌ **Ignorar validação**: Todo formulário deve ter schema Zod
- ❌ **Requisições não autenticadas**: Use sempre `useFetchClient`
- ❌ **Estados locais desnecessários**: Use Zustand para estado global

### ✅ SEMPRE FAÇA

- ✅ **Use variáveis CSS**: `hsl(var(--primary))`
- ✅ **Valide formulários**: React Hook Form + Zod
- ✅ **Implemente loading states**: Para melhor UX
- ✅ **Mantenha consistência**: Siga os padrões existentes
- ✅ **Use TypeScript**: Tipagem estrita em tudo
- ✅ **Teste responsividade**: Mobile-first approach

### 🎨 Design System

- **Espaçamento**: Use `gap-10` entre seções, `p-6` em cards
- **Bordas**: `rounded-xl` para cards, `rounded-md` para inputs
- **Sombras**: `shadow` para elevação sutil
- **Hover**: `hover:bg-primary/90` para botões
- **Focus**: Estados automáticos via componentes base

---

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Endereços não salvam

```bash
# Verificar se customer.id está sendo passado
console.log('Customer ID:', customer.id);

# Verificar chamada da API
const response = await fetch(`/api/customers/${customerId}/addresses`);
```

#### 2. Autenticação falha

```bash
# Verificar token
const token = await getToken();
console.log('Token:', token);

# Verificar variáveis de ambiente
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```

#### 3. Styles não aplicam

```bash
# Verificar se está usando variáveis CSS
❌ className="bg-blue-500"
✅ className="bg-primary"

# Verificar Tailwind
npm run dev
```

### Scripts Úteis

```bash
# Desenvolvimento
pnpm dev                 # Servidor local
pnpm dev:docker         # Com Docker
pnpm build              # Build produção
pnpm lint               # Linting
pnpm commit             # Commit padronizado

# Debug
npm run type-check      # Verificar tipos
npm run build-analyze   # Analisar bundle
```

---

## 📚 Recursos Adicionais

### Documentação

- [Next.js App Router](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [React Hook Form](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)
- [Clerk Authentication](https://clerk.com/docs)
- [TanStack Table](https://tanstack.com/table)

### Comandos Úteis

```bash
# Adicionar novo componente UI
npx shadcn@latest add button

# Gerar tipos TypeScript
npx typescript --noEmit

# Verificar dependências
pnpm audit

# Limpar cache
pnpm clean
```

---

## 🎯 Conclusão

Este documento serve como guia definitivo para desenvolvimento no Zion Dashboard. Sempre que tiver dúvidas:

1. **Consulte este documento primeiro**
2. **Verifique os padrões existentes no código**
3. **Mantenha consistência com o design system**
4. **Use TypeScript de forma rigorosa**
5. **Teste em diferentes devices**

**Lembre-se**: O objetivo é manter a qualidade e consistência do código. Quando em dúvida, prefira seguir os padrões existentes a criar novos.

---

_Documento atualizado em: Outubro 2025_
_Versão do projeto: 0.1.0_
