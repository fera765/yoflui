# Capítulo 7: Visualização de Dados com Matplotlib e Seaborn para Empreendedores

## Introdução

A visualização de dados é uma habilidade essencial para empreendedores modernos. Com a quantidade massiva de dados disponíveis hoje, a capacidade de transformar números em insights visuais claros pode fazer a diferença entre uma decisão acertada e um erro estratégico. Neste capítulo, exploraremos como usar as bibliotecas Matplotlib e Seaborn para criar visualizações impactantes que ajudem na tomada de decisões de negócios.

## Fundamentos da Visualização de Dados

Antes de mergulharmos nas bibliotecas específicas, é importante entender por que a visualização de dados é crucial para empreendedores:

1. **Compreensão Rápida**: Gráficos e visualizações permitem identificar padrões, tendências e anomalias em segundos, algo que levaria minutos ou horas com dados em formato tabular.

2. **Comunicação Eficaz**: Apresentar dados visualmente facilita a comunicação com stakeholders, investidores e equipe, tornando as informações mais acessíveis e compreensíveis.

3. **Tomada de Decisão Baseada em Dados**: Visualizações bem elaboradas ajudam a identificar oportunidades de mercado, problemas operacionais e áreas de melhoria.

## Matplotlib: A Base da Visualização em Python

Matplotlib é a biblioteca mais fundamental para visualização de dados em Python. Apesar de ter uma curva de aprendizado mais íngreme, oferece um controle detalhado sobre cada aspecto dos gráficos.

### Instalação e Importação

```python
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
```

### Tipos de Gráficos Básicos

#### Gráfico de Linhas

Ideal para mostrar tendências ao longo do tempo:

```python
# Exemplo: Receita mensal de uma startup
meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
receita = [15000, 18000, 22000, 25000, 30000, 35000]

plt.figure(figsize=(10, 6))
plt.plot(meses, receita, marker='o', linewidth=2, color='#2E86AB')
plt.title('Evolução da Receita Mensal', fontsize=16, fontweight='bold')
plt.xlabel('Mês', fontsize=12)
plt.ylabel('Receita (R$)', fontsize=12)
plt.grid(True, alpha=0.3)
plt.show()
```

#### Gráfico de Barras

Perfeito para comparar categorias:

```python
# Exemplo: Vendas por canal de marketing
canais = ['Redes Sociais', 'Email Marketing', 'Google Ads', 'Parcerias']
vendas = [45000, 32000, 58000, 28000]

plt.figure(figsize=(10, 6))
plt.bar(canais, vendas, color=['#A23B72', '#F18F01', '#C73E1D', '#2E86AB'])
plt.title('Vendas por Canal de Marketing', fontsize=16, fontweight='bold')
plt.xlabel('Canal de Marketing', fontsize=12)
plt.ylabel('Vendas (R$)', fontsize=12)
plt.xticks(rotation=45)
plt.show()
```

#### Gráfico de Pizza

Útil para mostrar proporções:

```python
# Exemplo: Distribuição de clientes por segmento
segmentos = ['Pequenas Empresas', 'Médias Empresas', 'Grandes Empresas', 'Startups']
porcentagens = [35, 25, 20, 20]
cores = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']

plt.figure(figsize=(8, 8))
plt.pie(porcentagens, labels=segmentos, autopct='%1.1f%%', colors=cores, startangle=90)
plt.title('Distribuição de Clientes por Segmento', fontsize=16, fontweight='bold')
plt.show()
```

## Seaborn: Visualizações Estatísticas Avançadas

Seaborn é construído sobre o Matplotlib e oferece uma interface mais intuitiva para criar visualizações estatísticas sofisticadas. É especialmente útil para análise exploratória de dados.

### Instalação e Importação

```python
import seaborn as sns
import matplotlib.pyplot as plt
```

### Gráficos Estatísticos Importantes

#### Gráfico de Dispersão (Scatter Plot)

Ideal para identificar correlações entre variáveis:

```python
# Exemplo: Relação entre investimento em marketing e vendas
np.random.seed(42)
investimento = np.random.uniform(1000, 10000, 100)
vendas = investimento * 1.2 + np.random.normal(0, 1000, 100)

plt.figure(figsize=(10, 6))
sns.scatterplot(x=investimento, y=vendas, alpha=0.7)
plt.title('Relação entre Investimento em Marketing e Vendas', fontsize=16, fontweight='bold')
plt.xlabel('Investimento em Marketing (R$)', fontsize=12)
plt.ylabel('Vendas (R$)', fontsize=12)
plt.show()
```

#### Gráfico de Distribuição (Histograma e KDE)

Para entender a distribuição de uma variável:

```python
# Exemplo: Distribuição do ticket médio dos clientes
ticket_medio = np.random.lognormal(4, 0.5, 1000)

plt.figure(figsize=(10, 6))
sns.histplot(ticket_medio, kde=True, bins=30)
plt.title('Distribuição do Ticket Médio dos Clientes', fontsize=16, fontweight='bold')
plt.xlabel('Ticket Médio (R$)', fontsize=12)
plt.ylabel('Frequência', fontsize=12)
plt.show()
```

#### Heatmap de Correlação

Para identificar relações entre múltiplas variáveis:

```python
# Exemplo: Correlação entre métricas de negócio
dados = pd.DataFrame({
    'vendas': np.random.normal(10000, 2000, 100),
    'marketing': np.random.normal(3000, 500, 100),
    'satisfacao': np.random.normal(7, 1.5, 100),
    'retencao': np.random.normal(0.6, 0.1, 100)
})

plt.figure(figsize=(8, 6))
sns.heatmap(dados.corr(), annot=True, cmap='coolwarm', center=0)
plt.title('Mapa de Correlação entre Métricas de Negócio', fontsize=16, fontweight='bold')
plt.show()
```

## Aplicações Práticas para Empreendedores

### Análise de Performance de Marketing

Visualizações podem revelar quais canais de marketing estão gerando melhores resultados:

```python
# Dados de performance de marketing
dados_marketing = pd.DataFrame({
    'canal': ['Redes Sociais', 'Email', 'Google Ads', 'SEO', 'Parcerias'],
    'investimento': [5000, 3000, 8000, 2000, 4000],
    'retorno': [15000, 12000, 25000, 8000, 10000],
    'roas': [3.0, 4.0, 3.1, 4.0, 2.5]
})

fig, axes = plt.subplots(1, 2, figsize=(15, 6))

# Gráfico de barras para investimento vs retorno
axes[0].bar(dados_marketing['canal'], dados_marketing['investimento'], label='Investimento', alpha=0.7)
axes[0].bar(dados_marketing['canal'], dados_marketing['retorno'], label='Retorno', alpha=0.7)
axes[0].set_title('Investimento vs Retorno por Canal', fontsize=14, fontweight='bold')
axes[0].legend()
axes[0].tick_params(axis='x', rotation=45)

# Gráfico de ROAS
axes[1].bar(dados_marketing['canal'], dados_marketing['roas'], color='green', alpha=0.7)
axes[1].set_title('ROAS por Canal de Marketing', fontsize=14, fontweight='bold')
axes[1].tick_params(axis='x', rotation=45)

plt.tight_layout()
plt.show()
```

### Análise de Satisfação do Cliente

Visualizações ajudam a entender padrões de satisfação:

```python
# Exemplo: NPS (Net Promoter Score) por segmento
nps_data = pd.DataFrame({
    'segmento': ['Pequenas', 'Médias', 'Grandes', 'Startups'],
    'promotores': [45, 38, 52, 41],
    'passivos': [30, 35, 28, 32],
    'detratores': [25, 27, 20, 27]
})

nps_data['nps'] = nps_data['promotores'] - nps_data['detratores']

plt.figure(figsize=(12, 6))
x = np.arange(len(nps_data['segmento']))
width = 0.35

plt.bar(x - width/2, nps_data['promotores'], width, label='Promotores', color='green', alpha=0.7)
plt.bar(x + width/2, nps_data['detratores'], width, label='Detratores', color='red', alpha=0.7)

plt.xlabel('Segmento de Cliente')
plt.ylabel('Percentual')
plt.title('Distribuição NPS por Segmento de Cliente', fontsize=16, fontweight='bold')
plt.xticks(x, nps_data['segmento'])
plt.legend()

# Adiciona linha para NPS
plt.twinx().plot(x, nps_data['nps'], color='blue', marker='o', linewidth=2, label='NPS')
plt.ylabel('NPS', color='blue')
plt.show()
```

## Melhores Práticas para Visualizações Comerciais

### 1. Simplicidade e Clareza

Evite gráficos excessivamente complexos. O objetivo é comunicar insights de forma clara e direta.

### 2. Cores Estratégicas

Use cores que reflitam sua marca e que sejam acessíveis. Evite excesso de cores que possam distrair.

### 3. Contexto Adequado

Sempre inclua títulos descritivos, rótulos claros e legendas quando necessário.

### 4. Foco no Negócio

Cada visualização deve ter um propósito comercial claro. Pergunte-se: "Esta visualização ajuda a tomar uma decisão de negócio?"

## Conclusão

A visualização de dados é uma habilidade poderosa que pode transformar a forma como você entende e gerencia seu negócio. Com Matplotlib e Seaborn, você tem ferramentas robustas para transformar dados brutos em insights acionáveis. Lembre-se de que a melhor visualização é aquela que comunica claramente uma mensagem e ajuda na tomada de decisões estratégicas.

No próximo capítulo, exploraremos como automatizar a geração de relatórios e visualizações, economizando tempo e garantindo consistência em suas análises de negócios.