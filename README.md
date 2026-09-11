# 💼 RHUB — Suíte de Cálculos de Departamento Pessoal & CLT Open Source

[![Acessar Aplicação](https://img.shields.io/badge/Acessar_Online-kalicon.github.io%2FRHUB-2563eb?style=for-the-badge&logo=googlechrome&logoColor=white)](https://kalicon.github.io/RHUB/)

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)
![Vitest Tests](https://img.shields.io/badge/tests-14%20passed%20(100%25)-brightgreen.svg?logo=vitest)
![PWA Ready](https://img.shields.io/badge/PWA-Installable_|_Offline-6366f1.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-CDN-06B6D4.svg)
![Chart.js](https://img.shields.io/badge/Chart.js-4.4_Interactive-FF6384.svg)
![GSAP](https://img.shields.io/badge/GSAP-3.12-88CE02.svg)
![SheetJS](https://img.shields.io/badge/SheetJS-0.20_Excel-107C41.svg)
![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6_Modules-F7DF1E.svg)
![CLT](https://img.shields.io/badge/CLT-Atualizada_2024-green.svg)
![GitHub Pages](https://img.shields.io/badge/deploy-GitHub_Pages-brightgreen.svg)

> **Calculadora e Suíte de Gestão Trabalhista Moderna para a CLT Brasileira & Simulador CLT vs. PJ.**  
> 🌐 **App Online:** [https://kalicon.github.io/RHUB/](https://kalicon.github.io/RHUB/)  
> 100% client-side, instalável como PWA (offline), suporte a Dark Mode, gráficos visuais dinâmicos com Chart.js, animações GSAP CountUp, exportação em Excel (.xlsx), impressão em formato de documento executivo, compartilhamento por Deep Link, backup/restauração em JSON e suíte de testes unitários com Vitest.  
> Projetada para profissionais de Recursos Humanos, Departamento Pessoal, contadores, diretores financeiros, peritos e advogados trabalhistas.

---

## ✨ Recursos e Destaques

- 📱 **Progressive Web App (PWA)**: Funciona 100% offline via Service Worker, instalável no celular e computador.
- 🏢 **Identidade Corporativa Personalizada**: Modal de configuração de Empresa, CNPJ, Colaborador e Cargo, inseridos automaticamente nas impressões e planilhas Excel.
- 📊 **6 Módulos de Cálculo Especializados**:
  1. **Adicional Noturno & DSR**: Hora noturna ficta (52min30s / fator 1,142857), prorrogação e DSR (Súmula 172 TST).
  2. **Rescisão de Contrato CLT**: 4 modalidades de rescisão, aviso prévio proporcional (Lei 12.506), 13º, férias, FGTS (8% + 40%/20%) e INSS/IRRF.
  3. **Faltas e Atrasos**: Desconto em dias (`Salário ÷ 30`), horas de atraso, perda do DSR semanal e tabela progressiva de perda de férias (Art. 130 CLT).
  4. **Férias & 13º Salário**: Período aquisitivo, 1/3 constitucional, abono pecuniário (venda de 10 dias), dobra (férias vencidas) e avos de 13º.
  5. **Salário Líquido (Holerite Mensal)**: Vencimentos (Salário base, Horas Extras 50%/100%, adicional noturno, DSR, insalubridade 10%/20%/40%, periculosidade 30%) e descontos reais (INSS progressivo, IRRF progressivo c/ dependentes, Vale Transporte teto 6%, VR/VA, saúde, pensão).
  6. **Simulador CLT vs. PJ & Custo Efetivo do Empregado**:
     - Custo real para a empresa: Simples Nacional vs. Lucro Presumido/Real, encargos patronais (INSS 20%, RAT ajustado pelo FAP, Sistema S/Terceiros), provisões de 13º, férias e FGTS.
     - Poder de compra real do colaborador (Salário líquido + Provisões mensais + Benefícios).
     - Regime PJ: Simples Nacional (Anexo III 6% ou Anexo V 15,5%), Fator R c/ pró-labore, custos com contabilidade e benefícios próprios.
     - **Break-Even automático**: cálculo exato do faturamento PJ necessário para empatar com o poder de compra CLT.
- 📈 **Gráficos Visuais Interativos com Chart.js**:
  - Donut Chart no Holerite (Salário Líquido vs. INSS vs. IRRF vs. Benefícios).
  - Gráfico de Barras no Comparador de Rescisão (Líquido do Empregado vs. Custo da Empresa em 4 modalidades).
  - Gráfico Comparativo CLT vs. PJ (Custo Empresa CLT vs. Poder Compra CLT vs. Líquido PJ vs. Break-Even).
- 🔗 **Compartilhamento por Link (Deep Linking)**: Gera links com parâmetros codificados na URL hash para envio direto a colaboradores, gestores ou clientes.
- 💾 **Backup & Restauração JSON**: Exportação e importação completa de dados corporativos e histórico de simulações em arquivo `.json`.
- 📖 **Guia & Glossário da CLT**: Modal com consulta rápida e busca instantânea dos principais artigos da CLT e súmulas do TST.
- 🧪 **Suíte de Testes Automatizados (Vitest)**: 14 testes unitários com 100% de aprovação cobrindo rigorosamente as leis trabalhistas.
- 📥 **Exportação Completa para Excel (.xlsx)**: Gera planilhas profissionais estruturadas com cabeçalho corporativo, dados da simulação e detalhamento dos cálculos.
- 🖨️ **Impressão / PDF Executivo**: Folha de estilo `@media print` que remove a interface web e gera relatórios limpos com cabeçalho da empresa e assinatura.
- 🕒 **Histórico de Simulações**: Drawer lateral com as últimas 15 simulações salvas no `localStorage`, restauráveis com 1 clique.

---

## 🎨 Stack Tecnológica

| Camada            | Tecnologia                             | Descrição                                         |
| ----------------- | -------------------------------------- | ------------------------------------------------- |
| **Estrutura**     | HTML5 Semântico                        | Acessibilidade WAI-ARIA e SEO estruturado         |
| **Estilização**   | Tailwind CSS (via CDN Play)            | Design utility-first com Dark Mode por classe     |
| **Lógica**        | JavaScript Vanilla (ES6 Modules)       | Módulos puros, testáveis, zero backend            |
| **Gráficos**      | Chart.js 4.4 (via CDN)                 | Visualização interativa de gráficos e dashboards  |
| **Animações**     | GSAP 3.12 (via CDN)                    | Efeito CountUp nos valores monetários             |
| **Planilhas**     | SheetJS / xlsx 0.20 (via CDN)          | Criação de arquivos `.xlsx` no navegador          |
| **Testes**        | Vitest 2.1                             | Testes unitários com asserções legais trabalhistas|
| **Offline / PWA** | Service Worker & Web App Manifest      | Cache-first para navegação offline completa       |
| **Deploy**        | GitHub Pages                           | Hospedagem estática contínua e gratuita           |

---

## 📁 Estrutura do Repositório

```text
RHUB/
├── assets/
│   ├── css/
│   │   ├── custom.css          ← Estilos do drawer, gráficos, orbes e temas
│   │   └── print.css           ← Folha de estilo de impressão executiva e PDF
│   ├── js/
│   │   ├── app.js              ← Controller SPA, roteador hash, Chart.js e GSAP
│   │   ├── modules/
│   │   │   ├── noturno.js      ← Adicional Noturno, hora ficta e DSR
│   │   │   ├── rescisao.js     ← Rescisão CLT e Comparador de 4 Cenários
│   │   │   ├── faltas.js       ← Faltas, atrasos, DSR e escala Art. 130
│   │   │   ├── ferias.js       ← Férias, 1/3, abono, dobra e 13º salário
│   │   │   ├── liquido.js      ← Salário Líquido completo (holerite mensal)
│   │   │   ├── clt_pj.js       ← Simulador CLT vs PJ e encargos patronais
│   │   │   └── tabelas.js      ← Tabelas progressivas de INSS e IRRF 2024
│   │   └── utils/
│   │       ├── exporter.js     ← Gerador de Excel (.xlsx) para todos os módulos
│   │       ├── storage.js      ← LocalStorage, Backup e Restauração JSON
│   │       ├── formatters.js   ← Formatação BRL (R$), decimais e datas
│   │       └── validators.js   ← Sanitização e validação de entradas
│   └── img/
│       ├── logo.svg            ← Logo vetorial do RHUB
│       ├── icon-192.svg        ← Ícone PWA 192x192
│       └── icon-512.svg        ← Ícone PWA 512x512
├── tests/
│   └── clt_modules.test.js     ← Suíte de testes unitários com Vitest
├── manifest.json               ← Manifesto PWA (instalável)
├── sw.js                       ← Service Worker com cache-first e offline
├── index.html                  ← Aplicação Single-Page completa
├── package.json                ← Configuração de testes Vitest
├── LICENSE                     ← Licença MIT
└── README.md                   ← Documentação técnica completa
```

---

## ⚖️ Fundamentação Legal dos Módulos

| Módulo | Regras Principais | Base Legal |
|--------|-------------------|------------|
| **Adicional Noturno** | Horário 22h às 05h, hora ficta reduzida (52min30s / fator 1,142857), adicional mín. 20%, DSR s/ noturno | Art. 73 da CLT, Lei 605/49, Súmulas 60 e 172 do TST |
| **Rescisão Contratual** | Sem justa causa, pedido de demissão, justa causa, acordo mútuo (Art. 484-A), aviso prévio proporcional (Lei 12.506/11), saque e multa FGTS | Art. 477, 482 e 484-A da CLT, Lei 12.506/2011, Lei 8.036/90 |
| **Faltas e Atrasos** | Desconto em dias (`Salário ÷ 30`), horas de atraso, perda do DSR semanal, escala progressiva de perda de férias | Art. 130 e 462 da CLT, Lei 605/49, Súmula 366 do TST |
| **Férias & 13º Salário** | Férias proporcionais e vencidas, 1/3 constitucional, abono pecuniário (venda de 10 dias), dobra por atraso e avos de 13º | Art. 129 a 145 da CLT, Art. 7º, XVII da CF/88, Lei 4.090/62 |
| **Salário Líquido (Holerite)** | Composição de proventos (HE 50%/100%, insalubridade, periculosidade, DSR), desconto de VT teto 6%, previdência e IRRF | Portaria Interministerial MPS/MF nº 2/2024, MP 1.206/2024, Lei 7.418/85 |
| **CLT vs. PJ & Custos** | Encargos patronais (INSS 20%, RAT x FAP, Terceiros 5.8%), provisões e FGTS; Simples Nacional PJ (Anexos III e V, Fator R 28%) e Break-Even | Lei 8.212/91, LC 123/2006, Art. 7º da CF/88 |
| **Tabelas Previdenciárias e Fiscais** | INSS por faixas progressivas (7,5%, 9%, 12%, 14%), dedução por dependente (R$ 189,59) e faixas do IRRF 2024 | Tabela Oficial da Receita Federal e Ministério da Previdência Social |

---

## 🧪 Executando os Testes Automatizados

A suíte de testes com Vitest valida todas as fórmulas matemáticas e regras da legislação CLT:

```bash
# Executar todos os testes unitários uma vez:
npm test

# Executar em modo watch (desenvolvimento contínuo):
npm run test:watch
```

---

## 🚀 Como Executar Localmente

Como o projeto utiliza **ES6 Modules nativos**, basta servi-lo via HTTP local:

```bash
# Opção 1: Python 3
python -m http.server 8086

# Opção 2: Node.js
npx serve .
```

Acesse no seu navegador: **http://localhost:8086**

---

## 📱 Instalação como App (PWA)

- **No Google Chrome / Edge (Desktop)**: Clique no ícone de instalação na barra de endereços ou no botão **Instalar App** no menu lateral.
- **No Android (Chrome)**: Toque nos três pontos do navegador e selecione **"Adicionar à tela inicial"** ou **"Instalar aplicativo"**.
- **No iOS (Safari)**: Toque no botão de compartilhamento e selecione **"Adicionar à Tela de Início"**.

O app funcionará normalmente mesmo sem conexão com a internet!

---

## 📄 Licença

Distribuído sob a licença **MIT**. Livre para uso pessoal, corporativo e modificações.
