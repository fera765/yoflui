import express from 'express';
import open from 'open';
import fs from 'fs/promises';
import path from 'path';

// --- Configurações ---
// O serviço OAuth específico não foi fornecido, então usaremos um URL de exemplo.
// VOCÊ DEVE SUBSTITUIR ESTES VALORES PELOS REAIS DO SEU SERVIÇO QWEN/AI.
const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/callback';
const AUTH_URL = 'https://auth.example.com/oauth/authorize'; // URL de autorização do serviço
const TOKEN_URL = 'https://auth.example.com/oauth/token'; // URL de troca de token
const CREDENTIALS_FILE = path.join(process.cwd(), 'qwen-credentials.json');

const app = express();
const PORT = 3000;
let server;

/**
 * Inicia o servidor Express para receber o callback OAuth.
 */
function startServer() {
  return new Promise((resolve, reject) => {
    app.get('/callback', async (req, res) => {
      const { code, error } = req.query;

      if (error) {
        res.send('Erro de OAuth: ' + error);
        console.error('Erro de OAuth:', error);
        server.close(() => reject(new Error('Login falhou.')));
        return;
      }

      if (code) {
        try {
          // 1. Trocar o código de autorização por tokens de acesso.
          // Esta é uma simulação. Na vida real, você usaria 'axios' ou 'fetch'
          // para fazer uma requisição POST para a TOKEN_URL.
          // Exemplo de requisição real:
          /*
          const tokenResponse = await axios.post(TOKEN_URL, {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code'
          });
          const tokens = tokenResponse.data;
          */

          // SIMULAÇÃO DE TOKENS (substitua pela lógica acima)
          const tokens = {
            access_token: 'simulated_access_token_' + Date.now(),
            refresh_token: 'simulated_refresh_token_' + Date.now(),
            expires_in: 3600,
            token_type: 'Bearer'
          };

          // 2. Salvar as credenciais no arquivo.
          await fs.writeFile(CREDENTIALS_FILE, JSON.stringify(tokens, null, 2));

          res.send('Login bem-sucedido! Você pode fechar esta janela.');
          server.close(() => resolve('Sucesso. Salvo.'));
        } catch (err) {
          res.send('Erro ao processar token.');
          console.error('Erro ao trocar ou salvar token:', err);
          server.close(() => reject(new Error('Erro interno.')));
        }
      } else {
        res.send('Callback inválido.');
        server.close(() => reject(new Error('Callback inválido.')));
      }
    });

    server = app.listen(PORT, () => {
      console.log(`Servidor de callback rodando em ${REDIRECT_URI}`);
      resolve();
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Função principal para executar o fluxo de login.
 */
async function runLogin() {
  try {
    // 1. Construir o URL de autorização.
    const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=read,write`;

    // 2. Iniciar o servidor de callback.
    await startServer();

    // 3. Abrir o navegador automaticamente.
    console.log('Abrindo navegador para autorização...');
    await open(authUrl);

    // 4. Aguardar a resolução do servidor (sucesso ou falha).
    const feedback = await new Promise((resolve, reject) => {
      server.on('close', () => {
        // Se o servidor fechar sem resolve/reject, é um erro.
        reject(new Error('Servidor fechado inesperadamente.'));
      });
    });

    console.log(feedback);
    return feedback;

  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`A porta ${PORT} já está em uso. Certifique-se de que nenhuma outra instância esteja rodando.`);
      return 'Porta ocupada.';
    }
    console.error('Ocorreu um erro durante o login:', error.message);
    return 'Login falhou.';
  }
}

runLogin().then(feedback => {
    // O feedback final de 2 palavras.
    if (feedback === 'Sucesso. Salvo.') {
        console.log('Login concluído.');
    } else {
        console.log('Login falhou.');
    }
    process.exit(0);
}).catch(err => {
    console.error('Erro fatal:', err.message);
    process.exit(1);
});
