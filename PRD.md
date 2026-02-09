# PRD — Preço Variável em Produtos (`isVariablePrice`)

## Contexto

Produtos agora possuem um campo que indica se o preço é variável. Quando ativado, o valor do produto pode ser alterado no momento da venda (ex: produtos vendidos por peso). Quando desativado, o preço cadastrado é fixo.

## Campo na API

| Propriedade | Valor |
|---|---|
| **Nome JSON** | `isVariablePrice` |
| **Tipo** | `boolean` |
| **Obrigatório** | Não (default: `false`) |
| **Valor padrão** | `false` |

## Endpoints afetados

### `GET /products` — Listar produtos
Retorna `isVariablePrice` em cada produto da lista.

### `GET /products/:id` — Detalhe do produto
Retorna `isVariablePrice` no objeto do produto.

### `POST /products` — Criar produto
Aceita `isVariablePrice` no body. Se omitido, será `false`.

### `PUT /products/:id` — Atualizar produto
Aceita `isVariablePrice` no body para alterar o valor.

## Payload de exemplo

**Request (criar/atualizar):**
```json
{
  "name": "Queijo Minas",
  "value": 4590,
  "unityType": "kg",
  "categoryId": "uuid-da-categoria",
  "imageUrl": "https://storage.exemplo.com/queijo.jpg",
  "isVariablePrice": true
}
```

**Response:**
```json
{
  "id": "uuid-do-produto",
  "name": "Queijo Minas",
  "value": 4590,
  "unityType": "kg",
  "categoryId": "uuid-da-categoria",
  "imageUrl": "https://storage.exemplo.com/queijo.jpg",
  "isVariablePrice": true
}
```

## Regras de negócio para o front

1. **Cadastro/edição de produto** — Adicionar um toggle/switch para "Preço variável" no formulário. Default: desligado.
2. **Listagem de produtos** — Exibir indicador visual (badge, ícone) nos produtos com preço variável.
3. **Tela de venda/pedido** — Se `isVariablePrice === true`, o campo de valor do item deve ser **editável** pelo operador. Se `false`, o valor vem fixo do cadastro e não pode ser alterado.
4. **Validação** — Quando preço variável e o operador edita o valor, garantir que o valor informado seja > 0.

## Produtos existentes

Todos os produtos já cadastrados receberam `isVariablePrice: false` automaticamente (default do banco). Nenhuma migração de dados é necessária no front.
