import express, { Request, Response } from 'express';

// Interface para representar um usuário
interface User {
  id: number;
  name: string;
  email: string;
}

// Simulação de banco de dados com um array
const users: User[] = [
  { id: 1, name: 'João Silva', email: 'joao@example.com' },
  { id: 2, name: 'Maria Oliveira', email: 'maria@example.com' },
  { id: 3, name: 'Pedro Santos', email: 'pedro@example.com' }
];

// Criação do app Express
const app = express();
const PORT = 3000;

// Middleware para parsing de JSON no body
app.use(express.json());

// Rota para obter todos os usuários
app.get('/users', (req: Request, res: Response) => {
  try {
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter usuários' });
  }
});

// Rota para obter um usuário específico por ID
app.get('/users/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter usuário' });
  }
});

// Rota para criar um novo usuário
app.post('/users', (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    
    // Validação simples
    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }
    
    // Verificar se o email já existe
    const emailExists = users.some(u => u.email === email);
    if (emailExists) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    // Criar novo usuário
    const newUser: User = {
      id: Math.max(...users.map(u => u.id), 0) + 1, // Geração simples de ID
      name,
      email
    };
    
    users.push(newUser);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Rota para atualizar um usuário existente
app.put('/users/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email } = req.body;
    
    // Validação simples
    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }
    
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Verificar se o email já existe para outro usuário
    const emailExists = users.some((u, index) => u.email === email && index !== userIndex);
    if (emailExists) {
      return res.status(400).json({ error: 'Email já cadastrado por outro usuário' });
    }
    
    // Atualizar usuário
    users[userIndex] = { ...users[userIndex], name, email };
    res.status(200).json(users[userIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Rota para deletar um usuário
app.delete('/users/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const deletedUser = users.splice(userIndex, 1)[0];
    res.status(200).json({ message: 'Usuário deletado com sucesso', user: deletedUser });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

// Rota raiz para teste
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Servidor Node.js/TypeScript/Express com CRUD de usuários funcionando!' });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Endpoints disponíveis:`);
  console.log(`  GET    /users          - Obter todos os usuários`);
  console.log(`  GET    /users/:id      - Obter usuário por ID`);
  console.log(`  POST   /users          - Criar novo usuário`);
  console.log(`  PUT    /users/:id      - Atualizar usuário existente`);
  console.log(`  DELETE /users/:id      - Deletar usuário`);
});