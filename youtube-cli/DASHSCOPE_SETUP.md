# ?? Como Configurar DashScope API Key

## ? OAuth Removido

O sistema OAuth foi **removido** porque tokens do portal.qwen.ai **N?O funcionam** para chamadas de API.

## ? Usando DashScope (Forma Correta)

### 1. Obter API Key

1. Acesse: https://dashscope.console.aliyun.com/
2. Fa?a login com sua conta Alibaba Cloud
3. V? em **API Keys**
4. Clique em **Create API Key**
5. Copie a API key (formato: `sk-xxxxx`)

### 2. Configurar na CLI

Edite o arquivo `config.json`:

```json
{
  "endpoint": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "apiKey": "sk-YOUR-KEY-HERE",
  "model": "qwen-plus",
  "maxVideos": 10,
  "maxCommentsPerVideo": 100
}
```

### 3. Modelos Dispon?veis

```bash
qwen-turbo          # R?pido, menor custo
qwen-plus           # Balanceado (recomendado)
qwen-max            # Mais poderoso
qwen3-coder-plus    # Otimizado para c?digo
```

## ?? Uso

### Modo Interativo
```bash
npm run dev
```

### Modo CLI
```bash
npm run start -- --prompt "sua tarefa aqui"
```

## ?? Importante

- **Use apenas DashScope API keys** (formato: `sk-xxx`)
- **N?O use** tokens do portal.qwen.ai
- **N?O use** OAuth tokens
- API keys s?o permanentes at? voc? remov?-las

## ?? Cr?ditos Gr?tis

DashScope oferece:
- **?10 CNY** em cr?ditos iniciais
- **2,000 chamadas gr?tis por dia** (para China)

## ?? Links ?teis

- Console DashScope: https://dashscope.console.aliyun.com/
- Documenta??o: https://help.aliyun.com/zh/dashscope/
- Modelos dispon?veis: https://dashscope.aliyun.com/model

## ? Teste R?pido

```bash
npm run build
npm run start -- --prompt "hello world"
```

Se ver erro `Incorrect API key`, sua API key est? incorreta ou n?o foi configurada.
