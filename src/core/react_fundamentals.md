# Capítulo 4: React Fundamentos

## Introdução ao React

React é uma biblioteca JavaScript de código aberto desenvolvida pelo Facebook para criar interfaces de usuário interativas e reativas. Desde seu lançamento em 2013, o React revolucionou a forma como desenvolvemos aplicações web modernas, introduzindo conceitos inovadores como componentes reutilizáveis, virtual DOM e programação declarativa.

A popularidade do React se deve à sua capacidade de simplificar o desenvolvimento de interfaces complexas, permitindo que os desenvolvedores criem aplicações escaláveis e de alta performance. Sua arquitetura baseada em componentes promove a reutilização de código, manutenção mais fácil e desenvolvimento mais rápido.

## Componentes: A Base do React

No React, tudo é construído em torno de componentes. Um componente é uma parte independente e reutilizável da interface que encapsula sua própria lógica, estado e aparência. Existem dois tipos principais de componentes: componentes de classe e componentes funcionais.

### Componentes Funcionais

Os componentes funcionais são funções JavaScript que retornam JSX (JavaScript XML), uma extensão da linguagem que permite escrever marcação HTML diretamente no código JavaScript. Eles são mais simples e leves, tornando-se a abordagem preferida na maioria dos casos modernos.

```jsx
function Welcome(props) {
  return <h1>Olá, {props.name}!</h1>;
}
```

### Componentes de Classe

Os componentes de classe são classes JavaScript que estendem a classe Component do React. Eles possuem métodos de ciclo de vida e podem gerenciar estado local, tornando-se úteis para componentes mais complexos.

```jsx
class Welcome extends React.Component {
  render() {
    return <h1>Olá, {this.props.name}!</h1>;
  }
}
```

## JSX: Sintaxe Poderosa

JSX é uma sintaxe que permite escrever expressões JavaScript dentro de marcação HTML. Ele é transformado em chamadas regulares de funções React antes de ser executado no navegador. O JSX torna o código mais legível e facilita a visualização da estrutura da interface.

```jsx
const element = (
  <div>
    <h1>Olá, mundo!</h1>
    <p>Esta é uma aplicação React.</p>
  </div>
);
```

## Props: Comunicação entre Componentes

Props (propriedades) são argumentos passados para componentes, semelhantes aos parâmetros de uma função. Eles permitem que os componentes recebam dados de seus componentes pais e sejam configurados de forma flexível. As props são somente leitura, o que significa que um componente não pode modificar suas próprias props.

```jsx
function Avatar(props) {
  return (
    <img 
      src={props.user.avatarUrl} 
      alt={props.user.name}
      className="avatar"
    />
  );
}

function Comment(props) {
  return (
    <div className="comment">
      <Avatar user={props.author} />
      <div className="comment-text">
        {props.text}
      </div>
      <div className="comment-date">
        {formatDate(props.date)}
      </div>
    </div>
  );
}
```

## Estado: Gerenciamento de Dados Internos

O estado é uma característica dos componentes que permite armazenar e gerenciar dados que podem mudar ao longo do tempo. Diferente das props, o estado é gerenciado internamente pelo componente e pode ser modificado usando funções específicas.

### Estado em Componentes de Classe

Nos componentes de classe, o estado é inicializado no construtor e modificado usando o método setState.

```jsx
class Clock extends React.Component {
  constructor(props) {
    super(props);
    this.state = { date: new Date() };
  }

  componentDidMount() {
    this.timerID = setInterval(
      () => this.tick(),
      1000
    );
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  tick() {
    this.setState({
      date: new Date()
    });
  }

  render() {
    return (
      <div>
        <h1>Horário atual:</h1>
        <h2>{this.state.date.toLocaleTimeString()}</h2>
      </div>
    );
  }
}
```

### Hooks: Estado em Componentes Funcionais

Com o lançamento do React 16.8, os Hooks foram introduzidos, permitindo o uso de estado e outras funcionalidades do React em componentes funcionais. O hook useState é o mais comum para gerenciar estado local.

```jsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Você clicou {count} vezes</p>
      <button onClick={() => setCount(count + 1)}>
        Clique aqui
      </button>
    </div>
  );
}
```

## Ciclo de Vida dos Componentes

O ciclo de vida de um componente React é dividido em três fases principais: montagem, atualização e desmontagem. Cada fase tem métodos específicos que permitem executar código em momentos estratégicos do ciclo de vida do componente.

### Métodos de Ciclo de Vida em Componentes de Classe

- **componentDidMount**: Chamado imediatamente após o componente ser montado na DOM
- **componentDidUpdate**: Chamado imediatamente após a atualização do componente
- **componentWillUnmount**: Chamado antes do componente ser desmontado e destruído

### Hooks Equivalentes

Com os Hooks, o efeito colateral é gerenciado pelo hook useEffect, que pode substituir todos os métodos de ciclo de vida antigos.

```jsx
import React, { useState, useEffect } from 'react';

function FriendStatus(props) {
  const [isOnline, setIsOnline] = useState(null);

  useEffect(() => {
    function handleStatusChange(status) {
      setIsOnline(status.isOnline);
    }

    ChatAPI.subscribeToFriendStatus(props.friend.id, handleStatusChange);
    
    return () => {
      ChatAPI.unsubscribeFromFriendStatus(props.friend.id, handleStatusChange);
    };
  });

  if (isOnline === null) {
    return 'Carregando...';
  }
  return isOnline ? 'Online' : 'Offline';
}
```

## Eventos no React

No React, eventos são nomeados usando camelCase em vez de letras minúsculas. Os eventos são passados como funções em vez de strings. O React normaliza os eventos para que funcionem de forma consistente em todos os navegadores.

```jsx
function Button() {
  function handleClick(e) {
    e.preventDefault();
    console.log('Botão foi clicado!');
  }

  return (
    <button onClick={handleClick}>
      Clique aqui
    </button>
  );
}
```

## Renderização Condicional

A renderização condicional no React funciona da mesma forma que as condições em JavaScript. Você pode usar operadores como if ou operadores condicionais para criar elementos representando estados diferentes e permitir que o React atualize a UI de acordo.

```jsx
function Greeting(props) {
  const isLoggedIn = props.isLoggedIn;
  
  if (isLoggedIn) {
    return <UserGreeting />;
  }
  return <GuestGreeting />;
}

function LoginControl(props) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  function handleLoginClick() {
    setIsLoggedIn(true);
  }

  function handleLogoutClick() {
    setIsLoggedIn(false);
  }

  let button;
  if (isLoggedIn) {
    button = <LogoutButton onClick={handleLogoutClick} />;
  } else {
    button = <LoginButton onClick={handleLoginClick} />;
  }

  return (
    <div>
      <Greeting isLoggedIn={isLoggedIn} />
      {button}
    </div>
  );
}
```

## Listas e Chaves

Ao renderizar listas no React, é importante fornecer uma chave (key) para cada item. As chaves ajudam o React a identificar quais itens foram alterados, adicionados ou removidos. Idealmente, as chaves devem ser strings estáveis e únicas para cada item.

```jsx
function NumberList(props) {
  const numbers = props.numbers;
  const listItems = numbers.map((number) =>
    <li key={number.toString()}>
      {number}
    </li>
  );
  return (
    <ul>{listItems}</ul>
  );
}
```

## Formulários no React

No React, formulários são um pouco diferentes de elementos HTML tradicionais porque os elementos de formulário mantêm seu próprio estado. Para tornar os formulários controlados, você deve gerenciar o estado do formulário no componente React.

```jsx
function Reservation() {
  const [isGoing, setIsGoing] = useState(true);
  const [numberOfGuests, setNumberOfGuests] = useState(2);

  function handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    if (name === 'isGoing') {
      setIsGoing(value);
    } else {
      setNumberOfGuests(value);
    }
  }

  return (
    <form>
      <label>
        Participando:
        <input
          name="isGoing"
          type="checkbox"
          checked={isGoing}
          onChange={handleInputChange}
        />
      </label>
      <br />
      <label>
        Número de convidados:
        <input
          name="numberOfGuests"
          type="number"
          value={numberOfGuests}
          onChange={handleInputChange}
        />
      </label>
    </form>
  );
}
```

## Melhores Práticas e Padrões

Ao desenvolver com React, existem várias melhores práticas que devem ser seguidas para garantir código limpo, escalável e manutenível:

1. **Componentes pequenos e focados**: Divida componentes complexos em componentes menores e mais específicos
2. **Nomenclatura clara**: Use nomes descritivos para componentes e variáveis
3. **Evite estado desnecessário**: Mantenha o estado o mais simples possível
4. **Use props para comunicação**: Prefira props para comunicação entre componentes
5. **Evite mutações diretas**: Sempre crie novos objetos ao invés de modificar os existentes
6. **Use hooks de forma apropriada**: Siga as regras dos hooks e use-os consistentemente

## Conclusão

React é uma biblioteca poderosa que transformou o desenvolvimento de interfaces de usuário. Com seus conceitos fundamentais de componentes, estado, props e ciclo de vida, o React permite criar aplicações web modernas, escaláveis e de alta performance. Dominar esses fundamentos é essencial para qualquer desenvolvedor que deseje trabalhar com tecnologias modernas de front-end.

Aprender React não é apenas sobre dominar uma biblioteca, mas sobre adotar uma nova mentalidade de desenvolvimento baseada em componentes reutilizáveis e lógica declarativa. Com prática e experiência, você será capaz de criar aplicações complexas com código limpo, organizado e eficiente.