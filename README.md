# RHUB — Suíte de Cálculos de Departamento Pessoal & CLT Open Source

[![Acessar Aplicação](https://img.shields.io/badge/Acessar_Online-kalicon.github.io%2FRHUB-2563eb?style=for-the-badge&logo=googlechrome&logoColor=white)](https://kalicon.github.io/RHUB/)

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)
![Vitest Tests](https://img.shields.io/badge/tests-21%20passed%20(100%25)-brightgreen.svg?logo=vitest)
![PWA Ready](https://img.shields.io/badge/PWA-Installable_|_Offline-6366f1.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-CDN-06B6D4.svg)
![Chart.js](https://img.shields.io/badge/Chart.js-4.4_Interactive-FF6384.svg)
![GSAP](https://img.shields.io/badge/GSAP-3.12-88CE02.svg)
![SheetJS](https://img.shields.io/badge/SheetJS-0.20_Excel-107C41.svg)
![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6_Modules-F7DF1E.svg)
![CLT](https://img.shields.io/badge/CLT-Atualizada_2024-green.svg)
![GitHub Pages](https://img.shields.io/badge/deploy-GitHub_Pages-brightgreen.svg)

> **Calculadora e Suíte de Gestão Trabalhista Moderna para a CLT Brasileira & Simulador CLT vs. PJ.**  
> **App Online:** [https://kalicon.github.io/RHUB/](https://kalicon.github.io/RHUB/)  
> 100% client-side, instalável como PWA (offline), suporte a Dark Mode, gráficos visuais dinâmicos com Chart.js, animações GSAP CountUp, exportação em Excel (.xlsx), impressão em formato de documento executivo, compartilhamento por Deep Link, backup/restauração em JSON, central de desafios comunitários e suíte de testes unitários com Vitest.  
> Projetada para profissionais de Recursos Humanos, Departamento Pessoal, contadores, diretores financeiros, peritos e advogados trabalhistas.

---

## Recursos e Destaques

- **Progressive Web App (PWA)**: Funciona 100% offline via Service Worker, instalável no celular e computador.
- **Identidade Corporativa Personalizada**: Modal de configuração de Empresa, CNPJ, Colaborador e Cargo, inseridos automaticamente nas impressões e planilhas Excel.
- **Central de Desafios de Criação & Sugestões**: Espaço integrado para a comunidade e usuários proporem regras complexas de DP e abrirem Issues oficiais no GitHub diretamente do app.
- **11 Módulos de Cálculo e People Analytics**:
  1. **Adicional Noturno & DSR**: Hora noturna ficta (52min30s / fator 1,142857), prorrogação e DSR (Súmula 172 TST).
  2. **Rescisão de Contrato CLT**: 4 modalidades de rescisão, aviso prévio proporcional (Lei 12.506), 13º, férias, FGTS (8% + 40%/20%), saque, seguro-desemprego e emissão direta de **TRCT Oficial em PDF**.
  3. **Faltas e Atrasos**: Desconto em dias (`Salário ÷ 30`), horas de atraso, perda do DSR semanal e tabela progressiva de perda de férias (Art. 130 CLT).
  4. **Férias & 13º Salário + Planejador Art. 134**: Período aquisitivo, 1/3 constitucional, abono pecuniário (venda de 10 dias), dobra, avos de 13º e **validador de fracionamento em até 3 períodos com calendário e regra anti-DSR**.
  5. **Salário Líquido (Holerite Mensal)**: Vencimentos e descontos reais com emissão instantânea de **Holerite / Contracheque Oficial em PDF**.
  6. **Simulador CLT vs. PJ & Custo Efetivo do Empregado**: Custo real para a empresa, Simples Nacional vs. Lucro Presumido/Real, encargos patronais e Break-Even automático.
  7. **Banco de Horas & Compensação de Jornada (Art. 59 CLT)**: Quitação de saldo credor (50% a 100%), reflexo em DSR e desconto de horas devedoras.
  8. **Participação nos Lucros e Resultados — PLR (Lei 10.101/2000)**: Tabela exclusiva de IRRF PLR da Receita Federal e isenção de encargos trabalhistas.
  9. **Teletrabalho / Home Office & Ajuda de Custo (Art. 75-A CLT)**: Rateio de internet, consumo elétrico (kWh), auxílio ergonomia e comparativo com VT.
  10. **Equiparação Salarial & Passivo Trabalhista (Art. 461 CLT)**: Diferença salarial mensal, reflexos quinquenais e penalidade por discriminação (Lei 14.611/2023).
  11. **Folha de Pagamento em Lote & Encargos Patronais (Batch Payroll)**: Upload CSV/XLSX ou demonstração, cálculo em massa de colaboradores, INSS Patronal (20%), RAT/FAP, Terceiros/Sistema S (5.8%), FGTS e dashboard consolidado com geração individual de holerites.
- **Emissão Direta de Holerite e TRCT em PDF**: Layout vetorial padronizado no padrão do Ministério do Trabalho, gerado 100% no navegador (Client-Side) com botão de download imediato.
- **Inteligência de Rubricas eSocial (Tabela S-1010)**: Dicionário oficial integrado, badges explicativos de incidência de INSS, FGTS e IRRF e modo auditoria contábil.
- **Simulador de Convenções Coletivas (CCT / ACT)**: Configuração de regras sindicais que se sobrepõem à CLT (Art. 611-A), com adicional noturno customizado, sábado considerado como repouso no DSR e Adicional por Tempo de Serviço (Anuênio, Triênio, Quinquênio).
- **Gráficos Visuais Interativos com Chart.js**: Visualização analítica no Holerite, Rescisão e Comparativo CLT vs PJ.
- **Compartilhamento por Link (Deep Linking)**: Gera links com parâmetros codificados na URL hash para envio direto.
- **Backup & Restauração JSON**: Exportação e importação completa de dados corporativos e histórico em `.json`.
- **Guia & Glossário da CLT**: Modal com consulta rápida e busca instantânea dos principais artigos da CLT e súmulas do TST.
- **Suíte de Testes Automatizados (Vitest)**: **32 testes unitários** com 100% de aprovação cobrindo rigorosamente todas as leis trabalhistas.
- **Exportação Completa para Excel (.xlsx)**: Gera planilhas profissionais estruturadas para todos os módulos e folha consolidada.
- **Histórico de Simulações**: Drawer lateral com as últimas 15 simulações salvas no `localStorage`.

---

## Stack Tecnológica

| Camada            | Tecnologia                             | Descrição                                         |
| ----------------- | -------------------------------------- | ------------------------------------------------- |
| **Estrutura**     | HTML5 Semântico                        | Acessibilidade WAI-ARIA e SEO estruturado         |
| **Estilização**   | Tailwind CSS (via CDN Play)            | Design utility-first com Dark Mode por classe     |
| **Lógica**        | JavaScript Vanilla (ES6 Modules)       | Módulos puros, testáveis, zero backend            |
| **PDF Vetorial**  | html2pdf.js / jsPDF (via CDN)          | Geração de Holerites e TRCT no navegador          |
| **Gráficos**      | Chart.js 4.4 (via CDN)                 | Visualização interativa de gráficos e dashboards  |
| **Animações**     | GSAP 3.12 (via CDN)                    | Efeito CountUp nos valores monetários             |
| **Planilhas**     | SheetJS / xlsx 0.20 (via CDN)          | Criação e leitura de arquivos `.xlsx`/`.csv`      |
| **Testes**        | Vitest 2.1                             | 32 testes unitários com asserções legais          |
| **Offline / PWA** | Service Worker & Web App Manifest      | Cache-first para navegação offline completa       |
| **Deploy**        | GitHub Pages                           | Hospedagem estática contínua e gratuita           |

---

## Estrutura do Repositório

```text
RHUB/
├── assets/
│   ├── css/
│   │   └── custom.css          <- Estilos do drawer, gráficos, orbes, temas e impressão
│   ├── data/
│   │   ├── cct_config.js       <- Gestor de regras sindicais CCT/ACT e ATS
│   │   └── esocial_rubricas.js <- Tabela de rubricas S-1010 e incidências
│   ├── js/
│   │   ├── app.js              <- Controller SPA, roteador hash, Chart.js e GSAP
│   │   ├── modules/
│   │   │   ├── noturno.js      <- Adicional Noturno, hora ficta e DSR
│   │   │   ├── rescisao.js     <- Rescisão CLT e Comparador de 4 Cenários
│   │   │   ├── faltas.js       <- Faltas, atrasos, DSR e escala Art. 130
│   │   │   ├── ferias.js       <- Férias, 13º e fracionamento Art. 134
│   │   │   ├── liquido.js      <- Salário Líquido completo (holerite mensal)
│   │   │   ├── clt_pj.js       <- Simulador CLT vs PJ e encargos patronais
│   │   │   ├── banco_horas.js  <- Banco de horas e quitação semestral/anual
│   │   │   ├── plr.js          <- Participação nos Lucros e Resultados
│   │   │   ├── teletrabalho.js <- Ajuda de custo home office e amortização
│   │   │   ├── equiparacao.js  <- Equiparação salarial e Lei 14.611
│   │   │   └── folha_lote.js   <- Folha de pagamento em lote e encargos patronais
│   │   └── utils/
│   │       ├── pdf_generator.js<- Gerador direto de Holerite e TRCT em PDF
│   │       ├── exporter.js     <- Exportação de planilhas XLSX e CSV
│   │       ├── formatters.js   <- Formatadores monetários, datas e horas
│   │       ├── validators.js   <- Sanitização e validação de entradas
│   │       └── storage.js      <- Gestão de dados corporativos e histórico
│   └── img/
│       ├── logo.svg            <- Logo vetorial do RHUB
│       ├── icon-192.svg        <- Ícone PWA 192x192
│       └── icon-512.svg        <- Ícone PWA 512x512
├── tests/
│   └── clt_modules.test.js     <- Suíte de 32 testes unitários com Vitest
├── manifest.json               <- Manifesto PWA (instalável)
├── sw.js                       <- Service Worker com cache-first e offline v3.0
├── index.html                  <- Aplicação Single-Page completa (11 módulos)
├── package.json                <- Configuração de testes Vitest
├── LICENSE                     <- Licença MIT
├── MANUAL_DE_USO.md            <- Manual operacional para usuários e RH
└── README.md                   <- Documentação técnica completa
```

---

## Fundamentação Legal dos Módulos

| Módulo | Regras Principais | Base Legal |
|--------|-------------------|------------|
| **Adicional Noturno** | Horário 22h às 05h, hora ficta reduzida (52min30s / fator 1,142857), adicional mín. 20%, DSR s/ noturno | Art. 73 da CLT, Lei 605/49, Súmulas 60 e 172 do TST |
| **Rescisão Contratual** | Sem justa causa, pedido de demissão, justa causa, acordo mútuo (Art. 484-A), aviso prévio proporcional (Lei 12.506/11), saque e multa FGTS | Art. 477, 482 e 484-A da CLT, Lei 12.506/2011, Lei 8.036/90 |
| **Faltas e Atrasos** | Desconto em dias (`Salário ÷ 30`), horas de atraso, perda do DSR semanal, escala progressiva de perda de férias | Art. 130 e 462 da CLT, Lei 605/49, Súmula 366 do TST |
| **Férias & 13º Salário** | Férias proporcionais e vencidas, 1/3 constitucional, abono pecuniário (venda de 10 dias), dobra por atraso e avos de 13º | Art. 129 a 145 da CLT, Art. 7º, XVII da CF/88, Lei 4.090/62 |
| **Salário Líquido (Holerite)** | Composição de proventos (HE 50%/100%, insalubridade, periculosidade, DSR), desconto de VT teto 6%, previdência e IRRF | Portaria Interministerial MPS/MF nº 2/2024, MP 1.206/2024, Lei 7.418/85 |
| **CLT vs. PJ & Custos** | Encargos patronais (INSS 20%, RAT x FAP, Terceiros 5.8%), provisões e FGTS; Simples Nacional PJ (Anexos III e V, Fator R 28%) e Break-Even | Lei 8.212/91, LC 123/2006, Art. 7º da CF/88 |
| **Banco de Horas** | Compensação semestral (acordo individual) ou anual (CCT), quitação de saldo com adicional mínimo de 50% e DSR | Art. 59, §§ 2º e 5º da CLT, Súmula 172 do TST |
| **Participação nos Lucros (PLR)** | Tributação exclusiva na fonte por tabela progressiva anual, isenção total de INSS e FGTS | Lei 10.101/2000, Lei 12.832/2013, Art. 7º, XI da CF/88 |
| **Teletrabalho & Home Office** | Ajuda de custo para energia/internet, ergonomia, isenção de reflexos salariais e comparativo com Vale-Transporte | Art. 75-A a 75-E da CLT, Lei 14.442/2022 |
| **Equiparação Salarial** | Diferença salarial para mesma função/empregador/localidade, reflexos em 13º, férias, FGTS e multa da Lei 14.611/2023 | Art. 461 da CLT, Súmula 6 do TST, Lei 14.611/2023 |
| **Tabelas Previdenciárias e Fiscais** | INSS por faixas progressivas (7,5%, 9%, 12%, 14%), dedução por dependente (R$ 189,59) e faixas do IRRF 2024 | Tabela Oficial da Receita Federal e Ministério da Previdência Social |

---

## Executando os Testes Automatizados

A suíte de testes com Vitest valida todas as fórmulas matemáticas e regras da legislação CLT:

```bash
# Executar todos os testes unitários uma vez:
npm test

# Executar em modo watch (desenvolvimento contínuo):
npm run test:watch
```

---

## Como Executar Localmente

Como o projeto utiliza **ES6 Modules nativos**, basta servi-lo via HTTP local:

```bash
# Opção 1: Python 3
python -m http.server 8086

# Opção 2: Node.js
npx serve .
```

Acesse no seu navegador: **http://localhost:8086**

---

## Instalação como App (PWA)

- **No Google Chrome / Edge (Desktop)**: Clique no ícone de instalação na barra de endereços ou no botão **Instalar App** no menu lateral.
- **No Android (Chrome)**: Toque nos três pontos do navegador e selecione **"Adicionar à tela inicial"** ou **"Instalar aplicativo"**.
- **No iOS (Safari)**: Toque no botão de compartilhamento e selecione **"Adicionar à Tela de Início"**.

O app funcionará normalmente mesmo sem conexão com a internet.

---

## Licença

Distribuído sob a licença **MIT**. Livre para uso pessoal, corporativo e modificações.
