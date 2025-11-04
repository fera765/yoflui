// Arquivo: calculator.js
// Descrição: Conjunto de funções básicas de calculadora
// Uso: node calculator.js ou importar as funções em outro módulo

/**
 * Soma dois números
 * @param {number} a - Primeiro número
 * @param {number} b - Segundo número
 * @returns {number} - Resultado da soma
 */
function somar(a, b) {
    return a + b;
}

/**
 * Subtrai dois números
 * @param {number} a - Primeiro número
 * @param {number} b - Segundo número
 * @returns {number} - Resultado da subtração
 */
function subtrair(a, b) {
    return a - b;
}

/**
 * Multiplica dois números
 * @param {number} a - Primeiro número
 * @param {number} b - Segundo número
 * @returns {number} - Resultado da multiplicação
 */
function multiplicar(a, b) {
    return a * b;
}

/**
 * Divide dois números
 * @param {number} a - Primeiro número
 * @param {number} b - Segundo número
 * @returns {number} - Resultado da divisão
 * @throws {Error} - Lança erro se tentar dividir por zero
 */
function dividir(a, b) {
    if (b === 0) {
        throw new Error("Não é possível dividir por zero");
    }
    return a / b;
}

// Se o script for executado diretamente, mostra exemplos de uso
if (require.main === module) {
    console.log("Exemplos de uso da calculadora:");
    console.log("Somar 5 + 3 =", somar(5, 3));
    console.log("Subtrair 5 - 3 =", subtrair(5, 3));
    console.log("Multiplicar 5 * 3 =", multiplicar(5, 3));
    console.log("Dividir 6 / 3 =", dividir(6, 3));
    
    try {
        console.log("Dividir 6 / 0 =", dividir(6, 0));
    } catch (error) {
        console.log("Erro:", error.message);
    }
}

// Exporta as funções para permitir uso em outros módulos
module.exports = {
    somar,
    subtrair,
    multiplicar,
    dividir
};