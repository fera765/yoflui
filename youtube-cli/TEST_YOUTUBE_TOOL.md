# Teste da Tool do YouTube

## Como testar a tool do YouTube

### 1. Configure as credenciais no config.json

```json
{
  "endpoint": "https://api.openai.com/v1",
  "apiKey": "sk-YOUR-KEY-HERE",
  "model": "gpt-4",
  "maxVideos": 5,
  "maxCommentsPerVideo": 50
}
```

### 2. Modo Interativo

```bash
npm run dev
```

Digite um comando como:
```
Search YouTube comments about "programming tutorials" and summarize the main topics
```

### 3. Modo Não-Interativo

```bash
npm run build
npm run start -- --prompt "What are people saying about AI on YouTube?"
```

### 4. Exemplo de Saída Esperada

```
[>] TOOL: SEARCH_YOUTUBE_COMMENTS
    Args: {"query":"programming tutorials"}...
    [+] Success

Resultado:
{
  "query": "programming tutorials",
  "totalVideos": 5,
  "totalComments": 250,
  "comments": [
    {
      "videoTitle": "Learn Python in 1 Hour",
      "videoUrl": "https://youtube.com/watch?v=...",
      "comment": "Best tutorial ever!",
      "author": "John Doe",
      "likes": 42
    },
    ...
  ]
}
```

## Features da Tool

✅ Busca vídeos no YouTube  
✅ Extrai comentários de cada vídeo  
✅ Limita quantidade de vídeos (maxVideos)  
✅ Limita comentários por vídeo (maxCommentsPerVideo)  
✅ Retorna JSON estruturado  
✅ Inclui informações do vídeo (título, URL)  
✅ Inclui dados do comentário (texto, autor, likes)

## Casos de Uso

1. **Análise de Sentimento**: "Analyze sentiment of YouTube comments about product X"
2. **Pesquisa de Mercado**: "What are people's opinions about topic Y?"
3. **Tendências**: "What are the main discussions about Z?"
4. **Feedback de Produto**: "What do users say about feature W?"
