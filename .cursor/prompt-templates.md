# Templates de Prompts por Contexto

## 🚀 Feature Development

```
@context feature-development

Implementar [nome da feature]:

**Requisitos:**
- [ ] Schema Zod em domains/
- [ ] Página de listagem com busca e filtros
- [ ] Página de detalhes/edição
- [ ] Integração com API
- [ ] Loading states e error handling
- [ ] Paginação (10 items por página)
- [ ] Responsividade mobile

**API Endpoints:**
- GET /api/[resource]
- GET /api/[resource]/[id]
- POST /api/[resource]
- PUT /api/[resource]/[id]
- DELETE /api/[resource]/[id]
```

## 🎨 UI Components

```
@context ui-components

Criar componente [ComponentName]:

**Especificações:**
- [ ] Baseado em shadcn/ui
- [ ] Variants com CVA
- [ ] ForwardRef se necessário
- [ ] Props tipadas com TypeScript
- [ ] Acessibilidade (ARIA)
- [ ] Testes de usabilidade
- [ ] Documentação de uso

**Variantes necessárias:**
- Size: sm, md, lg
- Variant: default, outline, ghost
```

## 🔗 API Integration

```
@context api-integration

Integrar com API [API Name]:

**Checklist:**
- [ ] Schema Zod para tipagem
- [ ] Repository layer
- [ ] Error handling com toast
- [ ] Loading states
- [ ] Autenticação via useFetchClient
- [ ] Validação de responses
- [ ] Cache strategy (se aplicável)

**Endpoints a implementar:**
- [ ] [METHOD] [endpoint] - [descrição]
```

## 📝 Forms

```
@context forms

Criar formulário [Form Name]:

**Requisitos:**
- [ ] React Hook Form + Zod resolver
- [ ] Validação client-side
- [ ] Feedback visual de erros
- [ ] Submit com loading state
- [ ] Toast notifications
- [ ] Campos responsivos
- [ ] Acessibilidade

**Campos:**
- [ ] [campo] - [tipo] - [validação]
```

## 📊 Data Tables

```
@context data-tables

Implementar tabela de [Entity]:

**Features:**
- [ ] Colunas definidas em columns.tsx
- [ ] Busca/filtros
- [ ] Ordenação
- [ ] Paginação com FullPagination
- [ ] Actions (view, edit, delete)
- [ ] Loading skeleton
- [ ] Empty state
- [ ] Responsividade mobile

**Colunas necessárias:**
- [ ] [coluna] - [tipo] - [sortable?]
```
