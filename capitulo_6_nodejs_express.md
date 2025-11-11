# Capítulo 6: Node.js e Express - Desenvolvimento de APIs e Servidores Web

## Introdução ao Node.js

Node.js é uma plataforma de desenvolvimento baseada no motor JavaScript V8 do Google Chrome, que permite a execução de código JavaScript no lado do servidor. Criado por Ryan Dahl em 2009, o Node.js revolucionou o desenvolvimento web ao permitir que desenvolvedores utilizem uma única linguagem (JavaScript) tanto no frontend quanto no backend, promovendo a reutilização de código e a produtividade.

A arquitetura do Node.js é baseada em um loop de eventos single-threaded que utiliza programação assíncrona e não bloqueante. Isso significa que o Node.js pode lidar com milhares de conexões simultâneas de forma eficiente, tornando-o ideal para aplicações em tempo real, APIs e microserviços.

## Características Principais do Node.js

### Event Loop
O Event Loop é o coração do Node.js. Ele permite que o Node.js execute operações de E/S de forma assíncrona, delegando tarefas bloqueantes para o sistema operacional e continuando a executar outras tarefas enquanto aguarda a conclusão das operações assíncronas.

### Non-blocking I/O
Diferente das linguagens tradicionais que bloqueiam a thread durante operações de E/S, o Node.js executa essas operações de forma assíncrona, permitindo que outras tarefas sejam executadas enquanto os dados são lidos ou escritos.

### Single-threaded
Apesar de ser single-threaded, o Node.js consegue lidar com alta concorrência graças ao seu modelo assíncrono e à capacidade de delegar operações pesadas para threads de sistema operacional.

### Ecossistema NPM
O Node Package Manager (NPM) é o maior ecossistema de bibliotecas de código aberto do mundo, oferecendo centenas de milhares de pacotes que podem ser facilmente integrados a projetos Node.js.

## Instalação e Configuração

Para começar com Node.js, é necessário baixar e instalar a versão mais recente do site oficial (nodejs.org). A instalação inclui tanto o Node.js quanto o NPM. Após a instalação, você pode verificar se tudo está funcionando corretamente executando:

```bash
node --version
npm --version
```

## Primeiro Servidor com Node.js

Vamos criar nosso primeiro servidor HTTP com Node.js puro:

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Olá, mundo Node.js!</h1>');
});

const port = 3000;
server.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
```

## Introdução ao Express.js

Express.js é um framework minimalista e flexível para Node.js que facilita a criação de aplicações web e APIs RESTful. Ele fornece uma camada robusta de recursos para aplicações web e móveis, incluindo manipulação de rotas, middleware, renderização de templates e muito mais.

Express é considerado o framework padrão para desenvolvimento de aplicações Node.js devido à sua simplicidade, flexibilidade e vasto ecossistema de extensões.

## Instalação do Express

Para instalar o Express em um projeto Node.js, execute:

```bash
npm install express
```

## Primeira Aplicação com Express

Vamos criar uma aplicação Express básica:

```javascript
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('<h1>Olá, mundo Express!</h1>');
});

app.listen(port, () => {
    console.log(`Aplicação Express rodando em http://localhost:${port}`);
});
```

## Rotas no Express

As rotas determinam como um aplicativo responde a solicitações de clientes para pontos finais específicos. No Express, as rotas são definidas usando métodos HTTP como GET, POST, PUT, DELETE, etc.

```javascript
// Rota GET para a raiz
app.get('/', (req, res) => {
    res.send('Página inicial');
});

// Rota GET para /usuarios
app.get('/usuarios', (req, res) => {
    res.json([
        { id: 1, nome: 'João' },
        { id: 2, nome: 'Maria' }
    ]);
});

// Rota POST para /usuarios
app.post('/usuarios', (req, res) => {
    // Lógica para criar um novo usuário
    res.status(201).json({ mensagem: 'Usuário criado com sucesso' });
});

// Rota com parâmetro
app.get('/usuarios/:id', (req, res) => {
    const id = req.params.id;
    res.json({ id: id, nome: `Usuário ${id}` });
});
```

## Middleware no Express

Middleware são funções que têm acesso ao objeto de solicitação (req), ao objeto de resposta (res) e à próxima função middleware no ciclo de solicitação-resposta. Eles podem executar código, fazer alterações nos objetos req/res, encerrar o ciclo de solicitação-resposta ou chamar o próximo middleware.

```javascript
// Middleware para log de requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Middleware para parsing de JSON
app.use(express.json());

// Middleware para parsing de dados de formulário
app.use(express.urlencoded({ extended: true }));
```

## Trabalhando com Parâmetros e Query Strings

Express facilita a captura de diferentes tipos de parâmetros:

```javascript
// Parâmetros de rota (req.params)
app.get('/produtos/:categoria/:id', (req, res) => {
    const { categoria, id } = req.params;
    res.json({ categoria, id });
});

// Query strings (req.query)
app.get('/busca', (req, res) => {
    const { termo, pagina = 1 } = req.query;
    res.json({ termo, pagina });
});

// Corpo da requisição (req.body) - após middleware express.json()
app.post('/usuarios', (req, res) => {
    const { nome, email } = req.body;
    res.json({ mensagem: 'Usuário criado', nome, email });
});
```

## Templates e Renderização de Views

Express pode trabalhar com mecanismos de template para renderizar HTML dinamicamente:

```javascript
// Configuração do mecanismo de template (ex: EJS)
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/pagina/:nome', (req, res) => {
    const { nome } = req.params;
    res.render('pagina', { nome: nome });
});
```

## Tratamento de Erros

Express fornece mecanismos para tratamento de erros:

```javascript
// Middleware para tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado!');
});

// Rota para erro 404
app.use((req, res) => {
    res.status(404).send('Página não encontrada');
});
```

## API RESTful com Express

Express é ideal para criar APIs RESTful. Aqui está um exemplo completo de CRUD para usuários:

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Banco de dados simulado
let usuarios = [
    { id: 1, nome: 'João', email: 'joao@email.com' },
    { id: 2, nome: 'Maria', email: 'maria@email.com' }
];

// GET /usuarios - Listar todos os usuários
app.get('/usuarios', (req, res) => {
    res.json(usuarios);
});

// GET /usuarios/:id - Obter usuário específico
app.get('/usuarios/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const usuario = usuarios.find(u => u.id === id);
    
    if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(usuario);
});

// POST /usuarios - Criar novo usuário
app.post('/usuarios', (req, res) => {
    const { nome, email } = req.body;
    
    if (!nome || !email) {
        return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }
    
    const novoUsuario = {
        id: usuarios.length + 1,
        nome,
        email
    };
    
    usuarios.push(novoUsuario);
    res.status(201).json(novoUsuario);
});

// PUT /usuarios/:id - Atualizar usuário
app.put('/usuarios/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = usuarios.findIndex(u => u.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const { nome, email } = req.body;
    usuarios[index] = { ...usuarios[index], nome, email };
    res.json(usuarios[index]);
});

// DELETE /usuarios/:id - Deletar usuário
app.delete('/usuarios/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = usuarios.findIndex(u => u.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    usuarios.splice(index, 1);
    res.status(204).send();
});
```

## Segurança e Melhores Práticas

Ao desenvolver com Express, é importante seguir práticas de segurança:

- Utilizar helmet.js para adicionar cabeçalhos de segurança
- Validar e sanitizar entradas de usuário
- Implementar autenticação e autorização adequadas
- Usar variáveis de ambiente para configurações sensíveis
- Implementar logging adequado
- Tratar erros de forma segura

## Conclusão

Node.js e Express formam uma combinação poderosa para desenvolvimento de aplicações web e APIs. O modelo assíncrono do Node.js, combinado com a simplicidade e flexibilidade do Express, permite criar aplicações escaláveis e de alto desempenho. Com seu vasto ecossistema de pacotes e comunidade ativa, Node.js continua sendo uma escolha popular para desenvolvimento backend moderno.