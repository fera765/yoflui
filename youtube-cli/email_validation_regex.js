// Expressão regular para validar endereços de email
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Função para validar email
function validarEmail(email) {
    return emailRegex.test(email);
}

// Exemplos de uso
console.log(validarEmail("exemplo@dominio.com")); // true
console.log(validarEmail("usuario.nome+tag@empresa.co.uk")); // true
console.log(validarEmail("email.invalido")); // false

module.exports = { validarEmail, emailRegex };