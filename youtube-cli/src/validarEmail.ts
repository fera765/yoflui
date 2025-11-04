function validarEmail(email: string): boolean {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

// Teste de exemplo
console.log(validarEmail("usuario@exemplo.com")); // true
console.log(validarEmail("email.invalido")); // false
console.log(validarEmail("teste@dominio.br")); // true
console.log(validarEmail("@exemplo.com")); // false