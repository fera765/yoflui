// Simulação de uma API assíncrona
function fetchUserData(userId) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (userId > 0) {
                resolve({
                    id: userId,
                    name: `Usuário ${userId}`,
                    email: `usuario${userId}@exemplo.com`
                });
            } else {
                reject(new Error('ID de usuário inválido'));
            }
        }, 1000);
    });
}

// Função que simula busca de múltiplos dados
function fetchUserPosts(userId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { id: 1, title: 'Post 1', userId: userId },
                { id: 2, title: 'Post 2', userId: userId }
            ]);
        }, 800);
    });
}

// Exemplo de uso com async/await
async function getUserDataWithPosts(userId) {
    try {
        console.log('Buscando dados do usuário...');
        
        // Aguarda a resolução da promessa
        const user = await fetchUserData(userId);
        console.log('Usuário encontrado:', user);
        
        console.log('Buscando posts do usuário...');
        // Aguarda a resolução da segunda promessa
        const posts = await fetchUserPosts(user.id);
        console.log('Posts encontrados:', posts);
        
        return {
            user: user,
            posts: posts
        };
    } catch (error) {
        console.error('Erro ao buscar dados:', error.message);
        throw error;
    }
}

// Exemplo de uso com tratamento de erros
async function main() {
    try {
        const result = await getUserDataWithPosts(1);
        console.log('Resultado final:', result);
    } catch (error) {
        console.log('Operação falhou:', error.message);
    }
}

// Executar o exemplo
main();