# RHUB — Suíte de Cálculos Trabalhistas e Simulação CLT vs. PJ

Aplicação web desenvolvida no contexto de um desafio acadêmico de engenharia de software para automatizar cálculos de Departamento Pessoal e regras da legislação trabalhista brasileira (CLT). A solução opera integralmente no navegador do usuário (client-side), com suporte offline via Progressive Web App (PWA), validação matemática por testes unitários automatizados e exportação estruturada para planilhas Excel.

---

## Demonstração

- **Aplicação Online:** [kalicon.github.io/RHUB](https://kalicon.github.io/RHUB/)
- **Visualização da Interface:**

```text
[Demonstração visual da interface do RHUB, cálculo de holerite e simulador CLT vs. PJ]
```

---

## Módulos e Regras Implementadas

1. **Salário Líquido (Holerite Mensal):** Aplicação das faixas progressivas vigentes de INSS e IRRF, dedução por dependentes, cálculo de horas extras (50% e 100%), adicional noturno com DSR, insalubridade, periculosidade e descontos legais (VT, VR, pensão).
2. **Rescisão de Contrato CLT:** Comparativo simultâneo de quatro modalidades rescisórias (dispensa sem justa causa, pedido de demissão, demissão por acordo mútuo e justa causa), com cálculo de aviso prévio proporcional (Lei 12.506), férias proporcionais e vencidas com 1/3, 13º proporcional e multas rescisórias do FGTS.
3. **Simulador CLT vs. PJ:** Análise de custo efetivo do empregado para a empresa (Simples Nacional vs. Lucro Presumido/Real, encargos patronais, provisões de 13º e férias), determinação do poder de compra real e cálculo do ponto de equilíbrio (*break-even*) de faturamento PJ.
4. **Férias e 13º Salário:** Períodos aquisitivos e concessivos, terço constitucional, abono pecuniário (venda de 10 dias), dobra de férias vencidas e projeção de primeira e segunda parcelas de décimo terceiro.
5. **Adicional Noturno e DSR:** Conversão de hora ficta noturna (fator 52min30s / 1,142857), prorrogação de jornada noturna e reflexos no Descanso Semanal Remunerado (Súmula 172 do TST).
6. **Faltas e Atrasos:** Desconto de dias proporcionais, horas não trabalhadas, perda do DSR da semana e aplicação da tabela progressiva de perda do direito de férias (Artigo 130 da CLT).

---

## Tecnologias Utilizadas

- **Linguagem:** JavaScript Vanilla (ES6 Modules)
- **Interface e Estilos:** Tailwind CSS
- **Testes Unitários:** Vitest
- **Visualização de Dados:** Chart.js
- **Geração de Documentos:** SheetJS (exportação de arquivos .xlsx)
- **Animações Numéricas:** GSAP (CountUp em transições de valores)
- **Suporte Offline:** Service Worker e Web App Manifest (PWA)
- **Hospedagem:** GitHub Pages

---

## Decisões de Arquitetura

### 1. Execução 100% Client-Side e Privacidade de Dados
Por lidar com simulações financeiras e dados salariais, a arquitetura foi desenhada para processamento exclusivo no navegador do cliente. Nenhuma informação de salário, documento ou empresa transita por servidores externos ou é persistida em nuvem, garantindo conformidade com privacidade de dados desde a concepção (*privacy by design*).

### 2. Módulos ES6 Puros sem Overhead de Bundling
Para a aplicação final, optou-se por utilizar o sistema nativo de módulos do ECMAScript (ES6 Modules). Essa decisão elimina dependências de empacotadores pesados em tempo de execução, permitindo carregamento rápido de assets e manutenção direta de cada módulo de cálculo isolado.

### 3. Validação Rigorosa via Testes Automatizados (Vitest)
Cálculos trabalhistas e fiscais exigem precisão absoluta em arredondamentos e ordem de operações. Foi desenvolvida uma suíte de testes unitários com Vitest que cobre cenários reais e extremos das tabelas progressivas e artigos da legislação, assegurando integridade a cada alteração de código.

### 4. Resiliência Offline (Progressive Web App)
A aplicação conta com Service Worker configurado em estratégia *Cache-First* para ativos estáticos. Isso permite que profissionais e estudantes utilizem todos os módulos de cálculo mesmo em ambientes sem conectividade com a internet, com comportamento idêntico a um aplicativo nativo.

### 5. Relatórios Técnicos e Exportação
Além da visualização em tela com gráficos analíticos, o sistema implementa folha de estilo dedicada para impressão técnica (`@media print`), removendo menus e adaptando o conteúdo para impressão ou geração de PDF limpo com espaço para assinaturas, além de download dos dados consolidados em planilha Excel via SheetJS.

---

## Como Executar Localmente

### Pré-requisitos
- Node.js (versão 18 ou superior) instalado para execução dos testes.

### Passo a Passo

1. Clone o repositório:
```bash
git clone https://github.com/Kalicon/RHUB.git
cd RHUB
```

2. Instale as dependências de teste:
```bash
npm install
```

3. Execute a suíte de testes unitários:
```bash
npm test
```

4. Para rodar a aplicação web localmente:
Você pode abrir o arquivo `index.html` diretamente em um navegador moderno ou iniciar um servidor estático simples:
```bash
npx serve .
```
Acesse a aplicação no navegador em `http://localhost:3000`.

---

## Licença

Este projeto está sob a licença MIT.
