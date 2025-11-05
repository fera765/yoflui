// Arquivo: hello.js
// Descrição: Script simples que imprime uma mensagem de saudação no console
// Uso: node hello.js

/**
 * Função principal que imprime uma mensagem de saudação
 */
function saudacao() {
    console.log("Hello, World!");
}

// Executa a função de saudação
saudacao();

// Exporta a função para permitir testes ou reutilização
module.exports = { saudacao };