// Arquivo: fileManager.js
// Descrição: Conjunto de funções para manipulação de arquivos
// Uso: node fileManager.js ou importar as funções em outro módulo

const fs = require('fs');
const path = require('path');

/**
 * Lê o conteúdo de um arquivo
 * @param {string} filePath - Caminho do arquivo a ser lido
 * @returns {Promise<string>} - Promessa que resolve com o conteúdo do arquivo
 */
function lerArquivo(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * Escreve conteúdo em um arquivo
 * @param {string} filePath - Caminho do arquivo a ser escrito
 * @param {string} content - Conteúdo a ser escrito no arquivo
 * @returns {Promise<void>} - Promessa que resolve quando a escrita é concluída
 */
function escreverArquivo(filePath, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, content, 'utf8', (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Verifica se um arquivo ou diretório existe
 * @param {string} filePath - Caminho do arquivo ou diretório
 * @returns {boolean} - Retorna true se o arquivo/diretório existe
 */
function existe(filePath) {
    return fs.existsSync(filePath);
}

/**
 * Cria um diretório se ele não existir
 * @param {string} dirPath - Caminho do diretório a ser criado
 * @returns {void}
 */
function criarDiretorio(dirPath) {
    if (!existe(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Lista os arquivos em um diretório
 * @param {string} dirPath - Caminho do diretório
 * @returns {Promise<string[]>} - Promessa que resolve com um array de nomes de arquivos
 */
function listarArquivos(dirPath) {
    return new Promise((resolve, reject) => {
        fs.readdir(dirPath, (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
}

// Se o script for executado diretamente, mostra exemplos de uso
if (require.main === module) {
    console.log("Exemplos de uso do gerenciador de arquivos:");
    
    // Exemplo de criação de diretório
    const testDir = './testDir';
    criarDiretorio(testDir);
    console.log(`Diretório ${testDir} criado (ou já existia)`);
    
    // Exemplo de escrita de arquivo
    const testFile = path.join(testDir, 'test.txt');
    escreverArquivo(testFile, 'Este é um arquivo de teste')
        .then(() => {
            console.log(`Arquivo ${testFile} criado com sucesso`);
            
            // Exemplo de leitura de arquivo
            return lerArquivo(testFile);
        })
        .then(content => {
            console.log(`Conteúdo do arquivo ${testFile}:`, content);
            
            // Exemplo de listagem de arquivos
            return listarArquivos(testDir);
        })
        .then(files => {
            console.log(`Arquivos no diretório ${testDir}:`, files);
        })
        .catch(err => {
            console.error('Erro:', err);
        });
}

// Exporta as funções para permitir uso em outros módulos
module.exports = {
    lerArquivo,
    escreverArquivo,
    existe,
    criarDiretorio,
    listarArquivos
};