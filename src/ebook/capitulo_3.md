# Capítulo 3: JavaScript ES6+

## Introdução

JavaScript ES6+ representa uma evolução significativa na linguagem de programação mais popular da web. Com a versão ES6 (ECMAScript 2015), a linguagem ganhou recursos poderosos que tornaram o desenvolvimento mais moderno, legível e eficiente. Este capítulo explora os principais recursos introduzidos a partir do ES6 e suas versões subsequentes.

## Let e Const

Antes do ES6, a declaração de variáveis era feita apenas com `var`, que possuía escopo de função e comportamentos confusos como hoisting. ES6 introduziu `let` e `const`, que possuem escopo de bloco.

```javascript
// Declaração com let - variável pode ser reatribuída
let nome = "João";
nome = "Maria"; // Válido

// Declaração com const - valor não pode ser reatribuído
const idade = 30;
// idade = 31; // Erro: Assignment to constant variable
```

O escopo de bloco significa que variáveis declaradas com `let` e `const` só são acessíveis dentro do bloco onde foram declaradas, diferentemente de `var` que tem escopo de função.

## Arrow Functions

As arrow functions são uma forma mais concisa de escrever funções, além de terem um comportamento diferente com o `this`. Elas são especialmente úteis para funções de callback e funções anônimas.

```javascript
// Função tradicional
function soma(a, b) {
    return a + b;
}

// Arrow function
const soma = (a, b) => a + b;

// Arrow function com corpo
const saudacao = (nome) => {
    return `Olá, ${nome}!`;
};

// Arrow function com um parâmetro (parênteses opcionais)
const dobro = x => x * 2;
```

As arrow functions não possuem seu próprio `this`, `arguments`, `super` ou `new.target`, o que as torna ideais para funções de callback onde você quer manter o contexto do `this` do escopo externo.

## Template Literals

Template literals permitem criar strings multilinhas e interpolar expressões de forma mais natural usando crases (`` ` ``) e `${expressão}`.

```javascript
const nome = "Carlos";
const idade = 25;

// String tradicional
const mensagem = "Olá, " + nome + "! Você tem " + idade + " anos.";

// Template literal
const mensagem = `Olá, ${nome}! Você tem ${idade} anos.`;

// Multilinhas
const texto = `
    Esta é uma string
    que ocupa várias linhas
    e é muito mais legível
`;

// Expressões em template literals
const preco = 10;
const imposto = 2;
const total = `O preço final é R$${preco + imposto},00`;
```

## Destructuring

O destructuring permite extrair valores de arrays e objetos de forma concisa e legível.

```javascript
// Destructuring de array
const numeros = [1, 2, 3];
const [primeiro, segundo, terceiro] = numeros;
console.log(primeiro); // 1

// Destructuring de objeto
const pessoa = { nome: "Ana", idade: 28, cidade: "São Paulo" };
const { nome, idade } = pessoa;
console.log(nome); // Ana

// Renomeação de propriedades
const { nome: nomeCompleto, idade: anos } = pessoa;
console.log(nomeCompleto); // Ana

// Valores padrão
const { pais = "Brasil" } = pessoa;
console.log(pais); // Brasil (valor padrão)
```

## Parâmetros Padrão

ES6 permite definir valores padrão para parâmetros de funções, eliminando a necessidade de verificações manuais.

```javascript
// Função com parâmetros padrão
function saudacao(nome = "Visitante", idioma = "pt") {
    if (idioma === "pt") {
        return `Olá, ${nome}!`;
    } else {
        return `Hello, ${nome}!`;
    }
}

console.log(saudacao()); // Olá, Visitante!
console.log(saudacao("Maria")); // Olá, Maria!
console.log(saudacao("John", "en")); // Hello, John!
```

## Operador Spread

O operador spread (`...`) permite expandir elementos de arrays ou propriedades de objetos em contextos onde múltiplos elementos são esperados.

```javascript
// Spread com arrays
const array1 = [1, 2, 3];
const array2 = [4, 5, 6];
const combinado = [...array1, ...array2]; // [1, 2, 3, 4, 5, 6]

// Copiar array
const copia = [...array1];

// Spread com objetos
const obj1 = { a: 1, b: 2 };
const obj2 = { c: 3, d: 4 };
const combinado = { ...obj1, ...obj2 }; // { a: 1, b: 2, c: 3, d: 4 }

// Spread em funções
function soma(a, b, c) {
    return a + b + c;
}
const numeros = [1, 2, 3];
console.log(soma(...numeros)); // 6
```

## Operador Rest

O operador rest (`...`) permite que uma função receba um número indefinido de argumentos como um array.

```javascript
// Função com parâmetros rest
function soma(...numeros) {
    return numeros.reduce((total, num) => total + num, 0);
}

console.log(soma(1, 2, 3)); // 6
console.log(soma(1, 2, 3, 4, 5)); // 15

// Rest com destructuring
const [primeiro, ...resto] = [1, 2, 3, 4, 5];
console.log(primeiro); // 1
console.log(resto); // [2, 3, 4, 5]
```

## Classes

ES6 introduziu uma sintaxe mais familiar para criar objetos e lidar com herança baseada em classes, embora ainda utilize protótipos por baixo dos panos.

```javascript
class Pessoa {
    constructor(nome, idade) {
        this.nome = nome;
        this.idade = idade;
    }
    
    saudacao() {
        return `Olá, eu sou ${this.nome} e tenho ${this.idade} anos.`;
    }
    
    static tipo() {
        return "Humano";
    }
}

class Estudante extends Pessoa {
    constructor(nome, idade, curso) {
        super(nome, idade);
        this.curso = curso;
    }
    
    saudacao() {
        return `${super.saudacao()} Estudo ${this.curso}.`;
    }
}

const aluno = new Estudante("Pedro", 20, "Engenharia");
console.log(aluno.saudacao()); // Olá, eu sou Pedro e tenho 20 anos. Estudo Engenharia.
```

## Módulos

ES6 introduziu um sistema de módulos nativo, permitindo importar e exportar funcionalidades entre arquivos de forma padronizada.

```javascript
// math.js
export const PI = 3.14159;

export function areaCirculo(raio) {
    return PI * raio * raio;
}

export default function soma(a, b) {
    return a + b;
}

// main.js
import soma, { PI, areaCirculo } from './math.js';

console.log(soma(2, 3)); // 5
console.log(PI); // 3.14159
console.log(areaCirculo(5)); // 78.53975
```

## Promises

Promises são uma forma mais elegante de lidar com operações assíncronas, substituindo callbacks aninhados por uma estrutura mais legível.

```javascript
// Criando uma promise
const promessa = new Promise((resolve, reject) => {
    setTimeout(() => {
        const sucesso = true;
        if (sucesso) {
            resolve("Operação bem-sucedida!");
        } else {
            reject("Erro na operação!");
        }
    }, 1000);
});

// Usando a promise
promessa
    .then(resultado => console.log(resultado))
    .catch(erro => console.error(erro));
```

## Async/Await

Async/await é uma sintaxe mais moderna para trabalhar com promises, tornando o código assíncrono mais parecido com código síncrono.

```javascript
async function buscarDados() {
    try {
        const resposta = await fetch('https://api.exemplo.com/dados');
        const dados = await resposta.json();
        return dados;
    } catch (erro) {
        console.error('Erro ao buscar dados:', erro);
    }
}

// Uso da função async
buscarDados().then(dados => console.log(dados));
```

## Map e Set

ES6 introduziu novas estruturas de dados: Map e Set, que oferecem funcionalidades específicas.

```javascript
// Map - armazena pares chave-valor
const mapa = new Map();
mapa.set('chave1', 'valor1');
mapa.set('chave2', 'valor2');

for (let [chave, valor] of mapa) {
    console.log(`${chave}: ${valor}`);
}

// Set - armazena valores únicos
const conjunto = new Set([1, 2, 3, 3, 4]); // [1, 2, 3, 4]
conjunto.add(5);
console.log(conjunto.has(3)); // true
```

## Conclusão

JavaScript ES6+ trouxe uma série de recursos que modernizaram completamente a linguagem, tornando o código mais legível, seguro e poderoso. Desde as simples mas eficazes arrow functions até recursos mais avançados como classes e módulos, essas adições tornaram JavaScript uma linguagem mais madura e adequada para aplicações complexas. Dominar esses recursos é essencial para qualquer desenvolvedor web moderno.