# Capítulo 5: Tratamento de Erros e Exceções em Python para Empreendedores

## Introdução

No mundo do empreendedorismo digital, a confiabilidade dos sistemas é fundamental para manter a credibilidade e a satisfação do cliente. Quando desenvolvemos aplicações, inevitavelmente encontramos situações inesperadas que podem interromper a execução do programa. O tratamento adequado de erros e exceções é uma prática essencial que garante que nossas aplicações se comportem de forma previsível mesmo diante de problemas inesperados. Neste capítulo, vamos explorar como Python lida com erros e exceções, e como essa funcionalidade pode ser aplicada estrategicamente em soluções empresariais.

O tratamento de exceções não é apenas uma questão técnica, mas também uma consideração de negócios. Um sistema que falha graciosamente, fornecendo mensagens claras e mantendo a integridade dos dados, transmite profissionalismo e confiança aos usuários. Para empreendedores que desenvolvem soluções digitais, dominar o tratamento de exceções é essencial para criar produtos robustos e confiáveis.

## O Que São Erros e Exceções?

Em Python, distinguimos entre dois tipos principais de erros:

- **Erros de sintaxe**: Ocorrem quando o código não segue as regras da linguagem Python. Esses erros são detectados antes da execução do programa.
- **Exceções**: Ocorrem durante a execução do programa quando algo inesperado acontece, mesmo que a sintaxe esteja correta.

Exceções podem surgir em diversas situações comuns em aplicações empresariais, como:
- Tentativa de divisão por zero em cálculos financeiros
- Leitura de arquivos que não existem
- Conexão com APIs externas que falham
- Entrada de dados inválida por parte do usuário

## Tipos Comuns de Exceções em Aplicações Empresariais

### ValueError
Ocorre quando uma função recebe um argumento com o tipo correto, mas valor inadequado:

```python
def calcular_imposto(valor):
    if valor < 0:
        raise ValueError("O valor não pode ser negativo")
    return valor * 0.1

try:
    imposto = calcular_imposto(-100)
except ValueError as e:
    print(f"Erro: {e}")
```

### FileNotFoundError
Ocorre quando tentamos abrir um arquivo que não existe:

```python
try:
    with open("relatorio_inexistente.csv", "r") as arquivo:
        conteudo = arquivo.read()
except FileNotFoundError:
    print("Relatório não encontrado. Gerando novo relatório...")
```

### ZeroDivisionError
Ocorre quando tentamos dividir por zero, comum em cálculos financeiros:

```python
def calcular_roi(receita, custo):
    try:
        return ((receita - custo) / custo) * 100
    except ZeroDivisionError:
        return float('inf') if receita > 0 else 0
```

## Estrutura do Tratamento de Exceções

Python fornece uma estrutura robusta para tratamento de exceções usando os blocos `try`, `except`, `else` e `finally`:

```python
try:
    # Código que pode gerar exceção
    resultado = operacao_possivelmente_perigosa()
except TipoDeExcecaoEspecífico as variavel:
    # Código para lidar com a exceção
    print(f"Ocorreu um erro: {variavel}")
else:
    # Executado apenas se nenhuma exceção ocorrer
    print("Operação concluída com sucesso")
finally:
    # Sempre executado, independentemente de exceções
    print("Limpando recursos...")
```

## Aplicações Práticas para Empreendedores

### Validação de Dados de Clientes

Quando lidamos com dados de clientes, é essencial validar as informações para evitar inconsistências:

```python
class ValidadorCliente:
    @staticmethod
    def validar_email(email):
        if "@" not in email or "." not in email:
            raise ValueError(f"Email inválido: {email}")
        return True
    
    @staticmethod
    def validar_cpf(cpf):
        cpf = ''.join(filter(str.isdigit, cpf))
        if len(cpf) != 11:
            raise ValueError(f"CPF inválido: {cpf}")
        return True

def cadastrar_cliente(nome, email, cpf):
    try:
        ValidadorCliente.validar_email(email)
        ValidadorCliente.validar_cpf(cpf)
        # Processo de cadastro
        print(f"Cliente {nome} cadastrado com sucesso!")
    except ValueError as e:
        print(f"Erro de validação: {e}")
        return False
    except Exception as e:
        print(f"Erro inesperado: {e}")
        return False
```

### Integração com APIs Externas

Ao integrar com APIs de pagamento, redes sociais ou outros serviços, é crucial lidar com falhas de conexão:

```python
import requests
from time import sleep

def integrar_com_api_pagamento(dados_pagamento, max_tentativas=3):
    url = "https://api-pagamento.exemplo.com/processar"
    
    for tentativa in range(max_tentativas):
        try:
            resposta = requests.post(url, json=dados_pagamento, timeout=10)
            resposta.raise_for_status()  # Levanta exceção para códigos de erro HTTP
            return resposta.json()
        
        except requests.exceptions.HTTPError as e:
            print(f"Erro HTTP: {e}")
            if resposta.status_code == 400:
                # Erro de validação - não tentar novamente
                raise
            elif resposta.status_code >= 500:
                # Erro do servidor - tentar novamente
                if tentativa < max_tentativas - 1:
                    sleep(2 ** tentativa)  # Backoff exponencial
                    continue
                else:
                    raise
        
        except requests.exceptions.ConnectionError:
            print("Erro de conexão com a API de pagamento")
            if tentativa < max_tentativas - 1:
                sleep(2 ** tentativa)
                continue
            else:
                raise
        
        except requests.exceptions.Timeout:
            print("Tempo limite excedido na API de pagamento")
            if tentativa < max_tentativas - 1:
                sleep(2 ** tentativa)
                continue
            else:
                raise
    
    raise Exception("Falha após todas as tentativas de conexão")
```

### Processamento de Arquivos de Dados

Empreendedores frequentemente precisam processar arquivos de dados, como planilhas de vendas ou relatórios financeiros:

```python
import csv
import os

def processar_arquivo_vendas(caminho_arquivo):
    if not os.path.exists(caminho_arquivo):
        raise FileNotFoundError(f"Arquivo não encontrado: {caminho_arquivo}")
    
    vendas = []
    
    try:
        with open(caminho_arquivo, 'r', newline='', encoding='utf-8') as arquivo:
            leitor = csv.DictReader(arquivo)
            
            for linha_num, linha in enumerate(leitor, start=2):
                try:
                    venda = {
                        'produto': linha['produto'],
                        'quantidade': int(linha['quantidade']),
                        'valor_unitario': float(linha['valor_unitario']),
                        'data': linha['data']
                    }
                    
                    # Validação adicional
                    if venda['quantidade'] <= 0 or venda['valor_unitario'] <= 0:
                        raise ValueError(f"Dados inválidos na linha {linha_num}")
                    
                    vendas.append(venda)
                    
                except (ValueError, KeyError) as e:
                    print(f"Aviso: Erro na linha {linha_num}: {e}")
                    continue
    
    except UnicodeDecodeError:
        print("Erro de codificação. Tentando com codificação diferente...")
        with open(caminho_arquivo, 'r', newline='', encoding='latin-1') as arquivo:
            # Processamento similar com codificação diferente
            pass
    
    return vendas
```

## Criação de Exceções Personalizadas

Para aplicações empresariais, é útil criar exceções personalizadas que representem situações específicas do domínio:

```python
class SaldoInsuficienteError(Exception):
    """Lançada quando não há saldo suficiente para uma operação financeira"""
    def __init__(self, saldo_atual, valor_solicitado):
        self.saldo_atual = saldo_atual
        self.valor_solicitado = valor_solicitado
        super().__init__(f"Saldo insuficiente: R$ {saldo_atual:.2f} para R$ {valor_solicitado:.2f}")

class LimiteCreditoExcedidoError(Exception):
    """Lançada quando o limite de crédito é excedido"""
    pass

class ContaFinanceira:
    def __init__(self, saldo_inicial=0, limite_credito=0):
        self.saldo = saldo_inicial
        self.limite_credito = limite_credito
    
    def sacar(self, valor):
        if valor <= 0:
            raise ValueError("Valor de saque deve ser positivo")
        
        if self.saldo >= valor:
            self.saldo -= valor
        elif (self.saldo + self.limite_credito) >= valor:
            self.saldo -= valor
        else:
            raise SaldoInsuficienteError(self.saldo, valor)
    
    def aplicar_juros(self, taxa):
        if taxa < 0:
            raise ValueError("Taxa de juros não pode ser negativa")
        self.saldo *= (1 + taxa)

# Uso das exceções personalizadas
conta = ContaFinanceira(saldo_inicial=1000, limite_credito=500)

try:
    conta.sacar(1200)  # Isso lançará SaldoInsuficienteError
except SaldoInsuficienteError as e:
    print(f"Operação negada: {e}")
    print(f"Saldo disponível: R$ {e.saldo_atual + conta.limite_credito:.2f}")
```

## Logging de Exceções

Manter registros de exceções é crucial para monitoramento e análise de problemas em sistemas empresariais:

```python
import logging
from datetime import datetime

# Configuração do logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

def processar_pedido(pedido):
    try:
        # Simulação de processamento
        if not pedido.get('cliente_id'):
            raise ValueError("ID do cliente não fornecido")
        
        if not pedido.get('itens'):
            raise ValueError("Nenhum item no pedido")
        
        # Processamento do pedido
        logging.info(f"Pedido {pedido['id']} processado com sucesso")
        return {"status": "sucesso", "pedido_id": pedido['id']}
    
    except ValueError as e:
        logging.error(f"Erro de validação no pedido {pedido.get('id', 'desconhecido')}: {e}")
        return {"status": "erro", "mensagem": str(e)}
    
    except Exception as e:
        logging.critical(f"Erro inesperado ao processar pedido {pedido.get('id', 'desconhecido')}: {e}")
        return {"status": "erro", "mensagem": "Erro interno do sistema"}
```

## Melhores Práticas para Empreendedores

### Tratamento Específico de Exceções

Evite capturar exceções genéricas quando possível. Trate exceções específicas para fornecer respostas apropriadas:

```python
# Ruim
try:
    resultado = operacao_complexa()
except Exception:
    print("Algo deu errado")

# Bom
try:
    resultado = operacao_complexa()
except ConnectionError:
    print("Não foi possível conectar ao serviço")
except ValueError:
    print("Dados inválidos fornecidos")
except FileNotFoundError:
    print("Arquivo necessário não encontrado")
```

### Não Silencie Exceções Importantes

Evite capturar exceções e não fazer nada com elas, a menos que seja intencional:

```python
# Ruim
try:
    atualizar_banco_de_dados()
except:
    pass  # Isso pode esconder problemas importantes

# Bom
try:
    atualizar_banco_de_dados()
except DatabaseError as e:
    logging.error(f"Falha na atualização do banco: {e}")
    # Implementar fallback ou notificar equipe de suporte
```

### Use Context Managers

Python oferece context managers que garantem a liberação adequada de recursos, mesmo em caso de exceções:

```python
# Usando with para garantir fechamento de arquivos
try:
    with open('dados.txt', 'r') as arquivo:
        dados = arquivo.read()
        # Processamento dos dados
except FileNotFoundError:
    print("Arquivo de dados não encontrado")
except PermissionError:
    print("Permissão negada para ler o arquivo")
```

## Conclusão

O tratamento de erros e exceções é uma prática fundamental para criar aplicações robustas e confiáveis no contexto do empreendedorismo digital. Ao implementar estratégias adequadas de tratamento de exceções, os empreendedores podem:

- Melhorar a experiência do usuário ao evitar falhas abruptas
- Manter a integridade dos dados empresariais
- Facilitar a depuração e manutenção de sistemas
- Garantir a continuidade das operações mesmo diante de problemas
- Fornecer feedback claro sobre problemas para equipes de suporte

Lembre-se de que um sistema bem preparado para lidar com exceções transmite profissionalismo e confiança aos clientes. Investir tempo no tratamento adequado de erros é um investimento na reputação e na sustentabilidade do seu negócio digital.