# Capítulo 5: React Hooks

## Introdução aos React Hooks

React Hooks são funções especiais introduzidas no React 16.8 que permitem usar estado e outros recursos do React sem escrever uma classe. Eles representam uma evolução significativa na forma como desenvolvemos componentes React, permitindo reutilizar lógica de estado entre componentes e simplificando a complexidade do código.

Antes dos Hooks, os componentes funcionais eram limitados e não podiam gerenciar estado ou ciclo de vida. Os Hooks resolveram essa limitação, tornando os componentes funcionais tão poderosos quanto os componentes de classe, com uma API mais limpa e intuitiva.

## useState: Gerenciamento de Estado

O `useState` é o Hook mais fundamental para gerenciar estado local em componentes funcionais. Ele retorna um array com dois elementos: o valor atual do estado e uma função para atualizá-lo.

```jsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Contagem: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Incrementar
      </button>
    </div>
  );
}
```

O `useState` aceita um valor inicial ou uma função que retorna o valor inicial. Isso é especialmente útil para estados complexos ou caros para calcular:

```jsx
const [items, setItems] = useState(() => {
  // Cálculo pesado realizado apenas na inicialização
  return getExpensiveItems();
});
```

## useEffect: Efeitos Colaterais

O `useEffect` permite executar efeitos colaterais em componentes funcionais, como chamadas de API, manipulação de DOM, assinaturas de eventos e limpezas. Ele combina as funcionalidades dos métodos de ciclo de vida `componentDidMount`, `componentDidUpdate` e `componentWillUnmount`.

```jsx
import React, { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const response = await fetch(`/api/users/${userId}`);
      const userData = await response.json();
      setUser(userData);
    }

    fetchUser();
  }, [userId]); // Array de dependências

  return user ? <div>{user.name}</div> : <div>Carregando...</div>;
}
```

O segundo argumento do `useEffect` é o array de dependências. Quando omitido, o efeito é executado após cada renderização. Quando vazio, o efeito é executado apenas uma vez (equivalente a `componentDidMount`). Quando contém dependências, o efeito é executado quando essas dependências mudam.

## Hooks de Estado Avançados

### useReducer

Para estados mais complexos, o `useReducer` oferece uma alternativa ao `useState`. Ele é especialmente útil quando o próximo estado depende do estado anterior de forma complexa.

```jsx
import React, { useReducer } from 'react';

const initialState = { count: 0, step: 1 };

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + state.step };
    case 'decrement':
      return { ...state, count: state.count - state.step };
    case 'setStep':
      return { ...state, step: action.payload };
    default:
      throw new Error();
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      <p>Contagem: {state.count}</p>
      <p>Passo: {state.step}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>
        Incrementar
      </button>
      <button onClick={() => dispatch({ type: 'decrement' })}>
        Decrementar
      </button>
      <input
        type="number"
        value={state.step}
        onChange={(e) => dispatch({ 
          type: 'setStep', 
          payload: Number(e.target.value) 
        })}
      />
    </div>
  );
}
```

### useCallback e useMemo

Esses Hooks ajudam a otimizar o desempenho evitando cálculos desnecessários e recriações de funções.

`useCallback` memoriza funções:
```jsx
import React, { useCallback, useState } from 'react';

function ParentComponent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return (
    <div>
      <p>Contagem: {count}</p>
      <ChildComponent onClick={handleClick} />
    </div>
  );
}
```

`useMemo` memoriza valores computados:
```jsx
import React, { useMemo, useState } from 'react';

function ExpensiveComponent({ items }) {
  const expensiveValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.value, 0);
  }, [items]);

  return <div>Valor total: {expensiveValue}</div>;
}
```

## Hooks de Referência e Layout

### useRef

O `useRef` retorna um objeto mutável que persiste durante todo o ciclo de vida do componente. É comumente usado para acessar diretamente elementos DOM.

```jsx
import React, { useRef, useEffect } from 'react';

function FocusInput() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  return <input ref={inputRef} type="text" />;
}
```

### useLayoutEffect

Semelhante ao `useEffect`, mas é acionado sincronicamente após todas as mutações DOM. Use quando precisar ler o layout do DOM.

## Hooks Personalizados

Hooks personalizados permitem reutilizar lógica de estado entre componentes. Eles são funções normais que usam outros Hooks.

```jsx
import { useState, useEffect } from 'react';

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Uso no componente
function StatusBar() {
  const isOnline = useOnlineStatus();

  return <div>{isOnline ? 'Online' : 'Offline'}</div>;
}
```

## Regras dos Hooks

Os Hooks seguem regras específicas para garantir seu funcionamento correto:

1. **Chame Hooks no nível superior**: Não chame Hooks dentro de loops, condições ou funções aninhadas.
2. **Chame Hooks apenas em componentes React ou Hooks personalizados**: Evite chamar Hooks em funções regulares.

## Melhores Práticas

- Use Hooks para simplificar componentes complexos
- Crie Hooks personalizados para lógica compartilhável
- Evite arrays de dependências vazios desnecessários
- Use `useCallback` e `useMemo` com moderação
- Prefira `useReducer` para estados complexos com múltiplas sub-values

## Conclusão

React Hooks revolucionaram o desenvolvimento React, oferecendo uma maneira mais funcional e limpa de gerenciar estado e efeitos colaterais. Eles promovem a reutilização de lógica, simplificam o código e tornam os componentes mais fáceis de entender e testar. Dominar os Hooks é essencial para qualquer desenvolvedor React moderno.