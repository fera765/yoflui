# 🔧 Guia das Novas Tools de Automação

## 📋 Visão Geral

Duas novas tools foram desenvolvidas exclusivamente para automações avançadas no FLUI:

1. **`condition`** - Roteamento condicional de fluxos
2. **`trigger_webhook`** - Envio de requisições HTTP para APIs externas

---

## 🔀 CONDITION TOOL

### Descrição
Avalia condições e direciona o fluxo de automação para diferentes caminhos, funcionando como um roteador/switch inteligente.

### Casos de Uso
- Webhook routers (COMPRAR → fluxo-compra, VENDER → fluxo-venda)
- Validação de entrada de usuários
- Roteamento baseado em status/tipo
- Decisões condicionais em automações

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `value` | string | ✅ | Valor a ser testado |
| `conditions` | array | ✅ | Lista de condições `[{pattern, nextFlow, matchType}]` |
| `defaultFlow` | string | ❌ | Fluxo padrão se nenhuma condição for atendida |
| `caseSensitive` | boolean | ❌ | Comparação case-sensitive (padrão: false) |

### Tipos de Match

- **`exact`** - Match exato (padrão)
- **`contains`** - Contém o padrão
- **`startsWith`** - Começa com o padrão
- **`endsWith`** - Termina com o padrão
- **`regex`** - Expressão regular

### Exemplo de Uso em Automação

```json
{
  "id": "step_router",
  "type": "tool",
  "toolName": "condition",
  "toolArgs": {
    "value": "${variables.objetivo}",
    "conditions": [
      {
        "pattern": "COMPRAR",
        "nextFlow": "flow-compra",
        "matchType": "exact"
      },
      {
        "pattern": "VENDER",
        "nextFlow": "flow-venda",
        "matchType": "exact"
      },
      {
        "pattern": "AJUDA",
        "nextFlow": "flow-suporte",
        "matchType": "exact"
      }
    ],
    "defaultFlow": "flow-default",
    "caseSensitive": false
  }
}
```

### Exemplo de Resposta

```json
{
  "success": true,
  "matchedCondition": "COMPRAR",
  "matchedFlow": "flow-compra",
  "matchType": "exact",
  "value": "COMPRAR"
}
```

---

## 🌐 TRIGGER_WEBHOOK TOOL

### Descrição
Envia requisições HTTP para APIs/webhooks externos com total flexibilidade de método, payload, headers e query params.

### Casos de Uso
- Integração com APIs externas (CRM, ERP, etc)
- Envio de dados coletados em formulários
- Notificações para serviços externos
- Sincronização de dados entre sistemas
- Gatilhos de eventos em plataformas terceiras

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `url` | string | ✅ | URL completa do endpoint (incluindo https://) |
| `method` | string | ✅ | Método HTTP: GET, POST, PUT, DELETE, PATCH |
| `payload` | object | ❌ | Dados do corpo da requisição (JSON) |
| `headers` | object | ❌ | Headers HTTP customizados |
| `queryParams` | object | ❌ | Parâmetros de query string |
| `timeout` | number | ❌ | Timeout em ms (padrão: 30000) |
| `retryOnFailure` | boolean | ❌ | Tentar novamente em caso de falha (padrão: false) |
| `validateStatus` | boolean | ❌ | Validar status 2xx (padrão: true) |

### Exemplo 1: POST com Payload

```json
{
  "id": "step_send_data",
  "type": "tool",
  "toolName": "trigger_webhook",
  "toolArgs": {
    "url": "https://api.exemplo.com/v1/vendas",
    "method": "POST",
    "payload": {
      "tipo": "compra",
      "produto": "${variables.produto}",
      "quantidade": "${variables.quantidade}",
      "email": "${variables.email}",
      "total": "${variables.total}",
      "timestamp": "${Date.now()}"
    },
    "headers": {
      "Authorization": "Bearer SEU_TOKEN_AQUI",
      "Content-Type": "application/json",
      "X-Client-ID": "FLUI"
    },
    "timeout": 15000,
    "retryOnFailure": true
  }
}
```

### Exemplo 2: GET com Query Params

```json
{
  "id": "step_fetch_data",
  "type": "tool",
  "toolName": "trigger_webhook",
  "toolArgs": {
    "url": "https://api.exemplo.com/v1/clientes",
    "method": "GET",
    "queryParams": {
      "email": "${variables.email}",
      "limit": "10",
      "page": "1"
    },
    "headers": {
      "Authorization": "Bearer TOKEN"
    }
  }
}
```

### Exemplo 3: PUT para Atualização

```json
{
  "id": "step_update_status",
  "type": "tool",
  "toolName": "trigger_webhook",
  "toolArgs": {
    "url": "https://api.exemplo.com/v1/pedidos/${variables.pedidoId}",
    "method": "PUT",
    "payload": {
      "status": "concluido",
      "updatedAt": "${Date.now()}"
    },
    "headers": {
      "Authorization": "Bearer TOKEN"
    }
  }
}
```

### Resposta de Sucesso

```json
{
  "success": true,
  "statusCode": 200,
  "statusText": "OK",
  "responseData": {
    "id": "12345",
    "status": "created"
  },
  "executionTime": 456,
  "url": "https://api.exemplo.com/v1/vendas",
  "method": "POST",
  "headers": {
    "content-type": "application/json",
    "x-request-id": "abc123"
  }
}
```

### Resposta de Erro

```json
{
  "success": false,
  "error": "HTTP Error: 401 Unauthorized",
  "statusCode": 401,
  "statusText": "Unauthorized",
  "url": "https://api.exemplo.com/v1/vendas",
  "method": "POST"
}
```

---

## 🎯 Exemplo Completo: E-commerce Webhook Flow

### Automação: `webhook-ecommerce.json`

```json
{
  "id": "webhook-ecommerce",
  "version": "1.0.0",
  "metadata": {
    "name": "E-commerce Webhook Handler",
    "description": "Processa webhooks de e-commerce e roteia para fluxos específicos"
  },
  "triggers": [
    {
      "type": "exact",
      "pattern": "@ecommerce-webhook"
    }
  ],
  "variables": {
    "acao": {"type": "string", "defaultValue": ""},
    "produto": {"type": "string", "defaultValue": ""},
    "email": {"type": "string", "defaultValue": ""},
    "valor": {"type": "string", "defaultValue": ""},
    "nextFlow": {"type": "string", "defaultValue": ""}
  },
  "steps": [
    {
      "id": "1",
      "type": "log",
      "message": "🔔 Webhook recebido: ${variables.acao}"
    },
    {
      "id": "2",
      "type": "tool",
      "toolName": "condition",
      "toolArgs": {
        "value": "${variables.acao}",
        "conditions": [
          {"pattern": "COMPRAR", "nextFlow": "processar-compra"},
          {"pattern": "CANCELAR", "nextFlow": "processar-cancelamento"},
          {"pattern": "SUPORTE", "nextFlow": "abrir-ticket"}
        ],
        "defaultFlow": "log-desconhecido"
      }
    },
    {
      "id": "3",
      "type": "conditional",
      "condition": "${variables.nextFlow} === 'processar-compra'",
      "nextSteps": ["4"]
    },
    {
      "id": "4",
      "type": "tool",
      "toolName": "trigger_webhook",
      "toolArgs": {
        "url": "https://api.crm.com/v1/vendas",
        "method": "POST",
        "payload": {
          "produto": "${variables.produto}",
          "email": "${variables.email}",
          "valor": "${variables.valor}",
          "origem": "webhook-flui"
        },
        "headers": {
          "Authorization": "Bearer CRM_TOKEN"
        },
        "retryOnFailure": true
      }
    },
    {
      "id": "5",
      "type": "log",
      "message": "✅ Processo concluído!"
    }
  ]
}
```

---

## 🚀 Casos de Uso Avançados

### 1. Multi-Step API Integration

Coletar dados → Validar → Enviar para CRM → Notificar Slack

### 2. Webhook Router Dinâmico

Receber webhook → Avaliar tipo → Rotear para automação específica

### 3. Data Sync Pipeline

Buscar dados (GET) → Processar → Atualizar sistema externo (PUT)

### 4. Error Handling with Fallback

Tentar API principal → Se falhar, usar API backup → Notificar admin

---

## ✅ Validação e Testes

Ambas as tools foram testadas e validadas:

- ✅ Condition: exact, contains, regex, startsWith, endsWith
- ✅ Trigger Webhook: GET, POST, PUT, DELETE, PATCH
- ✅ Headers customizados
- ✅ Query params
- ✅ Payload dinâmico com variáveis
- ✅ Retry on failure
- ✅ Timeout configurável
- ✅ Status validation

---

## 📚 Recursos Adicionais

- Documentação completa das tools em `/source/tools/`
- Exemplos de automações em `/automations/`
- Testes automatizados em `test-new-tools.ts`

**🎉 Ambas as tools estão prontas para uso em produção!**
