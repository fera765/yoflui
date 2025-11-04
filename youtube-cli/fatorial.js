/**
 * Função que calcula o fatorial de um número inteiro não negativo
 * @param {number} n - O número para calcular o fatorial
 * @returns {number} - O fatorial de n
 * @throws {Error} - Se n não for um inteiro não negativo
 */
function calcularFatorial(n) {
    // Verifica se o número é inteiro não negativo
    if (n < 0 || !Number.isInteger(n)) {
        throw new Error("O número deve ser um inteiro não negativo");
    }
    
    // Caso base: 0! = 1 e 1! = 1
    if (n === 0 || n === 1) {
        return 1;
    }
    
    // Calcula o fatorial iterativamente
    let resultado = 1;
    for (let i = 2; i <= n; i++) {
        resultado *= i;
    }
    
    return resultado;
}

// Exemplo de uso:
console.log(calcularFatorial(5)); // Retorna 120
console.log(calcularFatorial(0)); // Retorna 1
console.log(calcularFatorial(1)); // Retorna 1
console.log(calcularFatorial(10)); // Retorna 3628800

// Exporta a função para poder ser utilizada em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = calcularFatorial;
}