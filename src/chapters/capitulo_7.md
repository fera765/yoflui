# Capítulo 7: APIs RESTful

## Introdução às APIs RESTful

As APIs RESTful (Representational State Transfer) são um dos pilares fundamentais do desenvolvimento web moderno, permitindo que diferentes sistemas se comuniquem de forma eficiente e padronizada. A arquitetura REST define um conjunto de restrições e princípios que, quando aplicados corretamente, resultam em sistemas escaláveis, confiáveis e fáceis de manter.

REST é um estilo arquitetural proposto por Roy Fielding em 2000, baseado nos princípios fundamentais da web. Uma API RESTful implementa esses princípios para criar interfaces que permitem a comunicação entre clientes e servidores de maneira stateless, ou seja, sem manter estado entre requisições.

## Princípios Fundamentais do REST

O modelo arquitetural REST é baseado em seis princípios fundamentais que devem ser seguidos para criar APIs verdadeiramente RESTful:

### 1. Cliente-Servidor
A separação entre cliente e servidor permite que ambos evoluam independentemente. O cliente cuida da interface do usuário e da experiência, enquanto o servidor gerencia os dados e a lógica de negócios.

### 2. Stateless
Cada requisição do cliente para o servidor deve conter todas as informações necessárias para entender e processar a requisição. O servidor não deve manter estado entre requisições, o que melhora a confiabilidade e escalabilidade.

### 3. Cache
As respostas devem ser explicitamente marcadas como cacheáveis ou não cacheáveis para permitir que os clientes reutilizem respostas de requisições anteriores, melhorando o desempenho.

### 4. Interface Uniforme
Este é o princípio mais importante do REST. A interface uniforme simplifica e desacopla a arquitetura, permitindo que cada parte evolua independentemente. Inclui:
- Identificação de recursos
- Manipulação de recursos através de representações
- Mensagens auto-descritivas
- HATEOAS (Hypermedia as the Engine of Application State)

### 5. Sistema em Camadas
A arquitetura pode ser composta por múltiplas camadas, onde cada camada não precisa saber detalhes sobre as outras camadas além daquelas com as quais interage diretamente.

### 6. Código sob Demanda (Opcional)
Permite que o servidor envie código executável para o cliente, estendendo sua funcionalidade. Este é o único princípio opcional do REST.

## Verbos HTTP e Semântica

As APIs RESTful utilizam os verbos HTTP de forma semântica para indicar a intenção da operação:

### GET
Utilizado para recuperar recursos existentes. Deve ser idempotente e não ter efeitos colaterais. Exemplo: `GET /users/123` recupera o usuário com ID 123.

### POST
Utilizado para criar novos recursos. Não é idempotente, pois cada requisição cria um novo recurso. Exemplo: `POST /users` cria um novo usuário.

### PUT
Utilizado para atualizar recursos existentes ou criar um recurso em uma URI específica. É idempotente. Exemplo: `PUT /users/123` atualiza o usuário com ID 123.

### PATCH
Utilizado para atualizações parciais de recursos. Diferente do PUT, permite modificar apenas alguns campos. Exemplo: `PATCH /users/123` atualiza apenas alguns campos do usuário.

### DELETE
Utilizado para remover recursos. Exemplo: `DELETE /users/123` remove o usuário com ID 123.

## Design de Recursos e URIs

O design de recursos é crucial para APIs RESTful bem projetadas. Os recursos devem ser nomeados usando substantivos no plural e seguir uma estrutura hierárquica clara:

```
/users - Coleção de usuários
/users/123 - Usuário específico
/users/123/posts - Posts do usuário 123
/users/123/posts/456 - Post específico do usuário 123
```

Evite usar verbos nas URIs, pois os verbos HTTP já indicam a ação a ser realizada. Prefira estruturas como `/users` em vez de `/getUsers`.

## Códigos de Status HTTP

Os códigos de status HTTP são essenciais para comunicar o resultado das operações:

### 2xx - Sucesso
- 200 OK: Requisição bem-sucedida
- 201 Created: Recurso criado com sucesso
- 204 No Content: Requisição bem-sucedida, sem conteúdo para retornar

### 4xx - Erros do Cliente
- 400 Bad Request: Requisição inválida
- 401 Unauthorized: Autenticação necessária
- 403 Forbidden: Acesso proibido
- 404 Not Found: Recurso não encontrado
- 422 Unprocessable Entity: Requisição válida, mas sem sentido semântico

### 5xx - Erros do Servidor
- 500 Internal Server Error: Erro interno do servidor
- 502 Bad Gateway: Servidor recebeu resposta inválida de upstream
- 503 Service Unavailable: Serviço temporariamente indisponível

## Content Negotiation e Formatos de Dados

As APIs RESTful suportam diferentes formatos de dados, sendo JSON o mais comum. O Content Negotiation permite que cliente e servidor concordem sobre o formato de dados a ser utilizado:

```
Accept: application/json
Content-Type: application/json
```

Outros formatos suportados incluem XML, CSV e formatos proprietários, dependendo dos requisitos do sistema.

## Autenticação e Autorização

A segurança é fundamental em APIs RESTful. As abordagens mais comuns incluem:

### Token-based Authentication
Utiliza tokens (como JWT - JSON Web Tokens) para autenticar requisições. O token é enviado no header Authorization:

```
Authorization: Bearer <token>
```

### API Keys
Chaves de API podem ser enviadas como headers ou parâmetros de query para identificar o cliente.

### OAuth 2.0
Protocolo de autorização que permite que aplicações de terceiros obtenham acesso limitado a recursos protegidos.

## Versionamento de APIs

O versionamento é essencial para manter a compatibilidade backward e permitir evolução contínua:

### Versionamento por URI
```
/v1/users
/v2/users
```

### Versionamento por Header
```
Accept: application/vnd.api.v1+json
```

### Versionamento por Parâmetro de Query
```
/users?version=1
```

## Boas Práticas e Padrões

### Nomenclatura Consistente
Mantenha consistência na nomenclatura de endpoints, campos e estruturas de dados.

### Paginação
Implemente paginação para coleções grandes:
```
GET /users?page=1&limit=20
```

### Filtragem
Permite filtrar resultados:
```
GET /users?status=active&role=admin
```

### Ordenação
Permite ordenar resultados:
```
GET /users?sort=name&order=asc
```

### HATEOAS
Inclua links relacionados nas respostas para permitir que os clientes naveguem pela API:
```json
{
  "id": 123,
  "name": "John Doe",
  "_links": {
    "self": "/users/123",
    "posts": "/users/123/posts"
  }
}
```

## Tratamento de Erros

As APIs devem retornar estruturas de erro consistentes:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

## Performance e Otimização

### Cache HTTP
Utilize headers de cache apropriados:
```
Cache-Control: max-age=3600
ETag: "abc123"
```

### Compression
Implemente compressão (gzip) para reduzir o tamanho das respostas.

### Lazy Loading
Carregue apenas os dados necessários para evitar sobrecarga.

## Documentação e Ferramentas

A documentação é crucial para APIs bem-sucedidas. Ferramentas como Swagger/OpenAPI permitem criar documentação interativa e gerar SDKs automaticamente.

## Conclusão

As APIs RESTful são fundamentais para a arquitetura moderna de aplicações, proporcionando interoperabilidade, escalabilidade e manutenibilidade. Seguir os princípios REST, boas práticas de design e considerações de segurança resulta em APIs robustas e fáceis de consumir. A adoção de padrões consistentes e documentação adequada são essenciais para o sucesso de qualquer API RESTful.