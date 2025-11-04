# Expressão Regular para Validação de Email

## Resultado Principal

```regex
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

## Detalhes Relevantes

Esta expressão regular valida endereços de email com base nos seguintes critérios:

- **Início da string**: `^`
- **Parte local (antes do @)**: 
  - Pode conter letras maiúsculas e minúsculas (`a-zA-Z`)
  - Pode conter dígitos (`0-9`)
  - Pode conter os caracteres especiais: ponto (.), sublinhado (_), porcentagem (%), sinal de mais (+) e hífen (-)
  - Deve ter pelo menos um caractere antes do @
- **Símbolo @**: Obrigatório
- **Domínio**:
  - Após o @, pode conter letras, números, pontos e hífens
  - Deve terminar com um ponto seguido de pelo menos 2 letras (extensão do domínio)
- **Fim da string**: `$`

## Exemplos de emails válidos:
- usuario@exemplo.com
- nome.sobrenome@empresa.co.uk
- teste123@dominio.org

## Observações e Ressalvas

1. Esta expressão regular cobre os casos mais comuns de emails válidos, mas não é 100% estrita em relação à especificação técnica completa do formato de email (RFC 5322), pois uma implementação perfeitamente rigorosa seria extremamente complexa.

2. A expressão aceita formatos comuns usados na prática, mas pode não validar alguns formatos válidos tecnicamente que são raros na prática.

3. Não é recomendado usar apenas regex para validação completa de email em aplicações críticas - a melhor prática é combinar com verificação por envio de email de confirmação.

## Nível de Confiança: 90%